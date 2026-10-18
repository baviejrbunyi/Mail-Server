# AWS Serverless Email API Server

A lightweight, highly resilient, 100% serverless transactional email microservice designed for the AWS Free Tier. It bridges modern JSON HTTP payloads with traditional email delivery using **Amazon API Gateway**, **AWS Lambda**, **Amazon SQS**, **Amazon DynamoDB**, and **Amazon SES**.

---

## 1. Project Overview

Modern applications often struggle with synchronous email delivery bottlenecks where SMTP connections block HTTP response threads or time out under load. This architecture decouples email ingestion from delivery using an asynchronous producer-consumer queue pattern.

- **Asynchronous Ingestion**: `POST /api/v1/send` validates the request, logs it as `queued` in DynamoDB, publishes a job to an SQS FIFO queue, and returns `202 Accepted` in milliseconds.
- **Reliable Worker Delivery**: SQS triggers a worker Lambda (`processEmailQueue`) that uses AWS SDK v3 <code className="text-amber-400">SESClient</code> to send emails via Amazon SES.
- **Resilience & Dead Letter Queue**: Failed deliveries (e.g. throttling or network errors) automatically retry up to 3 times before routing to an SQS Dead Letter Queue (DLQ).
- **Secure Authentication**: API requests are authenticated using Bearer tokens verified against a DynamoDB <code className="text-amber-400">ApiKeys</code> table.

---

## 2. Architecture & Data Flow

```
┌─────────────────┐       ┌──────────────────────┐       ┌─────────────────────┐
│  HTTP Client    │──────>│ API Gateway (REST)   │──────>│ Ingest Lambda       │
│  (curl / App)   │       │ POST /api/v1/send    │       │ (ingestEmail.ts)    │
└─────────────────┘       └──────────────────────┘       └──────────┬──────────┘
                                                                    │
                          ┌──────────────────────┐                  │ Save Record &
                          │ DynamoDB ApiKeys &   │<─────────────────┘ Publish Job
                          │ EmailLogs Tables     │                     to SQS
                          └──────────▲───────────┘
                                     │ Update
                                     │ Status
┌─────────────────┐       ┌──────────┴───────────┐       ┌─────────────────────┐
│ Amazon SES      │<──────│ SQS Worker Lambda    │<──────│ Amazon SQS Queue    │
│ (Email Delivery)│       │ (processEmailQueue)  │       │ (with DLQ)          │
└─────────────────┘       └──────────────────────┘       └─────────────────────┘
```

### DynamoDB Schema
1. **`ApiKeys` Table**:
   - **Partition Key**: `ApiKey` (String)
   - **Attributes**: `ClientId`, `Status` (`ACTIVE` / `INACTIVE`), `CreatedAt`
2. **`EmailLogs` Table**:
   - **Partition Key**: `MessageId` (String, UUID)
   - **Global Secondary Index (GSI)**: `ClientId-CreatedAt-Index` (Hash Key: `ClientId`, Sort Key: `CreatedAt`)
   - **Attributes**: `To`, `From`, `Subject`, `Status` (`queued`, `sent`, `failed`), `RetryCount`, `ErrorMsg`, `CreatedAt`, `UpdatedAt`

---

## 3. Implementation Details

- **Infrastructure as Code**: Defined using AWS SAM (`backend/template.yaml`) for seamless CloudFormation deployment.
- **Runtime**: Node.js 20.x & TypeScript.
- **AWS SDK v3**: Modular imports (`@aws-sdk/client-ses`, `@aws-sdk/client-dynamodb`, `@aws-sdk/lib-dynamodb`, `@aws-sdk/client-sqs`).
- **Developer Dashboard**: Included Next.js interactive developer console for testing API requests, viewing message audit logs, and inspecting code snippets.

---

## 4. Setup & Production Deployment Guide

### Prerequisites
1. **AWS CLI** configured with administrator or deployment credentials (`aws configure`).
2. **AWS SAM CLI** installed (`sam --version`).
3. **Node.js 20+** and npm installed.

### Step 1: Clone and Install Dependencies
```bash
git clone <repository-url>
cd aws-serverless-email-api
npm install
```

### Step 2: Build & Package with AWS SAM
Navigate to the backend directory or root and build the SAM application:
```bash
cd backend
sam build
```

### Step 3: Deploy to AWS
Run guided deployment to create your CloudFormation stack, API Gateway, DynamoDB tables, SQS queues, and Lambda functions:
```bash
sam deploy --guided
```
*Follow the prompts (e.g., stack name `email-api-prod`, region `us-east-1`, confirm changesets).*

### Step 4: Seed an API Key in DynamoDB
To authenticate your API requests, add an active API key item to your DynamoDB <code className="text-amber-400">ApiKeys</code> table via AWS CLI or Console:
```bash
aws dynamodb put-item \
    --table-name ApiKeys \
    --item '{"ApiKey": {"S": "ak_prod_99f83a2b1c4e"}, "ClientId": {"S": "client_production"}, "Status": {"S": "ACTIVE"}}'
```

### Step 5: Verify Amazon SES Setup (Important)
- **SES Sandbox**: New AWS SES accounts start in the SES Sandbox. You must verify your sender email address or domain in the **Amazon SES Console -> Verified Identities**.
- To send emails to arbitrary addresses in production, submit a support request to lift SES sandbox restrictions.

### Step 6: Test Your Deployed API

**1. Send an Email (POST):**
```bash
curl -X POST https://YOUR_API_ID.execute-api.REGION.amazonaws.com/prod/api/v1/send \\
  -H "Authorization: Bearer ak_prod_99f83a2b1c4e" \\
  -H "Content-Type: application/json" \\
  -d '{
    "to": "recipient@verifieddomain.com",
    "from": "sender@verifieddomain.com",
    "subject": "Hello from Production API",
    "text": "This email was delivered via API Gateway, SQS, and SES."
  }'
```
*Expected Response (202 Accepted):*
```json
{
  "status": "accepted",
  "messageId": "msg_a1b2c3d4e5f6",
  "message": "Email accepted and published to SQS queue for delivery."
}
```

**2. Check Message Delivery Status (GET):**
```bash
curl -X GET https://YOUR_API_ID.execute-api.REGION.amazonaws.com/prod/api/v1/messages/msg_a1b2c3d4e5f6 \\
  -H "Authorization: Bearer ak_prod_99f83a2b1c4e"
```

**3. List Audit Logs (GET):**
```bash
curl -X GET https://YOUR_API_ID.execute-api.REGION.amazonaws.com/prod/api/v1/messages \\
  -H "Authorization: Bearer ak_prod_99f83a2b1c4e"
```

---

## License
MIT License. Free for commercial and open-source use under AWS Free Tier guidelines.
