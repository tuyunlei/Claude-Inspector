
export interface ClaudeContentBlock {
  type: 'text' | 'tool_use' | 'tool_result' | 'image' | 'thinking';
  text?: string;
  name?: string; // for tool_use
  input?: any; // for tool_use
  tool_use_id?: string; // for tool_result
  content?: string | any; // for tool_result
  thinking?: string; // for thinking
  signature?: string; // for thinking
}

export interface ClaudeMessage {
  id?: string;
  role: 'user' | 'assistant' | 'system';
  model?: string;
  content: ClaudeContentBlock[] | string;
  usage?: {
    input_tokens?: number;
    output_tokens?: number;
  };
}

export interface ClaudeEvent {
  uuid?: string;
  sessionId: string;
  cwd?: string;
  timestamp: string; // ISO string
  type: string; // user, assistant, system, summary, etc.
  message?: ClaudeMessage;
  toolUseResult?: any;
  raw?: any;
}
