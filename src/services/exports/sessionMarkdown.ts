
import { SessionSummary } from '../../model/sessions';
import { ClaudeContentBlock } from '../../model/events';

function formatBlock(block: ClaudeContentBlock): string {
  if (block.type === 'text') {
    return block.text || '';
  }
  if (block.type === 'tool_use') {
    const inputStr = JSON.stringify(block.input, null, 2);
    return `> **Tool Use**: \`${block.name}\`\n\`\`\`json\n${inputStr}\n\`\`\``;
  }
  if (block.type === 'tool_result') {
    let content = block.content;
    if (typeof content !== 'string') {
      content = JSON.stringify(content, null, 2);
    }
    return `> **Tool Result**:\n\`\`\`\n${content}\n\`\`\``;
  }
  if (block.type === 'image') {
    return `> [Image Content]`;
  }
  return `> [Unsupported Block: ${block.type}]`;
}

export function sessionToMarkdown(session: SessionSummary): string {
  const lines: string[] = [];

  // Header
  lines.push(`# Session: ${session.display}`);
  lines.push(`- **ID**: ${session.id}`);
  lines.push(`- **Date**: ${new Date(session.timestamp).toLocaleString()}`);
  lines.push(`- **Project**: ${session.projectPath}`);
  lines.push(`- **Stats**: ${session.messageCount} messages, ${session.totalTokens.toLocaleString()} tokens`);
  lines.push(`\n---\n`);

  // Events
  session.events.forEach((event, index) => {
    if (!event.message) return;

    const role = event.message.role.toUpperCase();
    const time = new Date(event.timestamp).toLocaleTimeString();
    
    lines.push(`### ${role} (${time})`);

    const content = event.message.content;
    if (Array.isArray(content)) {
      content.forEach(block => {
        if (block.type === 'thinking') return; // Skip thinking in export usually, or make optional
        lines.push(formatBlock(block));
      });
    } else if (typeof content === 'string') {
      lines.push(content);
    }

    lines.push(`\n`);
  });

  return lines.join('\n');
}

export function downloadTextFile(filename: string, content: string) {
  const blob = new Blob([content], { type: 'text/markdown;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

export async function copyMarkdownToClipboard(content: string): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(content);
    return true;
  } catch (err) {
    console.error('Failed to copy', err);
    return false;
  }
}
