import express from "express";
import { startEamilPaymentConsumer } from "./consumers/payment.consumer";
import logger from "./utils/logger";

const app = express();
const PORT = process.env.PORT || 3000;

// Health check 
app.get("/health", (req, res) => res.send("Email Service is running"));

async function main() {
  logger.info("Email Service starting...");
  
  startEamilPaymentConsumer();

  // Start HTTP Server
  app.listen(PORT, () => {
      logger.info(`Email Service listening on port ${PORT}`);
  });
}

main();