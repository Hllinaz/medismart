export type OllamaMessage = {
  role: "system" | "user" | "assistant";
  content: string;
};

export type OllamaChatRequest = {
  model: string;
  messages: OllamaMessage[];
  stream?: boolean;
  format?: "json";
  options?: {
    temperature?: number;
    top_p?: number;
    top_k?: number;
    num_predict?: number;
  };
};

export type OllamaChatResponse = {
  model: string;
  created_at: string;
  message: OllamaMessage;
  done: boolean;
  total_duration?: number;
  load_duration?: number;
  prompt_eval_count?: number;
  eval_count?: number;
};

export type OllamaModelInfo = {
  name: string;
  modified_at: string;
  size: number;
};

export type OllamaListResponse = {
  models: OllamaModelInfo[];
};

export type OllamaPullResponse = {
  status: string;
  digest?: string;
  total?: number;
  completed?: number;
};

export type AssistantAction = {
  intent:
    | "saludo"
    | "listar_especialidades"
    | "listar_medicos"
    | "consultar_disponibilidad"
    | "agendar_cita"
    | "mis_citas"
    | "cancelar_cita"
    | "ayuda"
    | "despedida"
    | "no_entendido";
  entities: {
    especialidad?: string;
    medico?: string;
    doctorId?: string;
    fecha?: string;
    motivo?: string;
    citaId?: string;
    telefono?: string;
  };
  response: string;
  require_action: boolean;
};
