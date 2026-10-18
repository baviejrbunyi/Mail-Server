import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient, GetCommand } from "@aws-sdk/lib-dynamodb";
import { APIGatewayProxyEvent, APIGatewayProxyResult } from "aws-lambda";

const client = new DynamoDBClient({});
const dynamo = DynamoDBDocumentClient.from(client);

const TABLE_NAME = process.env.API_KEYS_TABLE || "ApiKeys";

export interface AuthenticatedEvent extends APIGatewayProxyEvent {
  clientId?: string;
}

export async function validateApiKey(
  event: APIGatewayProxyEvent
): Promise<{ isValid: boolean; clientId?: string; errorResponse?: APIGatewayProxyResult }> {
  const authHeader = event.headers?.Authorization || event.headers?.authorization;

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return {
      isValid: false,
      errorResponse: {
        statusCode: 401,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ error: "Missing or malformed Authorization header. Use Bearer <API_KEY>" }),
      },
    };
  }

  const apiKey = authHeader.replace("Bearer ", "").trim();

  try {
    const result = await dynamo.send(
      new GetCommand({
        TableName: TABLE_NAME,
        Key: { ApiKey: apiKey },
      })
    );

    if (!result.Item || result.Item.Status !== "ACTIVE") {
      return {
        isValid: false,
        errorResponse: {
          statusCode: 403,
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ error: "Invalid or inactive API key" }),
        },
      };
    }

    return {
      isValid: true,
      clientId: result.Item.ClientId || "default-client",
    };
  } catch (error: any) {
    console.error("API Key validation error:", error);
    return {
      isValid: false,
      errorResponse: {
        statusCode: 500,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ error: "Internal server error during authentication" }),
      },
    };
  }
}
