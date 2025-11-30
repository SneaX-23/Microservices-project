import Redis from "ioredis";
import { prisma } from "../db/prisma";

const redis = new Redis({
  host: process.env.REDIS_HOST || "redis",
  port: 6379,
});

// Returns: 1 (Success), 0 (Out of Stock), -1 (Key doesn't exist)
const RESERVE_STOCK_SCRIPT = `
  local stock = redis.call('get', KEYS[1])
  if not stock then
    return -1 
  end
  stock = tonumber(stock)
  local requested = tonumber(ARGV[1])
  if stock >= requested then
    redis.call('decrby', KEYS[1], requested)
    return 1
  else
    return 0
  end
`;

export const checkoutService = {
  async reserveItem(userId: string, productId: number, quantity: number) {
    const key = `inventory:product:${productId}:stock`;

    // Try to Reserve in Redis
    let result = await redis.eval(RESERVE_STOCK_SCRIPT, 1, key, quantity);

    //  Handle Cache Miss  
    if (result === -1) {
      console.log(`[Cache Miss] Hydrating Redis for Product ${productId}`);
      
      const product = await prisma.product.findUnique({ where: { id: productId } });
      if (!product) throw new Error("Product not found");

      // Set DB stock to Redis 
      await redis.set(key, product.stock, "EX", 3600);
      
      // Retry the reservation
      result = await redis.eval(RESERVE_STOCK_SCRIPT, 1, key, quantity);
    }

    // Handle Out of Stock
    if (result === 0) {
      throw new Error("Out of Stock");
    }

    // Persistence. Create Reservation in DB.
    // If Redis succeeded, record it in DB. 
    try {
      const reservation = await prisma.reservation.create({
        data: {
          userId,
          productId,
          quantity,
          status: "PENDING",
          expiresAt: new Date(Date.now() + 15 * 60 * 1000), // expires in 15 minutes 
        },
      });

      return reservation;

    } catch (dbError) {
      // If DB fails,rollback Redis stock!
      await redis.incrby(key, quantity);
      throw new Error("Failed to create reservation record");
    }
  },
};

async function safeUpdateRedisStock(key: string, stock: number) {
    const MAX_RETRIES = 3;
    let attempt = 0;

    while (attempt < MAX_RETRIES) {
        try {
            await redis.set(key, stock, "EX", 3600);
            return; // success
        } catch (err) {
            attempt++;
            const delay = 100 * Math.pow(2, attempt); // exponential backoff

            console.error(
                `[Redis Sync Failed] attempt ${attempt}/${MAX_RETRIES}. Retrying in ${delay}ms`
            );

            await new Promise((res) => setTimeout(res, delay));
        }
    }

    // If all retries failed, delete key to avoid stale cache
    console.error(`[Redis Sync] All retries failed. Deleting key ${key} to avoid stale stock.`);
    try {
        await redis.del(key);
    } catch (err) {
        console.error(`[Redis Delete Failed] Redis is fully unavailable.`, err);
    }
}


export const ConfirmReservation = async (reservationId: string) => {
    const reservation = await prisma.reservation.findUnique({
        where: {id: reservationId}
    });
    
    // Check if reservation exixts
    if(!reservation){throw new Error("Reservation not found.")}
    

    if(reservation.status === "EXPIRED" || reservation.status === "CANCELLED"){
        console.error(`Reservation ${reservationId} is already ${reservation.status}`);
        return;
    }

    if(reservation.status === "CONFIRMED"){
        console.log(`Reservation ${reservationId} already confirmed.`);
        return;
    }

    // Returns new stock of updated producr
    const newStock = await prisma.$transaction(async (tx) => {
        // Update reservation
        await tx.reservation.update({
            where: {id: reservationId},
            data: {status: "CONFIRMED"},
        });
        // Fetch product to upadate
        const productToUpdate = await tx.product.findUniqueOrThrow({
            where: {id: reservation.productId}
        });

        // Reduce reserved quantity form product stock
        const stockToDeduct = productToUpdate.stock - reservation.quantity;
        
        // If stock goes below 0
        if (stockToDeduct < 0) {
            throw new Error("Inconsistent stock: cannot confirm reservation.");
            //ToDO in real application 
            // Cancle reservation and refund money
        }

        // Update product and return new stock
        const updatedProduct = await tx.product.update({
            where: {id: reservation.productId},
            data: {stock: stockToDeduct},
            select: {stock: true}
        })
        
        return updatedProduct.stock;
    });

    const key = `inventory:product:${reservation.productId}:stock`;
    // Keep redis cache fresh
    await safeUpdateRedisStock(key, newStock)
}