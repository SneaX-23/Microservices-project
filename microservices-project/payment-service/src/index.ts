import express, { Request, Response, NextFunction } from "express";
import { Kafka } from "kafkajs";
import Redis from "ioredis";
import { catchAsync } from "./utils/catchAsync";
import { AppError } from "./utils/appError";
import { globalErrorHandler } from "./controllers/errorController";
import logger from "./utils/logger";
import { requestLogger } from "./middleware/requestLogger";

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());
app.use(requestLogger);

const redis = new Redis({
  host: process.env.REDIS_HOST || "redis",
  port: 6379,
});

const kafka = new Kafka({
  clientId: "payment-service",
  brokers: [process.env.KAFKA_BROKER || "kafka:9092"],
});

const producer = kafka.producer();
const consumer = kafka.consumer({ groupId: "payment-service-group" });

const startService = async () => {
  try {
    logger.info("Payment Service: Connecting to Kafka...");
    await producer.connect();
    await consumer.connect();
    
    await consumer.subscribe({ topic: "payment-events", fromBeginning: false });
    logger.info("Payment Service: Connected to Kafka");

    await consumer.run({
      eachMessage: async ({ topic, partition, message }) => {
        if (!message.value) return;
        const event = JSON.parse(message.value.toString());

        if (event.type === "REFUND_INITIATED") {
          const { reservationId, amount, userId, reason } = event.data;
          const idempotencyKey = `refund:processed:${reservationId}`;
          const alreadyRefunded = await redis.get(idempotencyKey);
          
          if(alreadyRefunded){
            logger.warn(`Duplicate refund for ${reservationId} | Amount ${amount}`);
            return;
          }

          logger.info(`Processing REFUND for ${reservationId} | Amount: $${amount}`);
          // Simulated delay
          await new Promise((resolve) => setTimeout(resolve, 1000));
          logger.info(`Refund Successful for User ${userId}`);
          
          await redis.set(idempotencyKey, "true", "EX", 60 * 60 * 24 )
        }
      },
    });

    // Start HTTP Server
    app.listen(PORT, () => {
      console.log(`Payment Service running on port ${PORT}`);
    });

  } catch (error) {
    logger.error("Failed to start Payment Service:", error);
    process.exit(1); 
  }
};


app.post("/pay", catchAsync(async (req: Request, res: Response, next: NextFunction) => {
  const { reservationId, amount } = req.body;
  const userId = req.headers['x-user-id']; 

  if (!reservationId) {
    return next(new AppError("Missing reservationId", 400));
  }

  // Immediate Response
  res.status(202).json({ 
    status: "processing", 
    message: "Payment is being processed. You will receive an email shortly." 
  });

  logger.info(`Processing payment for ${reservationId}...`);
  
  await new Promise((resolve) => setTimeout(resolve, 2000));

  const isSuccess = Math.random() < 0.8; 
  const eventType = isSuccess ? "PAYMENT_CONFIRMED" : "PAYMENT_FAILED";
  
  const eventPayload = {
    type: eventType,
    data: {
      reservationId,
      amount,
      userId,
      timestamp: new Date().toISOString(),
      reason: isSuccess ? "Transaction Approved" : "Insufficient Funds",
    },
  };

  await producer.send({
    topic: "payment-events",
    messages: [{ value: JSON.stringify(eventPayload) }],
  });
  logger.info(`Emitted Event: ${eventType} for ${reservationId}`);
}));

// 404 Handler
app.all("*", (req: Request, res: Response, next: NextFunction) => {
  next(new AppError(`Can't find ${req.originalUrl} on this server!`, 404));
});

// Global Error Handler
app.use(globalErrorHandler);

startService();