// Log parser for CodeBuddy logs

import {
  LogEntry,
  ParsedLog,
  ParsedLogEntry,
  SystemInitEntry,
  FileHistoryEntry,
  AssistantEntry,
  UserEntry,
  ResultEntry,
  ErrorEntry,
  ProgressEntry,
  PermissionRequestEntry,
  ThinkingEntry,
  ToolCallEntry,
  GenericEntry,
  LogType,
} from './types';

// Regex to match log line format: TIMESTAMP JSON (CodeBuddy format)
const LOG_LINE_REGEX = /^(\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d+Z)\s+(.+)$/;

// Regex to match GitHub Actions log format: TIMESTAMPZ LOG_CONTENT
const GHA_LOG_REGEX = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d+Z\s+(.+)$/;

// Regex to detect JSON object start
const JSON_START_REGEX = /^\s*\{/;

export function parseLogLine(line: string, silent: boolean = true): ParsedLogEntry | null {
  const trimmed = line.trim();
  if (!trimmed) return null;

  let jsonStr: string;
  let rawTimestamp: string | undefined;

  // Try CodeBuddy format first: TIMESTAMP JSON
  let match = trimmed.match(LOG_LINE_REGEX);
  if (match) {
    [, rawTimestamp, jsonStr] = match;
  } else if (JSON_START_REGEX.test(trimmed)) {
    // Pure JSON without timestamp prefix
    jsonStr = trimmed;
    rawTimestamp = undefined;
  } else {
    // Try GitHub Actions format: TIMESTAMPZ JSON
    match = trimmed.match(GHA_LOG_REGEX);
    if (match) {
      jsonStr = match[1];
      rawTimestamp = undefined;
    } else {
      return null;
    }
  }

  let json: Record<string, unknown>;
  try {
    json = JSON.parse(jsonStr);
  } catch {
    return null;
  }

  // Validate it's a CodeBuddy log entry
  if (!json.type || typeof json.type !== 'string') {
    return null;
  }

  // Use __timestamp from JSON if available, otherwise use extracted timestamp or current time
  const timestamp = json.__timestamp as string || rawTimestamp || new Date().toISOString();

  const baseEntry: LogEntry = {
    timestamp: formatTimestamp(timestamp),
    rawTimestamp: timestamp,
    type: json.type as string,
    subtype: json.subtype as string | undefined,
    uuid: json.uuid as string,
    session_id: json.session_id as string,
    _requestId: json._requestId as string,
    __timestamp: json.__timestamp as string,
    ...json,
  };

  return parseTypedEntry(baseEntry, json);
}

function parseTypedEntry(base: LogEntry, json: Record<string, unknown>): ParsedLogEntry {
  const type = base.type;

  switch (type) {
    case LogType.SYSTEM:
      return parseSystemEntry(base, json);
    case LogType.FILE_HISTORY:
      return parseFileHistoryEntry(base, json);
    case LogType.ASSISTANT:
      return base as AssistantEntry;
    case LogType.USER:
      return base as UserEntry;
    case LogType.RESULT:
      return parseResultEntry(base, json);
    case LogType.ERROR:
      return base as ErrorEntry;
    case LogType.PROGRESS:
      return base as ProgressEntry;
    case LogType.PERMISSION_REQUEST:
      return base as PermissionRequestEntry;
    case LogType.THINKING:
      return base as ThinkingEntry;
    case LogType.TOOL_CALL:
      return base as ToolCallEntry;
    default:
      return base as GenericEntry;
  }
}

function parseSystemEntry(base: LogEntry, json: Record<string, unknown>): SystemInitEntry {
  const entry = base as SystemInitEntry;
  entry.mcp_servers = (json.mcp_servers as SystemInitEntry['mcp_servers']) || [];
  entry.slash_commands = (json.slash_commands as string[]) || [];
  entry.output_style = (json.output_style as string) || 'default';
  return entry;
}

function parseFileHistoryEntry(base: LogEntry, json: Record<string, unknown>): FileHistoryEntry {
  const entry = base as FileHistoryEntry;
  entry.snapshotTimestamp = json.timestamp as number;
  return entry;
}

function parseResultEntry(base: LogEntry, json: Record<string, unknown>): ResultEntry {
  const entry = base as ResultEntry;
  entry.permission_denials = (json.permission_denials as ResultEntry['permission_denials']) || [];
  return entry;
}

function formatTimestamp(isoTimestamp: string): string {
  try {
    const date = new Date(isoTimestamp);
    return date.toLocaleString('zh-CN', {
      hour12: false,
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    });
  } catch {
    return isoTimestamp;
  }
}

export function parseLogFile(content: string): ParsedLog {
  const lines = content.split('\n');
  const entries: ParsedLogEntry[] = [];
  const errors: ErrorEntry[] = [];
  let sessionInfo: ParsedLog['sessionInfo'];
  let result: ResultEntry | undefined;

  for (const line of lines) {
    const entry = parseLogLine(line, true);
    if (!entry) continue;

    entries.push(entry);

    // Extract session info from init entry
    if (entry.type === LogType.SYSTEM && entry.subtype === 'init') {
      const initEntry = entry as SystemInitEntry;
      sessionInfo = {
        sessionId: initEntry.session_id,
        model: initEntry.model,
        cwd: initEntry.cwd,
        startTime: entry.timestamp,
        tools: initEntry.tools,
        mcpServers: initEntry.mcp_servers,
      };
    }

    // Capture result entry
    if (entry.type === LogType.RESULT) {
      result = entry as ResultEntry;
    }

    // Collect error entries
    if (entry.type === LogType.ERROR) {
      errors.push(entry as ErrorEntry);
    }
  }

  return { entries, sessionInfo, result, errors };
}

// Utility function to check if entry is of a specific type
export function isEntryType<T extends ParsedLogEntry>(entry: ParsedLogEntry, type: string): entry is T {
  return entry.type === type;
}

// Get all entries of a specific type
export function getEntriesByType<T extends ParsedLogEntry>(log: ParsedLog, type: string): T[] {
  return log.entries.filter((entry): entry is T => entry.type === type);
}
