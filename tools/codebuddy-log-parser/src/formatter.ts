// Output formatter for parsed logs

import {
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
  MessageContent,
  LogType,
} from './types';

export interface FormatterOptions {
  verbose?: boolean;
  showTimestamps?: boolean;
  showToolResults?: boolean;
  colorize?: boolean;
}

// ANSI color codes
const colors = {
  reset: '\x1b[0m',
  bold: '\x1b[1m',
  dim: '\x1b[2m',
  green: '\x1b[32m',
  blue: '\x1b[34m',
  yellow: '\x1b[33m',
  cyan: '\x1b[36m',
  magenta: '\x1b[35m',
  red: '\x1b[31m',
};

function color(text: string, colorCode: string, enabled: boolean): string {
  return enabled ? `${colorCode}${text}${colors.reset}` : text;
}

export function formatLog(log: ParsedLog, options: FormatterOptions = {}): string {
  const { verbose = false, showTimestamps = true, showToolResults = true, colorize = true } = options;
  const output: string[] = [];

  // Header
  output.push(color('═'.repeat(60), colors.cyan, colorize));
  output.push(color('  CodeBuddy Log Parser Output', colors.bold + colors.cyan, colorize));
  output.push(color('═'.repeat(60), colors.cyan, colorize));
  output.push('');

  // Session Info
  if (log.sessionInfo) {
    output.push(color('📋 Session Information', colors.bold + colors.green, colorize));
    output.push('─'.repeat(40));
    output.push(`  Session ID: ${color(log.sessionInfo.sessionId, colors.dim, colorize)}`);
    output.push(`  Model:      ${color(log.sessionInfo.model, colors.yellow, colorize)}`);
    output.push(`  Working Dir: ${log.sessionInfo.cwd}`);
    output.push(`  Start Time: ${log.sessionInfo.startTime}`);
    if (verbose && log.sessionInfo.tools) {
      output.push(`  Tools:      ${log.sessionInfo.tools.slice(0, 5).join(', ')}${log.sessionInfo.tools.length > 5 ? '...' : ''}`);
    }
    output.push('');
  }

  // Errors
  if (log.errors.length > 0) {
    output.push(color('❌ Errors', colors.bold + colors.red, colorize));
    output.push('─'.repeat(40));
    for (const error of log.errors) {
      output.push(`  ${error.timestamp}: ${error.error?.message || 'Unknown error'}`);
    }
    output.push('');
  }

  // Conversation flow
  output.push(color('💬 Conversation Flow', colors.bold + colors.green, colorize));
  output.push('─'.repeat(40));

  let turnNumber = 0;
  let lastType = '';

  for (const entry of log.entries) {
    const timestamp = showTimestamps ? color(`[${entry.timestamp}]`, colors.dim, colorize) + ' ' : '';

    switch (entry.type) {
      case LogType.SYSTEM:
        // Skip system init (already shown in session info)
        break;

      case LogType.FILE_HISTORY:
        // Skip file history
        break;

      case LogType.ASSISTANT:
        const assistantEntry = entry as AssistantEntry;
        
        if (lastType !== LogType.ASSISTANT) {
          turnNumber++;
          output.push('');
          output.push(color(`  ┌─ Turn ${turnNumber} ─`, colors.blue, colorize));
        }

        for (const content of assistantEntry.message.content) {
          const formatted = formatMessageContent(content, timestamp, colorize, verbose);
          if (formatted) {
            for (const line of formatted) {
              output.push(`  │ ${line}`);
            }
          }
        }
        break;

      case LogType.USER:
        if (showToolResults) {
          const userEntry = entry as UserEntry;
          for (const content of userEntry.message.content) {
            const formatted = formatUserContent(content, timestamp, colorize, verbose);
            for (const line of formatted) {
              output.push(`  │ ${line}`);
            }
          }
        }
        break;

      case LogType.ERROR:
        const errorEntry = entry as ErrorEntry;
        output.push(`  │ ${timestamp}❌ ${color('Error:', colors.red, colorize)} ${errorEntry.error?.message || 'Unknown'}`);
        break;

      case LogType.PROGRESS:
        const progressEntry = entry as ProgressEntry;
        output.push(`  │ ${timestamp}⏳ ${color('Progress:', colors.cyan, colorize)} ${progressEntry.progress}% - ${progressEntry.message}`);
        break;

      case LogType.PERMISSION_REQUEST:
        const permEntry = entry as PermissionRequestEntry;
        output.push(`  │ ${timestamp}🔐 ${color('Permission:', colors.yellow, colorize)} ${permEntry.tool} - ${permEntry.reason}`);
        break;

      case LogType.THINKING:
        const thinkingEntry = entry as ThinkingEntry;
        output.push(`  │ ${timestamp}💭 ${color('Thinking:', colors.dim, colorize)} ${thinkingEntry.thinking.substring(0, 100)}...`);
        break;

      case LogType.TOOL_CALL:
        const toolCallEntry = entry as ToolCallEntry;
        output.push(`  │ ${timestamp}🔧 ${color('Tool Call:', colors.magenta, colorize)} ${toolCallEntry.tool_name}`);
        break;

      case LogType.RESULT:
        // Skip result (shown at the end)
        break;

      default:
        // Handle unknown types
        if (verbose) {
          output.push(`  │ ${timestamp}❓ ${color('Unknown:', colors.dim, colorize)} ${(entry as any).type}`);
        }
    }

    lastType = entry.type;
  }

  output.push('');
  output.push(color('  └' + '─'.repeat(30), colors.blue, colorize));
  output.push('');

  // Result Summary
  if (log.result) {
    output.push(...formatResultSummary(log.result, colorize, verbose));
  }

  output.push(color('═'.repeat(60), colors.cyan, colorize));

  return output.join('\n');
}

