export interface StoredApiKey {
  id: string;
  user_id: string;
  api_key: string;
  key_prefix: string;
  name: string;
  status: "ACTIVE" | "REVOKED";
  created_at: string;
}

export interface StoredEmailLog {
  message_id: string;
  user_id?: string;
  client_id?: string;
  recipient: string[];
  sender: string;
  subject: string;
  text?: string;
  html?: string;
  status: "queued" | "sent" | "failed";
  retry_count: number;
  error_msg?: string;
  created_at: string;
  updated_at: string;
}

export const globalApiKeys: StoredApiKey[] = [
  {
    id: "key_demo_default",
    user_id: "usr_demo_default",
    api_key: "ak_live_demo123456789abcdef0123456789abcdef",
    key_prefix: "ak_live_demo...",
    name: "Default Demo Key",
    status: "ACTIVE",
    created_at: new Date().toISOString(),
  },
];

export const globalEmailLogs: StoredEmailLog[] = [
  {
    message_id: "msg_demo_101",
    user_id: "usr_demo_default",
    client_id: "ak_live_demo",
    recipient: ["recipient@example.com"],
    sender: "noreply@yourdomain.com",
    subject: "Welcome to Serverless Email API",
    status: "sent",
    retry_count: 0,
    created_at: new Date(Date.now() - 3600000 * 2).toISOString(),
    updated_at: new Date(Date.now() - 3600000 * 2 + 1500).toISOString(),
  },
  {
    message_id: "msg_demo_102",
    user_id: "usr_demo_default",
    client_id: "ak_live_demo",
    recipient: ["team@example.com"],
    sender: "alerts@yourdomain.com",
    subject: "Daily System Delivery Summary",
    status: "queued",
    retry_count: 0,
    created_at: new Date(Date.now() - 60000 * 15).toISOString(),
    updated_at: new Date(Date.now() - 60000 * 15).toISOString(),
  },
];
