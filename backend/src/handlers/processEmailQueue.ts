import { SESClient, SendEmailCommand } from "@aws-sdk/client-ses";
import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient, UpdateCommand } from "@aws-sdk/lib-dynamodb";
import { SQSEvent, SQSBatchResponse } from "aws-lambda";

const ses = new SESClient({ region: process.env.SES_REGION || "us-east-1" });
const dynamoClient = new DynamoDBClient({});
const dynamo = DynamoDBDocumentClient.from(dynamoClient);

const LOGS_TABLE = process.env.EMAIL_LOGS_TABLE || "EmailLogs";

export const handler = async (event: SQSEvent): Promise<SQSBatchResponse> => {
  const batchItemFailures: { itemIdentifier: string }[] = [];

  for (const record of event.Records) {
    const messageId = record.messageId;
    try {
      const body = JSON.parse(record.body);
      const { messageId: dbMessageId, payload } = body;

      const toAddresses = Array.isArray(payload.to) ? payload.to : [payload.to];

      // Construct SES SendEmail Command
      const sesCommand = new SendEmailCommand({
        Source: payload.from,
        Destination: {
          ToAddresses: toAddresses,
        },
        Message: {
          Subject: {
            Data: payload.subject,
            Charset: "UTF-8",
          },
          Body: {
            ...(payload.text && {
              Text: {
                Data: payload.text,
                Charset: "UTF-8",
              },
            }),
            ...(payload.html && {
              Html: {
                Data: payload.html,
                Charset: "UTF-8",
              },
            }),
          },
        },
      });

      // Send email via SES
      await ses.send(sesCommand);

      // Update DynamoDB record to sent
      await dynamo.send(
        new UpdateCommand({
          TableName: LOGS_TABLE,
          Key: { MessageId: dbMessageId },
          UpdateExpression: "SET #status = :status, UpdatedAt = :updatedAt",
          ExpressionAttributeNames: { "#status": "Status" },
          ExpressionAttributeValues: {
            ":status": "sent",
            ":updatedAt": new Date().toISOString(),
          },
        })
      );
    } catch (error: any) {
      console.error(`Failed to process message ${record.messageId}:`, error);

      // Attempt to update status to failed or record retry count if needed
      try {
        const body = JSON.parse(record.body);
        const { messageId: dbMessageId } = body;
        const receiveCount = parseInt(record.attributes.ApproximateReceiveCount || "1", 10);

        const status = receiveCount >= 3 ? "failed" : "queued";

        await dynamo.send(
          new UpdateCommand({
            TableName: LOGS_TABLE,
            Key: { MessageId: dbMessageId },
            UpdateExpression: "SET #status = :status, RetryCount = :retryCount, ErrorMsg = :errorMsg, UpdatedAt = :updatedAt",
            ExpressionAttributeNames: { "#status": "Status" },
            ExpressionAttributeValues: {
              ":status": status,
              ":retryCount": receiveCount,
              ":errorMsg": error.message || "Unknown SES error",
              ":updatedAt": new Date().toISOString(),
            },
          })
        );
      } catch (dbErr) {
        console.error("Failed to update DynamoDB failure state:", dbErr);
      }

      // Throw error / add to batch item failures so SQS retries or pushes to DLQ
      batchItemFailures.push({ itemIdentifier: record.messageId });
    }
  }

  return { batchItemFailures };
};
