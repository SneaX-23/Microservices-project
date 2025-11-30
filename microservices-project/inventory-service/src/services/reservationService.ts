import Redis from "ioredis";
import { prisma } from "../db/prisma";
import { Producer } from "kafkajs";

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

    // Try to Reserve in Redis using Lua script
    let result = await redis.eval(RESERVE_STOCK_SCRIPT, 1, key, quantity);

    // Handle Cache Miss
    if (result === -1) {
      console.log(`[Cache Miss] Hydrating Redis for Product ${productId}`);
      
      const product = await prisma.product.findUnique({ where: { id: productId } });
      if (!product) throw new Error("Product not found");

      // DB Stock (Total) - Pending Reservations (Held in Limbo)
      const pendingAgg = await prisma.reservation.aggregate({
        _sum: { quantity: true },
        where: {
          productId: productId,
          status: "PENDING",
          expiresAt: { gt: new Date() } 
        }
      });

      const pendingCount = pendingAgg._sum.quantity || 0;
      const availableStock = product.stock - pendingCount;

      // Set calculated stock to Redis
      // usage: max(0, available) to prevent negative cache setting
      await redis.set(key, Math.max(0, availableStock), "EX", 3600);
      
      // Retry the reservation after hydration
      result = await redis.eval(RESERVE_STOCK_SCRIPT, 1, key, quantity);
    }

    //  Handle Out of Stock
    if (result === 0) {
      throw new Error("Out of Stock");
    }

    //  Persistence. Create Reservation in DB.
    try {
      const reservation = await prisma.reservation.create({
        data: {
          userId,
          productId,
          quantity,
          status: "PENDING",
          expiresAt: new Date(Date.now() + 15 * 60 * 1000), // 15 mins
        },
      });

      return reservation;

    } catch (dbError) {
      // If DB fails, rollback Redis stock
      await redis.incrby(key, quantity);
      throw new Error("Failed to create reservation record");
    }
  },
};

export const ConfirmReservation = async (reservationId: string, paidAmount: number, producer: Producer) => {
    const reservation = await prisma.reservation.findUnique({
        where: {id: reservationId}
    });
    
    if(!reservation) throw new Error("Reservation not found.");

    if(reservation.status === "EXPIRED" || reservation.status === "CANCELLED"){
        console.warn(`[Zombie Check] Payment received for ${reservation.status} reservation ${reservationId}. Initiating Refund.`);

        // Emit Refund Event
        await producer.send({
            topic: "payment-events",
            messages: [{
                value: JSON.stringify({
                    type: "REFUND_INITIATED",
                    data: {
                        reservationId: reservation.id,
                        userId: reservation.userId,
                        amount: paidAmount,
                        reason: "Inventory Reservation Expired"
                    }
                })
            }]
        });
        return;
    }

    if(reservation.status === "CONFIRMED"){
       console.log(`Reservation ${reservationId} already confirmed. Idempotency check passed.`);
        return;
    }

    // Transaction: Permanently deduct from DB
    await prisma.$transaction(async (tx) => {
        // Update reservation status
        await tx.reservation.update({
            where: { id: reservationId },
            data: { status: "CONFIRMED" },
        });

        // Fetch current product state
        const productToUpdate = await tx.product.findUniqueOrThrow({
            where: { id: reservation.productId }
        });

        // Deduct reserved quantity from permanent storage
        const stockToDeduct = productToUpdate.stock - reservation.quantity;
        
        // Safety Check
        if (stockToDeduct < 0) {
            throw new Error("Inconsistent stock: cannot confirm reservation.");
            // ToDO Trigger Refund Logic 
        }

        // 4. Update product
        await tx.product.update({
            where: { id: reservation.productId },
            data: { stock: stockToDeduct },
        });
    });
    console.log(`Reservation ${reservationId} confirmed successfully.`);
}

export const releaseReservation = async (reservationId: string) => {
    const reservation = await prisma.reservation.findUnique({
        where: {id: reservationId}
    });

    if(!reservation) throw new Error("Reservation not found.");

    if(reservation.status === "EXPIRED" || reservation.status === "CONFIRMED"){
        console.error(`Reservation ${reservationId} is already ${reservation.status}.`)
        return;
    }

    if(reservation.status === "CANCELLED"){
        console.log(`Reservation ${reservationId} already cancelled`);
        return;
    }

    //  Mark DB as Cancelled
    await prisma.reservation.update({
        where: { id: reservationId },
        data: { status: "CANCELLED" }
    });

    // Return stock to Redis 
    // INCRBY to add the held stock back to the pool 
    const key = `inventory:product:${reservation.productId}:stock`;
    await redis.incrby(key, reservation.quantity);

    console.log(`Reservation ${reservationId} released. Stock returned to Redis.`);
}