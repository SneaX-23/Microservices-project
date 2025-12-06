import { Kafka } from "kafkajs";

const kafka = new Kafka({
    clientId: "email-service",
    brokers: [(process.env.KAFKA_BROKER || "kafka:9092")],
});

export const topics = {
    PAYMENT_EVENTS: "payment-events",
};

export const consumerId = "email-service-consumer-group";

export const createKafkaConsumer = () => {
    return kafka.consumer({
        groupId: consumerId,
    });
};

export default kafka;