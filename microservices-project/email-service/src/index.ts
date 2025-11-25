import express from "express";
import os from "os";
import { Queue, Worker } from "bullmq";
import {Redis} from "ioredis";

const app = express();
app.use(express.json());

const redisConnection = new Redis({
  host: "redis", 
  port: 6379,
  maxRetriesPerRequest: null
});

const emailQueue = new Queue("email-queue", { connection: redisConnection });

const worker = new Worker("email-queue", async (job) => {
    console.log(`[Worker] Processing job ${job.id}: Sending email to ${job.data.to}`);
    
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    console.log(`[Worker] ✅ Email sent to ${job.data.to}`);
}, { connection: redisConnection });

app.post("/email", async (req, res) => {
    const { to, subject, body } = req.body;

    if (!to || !subject) {
        return res.status(400).json({ error: "Missing 'to' or 'subject'" });
    }

    await emailQueue.add("send-email", { to, subject, body });

    res.status(202).json({ 
        message: "Email queued successfully!", 
        served_by: os.hostname() 
    });
});

app.get("/", (req, res) => {
    res.json({ message: "Email Service is Alive!", served_by: os.hostname() });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Email server listening on port ${PORT}`);
});