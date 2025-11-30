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
const consumer = kafka.consumer({ groupId: "payment-service-group" });

// Define the startup logic (Connect -> Subscribe -> Run -> Listen)
const startService = async () => {
  try {
    console.log("Payment Service: Connecting to Kafka...");
    await producer.connect();
    await consumer.connect();
    
    // Subscribe to topics
    await consumer.subscribe({ topic: "payment-events", fromBeginning: false });
    
    console.log("Payment Service: Connected to Kafka");

    //  Start the Consumer Loop INSIDE the async function
    await consumer.run({
      eachMessage: async ({ topic, partition, message }) => {
        if (!message.value) return;

        const event = JSON.parse(message.value.toString());

        if (event.type === "REFUND_INITIATED") {
          const { reservationId, amount, userId, reason } = event.data;
          
          console.log(`Processing REFUND for ${reservationId} | Amount: $${amount}`);
          console.log(`Reason: ${reason}`);

          // SIMULATE BANK REFUND API CALL
          await new Promise((resolve) => setTimeout(resolve, 1000));
          
          console.log(`Refund Successful for User ${userId}`);
          
          // Emit REFUND_COMPLETED here
        }
      },
    });

    //  Only start the HTTP server AFTER Kafka is ready
    app.listen(PORT, () => {
      console.log(`Payment Service running on port ${PORT}`);
    });

  } catch (error) {
    console.error("Failed to start Payment Service:", error);
    process.exit(1); 
  }
};



app.post("/pay", async (req, res) => {
  const { reservationId, amount } = req.body;

  if (!reservationId) {
    return res.status(400).json({ error: "Missing reservationId" });
  }

  // Immediate Response
  res.status(202).json({ 
    status: "processing", 
    message: "Payment is being processed. You will receive an email shortly." 
  });

  console.log(`Processing payment for ${reservationId}...`);
  
 
  await new Promise((resolve) => setTimeout(resolve, 2000));


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

startService();