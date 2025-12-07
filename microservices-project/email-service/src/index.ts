import { startEamilPaymentConsumer } from "./consumers/payment.consumer";
import logger from "./utils/logger";

async function main() {
  logger.info("Email Service starting...");

  try {
    await startEamilPaymentConsumer();
    logger.info("Kafka consumer running...");
  } catch (err) {
      logger.error({
        message: "Failed to start email service",
        error: err
    });
  }
}

main();