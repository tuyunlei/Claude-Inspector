import React from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import rehypeRaw from 'rehype-raw';
import rehypeSanitize from 'rehype-sanitize';
import rehypeHighlight from 'rehype-highlight';

type MarkdownRendererProps = {
  content: string;
  className?: string;
  /**
   * Toggle GFM support (Tables, Task lists, Strikethrough, etc.)
   * Default: true
   */
  enableGfm?: boolean;
  /**
   * Allow parsing raw HTML tags via rehype-raw
   * Default: true
   */
  allowHtml?: boolean;
  /**
   * Sanitize HTML to prevent XSS (only active if allowHtml is true)
   * Default: true
   */
  sanitizeHtml?: boolean;
  /**
   * Enable syntax highlighting for code blocks
   * Default: true
   */
  highlightCode?: boolean;
};

export const MarkdownRenderer: React.FC<MarkdownRendererProps> = ({
  content,
  className,
  enableGfm = true,
  allowHtml = true,
  sanitizeHtml = true,
  highlightCode = true,
}) => {
  const remarkPlugins: any[] = [];
  const rehypePlugins: any[] = [];

  if (enableGfm) {
    remarkPlugins.push(remarkGfm);
  }

  if (allowHtml) {
    rehypePlugins.push(rehypeRaw);
  }

  if (sanitizeHtml) {
    rehypePlugins.push(rehypeSanitize);
  }

  if (highlightCode) {
    rehypePlugins.push(rehypeHighlight);
  }

  // Define base typography classes from Tailwind
  // max-w-none: Prevents the prose plugin from constraining the width
  // break-words: Ensures long strings (URLs/code) wrap correctly
  const baseClass = 'prose prose-sm max-w-none break-words';
  
  // Combine base classes with custom className
  const mergedClass = [baseClass, className].filter(Boolean).join(' ');

  return (
    <div className={mergedClass}>
      <ReactMarkdown
        remarkPlugins={remarkPlugins}
        rehypePlugins={rehypePlugins}
      >
        {content}
      </ReactMarkdown>
    </div>
  );
};