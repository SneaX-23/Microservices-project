import { prisma } from "../db/prisma";

export const GetAllProducts = async () => {
  return prisma.product.findMany();
}

export const CreateProduct = async (sku: string, name: string, price: number, stock: number) => {
  return prisma.product.create({
    data : {sku, name, price, stock}
  })
}

export const BuyProduct = async (productId: number, quantity: number) => {
  return prisma.product.updateMany({
    where: {
        id: productId,
        stock: { gte: quantity },
      },
      data: {
        stock: { decrement: quantity }, 
      },
  })
}