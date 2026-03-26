import { Worker } from "worker_threads";
import { fileURLToPath } from "url";
import path from "path";
import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";
import { randomUUID } from "crypto";
import prisma from "../config/db.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const s3 = new S3Client({
  region: process.env.AWS_REGION,
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  },
});

function resizeImageInWorker(buffer, mimetype) {
  return new Promise((resolve, reject) => {
    const worker = new Worker(
      path.join(__dirname, "../workers/imageWorker.js"),
      {
        workerData: { buffer: buffer.toJSON().data, mimetype },
      },
    );
    worker.on("message", resolve);
    worker.on("error", reject);
  });
}

async function uploadToS3(buffer, key, mimetype) {
  await s3.send(
    new PutObjectCommand({
      Bucket: process.env.AWS_BUCKET_NAME,
      Key: key,
      Body: buffer,
      ContentType: mimetype,
    }),
  );
  return `https://${process.env.AWS_BUCKET_NAME}.s3.${process.env.AWS_REGION}.amazonaws.com/${key}`;
}

export const createProduct = async (req, res) => {
  const { name, description, price, stock } = req.body;

  if (!name || !description || !price || !stock) {
    return res.status(400).json({ message: "All fields are required" });
  }

  try {
    const shop = await prisma.shop.findUnique({
      where: { sellerId: req.user.id },
    });
    if (!shop) {
      return res
        .status(404)
        .json({ message: "Shop not found. Please create a shop first." });
    }

    const images = [];

    if (req.file) {
      const { thumbnail, gallery } = await resizeImageInWorker(
        req.file.buffer,
        req.file.mimetype,
      );
      const id = randomUUID();

      const [thumbnailUrl, galleryUrl] = await Promise.all([
        uploadToS3(
          thumbnail.buffer,
          `products/${id}/thumbnail`,
          thumbnail.mimetype,
        ),
        uploadToS3(gallery.buffer, `products/${id}/gallery`, gallery.mimetype),
      ]);

      images.push(
        { url: thumbnailUrl, type: "thumbnail" },
        { url: galleryUrl, type: "gallery" },
      );
    }

    const product = await prisma.product.create({
      data: {
        name,
        description,
        price: parseFloat(price),
        stock: parseInt(stock),
        shopId: shop.id,
        images: { create: images },
      },
      include: { images: true },
    });

    res.status(201).json({ product });
  } catch (err) {
    console.error("Create product error:", err);
    res.status(500).json({ message: "Server error" });
  }
};

export const getMyProducts = async (req, res) => {
  try {
    const shop = await prisma.shop.findUnique({
      where: { sellerId: req.user.id },
    });
    if (!shop) {
      return res.status(404).json({ message: "Shop not found" });
    }

    const products = await prisma.product.findMany({
      where: { shopId: shop.id },
      include: { images: true },
      orderBy: { createdAt: "desc" },
    });

    res.json({ products });
  } catch (err) {
    console.error("Get products error:", err);
    res.status(500).json({ message: "Server error" });
  }
};
