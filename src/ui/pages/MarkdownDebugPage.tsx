import React, { useMemo, useState } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import rehypeRaw from "rehype-raw";
import rehypeSanitize from "rehype-sanitize";
import rehypeHighlight from "rehype-highlight";

import { unified } from "unified";
import remarkParse from "remark-parse";
import remarkRehype from "remark-rehype";
import rehypeStringify from "rehype-stringify";
import { Bug, FileCode, Settings2, Eye } from "lucide-react";

import "highlight.js/styles/github-dark.css"; 

const DEFAULT_MARKDOWN = `# Markdown Debug

- Support **GFM** (Tables, Task lists, etc.)
- Support optional \`HTML\` parsing (rehype-raw + rehype-sanitize)
- Support Code Highlighting (rehype-highlight)

## Table Example

| Name | Value |
| ---- | ----- |
| Foo  | 123   |
| Bar  | 456   |

## Task List

- [x] Basic Rendering
- [ ] Business Integration

## HTML Example

<div style="padding: 8px; border-radius: 8px; border: 1px solid #ccc;">
  <strong>Raw HTML Block</strong>
  <p>Content inside <code>&lt;div&gt;</code>.</p>
</div>

\`\`\`ts
function hello(name: string) {
  console.log("Hello", name);
}
\`\`\`
`;

type MarkdownConfig = {
  enableGfm: boolean;
  allowHtml: boolean;
  sanitizeHtml: boolean;
  enableHighlight: boolean;
};

