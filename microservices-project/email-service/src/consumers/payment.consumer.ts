import { createKafkaConsumer, topics, consumerId } from "../config/kafka";
import { getUserEmail } from "../config/user.config";
import { sendMail } from "../services/email.service";

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

                console.log(`Eamil sent to user: ${event.data.userId}`);

            }
        })
    } catch (err) {
        console.error(`Failed to start payment consumer.`, err);
        console.error("Consumer crashed — will retry.");
    }
}