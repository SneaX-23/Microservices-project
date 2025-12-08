import { Kafka } from "kafkajs";
import logger from "../utils/logger";

export const kafka = new Kafka({
    clientId: "user-service",
    brokers: [(process.env.KAFKA_BROKER || "kafka:9092")],
});

export const producer = kafka.producer();

export const startKafka = async () => {
    try {

        logger.info("Connectiong to kafak");
        await producer.connect();
        logger.info("Conneceted to kafka")
    } catch (err: any) {
        logger.error({
            message: "Error connect to kafka.",
            error: err,
        })
    }
}

