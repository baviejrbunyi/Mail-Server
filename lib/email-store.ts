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

export const globalEmailLogs: StoredEmailLog[] = [];

export const globalRegisteredUsers = new Set<string>();
