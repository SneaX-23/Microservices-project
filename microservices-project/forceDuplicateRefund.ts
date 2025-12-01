import { Kafka } from "kafkajs";

const kafka = new Kafka({ clientId: "test", brokers: ["localhost:9092"] });
const producer = kafka.producer();

const run = async () => {
    await producer.connect();

    
    const payload = {
        type: "REFUND_INITIATED",
        data: {
            
            reservationId: "d9ac37c4-b037-4279-a605-91e3056e8116", 
            amount: 100,
            userId: "victim-user-123",
            reason: "Manual Duplicate Test"
        }
    };

    await producer.send({
        topic: "payment-events",
        messages: [{ value: JSON.stringify(payload) }]
    });

    console.log("Sent Duplicate Refund Command");
    await producer.disconnect();
}
run();