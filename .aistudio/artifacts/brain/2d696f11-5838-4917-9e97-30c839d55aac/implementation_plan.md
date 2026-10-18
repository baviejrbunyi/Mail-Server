# AWS Serverless Email API Server & Developer Console

A lightweight, independent Serverless Email API Server deployed on AWS (API Gateway REST API, Lambda, SQS, DynamoDB, and SES) adhering strictly to AWS Free Tier limits, accompanied by an interactive Next.js developer console and API playground.

## User Review & Critical Decisions

> [!IMPORTANT]
> The following architectural preferences were confirmed during the planning phase:
> - **Infrastructure as Code**: AWS SAM (`template.yaml`) with CloudFormation.
> - **Authentication & Logging**: DynamoDB `ApiKeys` table for Bearer token validation and `EmailLogs` table with a Global Secondary Index (GSI) for audit trails.
> - **Resiliency & Retries**: Amazon SQS with Dead Letter Queue (DLQ) configured for 3 max receive retries.

---

## 1. Overview & Core Concept

- **What It Does**: Bridges modern JSON HTTP payloads (`POST /api/v1/send`) with asynchronous Amazon SES email delivery using SQS decoupling, ensuring reliable retries, API key authentication, and audit logs.
- **Target Audience**: Developers and engineering teams seeking a self-hosted, serverless transactional email microservice.
- **Key Value**: 100% serverless (AWS Free Tier compatible), decoupled queue architecture preventing request timeouts, robust error recovery with DLQ, and a polished developer console to test, inspect logs, and copy IaC templates.

---

## 2. User Experience & Visual Design

- **Aesthetic Direction**: Professional utilitarian developer console (inspired by AWS Console & Vercel Developer Hub), utilizing clean dark/light slate neutrals, monospace tabular metrics, and crisp code blocks.
- **Color Palette & Typography**:
  - *Neutrals*: Slate (`#0F172A` / `#F8FAFC`).
  - *Accent*: AWS Orange / Amber (`#F59E0B` / `#D97706`).
  - *Typography*: Plus Jakarta Sans for UI headings and body, JetBrains Mono for API endpoints, JSON payloads, and terminal curl commands.
- **Core Dashboard Views**:
  - **API Playground**: Interactive testing interface to send test emails with custom recipients, subjects, and HTML/text bodies.
  - **Message Audit Log**: Real-time inspection of DynamoDB `EmailLogs` (status: `queued`, `sent`, `failed`, retry count).
  - **Architecture & SAM Config**: Complete copy-pasteable `template.yaml`, `ingestEmail.ts`, `processEmailQueue.ts`, and `curl` verification snippets.

---

## 3. Key Product Decisions & Trade-Offs

- **Asynchronous Ingestion**: `POST /api/v1/send` records the email as `queued` in DynamoDB and publishes to SQS, returning `202 Accepted` immediately (bypassing SES latency).
- **Decoupled Worker**: SQS triggers `processEmailQueue` Lambda to handle SES delivery and retries automatically on transient errors.
- **Interactive Simulator**: The Next.js frontend includes a mock local simulation mode so users can test the entire serverless email workflow directly in AI Studio before deploying to AWS.

---

## 4. Technical Architecture & Data Strategy

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

### Data Models & Schemas (DynamoDB)
1. **ApiKeys Table**:
   - Primary Key: `ApiKey` (String)
   - Attributes: `ClientId`, `Status`, `CreatedAt`
2. **EmailLogs Table**:
   - Primary Key: `MessageId` (String, UUID)
   - GSI: `ClientId-CreatedAt-Index` (Hash Key: `ClientId`, Sort Key: `CreatedAt`)
   - Attributes: `To`, `From`, `Subject`, `Status` (`queued`, `sent`, `failed`), `RetryCount`, `Error`, `UpdatedAt`
