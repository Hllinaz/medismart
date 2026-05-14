type ConversationEntry = {
  role: "user" | "assistant" | "system";
  content: string;
  timestamp: Date;
};

type ConversationState = {
  phoneNumber: string;
  contactName: string | null;
  messages: ConversationEntry[];
  context: Record<string, unknown>;
  createdAt: Date;
  lastActivity: Date;
};

const MAX_MESSAGES = 50;
const TTL_MS = 24 * 60 * 60 * 1000;

class ConversationStore {
  private conversations = new Map<string, ConversationState>();

  private cleanup(): void {
    const now = Date.now();
    for (const [key, conv] of this.conversations) {
      if (now - conv.lastActivity.getTime() > TTL_MS) {
        this.conversations.delete(key);
      }
    }
  }

  getOrCreate(phoneNumber: string, contactName?: string): ConversationState {
    this.cleanup();

    let conv = this.conversations.get(phoneNumber);
    if (!conv) {
      conv = {
        phoneNumber,
        contactName: contactName ?? null,
        messages: [],
        context: {},
        createdAt: new Date(),
        lastActivity: new Date(),
      };
      this.conversations.set(phoneNumber, conv);
    }

    if (contactName && conv.contactName !== contactName) {
      conv.contactName = contactName;
    }

    return conv;
  }

  addMessage(
    phoneNumber: string,
    role: "user" | "assistant" | "system",
    content: string
  ): void {
    const conv = this.conversations.get(phoneNumber);
    if (!conv) return;

    conv.messages.push({ role, content, timestamp: new Date() });
    conv.lastActivity = new Date();

    if (conv.messages.length > MAX_MESSAGES) {
      conv.messages = conv.messages.slice(-MAX_MESSAGES);
    }
  }

  getHistory(phoneNumber: string, limit = 10): ConversationEntry[] {
    const conv = this.conversations.get(phoneNumber);
    if (!conv) return [];
    return conv.messages.slice(-limit);
  }

  getContext(phoneNumber: string): Record<string, unknown> {
    return this.conversations.get(phoneNumber)?.context ?? {};
  }

  setContext(phoneNumber: string, key: string, value: unknown): void {
    const conv = this.conversations.get(phoneNumber);
    if (conv) {
      conv.context = { ...conv.context, [key]: value };
    }
  }

  clearContext(phoneNumber: string): void {
    const conv = this.conversations.get(phoneNumber);
    if (conv) {
      conv.context = {};
    }
  }

  remove(phoneNumber: string): void {
    this.conversations.delete(phoneNumber);
  }

  size(): number {
    return this.conversations.size;
  }
}

export const conversationStore = new ConversationStore();
