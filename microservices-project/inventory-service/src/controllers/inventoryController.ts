import { Request, Response, NextFunction } from "express";
import { GetAllProducts, CreateProduct } from "../services/inventoryService";
import { checkoutService } from "../services/reservationService";
import { CreateProductInput, ReserveProductInput } from "../validators/inventory.schema";
import { catchAsync } from "../utils/catchAsync";
import { AppError } from "../utils/appError";

// Get all products
export const getAllProducts = catchAsync(async (req: Request, res: Response) => {
    const products = await GetAllProducts();
    res.json(products);
});

// Create a product
export const createProduct = catchAsync(async (req: Request<{}, {}, CreateProductInput>, res: Response) => {
    const { sku, name, price, stock } = req.body;
    const product = await CreateProduct(sku, name, price, stock);
    res.status(201).json(product);
});

// Reserve a product
export const reserveProduct = catchAsync(async (req: Request<{}, {}, ReserveProductInput>, res: Response, next: NextFunction) => {
    const { productId, quantity } = req.body;
    const userId = req.headers["x-user-id"] as string;

    if (!productId || !quantity) {
      return next(new AppError("Missing productId or quantity", 400));
    }

    try {
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
      if (error.message === "Out of Stock") {
        return next(new AppError("Out of Stock", 409));
      }
      throw error; 
    }
});