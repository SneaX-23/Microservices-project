import { z,ZodTypeAny } from "zod";
import { Request, Response, NextFunction } from "express";

export const validate =
  <T extends ZodTypeAny>(schema: T) =>
  (req: Request, res: Response, next: NextFunction) => {
    const result = schema.safeParse(req.body);

    if (!result.success) {
      return res.status(400).json({
        success: false,
        
        errors: result.error.flatten().fieldErrors, 
      });
    }
    req.body = result.data; 
    next();
  };