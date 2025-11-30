import express from "express";
import { Kafka } from "kafkajs";

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());

const kafka = new Kafka({
  clientId: "payment-service",
  brokers: [process.env.KAFKA_BROKER || "kafka:9092"],
});

const producer = kafka.producer();

const connectKafka = async () => {
  try {
    await producer.connect();
    console.log("Payment Service connected to Kafka");
  } catch (error) {
    console.error("Kafka connection failed", error);
  }
};
connectKafka();

app.post("/pay", async (req, res) => {
  const { reservationId, amount } = req.body;

  if (!reservationId) {
    return res.status(400).json({ error: "Missing reservationId" });
  }

  // Immediate Response to Client
  res.status(202).json({ 
    status: "processing", 
    message: "Payment is being processed. You will receive an email shortly." 
  });

  //Simulate Third-Party Processing
  console.log(`Processing payment for ${reservationId}...`);
  await new Promise((resolve) => setTimeout(resolve, 2000));

  // Random Success/Failure Logic
  const isSuccess = Math.random() < 0.8;

  const eventType = isSuccess ? "PAYMENT_CONFIRMED" : "PAYMENT_FAILED";
  
  const eventPayload = {
    type: eventType,
    data: {
      reservationId,
      amount,
      timestamp: new Date().toISOString(),
      reason: isSuccess ? "Transaction Approved" : "Insufficient Funds",
    },
  };

  //Publish Result to Kafka
  try {
    await producer.send({
      topic: "payment-events",
      messages: [{ value: JSON.stringify(eventPayload) }],
    });
    console.log(`Emitted Event: ${eventType} for ${reservationId}`);
  } catch (err) {
    console.error("Failed to emit Kafka event", err);
  }
});

app.listen(PORT, () => {
  console.log(`Payment Service running on port ${PORT}`);
});