import { Client, LocalAuth } from "whatsapp-web.js";
import QRCode from "qrcode";
import type { WhatsAppStatus, QRData, SendMessageResult } from "./types";

const QR_REFRESH_INTERVAL = 30000;

class WhatsAppManager {
  private client: Client | null = null;
  private status: WhatsAppStatus = "disconnected";
  private qrData: QRData | null = null;
  private messageHandler: ((from: string, body: string, contactName?: string) => Promise<void>) | null = null;
  private initialized = false;
  private initPromise: Promise<void> | null = null;

  onMessage(handler: (from: string, body: string, contactName?: string) => Promise<void>) {
    this.messageHandler = handler;
  }

  async initialize(): Promise<void> {
    if (this.initialized && this.client) return;
    if (this.initPromise) return this.initPromise;

    this.initPromise = this._initialize();
    return this.initPromise;
  }

  private async _initialize(): Promise<void> {
    this.status = "connecting";

    this.client = new Client({
      authStrategy: new LocalAuth({ clientId: "medismart" }),
      puppeteer: {
        headless: true,
        args: [
          "--no-sandbox",
          "--disable-setuid-sandbox",
          "--disable-dev-shm-usage",
          "--disable-accelerated-2d-canvas",
          "--no-first-run",
          "--no-zygote",
          "--single-process",
          "--disable-gpu",
        ],
      },
    });

    this.client.on("qr", async (qr: string) => {
      this.status = "qr";
      try {
        const base64 = await QRCode.toDataURL(qr);
        this.qrData = { base64, timestamp: Date.now() };
      } catch {
        this.qrData = { base64: qr, timestamp: Date.now() };
      }

      setTimeout(() => {
        if (this.status === "qr") {
          this.qrData = null;
        }
      }, QR_REFRESH_INTERVAL);
    });

    this.client.on("ready", () => {
      this.status = "connected";
      this.qrData = null;
    });

    this.client.on("disconnected", () => {
      this.status = "disconnected";
      this.qrData = null;
    });

    this.client.on("message", async (message) => {
      if (message.fromMe) return;
      if (!this.messageHandler) return;

      const contact = await message.getContact();
      await this.messageHandler(
        message.from,
        message.body,
        contact.name || contact.pushname || undefined
      );
    });

    try {
      await this.client.initialize();
      this.initialized = true;
    } catch (error) {
      this.status = "disconnected";
      throw error;
    }
  }

  getStatus(): WhatsAppStatus {
    return this.status;
  }

  getQR(): QRData | null {
    return this.qrData;
  }

  async sendMessage(to: string, text: string): Promise<SendMessageResult> {
    if (!this.client || this.status !== "connected") {
      return { success: false, error: "WhatsApp no conectado" };
    }

    try {
      const chatId = to.includes("@c.us") ? to : `${to}@c.us`;
      const result = await this.client.sendMessage(chatId, text);
      return { success: true, sid: result.id?._serialized };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : "Error al enviar mensaje",
      };
    }
  }

  async getContacts() {
    if (!this.client || this.status !== "connected") return [];
    try {
      const contacts = await this.client.getContacts();
      return contacts
        .filter((c) => !c.isMe && !c.isGroup && c.number)
        .map((c) => ({
          number: c.number,
          name: c.name || c.pushname || c.number,
        }));
    } catch {
      return [];
    }
  }
}

let globalManager: WhatsAppManager | undefined;

function getGlobalManager(): WhatsAppManager {
  if (!globalManager) {
    globalManager = new WhatsAppManager();
  }
  return globalManager;
}

export function getWhatsAppClient(): WhatsAppManager {
  return getGlobalManager();
}
