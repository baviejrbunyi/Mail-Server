import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient, QueryCommand } from "@aws-sdk/lib-dynamodb";
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

  try {
    const result = await dynamo.send(
      new QueryCommand({
        TableName: LOGS_TABLE,
        IndexName: "ClientId-CreatedAt-Index",
        KeyConditionExpression: "ClientId = :clientId",
        ExpressionAttributeValues: {
          ":clientId": auth.clientId,
        },
        ScanIndexForward: false, // Descending order (newest first)
        Limit: 50,
      })
    );

    return {
      statusCode: 200,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        items: result.Items || [],
        count: result.Count || 0,
      }),
    };
  } catch (error: any) {
    console.error("List messages error:", error);
    return {
      statusCode: 500,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ error: "Internal server error", details: error.message }),
    };
  }
};
