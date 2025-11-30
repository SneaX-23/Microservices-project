import { Router } from "express";
import { getAllProducts, createProduct, buyProduct, reserveProduct } from "../controllers/inventoryController";

const router = Router();

// Public: Get all products
router.get("/", getAllProducts);

// Internal/Admin: Create a new product
router.post("/", createProduct);

// Protected: Buy a product 
router.post("/buy", buyProduct);

router.post("/reserve", reserveProduct);
export default router;