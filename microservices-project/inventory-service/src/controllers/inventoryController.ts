import {prisma} from "../db/prisma"
import { Request, Response } from "express";
import { GetAllProducts, CreateProduct, BuyProduct} from "../services/inventoryService";
import { checkoutService } from "../services/reservationService";
import { CreateProductInput, ReserveProductInput } from "../validators/inventory.schema";

//Get all products
export const getAllProducts = async (req: Request, res: Response) => {
  try {
    const products = await GetAllProducts()
    res.json(products);
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch products" });
  }
};

// Create a product
export const createProduct = async (req: Request<{}, {}, CreateProductInput>, res: Response) => {
  try {
    const { sku, name, price, stock } = req.body;
    const product = await CreateProduct(sku, name, price, stock);
    res.status(201).json(product);
  } catch (error) {
    res.status(500).json({ error: "Failed to create product" });
  }
};

//Reserve a product
export const reserveProduct = async (req: Request<{}, {}, ReserveProductInput>, res: Response) => {
  try {
    const { productId, quantity } = req.body;
    
    const userId = req.headers["x-user-id"] as string; 

    if (!productId || !quantity) {
      return res.status(400).json({ error: "Missing productId or quantity" });
    }

    const reservation = await checkoutService.reserveItem(
      userId, 
      Number(productId), 
      Number(quantity)
    );

    res.status(201).json({
      success: true,
      message: "Item reserved successfully",
      reservationId: reservation.id,
      expiresAt: reservation.expiresAt
    });

  } catch (error: any) {
    console.error("Reservation Error:", error.message);

    if (error.message === "Out of Stock") {
      return res.status(409).json({ error: "Out of Stock" });
    }
    
    res.status(500).json({ error: "Internal Server Error" });
  }
};