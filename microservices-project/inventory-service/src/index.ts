import express, { Request, Response, NextFunction } from "express";
import cors from "cors";
import inventoryRoutes from "./routes/inventoryRoutes";
import { startExpirationJob } from "./utils/expirationJob";
import { startKafka } from "./events/kafkaConsumer";
import { globalErrorHandler } from "./controllers/errorController";
import { AppError } from "./utils/appError";
import { requestLogger } from "./middleware/requestLogger";
const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());
app.use(requestLogger);

app.use("/api/v1/inventory", inventoryRoutes);

// Health check
app.get("/health", (req, res) => {
  res.status(200).json({ status: "UP", service: "inventory-service" });
});

// 404 Handler
app.all("*", (req: Request, res: Response, next: NextFunction) => {
  next(new AppError(`Can't find ${req.originalUrl} on this server!`, 404));
});

// Global Error Handler
app.use(globalErrorHandler);

app.listen(PORT, async () => {
  console.log(`Inventory Service running on port ${PORT}`);
  startExpirationJob();
  await startKafka();
});