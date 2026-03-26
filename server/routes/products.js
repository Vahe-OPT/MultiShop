import { Router } from "express";
import multer from "multer";
import protect from "../middlewares/protect.js";
import { createProduct, getMyProducts } from "../controllers/productController.js";

const router = Router();
const upload = multer({ storage: multer.memoryStorage() });

router.post("/", protect, upload.single("image"), createProduct);
router.get("/mine", protect, getMyProducts);

export default router;
