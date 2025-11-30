import {prisma} from "../db/prisma"
import { Request, Response } from "express";
import { GetAllProducts, CreateProduct, BuyProduct} from "../services/inventoryService";
import { checkoutService } from "../services/reservationService";


export const getAllProducts = async (req: Request, res: Response) => {
  try {
    const products = await GetAllProducts()
    res.json(products);
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch products" });
  }
};

export const createProduct = async (req: Request, res: Response) => {
  try {
    const { sku, name, price, stock } = req.body;
    const product = await CreateProduct(sku, name, price, stock);
    res.status(201).json(product);
  } catch (error) {
    res.status(500).json({ error: "Failed to create product" });
  }
};

export const buyProduct = async (req: Request, res: Response) => {
  const { productId, quantity } = req.body;
  const userId = req.headers["x-user-id"]; 

  if (!productId || !quantity) {
    return res.status(400).json({ error: "Missing productId or quantity" });
  }

  try {
    const result = await BuyProduct(productId, quantity)

    if (result.count === 0) {
      return res.status(409).json({ 
        error: "Purchase failed", 
        reason: "Out of stock or invalid product ID" 
      });
    }

    console.log(`User ${userId} bought ${quantity} of Product ${productId}`);

    res.json({ success: true, message: "Order placed successfully!" });

  } catch (error) {
    console.error("Purchase Error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};

export const reserveProduct = async (req: Request, res: Response) => {
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