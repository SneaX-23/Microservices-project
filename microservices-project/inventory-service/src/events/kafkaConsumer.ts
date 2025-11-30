import { Kafka } from "kafkajs";
import { ConfirmReservation, releaseReservation } from "../services/reservationService";

const kafka = new Kafka({
    clientId: "inventory-service",
    brokers: [process.env.KAFKA_BROKER || "kafka:9092"],
});

const consumer = kafka.consumer({ groupId: "inventory-service" });
const producer = kafka.producer();

// 1. Export this function
export const startKafka = async () => {
    try {
        console.log("Kafka Consumer: Connecting...");
        
        await consumer.connect();
        await producer.connect();

        await consumer.subscribe({
            topic: "payment-events",
            fromBeginning: false,
        });

        console.log("Kafka Consumer: Connected & Subscribed");
        
        await consumer.run({
            eachMessage: async ({ topic, partition, message }) => {
                if (!message.value) return;

                const event = JSON.parse(message.value.toString());
                
                try {
                    if (event.type === "PAYMENT_CONFIRMED") {
                        await ConfirmReservation(
                            event.data.reservationId, 
                            event.data.amount,
                            producer 
                        );
                    }
                    if (event.type === "PAYMENT_FAILED") {
                        await releaseReservation(event.data.reservationId);
                    }
                } catch (err) {
                    console.error(`Error processing Kafka event ${event.type}:`, err);
                }
            }
        });

    } catch (err) {
        console.error("Failed to start Kafka consumer:", err);
    }
};