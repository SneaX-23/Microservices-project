import { prisma } from "../db/prisma";

export const GetAllProducts = async () => {
  return prisma.product.findMany();
}

export const CreateProduct = async (sku: string, name: string, price: number, stock: number) => {
  return prisma.product.create({
    data : {sku, name, price, stock}
  })
}