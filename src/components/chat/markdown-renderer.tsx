"use client";

import ReactMarkdown from "react-markdown";
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter";
import { oneDark } from "react-syntax-highlighter/dist/cjs/styles/prism";
import remarkGfm from "remark-gfm";
import { Copy, Check } from "lucide-react";
import { useState } from "react";
import { Button } from "~/components/ui/button";

interface MarkdownRendererProps {
  content: string;
}

export function MarkdownRenderer({ content }: MarkdownRendererProps) {
  return (
    <ReactMarkdown
      remarkPlugins={[remarkGfm]}
      components={{
        code({ node, inline, className, children, ...props }) {
          const match = /language-(\w+)/.exec(className || "");
          const language = match ? match[1] : "";

          if (!inline && language) {
            return (
              <CodeBlock
                language={language}
                code={String(children).replace(/\n$/, "")}
                {...props}
              />
            );
          }

          return (
            <code
              className="rounded bg-muted px-1.5 py-0.5 text-sm font-mono"
              {...props}
            >
              {children}
            </code>
          );
        },
        pre({ children }) {
          return <div className="my-4">{children}</div>;
        },
        blockquote({ children }) {
          return (
            <blockquote className="border-l-4 border-muted-foreground/20 pl-4 italic text-muted-foreground">
              {children}
            </blockquote>
          );
        },
        table({ children }) {
          return (
            <div className="my-4 overflow-x-auto">
              <table className="min-w-full divide-y divide-border">
                {children}
              </table>
            </div>
          );
        },
        th({ children }) {
          return (
            <th className="bg-muted px-4 py-2 text-left font-semibold">
              {children}
            </th>
          );
        },
        td({ children }) {
          return <td className="border-t px-4 py-2">{children}</td>;
        },
        ul({ children }) {
          return <ul className="my-2 ml-4 list-disc space-y-1">{children}</ul>;
        },
        ol({ children }) {
          return <ol className="my-2 ml-4 list-decimal space-y-1">{children}</ol>;
        },
        h1({ children }) {
          return <h1 className="mb-4 text-2xl font-bold">{children}</h1>;
        },
        h2({ children }) {
          return <h2 className="mb-3 text-xl font-semibold">{children}</h2>;
        },
        h3({ children }) {
          return <h3 className="mb-2 text-lg font-medium">{children}</h3>;
        },
        p({ children }) {
          return <p className="mb-2 leading-relaxed">{children}</p>;
        },
        a({ href, children }) {
          return (
            <a
              href={href}
              target="_blank"
              rel="noopener noreferrer"
              className="text-indigo-600 underline hover:no-underline"
            >
              {children}
            </a>
          );
        },
      }}
    >
      {content}
    </ReactMarkdown>
  );
}

interface CodeBlockProps {
  language: string;
  code: string;
}

function CodeBlock({ language, code }: CodeBlockProps) {
  const [copied, setCopied] = useState(false);

  const copyToClipboard = async () => {
    await navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="group relative">
      <div className="flex items-center justify-between rounded-t-lg bg-muted px-4 py-2">
        <span className="text-sm font-medium text-muted-foreground">
          {language}
        </span>
        <Button
          variant="ghost"
          size="sm"
          onClick={copyToClipboard}
          className="h-6 w-6 p-0 opacity-0 transition-opacity group-hover:opacity-100"
        >
          {copied ? (
            <Check className="h-3 w-3" />
          ) : (
            <Copy className="h-3 w-3" />
          )}
        </Button>
      </div>
      <SyntaxHighlighter
        style={oneDark}
        language={language}
        customStyle={{
          margin: 0,
          borderTopLeftRadius: 0,
          borderTopRightRadius: 0,
          fontSize: "0.875rem",
        }}
      >
        {code}
      </SyntaxHighlighter>
    </div>
  );
}
