import { Router } from "express";
import { getAllProducts, createProduct, buyProduct } from "../controllers/inventoryController";

const router = Router();

// Public: Get all products
router.get("/", getAllProducts);

// Internal/Admin: Create a new product (To seed the DB)
router.post("/", createProduct);

// Protected: Buy a product (Stock deduction)
router.post("/buy", buyProduct);

export default router;