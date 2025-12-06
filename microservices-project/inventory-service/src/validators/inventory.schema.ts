import {z} from "zod";
import { CreateProduct } from "../services/inventoryService";

export const ReserveProductSchema = z.object({
    productId: z.number(),
    quantity: z.number(),
}) .strict();

export type ReserveProductInput = z.infer<typeof ReserveProductSchema>;

export const CreateProductSchema = z.object({
    sku: z.string(),
    name: z.string(),
    price: z.number(),
    stock: z.number(),
}).strict();

export type CreateProductInput = z.infer<typeof CreateProductSchema>;