import { Queue, Worker } from "bullmq";
import { defaultQueueConfig, redisConnection } from "../config/queue.js";
import logger from "../config/logger.js";
import { sendEmail } from "../config/mailer.js";

export const emailQueueName = "email-queue";

export const emailQueue = new Queue(emailQueueName, {
  connection: redisConnection,
  defaultJobOptions: defaultQueueConfig,
});

// * Workers
export const handler = new Worker(
  emailQueueName,
  async (job) => {
    console.log("this email worker data is", job.data);
    const data = job.data;
    data?.map(async (item) => {
      await sendEmail(item.toEmail, item.subject, item.body);
    });
  },
  {
    connection: redisConnection,
  }
);

// * Worker listernes
handler.on("completed", (job) => {
  logger.info({ job: job, message: "job completed successfully" });
  console.log(`the job ${job.id} is completed`);
});

handler.on("failed", (job) => {
  console.log(`the job ${job.id} is failed`);
});
