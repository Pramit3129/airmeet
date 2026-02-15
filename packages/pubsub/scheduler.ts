import { protos } from "@google-cloud/tasks";
import { client } from "./client";

interface JobData {
  metadata: {
    leadId: string;
    userId: string;
    isBatchCallRecord: boolean;
  };
  from_number: string;
  agentId: string;
  dynamicVariables: {
    name: string;
    email: string;
    phone_number: string;
  };
}
export async function scheduleTask(jobData: JobData, delayMs: number) {
  const project = "realtygenie";
  const location = process.env.LOCATION || "europe-west1";
  const queue = process.env.QUEUE_NAME || "airmeet-queue-1";

  const parent = client.queuePath(project, location, queue);
  const payload = JSON.stringify(jobData);

  const delaySeconds = Math.floor(delayMs / 1000);

  const task: protos.google.cloud.tasks.v2.ITask = {
    httpRequest: {
      httpMethod: "POST",
      url: process.env.API_URL + "/call/publish",
      headers: {
        "Content-Type": "application/json",
      },
      body: Buffer.from(payload).toString("base64"),
    },
    scheduleTime: {
      seconds: Math.floor(Date.now() / 1000) + delaySeconds,
    },
  };
  try {
    const response = await client.createTask({
      parent,
      task,
    });
    console.log("Task created:", response);
  } catch (error) {
    console.error("Error creating task:", error);
  }
}
