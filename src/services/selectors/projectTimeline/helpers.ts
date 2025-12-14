
export function stripAnsi(str: string): string {
    // eslint-disable-next-line no-control-regex
    return str.replace(/\x1b\[[0-9;]*m/g, '');
}

type MessageContent = { type: string; text?: string }[] | string;

export function getTextContent(content: MessageContent | undefined): string {
    if (!content) return '';
    if (typeof content === 'string') return content;
    if (Array.isArray(content)) {
        return content
            .filter((c): c is { type: string; text: string } => c.type === 'text' && typeof c.text === 'string')
            .map(c => c.text)
            .join('\n');
    }
    return '';
}

export function getActionKind(name: string): 'tool' | 'subagent' {
    if (!name) return 'tool';
    const lower = name.toLowerCase();
    if (lower.includes('agent') || lower === 'mcp' || lower === 'bash' || lower === 'glob') return 'subagent';
    return 'tool';
}