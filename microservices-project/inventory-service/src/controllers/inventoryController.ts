import {prisma} from "../db/prisma"
import { Request, Response } from "express";

export const getAllProducts = async (req: Request, res: Response) => {
  try {
    const products = await prisma.product.findMany();
    res.json(products);
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch products" });
  }
};

export const createProduct = async (req: Request, res: Response) => {
  try {
    const { sku, name, price, stock } = req.body;
    const product = await prisma.product.create({
      data: { sku, name, price, stock },
    });
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
    const result = await prisma.product.updateMany({
      where: {
        id: productId,
        stock: { gte: quantity },
      },
      data: {
        stock: { decrement: quantity }, 
      },
    });

    if (result.count === 0) {
      return res.status(409).json({ 
        error: "Purchase failed", 
        reason: "Out of stock or invalid product ID" 
      });
    }

    console.log(`✅ User ${userId} bought ${quantity} of Product ${productId}`);

    res.json({ success: true, message: "Order placed successfully!" });

  } catch (error) {
    console.error("Purchase Error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};