function formatMessageContent(content: MessageContent | any, timestamp: string, colorize: boolean, verbose: boolean): string[] {
  const lines: string[] = [];

  if (content.type === 'text' && content.text) {
    const text = content.text.trim();
    if (text) {
      lines.push(`${timestamp}🤖 ${color('Assistant:', colors.blue, colorize)}`);
      const textLines = text.split('\n');
      for (const line of textLines) {
        lines.push(`   ${line}`);
      }
    }
  } else if (content.type === 'tool_use') {
    const toolName = content.name || 'unknown';
    lines.push(`${timestamp}🔧 ${color('Tool:', colors.magenta, colorize)} ${color(toolName, colors.yellow, colorize)}`);
    
    if (verbose && content.input && Object.keys(content.input).length > 0) {
      const inputStr = JSON.stringify(content.input, null, 2);
      const inputLines = inputStr.split('\n');
      for (const line of inputLines) {
        lines.push(`   ${color(line, colors.dim, colorize)}`);
      }
    }
  } else if (content.type === 'thinking' && content.thinking) {
    const thinkingText = String(content.thinking);
    lines.push(`${timestamp}💭 ${color('Thinking:', colors.dim, colorize)}`);
    lines.push(`   ${thinkingText.substring(0, 200)}${thinkingText.length > 200 ? '...' : ''}`);
  }

  return lines;
}

function formatUserContent(content: any, timestamp: string, colorize: boolean, verbose: boolean): string[] {
  const lines: string[] = [];

  if (content.type === 'tool_result') {
    const isError = content.is_error;
    const icon = isError ? '❌' : '✅';
    const resultColor = isError ? colors.red : colors.green;
    
    lines.push(`${timestamp}${icon} ${color('Result:', resultColor, colorize)}`);
    
    if (content.content) {
      for (const resultContent of content.content) {
        if (resultContent.type === 'text') {
          const text = resultContent.text;
          const textLines = text.split('\n');
          const displayLines = verbose ? textLines : textLines.slice(0, 5);
          for (const line of displayLines) {
            lines.push(`   ${color(line, colors.dim, colorize)}`);
          }
          if (!verbose && textLines.length > 5) {
            lines.push(`   ${color(`... (${textLines.length - 5} more lines)`, colors.dim, colorize)}`);
          }
        }
      }
    }
  } else if (content.type === 'text' && content.text) {
    lines.push(`${timestamp}👤 ${color('User:', colors.green, colorize)}`);
    lines.push(`   ${content.text}`);
  }

  return lines;
}

