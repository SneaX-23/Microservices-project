import { startEamilPaymentConsumer } from "./consumers/payment.consumer";

async function main() {
  console.log("Email Service starting...");

  try {
    await startEamilPaymentConsumer();
    console.log("Kafka consumer running...");
  } catch (err) {
    console.error("Failed to start email service", err);
  }
}

main();