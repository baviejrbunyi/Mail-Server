export interface EmailLog {
  MessageId: string;
  ClientId: string;
  To: string | string[];
  From: string;
  Subject: string;
  Status: "queued" | "sent" | "failed";
  RetryCount: number;
  ErrorMsg?: string;
  CreatedAt: string;
  UpdatedAt: string;
}

export const globalEmailLogs: EmailLog[] = [
  {
    MessageId: "msg-demo-101",
    ClientId: "client_prod_sample",
    To: "recipient@example.com",
    From: "sender@yourdomain.com",
    Subject: "Welcome to AWS Serverless Email API",
    Status: "sent",
    RetryCount: 0,
    CreatedAt: new Date(Date.now() - 3600000 * 2).toISOString(),
    UpdatedAt: new Date(Date.now() - 3600000 * 2 + 1500).toISOString(),
  },
  {
    MessageId: "msg-demo-102",
    ClientId: "client_prod_sample",
    To: "alerts@yourdomain.com",
    From: "monitor@yourdomain.com",
    Subject: "Daily System Health Report",
    Status: "queued",
    RetryCount: 0,
    CreatedAt: new Date(Date.now() - 60000 * 15).toISOString(),
    UpdatedAt: new Date(Date.now() - 60000 * 15).toISOString(),
  },
];