function formatResultSummary(result: ResultEntry, colorize: boolean, verbose: boolean): string[] {
  const lines: string[] = [];
  
  lines.push(color('📊 Summary', colors.bold + colors.green, colorize));
  lines.push('─'.repeat(40));
  
  const statusIcon = result.is_error ? '❌' : '✅';
  const statusText = result.subtype === 'success' ? 'Success' : 
                     result.subtype === 'cancelled' ? 'Cancelled' : 'Failed';
  lines.push(`  Status: ${statusIcon} ${statusText}`);
  lines.push(`  Duration: ${formatDuration(result.duration_ms)}`);
  lines.push(`  Turns: ${result.num_turns}`);
  lines.push(`  Cost: $${result.total_cost_usd.toFixed(4)}`);
  lines.push(`  Tokens: ${formatTokens(result.usage)}`);
  
  if (result.permission_denials && result.permission_denials.length > 0) {
    lines.push(`  Permission Denials: ${result.permission_denials.length}`);
  }
  
  lines.push('');

  if (verbose && result.result) {
    lines.push(color('  Result:', colors.cyan, colorize));
    const resultLines = result.result.split('\n');
    for (const line of resultLines) {
      lines.push(`    ${line}`);
    }
    lines.push('');
  }

  return lines;
}

function formatDuration(ms: number): string {
  if (ms < 1000) return `${ms}ms`;
  if (ms < 60000) return `${(ms / 1000).toFixed(1)}s`;
  const minutes = Math.floor(ms / 60000);
  const seconds = Math.round((ms % 60000) / 1000);
  return `${minutes}m ${seconds}s`;
}

function formatTokens(usage: { input_tokens: number; output_tokens: number }): string {
  const input = usage.input_tokens.toLocaleString();
  const output = usage.output_tokens.toLocaleString();
  return `${input} in / ${output} out`;
}

export function formatHumanChat(log: ParsedLog, options: FormatterOptions = {}): string {
  const { verbose = false, colorize = true } = options;
  const output: string[] = [];

  for (const entry of log.entries) {
    const formatted = formatEntryHumanChat(entry, verbose, colorize);
    if (formatted) {
      output.push(formatted);
    }
  }

  // Add summary at the end
  if (log.result) {
    output.push('');
    output.push(`${color('summary:', colors.cyan, colorize)} ${log.result.is_error ? 'error' : 'success'} | duration: ${formatDuration(log.result.duration_ms)} | turns: ${log.result.num_turns}`);
  }

  return output.join('\n');
}

function formatEntryHumanChat(entry: ParsedLogEntry, verbose: boolean, colorize: boolean): string | null {
  switch (entry.type) {
    case LogType.SYSTEM:
    case LogType.FILE_HISTORY:
    case LogType.RESULT:
      return null;

    case LogType.ASSISTANT:
      return formatAssistantHumanChat(entry as AssistantEntry, verbose, colorize);

    case LogType.USER:
      return formatUserHumanChat(entry as UserEntry, verbose, colorize);

    case LogType.ERROR:
      const errorEntry = entry as ErrorEntry;
      return `${color('error:', colors.red, colorize)} ${errorEntry.error?.message || 'Unknown error'}`;

    case LogType.PROGRESS:
      const progressEntry = entry as ProgressEntry;
      return `${color('progress:', colors.cyan, colorize)} ${progressEntry.progress}% - ${progressEntry.message}`;

    case LogType.PERMISSION_REQUEST:
      const permEntry = entry as PermissionRequestEntry;
      return `${color('permission:', colors.yellow, colorize)} ${permEntry.tool}`;

    case LogType.THINKING:
      const thinkingEntry = entry as ThinkingEntry;
      return `${color('thinking:', colors.dim, colorize)} ${thinkingEntry.thinking.substring(0, 100)}...`;

    case LogType.TOOL_CALL:
      const toolCallEntry = entry as ToolCallEntry;
      return `${color('tool_call:', colors.magenta, colorize)}${color(toolCallEntry.tool_name, colors.yellow, colorize)}`;

    default:
      if (verbose) {
        return `${color('unknown:', colors.dim, colorize)} ${(entry as any).type}`;
      }
      return null;
  }
}

