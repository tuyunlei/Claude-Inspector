export function stripAnsi(str: string): string {
    // eslint-disable-next-line no-control-regex
    return str.replace(/\x1b\[[0-9;]*m/g, '');
}

export function getTextContent(content: any): string {
    if (typeof content === 'string') return content;
    if (Array.isArray(content)) {
        return content
            .filter((c: any) => c.type === 'text')
            .map((c: any) => c.text)
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