import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient, PutCommand } from "@aws-sdk/lib-dynamodb";
import { SQSClient, SendMessageCommand } from "@aws-sdk/client-sqs";
import { APIGatewayProxyEvent, APIGatewayProxyResult } from "aws-lambda";
import { validateApiKey } from "../middleware/auth";
import crypto from "crypto";

const dynamoClient = new DynamoDBClient({});
const dynamo = DynamoDBDocumentClient.from(dynamoClient);
const sqs = new SQSClient({});

const LOGS_TABLE = process.env.EMAIL_LOGS_TABLE || "EmailLogs";
const QUEUE_URL = process.env.EMAIL_QUEUE_URL || "";

export interface EmailPayload {
  to: string | string[];
  from: string;
  subject: string;
  text?: string;
  html?: string;
}

export const handler = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
  // 1. Authenticate Request
  const auth = await validateApiKey(event);
  if (!auth.isValid) {
    return auth.errorResponse!;
  }

  // 2. Parse and Validate Body
  if (!event.body) {
    return {
      statusCode: 400,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ error: "Missing request body" }),
    };
  }

  let payload: EmailPayload;
  try {
    payload = JSON.parse(event.body);
  } catch (err) {
    return {
      statusCode: 400,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ error: "Invalid JSON payload" }),
    };
  }

  if (!payload.to || !payload.from || !payload.subject || (!payload.text && !payload.html)) {
    return {
      statusCode: 400,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ error: "Missing required fields: to, from, subject, and text/html" }),
    };
  }

  const messageId = crypto.randomUUID();
  const createdAt = new Date().toISOString();

  const logRecord = {
    MessageId: messageId,
    ClientId: auth.clientId,
    To: payload.to,
    From: payload.from,
    Subject: payload.subject,
    Status: "queued",
    RetryCount: 0,
    CreatedAt: createdAt,
    UpdatedAt: createdAt,
  };

  try {
    // 3. Save record to DynamoDB with status queued
    await dynamo.send(
      new PutCommand({
        TableName: LOGS_TABLE,
        Item: logRecord,
      })
    );

    // 4. Publish message & Record ID to SQS FIFO queue
    await sqs.send(
      new SendMessageCommand({
        QueueUrl: QUEUE_URL,
        MessageBody: JSON.stringify({ messageId, payload, clientId: auth.clientId }),
        MessageGroupId: auth.clientId || "default",
        MessageDeduplicationId: messageId,
      })
    );

    // 5. Return 202 Accepted immediately
    return {
      statusCode: 202,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        status: "accepted",
        messageId,
        message: "Email queued successfully for delivery",
      }),
    };
  } catch (error: any) {
    console.error("Error ingestion email:", error);
    return {
      statusCode: 500,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ error: "Failed to queue email", details: error.message }),
    };
  }
};
