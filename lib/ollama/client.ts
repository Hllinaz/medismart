import type { OllamaChatRequest, OllamaChatResponse, OllamaListResponse } from "./types";

function getBaseUrl(): string {
  return process.env.OLLAMA_BASE_URL ?? "http://localhost:11434";
}

function getModel(): string {
  return process.env.OLLAMA_MODEL ?? "phi4:latest";
}

export function createOllamaClient() {
  const baseUrl = getBaseUrl();
  const model = getModel();

  async function chat(
    messages: OllamaChatRequest["messages"],
    options?: Partial<OllamaChatRequest>
  ): Promise<OllamaChatResponse> {
    const res = await fetch(`${baseUrl}/api/chat`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        model,
        messages,
        stream: false,
        format: "json",
        options: { temperature: 0.1, ...options?.options },
        ...options,
      }),
    });

    if (!res.ok) {
      const err = await res.text();
      throw new Error(`Ollama API error (${res.status}): ${err}`);
    }

    return res.json();
  }

  async function health(): Promise<boolean> {
    try {
      const res = await fetch(`${baseUrl}/api/tags`, {
        signal: AbortSignal.timeout(5000),
      });
      return res.ok;
    } catch {
      return false;
    }
  }

  async function listModels(): Promise<OllamaListResponse["models"]> {
    const res = await fetch(`${baseUrl}/api/tags`);
    const data: OllamaListResponse = await res.json();
    return data.models ?? [];
  }

  async function pullModel(name: string = model): Promise<void> {
    const res = await fetch(`${baseUrl}/api/pull`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, stream: false }),
    });

    if (!res.ok) {
      const err = await res.text();
      throw new Error(`Ollama pull error: ${err}`);
    }
  }

  return { chat, health, listModels, pullModel, getModel };
}
