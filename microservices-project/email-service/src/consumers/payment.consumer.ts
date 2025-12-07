import { createKafkaConsumer, topics, consumerId } from "../config/kafka";
import { getUserEmail } from "../config/user.config";
import { sendMail } from "../services/email.service";
import logger from "../utils/logger";

const consumer = createKafkaConsumer();

// Kafka conumer for payments, sends emails on payment events
export const startEamilPaymentConsumer = async () => {
    try {
        await consumer.connect();

        // Subscribe to topic
        await consumer.subscribe({topic: topics.PAYMENT_EVENTS, fromBeginning: false});

        await consumer.run({
            eachMessage: async ({topic, partition, message}) => {
                if(!message.value) return;

                const event = JSON.parse(message.value.toString());

                // Get user email from user service
                const userEmail = await getUserEmail(event.data.userId);

                // Send email 
                await sendMail(userEmail, event.type, event.data);

                logger.info(`Eamil sent to user: ${event.data.userId}`);

            }
        })
    } catch (err) {
        logger.error({message: `Failed to start payment consumer.`, error: err});
        logger.info("Consumer crashed — will retry.");
    }
}