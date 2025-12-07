
export interface McpServerConfig {
  command: string;
  args: string[];
  env?: Record<string, string>;
}

export interface ConfigData {
  settings?: any;
  mcpServers?: Record<string, McpServerConfig>;
  rawSettingsJson?: string;
  rawMcpJson?: string;
  extraMcpJson?: string; // For manually uploaded config
}

export interface ParseWarning {
  file: string;
  line?: number;
  message: string;
}
