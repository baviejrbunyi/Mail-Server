import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient, GetCommand } from "@aws-sdk/lib-dynamodb";
import { APIGatewayProxyEvent, APIGatewayProxyResult } from "aws-lambda";
import { validateApiKey } from "../middleware/auth";

const client = new DynamoDBClient({});
const dynamo = DynamoDBDocumentClient.from(client);

const LOGS_TABLE = process.env.EMAIL_LOGS_TABLE || "EmailLogs";

export const handler = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
  const auth = await validateApiKey(event);
  if (!auth.isValid) {
    return auth.errorResponse!;
  }

  const messageId = event.pathParameters?.id;
  if (!messageId) {
    return {
      statusCode: 400,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ error: "Missing message ID parameter" }),
    };
  }

  try {
    const result = await dynamo.send(
      new GetCommand({
        TableName: LOGS_TABLE,
        Key: { MessageId: messageId },
      })
    );

    if (!result.Item) {
      return {
        statusCode: 404,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ error: "Message not found" }),
      };
    }

    // Ensure client owns the message
    if (result.Item.ClientId !== auth.clientId) {
      return {
        statusCode: 403,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ error: "Forbidden: Unauthorized access to message" }),
      };
    }

    return {
      statusCode: 200,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(result.Item),
    };
  } catch (error: any) {
    console.error("Get message error:", error);
    return {
      statusCode: 500,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ error: "Internal server error", details: error.message }),
    };
  }
};
