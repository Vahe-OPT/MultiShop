import { workerData, parentPort } from "worker_threads";
import sharp from "sharp";

const { buffer, mimetype } = workerData;

try {
  const input = Buffer.from(buffer);

  const [thumbnail, gallery] = await Promise.all([
    sharp(input).resize(200, 200, { fit: "cover" }).toBuffer(),
    sharp(input).resize(800, 600, { fit: "inside" }).toBuffer(),
  ]);

  parentPort.postMessage({
    thumbnail: { buffer: thumbnail, mimetype },
    gallery: { buffer: gallery, mimetype },
  });
} catch (err) {
  throw new Error("Image processing failed: " + err.message);
}
