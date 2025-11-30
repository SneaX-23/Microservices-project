import cron from "node-cron";
import Redis from "ioredis";
import { prisma } from "../db/prisma";

const redis = new Redis({
  host: process.env.REDIS_HOST || "redis",
  port: 6379,
});

export const startExpirationJob = () => {
  // Schedule task to run every minute
  cron.schedule("* * * * *", async () => {
    console.log("Running Expiration Cleanup Job...");

    try {
      // Find all reservations that are PENDING and past their expiration time
      const expiredReservations = await prisma.reservation.findMany({
        where: {
          status: "PENDING",
          expiresAt: {
            lt: new Date(), 
          },
        },
      });

      if (expiredReservations.length === 0) {
        return; 
      }

      console.log(`Found ${expiredReservations.length} expired reservations. Releasing stock...`);

      //  Process each expired reservation
      for (const reservation of expiredReservations) {
        try {
          await processExpiredReservation(reservation);
        } catch (err) {
            console.error(`Failed to process expired reservation ${reservation.id}:`, err);
        }
      }
    } catch (error) {
      console.error("Critical Error in Expiration Job:", error);
    }
  });
};

// Helper function to handle the atomic release
async function processExpiredReservation(reservation: any) {
    const key = `inventory:product:${reservation.productId}:stock`;

    // Update Database Status to EXPIRED
    // check status again inside update to ensure no race condition 
    const updateResult = await prisma.reservation.updateMany({
        where: {
            id: reservation.id,
            status: "PENDING", 
        },
        data: {
            status: "EXPIRED",
        },
    });

    // If updateResult.count is 0, it means the status changed before we could grab it.
    // So we abort releasing the Redis stock.
    if (updateResult.count === 0) return;

    //  Increment Redis Stock- Release the hold
    await redis.incrby(key, reservation.quantity);
    
    console.log(`[Expired] Reservation ${reservation.id} cancelled. Restored ${reservation.quantity} items to Redis.`);
}