function formatAssistantHumanChat(entry: AssistantEntry, verbose: boolean, colorize: boolean): string | null {
  const parts: string[] = [];

  for (const content of entry.message.content) {
    const c = content as any;
    if (content.type === 'text' && c.text) {
      const text = String(c.text).trim();
      if (text) {
        parts.push(`${color('assistant:', colors.blue, colorize)} ${text}`);
      }
    } else if (content.type === 'tool_use') {
      const toolName = c.name || 'unknown';
      parts.push(`${color('tool_use:', colors.magenta, colorize)}${color(toolName, colors.yellow, colorize)}`);
      
      if (verbose && c.input && Object.keys(c.input).length > 0) {
        const inputStr = JSON.stringify(c.input);
        parts.push(`  input: ${inputStr}`);
      }
    } else if (content.type === 'thinking' && c.thinking) {
      const thinkingText = String(c.thinking);
      parts.push(`${color('thinking:', colors.dim, colorize)} ${thinkingText.substring(0, 100)}...`);
    }
  }

  return parts.length > 0 ? parts.join('\n') : null;
}

function formatUserHumanChat(entry: UserEntry, verbose: boolean, colorize: boolean): string | null {
  const parts: string[] = [];

  for (const content of entry.message.content) {
    if (content.type === 'tool_result') {
      const isError = content.is_error;
      const resultColor = isError ? colors.red : colors.green;
      
      if (content.content) {
        for (const resultContent of content.content) {
          if (resultContent.type === 'text') {
            const text = resultContent.text.trim();
            const displayText = verbose ? text : text.split('\n').slice(0, 3).join('\n');
            const truncated = !verbose && text.split('\n').length > 3;
            
            parts.push(`${color('tool_result:', resultColor, colorize)} ${displayText}${truncated ? '...' : ''}`);
          }
        }
      }
    } else if (content.type === 'text' && content.text) {
      parts.push(`${color('user:', colors.green, colorize)} ${content.text}`);
    }
  }

  return parts.length > 0 ? parts.join('\n') : null;
}

export function formatJson(log: ParsedLog): string {
  const simplified = {
    session: log.sessionInfo,
    entries: log.entries.map(entry => ({
      type: entry.type,
      timestamp: entry.timestamp,
      uuid: entry.uuid,
    })),
    turns: [] as Array<{
      timestamp: string;
      type: string;
      content: string | Array<{ type: string; name?: string; text?: string }>;
    }>,
    result: log.result ? {
      status: log.result.is_error ? 'error' : 'success',
      duration_ms: log.result.duration_ms,
      turns: log.result.num_turns,
      cost_usd: log.result.total_cost_usd,
    } : null,
    errors: log.errors.map(e => ({
      timestamp: e.timestamp,
      message: e.error?.message,
    })),
  };

  for (const entry of log.entries) {
    if (entry.type === LogType.ASSISTANT) {
      const assistantEntry = entry as AssistantEntry;
      simplified.turns.push({
        timestamp: entry.timestamp,
        type: 'assistant',
        content: assistantEntry.message.content.map(c => {
          const content = c as any;
          return {
            type: c.type,
            name: content.name,
            text: content.text ? String(content.text).substring(0, 200) : undefined,
          };
        }),
      });
    }
  }

  return JSON.stringify(simplified, null, 2);
}
