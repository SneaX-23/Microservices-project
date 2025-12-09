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
        await consumer.subscribe({topic: topics.PAYMENT_EVENTS, fromBeginning: true});
        await consumer.subscribe({ topic: topics.USER_CREATED, fromBeginning: true });

        await consumer.run({
            eachMessage: async ({topic, partition, message}) => {
                if(!message.value) return;

                const event = JSON.parse(message.value.toString());

               try {
                    let userEmail: string;

                    //  Handle "new_user" events, Email is already in payload
                    if (event.type === "new_user") {
                        userEmail = event.data.email;
                    } 
                    // Handle Payment events, Need to fetch email using userId
                    else {
                        if (!event.data.userId) {
                            logger.warn(`Event ${event.type} missing userId. Skipping.`);
                            return; 
                        }
                        userEmail = await getUserEmail(event.data.userId);
                    }

                    // Send the email
                    if (userEmail) {
                        await sendMail(userEmail, event.type, event.data);
                        logger.info(`Email sent to: ${userEmail} for event: ${event.type}`);
                    } else {
                        logger.error(`Failed to resolve email for event: ${event.type}`);
                    }

                } catch (err) {
                    logger.error({ message: `Error processing message: ${event.type}`, error: err });
                }
            }
        })
    } catch (err) {
        logger.error({message: `Failed to start payment consumer.`, error: err});
        logger.info("Consumer crashed — will retry.");
    }
}