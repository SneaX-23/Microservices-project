import cron from "node-cron";
import Redis from "ioredis";
import { prisma } from "../db/prisma";
import logger from "./logger";
const redis = new Redis({
  host: process.env.REDIS_HOST || "redis",
  port: 6379,
});

export const startExpirationJob = () => {
  // Schedule task to run every minute (set to 10 seconds for testing)
  cron.schedule("*/10 * * * * *", async () => {
    logger.info("Running Expiration Cleanup Job...");

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

      logger.info(`Found ${expiredReservations.length} expired reservations. Releasing stock...`);

      //  Process each expired reservation
      for (const reservation of expiredReservations) {
        try {
          await processExpiredReservation(reservation);
        } catch (err) {
          logger.error({message: `Failed to process expired reservation ${reservation.id}:`, error: err});
        }
      }
    } catch (error) {
        logger.error({message:"Critical Error in Expiration Job:", error: error});
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


    if (updateResult.count === 0) return;

    //  Increment Redis Stock- Release the hold
    await redis.incrby(key, reservation.quantity);
    
    logger.info(`[Expired] Reservation ${reservation.id} cancelled. Restored ${reservation.quantity} items to Redis.`);
}