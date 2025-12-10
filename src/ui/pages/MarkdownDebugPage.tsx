import React, { useMemo, useState } from "react";
import remarkGfm from "remark-gfm";
import rehypeRaw from "rehype-raw";
import rehypeSanitize from "rehype-sanitize";
import rehypeHighlight from "rehype-highlight";
import rehypeStringify from "rehype-stringify";

import { unified } from "unified";
import remarkParse from "remark-parse";
import remarkRehype from "remark-rehype";
import { Bug, FileCode, Settings2, Eye } from "lucide-react";
import { MarkdownRenderer } from "../components/MarkdownRenderer";

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

  // Unified pipeline for HTML output preview (Right Column)
  const htmlOutput = useMemo(() => {
    try {
      const processor = unified()
        .use(remarkParse)
        .use(config.enableGfm ? remarkGfm : () => {})
        // @ts-ignore
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
            className="flex-1 w-full resize-none p-4 font-mono text-sm bg-transparent outline-none text-slate-800 dark:text-slate-200"
            value={source}
            onChange={(e) => setSource(e.target.value)}
          />
        </section>

        {/* Middle: React Render Preview */}
        <section className="flex flex-col h-full bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
           <div className="px-4 py-2 border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900 flex items-center justify-between">
              <div className="flex items-center gap-2 text-xs font-semibold text-slate-500 uppercase tracking-wider">
                  <Eye size={12} /> Render Preview
              </div>
              <div className="flex items-center gap-3">
                  <label className="flex items-center gap-1.5 text-xs text-slate-600 dark:text-slate-400 cursor-pointer">
                      <input type="checkbox" checked={config.enableGfm} onChange={e => setConfig({...config, enableGfm: e.target.checked})} className="rounded text-purple-600 focus:ring-purple-500"/>
                      GFM
                  </label>
                  <label className="flex items-center gap-1.5 text-xs text-slate-600 dark:text-slate-400 cursor-pointer">
                      <input type="checkbox" checked={config.allowHtml} onChange={e => setConfig({...config, allowHtml: e.target.checked})} className="rounded text-purple-600 focus:ring-purple-500"/>
                      HTML
                  </label>
                  <label className="flex items-center gap-1.5 text-xs text-slate-600 dark:text-slate-400 cursor-pointer">
                      <input type="checkbox" checked={config.sanitizeHtml} onChange={e => setConfig({...config, sanitizeHtml: e.target.checked})} className="rounded text-purple-600 focus:ring-purple-500"/>
                      Sanitize
                  </label>
                  <label className="flex items-center gap-1.5 text-xs text-slate-600 dark:text-slate-400 cursor-pointer">
                      <input type="checkbox" checked={config.enableHighlight} onChange={e => setConfig({...config, enableHighlight: e.target.checked})} className="rounded text-purple-600 focus:ring-purple-500"/>
                      Highlight
                  </label>
              </div>
           </div>
           <div className="flex-1 overflow-auto p-4 bg-white dark:bg-slate-950">
             <MarkdownRenderer 
                content={source}
                className="prose-slate dark:prose-invert"
                enableGfm={config.enableGfm}
                allowHtml={config.allowHtml}
                sanitizeHtml={config.sanitizeHtml}
                highlightCode={config.enableHighlight}
             />
           </div>
        </section>

        {/* Right: HTML Output */}
        <section className="flex flex-col h-full bg-slate-50 dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
          <div className="px-4 py-2 border-b border-slate-200 dark:border-slate-800 bg-slate-100 dark:bg-slate-800 flex items-center gap-2 text-xs font-semibold text-slate-500 uppercase tracking-wider">
            <FileCode size={12} /> HTML Output
          </div>
          <pre className="flex-1 p-4 font-mono text-xs text-slate-600 dark:text-slate-400 whitespace-pre-wrap overflow-auto">
            {htmlOutput}
          </pre>
        </section>
      </div>
    </div>
  );
};