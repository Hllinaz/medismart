export type WhatsAppStatus = "disconnected" | "qr" | "connecting" | "connected";

export type QRData = {
  base64: string;
  timestamp: number;
};

export type MessageEvent = {
  from: string;
  body: string;
  contactName?: string;
};

export type SendMessageResult = {
  success: boolean;
  sid?: string;
  error?: string;
};