export const MarkdownDebugPage: React.FC = () => {
  const [source, setSource] = useState<string>(DEFAULT_MARKDOWN);
  const [config, setConfig] = useState<MarkdownConfig>({
    enableGfm: true,
    allowHtml: true,
    sanitizeHtml: true,
    enableHighlight: true,
  });

  // remark / rehype plugins for ReactMarkdown
  const remarkPlugins = useMemo(() => {
    const list: any[] = [];
    if (config.enableGfm) list.push(remarkGfm);
    return list;
  }, [config.enableGfm]);

  const rehypePlugins = useMemo(() => {
    const list: any[] = [];
    if (config.allowHtml) {
      list.push(rehypeRaw);
      if (config.sanitizeHtml) {
        list.push(rehypeSanitize);
      }
    }
    if (config.enableHighlight) {
      list.push(rehypeHighlight);
    }
    return list;
  }, [config.allowHtml, config.sanitizeHtml, config.enableHighlight]);

  // Unified pipeline for HTML output preview
  const htmlOutput = useMemo(() => {
    try {
      const processor = unified()
        .use(remarkParse)
        .use(config.enableGfm ? remarkGfm : () => {})
        // @ts-ignore - unified types can be tricky with optional plugins
        .use(remarkRehype, { allowDangerousHtml: config.allowHtml })
        .use(config.allowHtml ? rehypeRaw : () => {})
        .use(config.allowHtml && config.sanitizeHtml ? rehypeSanitize : () => {})
        .use(rehypeHighlight)
        .use(rehypeStringify);

      const file = processor.processSync(source);
      return String(file.value ?? file);
    } catch (e) {
      return `<!-- HTML Generation Error: ${(e as Error).message} -->`;
    }
  }, [source, config]);

  return (
    <div className="flex flex-col h-full bg-slate-50 dark:bg-slate-950 p-4 md:p-6 overflow-hidden">
      <header className="flex items-center justify-between mb-4 shrink-0">
        <div className="flex items-center gap-2">
            <div className="p-2 bg-purple-100 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400 rounded-lg">
                <Bug size={20} />
            </div>
            <div>
                <h1 className="text-xl font-bold text-slate-900 dark:text-slate-100">Markdown Debug</h1>
                <p className="text-xs text-slate-500 dark:text-slate-400">Experimental renderer configuration playground</p>
            </div>
        </div>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 flex-1 min-h-0">
        {/* Left: Editor */}
        <section className="flex flex-col h-full bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
          <div className="px-4 py-2 border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900 flex items-center gap-2 text-xs font-semibold text-slate-500 uppercase tracking-wider">
            <Settings2 size={12} /> Source
          </div>
          <textarea
            className="flex-1 w-full resize-none p-4 text-sm font-mono leading-relaxed outline-none bg-transparent text-slate-800 dark:text-slate-200"
            value={source}
            onChange={(e) => setSource(e.target.value)}
            spellCheck={false}
          />
        </section>

        {/* Middle: Preview */}
        <section className="flex flex-col h-full bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
          <div className="px-4 py-2 border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900 flex items-center gap-2 text-xs font-semibold text-slate-500 uppercase tracking-wider">
            <Eye size={12} /> Preview
          </div>
          <div className="flex-1 overflow-auto p-6">
            <div className="prose prose-sm prose-slate dark:prose-invert max-w-none">
                {/* @ts-ignore */}
                <ReactMarkdown remarkPlugins={remarkPlugins} rehypePlugins={rehypePlugins}>
                  {source}
                </ReactMarkdown>
            </div>
          </div>
        </section>

        {/* Right: HTML & Config */}
        <section className="flex flex-col h-full gap-4 min-h-0">
          
          {/* HTML Output */}
          <div className="flex-1 flex flex-col bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden min-h-0">
            <div className="px-4 py-2 border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900 flex items-center gap-2 text-xs font-semibold text-slate-500 uppercase tracking-wider">
                <FileCode size={12} /> HTML Output
            </div>
            <div className="flex-1 overflow-auto p-0 bg-slate-50 dark:bg-slate-950">
                <pre className="text-xs font-mono p-4 text-slate-600 dark:text-slate-300 whitespace-pre-wrap break-all">
                {htmlOutput}
                </pre>
            </div>
          </div>

          {/* Config Controls */}
          <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm p-4 shrink-0">
            <div className="text-xs font-semibold text-slate-900 dark:text-slate-100 mb-3 uppercase tracking-wider">
                Configuration
            </div>
            <div className="space-y-3">
                <label className="flex items-center gap-2 text-sm text-slate-700 dark:text-slate-300 cursor-pointer">
                <input
                    type="checkbox"
                    className="rounded border-slate-300 text-purple-600 focus:ring-purple-500"
                    checked={config.enableGfm}
                    onChange={(e) =>
                    setConfig((c) => ({ ...c, enableGfm: e.target.checked }))
                    }
                />
                <span>Enable GFM (Tables/Tasks)</span>
                </label>
                <label className="flex items-center gap-2 text-sm text-slate-700 dark:text-slate-300 cursor-pointer">
                <input
                    type="checkbox"
                    className="rounded border-slate-300 text-purple-600 focus:ring-purple-500"
                    checked={config.allowHtml}
                    onChange={(e) =>
                    setConfig((c) => ({ ...c, allowHtml: e.target.checked }))
                    }
                />
                <span>Allow HTML (rehype-raw)</span>
                </label>
                <label className={`flex items-center gap-2 text-sm cursor-pointer ${!config.allowHtml ? 'opacity-50 cursor-not-allowed' : 'text-slate-700 dark:text-slate-300'}`}>
                <input
                    type="checkbox"
                    className="rounded border-slate-300 text-purple-600 focus:ring-purple-500"
                    checked={config.sanitizeHtml}
                    onChange={(e) =>
                    setConfig((c) => ({ ...c, sanitizeHtml: e.target.checked }))
                    }
                    disabled={!config.allowHtml}
                />
                <span>Sanitize HTML</span>
                </label>
                <label className="flex items-center gap-2 text-sm text-slate-700 dark:text-slate-300 cursor-pointer">
                <input
                    type="checkbox"
                    className="rounded border-slate-300 text-purple-600 focus:ring-purple-500"
                    checked={config.enableHighlight}
                    onChange={(e) =>
                    setConfig((c) => ({ ...c, enableHighlight: e.target.checked }))
                    }
                />
                <span>Highlight Code</span>
                </label>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
};
