import { Worker } from "bullmq";
import nodemailer from "nodemailer";
import { redisConnection } from "../config/queue.js";

const transporter = nodemailer.createTransport({
  host: process.env.MAIL_HOST,
  port: Number(process.env.MAIL_PORT),
  auth: {
    user: process.env.MAIL_USER,
    pass: process.env.MAIL_PASS,
  },
});

const emailWorker = new Worker(
  "email",
  async (job) => {
    if (job.name === "welcome") {
      const { name, email, role } = job.data;
      const subject = role === "seller"
        ? "Welcome to MultiShop — Set up your shop!"
        : "Welcome to MultiShop!";
      const text = role === "seller"
        ? `Hi ${name}, your seller account is ready. Go to your dashboard to create your shop.`
        : `Hi ${name}, welcome to MultiShop! Start browsing thousands of products.`;

      await transporter.sendMail({
        from: `"MultiShop" <${process.env.MAIL_USER}>`,
        to: email,
        subject,
        text,
      });
    }
  },
  { connection: redisConnection }
);

emailWorker.on("failed", (job, err) => {
  console.error(`Email job ${job?.id} failed:`, err.message);
});

export default emailWorker;
