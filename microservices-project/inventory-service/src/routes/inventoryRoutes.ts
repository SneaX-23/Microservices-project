import { Router } from "express";
import { getAllProducts, createProduct, reserveProduct } from "../controllers/inventoryController";
import { ReserveProductSchema, CreateProductSchema } from "../validators/inventory.schema";
import { validate } from "../validators/validate";
const router = Router();

// Public: Get all products
router.get("/", getAllProducts);

// Internal/Admin: Create a new product
router.post("/", validate(CreateProductSchema),createProduct);

//Public: Reserve a product
router.post("/reserve", validate(ReserveProductSchema), reserveProduct);
export default router;