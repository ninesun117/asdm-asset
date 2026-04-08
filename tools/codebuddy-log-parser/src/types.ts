// Log entry types for CodeBuddy log parser

// Base log entry interface
export interface LogEntry {
  timestamp: string;
  rawTimestamp: string;
  type: string;
  subtype?: string;
  uuid: string;
  session_id: string;
  _requestId?: string;
  __timestamp?: string;
  [key: string]: unknown;
}

// System init entry
export interface SystemInitEntry extends LogEntry {
  type: 'system';
  subtype: 'init';
  cwd: string;
  model: string;
  tools: string[];
  permissionMode: string;
  apiKeySource: string;
  mcp_servers: McpServer[];
  slash_commands: string[];
  output_style: string;
}

// MCP Server configuration
export interface McpServer {
  name: string;
  config?: Record<string, unknown>;
}

// File history snapshot entry
export interface FileHistoryEntry extends LogEntry {
  type: 'file-history-snapshot';
  id: string;
  snapshotTimestamp: number;
  isSnapshotUpdate: boolean;
  snapshot: {
    messageId: string;
    trackedFileBackups: Record<string, unknown>;
  };
}

// Assistant message entry
export interface AssistantEntry extends LogEntry {
  type: 'assistant';
  message: AssistantMessage;
  parent_tool_use_id: string | null;
}

export interface AssistantMessage {
  id: string;
  content: MessageContent[];
  model: string;
  role: 'assistant';
  stop_reason: string | null;
  stop_sequence: string | null;
  type: 'message';
  usage: UsageInfo;
}

// Message content types
export interface TextContent {
  type: 'text';
  text: string;
}

export interface ToolUseContent {
  type: 'tool_use';
  id: string;
  name: string;
  input: Record<string, unknown>;
}

export interface ThinkingContent {
  type: 'thinking';
  thinking: string;
}

export type MessageContent = TextContent | ToolUseContent | ThinkingContent | { type: string; [key: string]: unknown };

// User message entry
export interface UserEntry extends LogEntry {
  type: 'user';
  message: {
    content: UserMessageContent[];
    role: 'user';
  };
  parent_tool_use_id: string | null;
}

export interface UserMessageContent {
  type: 'tool_result' | 'text';
  tool_use_id?: string;
  content?: Array<{ type: string; text: string }>;
  is_error?: boolean;
  text?: string;
}

// Result entry
export interface ResultEntry extends LogEntry {
  type: 'result';
  subtype?: 'success' | 'error' | 'cancelled';
  is_error: boolean;
  result: string;
  duration_ms: number;
  duration_api_ms: number;
  num_turns: number;
  total_cost_usd: number;
  usage: UsageInfo;
  permission_denials: PermissionDenial[];
}

// Permission denial
export interface PermissionDenial {
  tool: string;
  reason: string;
  timestamp: string;
}

// Usage information
export interface UsageInfo {
  input_tokens: number;
  output_tokens: number;
  cache_creation_input_tokens: number | null;
  cache_read_input_tokens: number | null;
  cache_creation: unknown | null;
  server_tool_use: unknown | null;
  service_tier: unknown | null;
}

// Error entry
export interface ErrorEntry extends LogEntry {
  type: 'error';
  error: {
    message: string;
    code?: string;
    stack?: string;
  };
}

// Progress entry
export interface ProgressEntry extends LogEntry {
  type: 'progress';
  progress: number;
  message: string;
}

// Permission request entry
export interface PermissionRequestEntry extends LogEntry {
  type: 'permission-request';
  tool: string;
  input: Record<string, unknown>;
  reason: string;
}

// Thinking entry
export interface ThinkingEntry extends LogEntry {
  type: 'thinking';
  thinking: string;
}

// Tool call entry (for detailed tool tracking)
export interface ToolCallEntry extends LogEntry {
  type: 'tool-call';
  tool_name: string;
  tool_input: Record<string, unknown>;
  tool_use_id: string;
}

// Generic entry for unknown types
export interface GenericEntry extends LogEntry {
  type: string;
  [key: string]: unknown;
}

// Union type for all log entries
export type ParsedLogEntry = 
  | SystemInitEntry 
  | FileHistoryEntry 
  | AssistantEntry 
  | UserEntry 
  | ResultEntry
  | ErrorEntry
  | ProgressEntry
  | PermissionRequestEntry
  | ThinkingEntry
  | ToolCallEntry
  | GenericEntry;

// Parsed log structure
export interface ParsedLog {
  entries: ParsedLogEntry[];
  sessionInfo?: SessionInfo;
  result?: ResultEntry;
  errors: ErrorEntry[];
}

export interface SessionInfo {
  sessionId: string;
  model: string;
  cwd: string;
  startTime: string;
  tools?: string[];
  mcpServers?: McpServer[];
}

// Log type enumeration
export enum LogType {
  SYSTEM = 'system',
  FILE_HISTORY = 'file-history-snapshot',
  ASSISTANT = 'assistant',
  USER = 'user',
  RESULT = 'result',
  ERROR = 'error',
  PROGRESS = 'progress',
  PERMISSION_REQUEST = 'permission-request',
  THINKING = 'thinking',
  TOOL_CALL = 'tool-call',
}
