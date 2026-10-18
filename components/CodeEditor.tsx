"use client";

import React, { useState, useMemo } from "react";
import { Copy, Check, Terminal, FileCode } from "lucide-react";
import { copyToClipboardSafe } from "@/lib/utils";

interface CodeEditorProps {
  code: string;
  language?: string;
  filename?: string;
  showLineNumbers?: boolean;
  copyable?: boolean;
  className?: string;
  maxHeight?: string;
}

interface Token {
  type:
    | "comment"
    | "string"
    | "property"
    | "flag"
    | "keyword"
    | "builtin"
    | "number"
    | "punctuation"
    | "plain";
  text: string;
}

// Tokenize a single line of code into syntax tokens
function tokenizeLine(line: string, _lang?: string): Token[] {
  // If the whole line or start of line is a comment:
  if (/^\s*(\/\/|#|--|\/\*|\*)/.test(line)) {
    return [{ type: "comment", text: line }];
  }

  // Regex tokens:
  // 1. Strings: double quotes, single quotes, template literals
  // 2. JSON / Object property keys followed by colon: "key": or key:
  // 3. Command flags: -X, -H, -d, --header, etc.
  // 4. Numbers and booleans
  // 5. Language Keywords
  // 6. Common builtins / HTTP methods / functions
  // 7. Punctuation / delimiters
  const tokenRegex =
    /("(?:\\.|[^"\\])*"\s*:|'(?:\\.|[^'\\])*'\s*:)|("(?:\\.|[^"\\])*"|'(?:\\.|[^'\\])*'|`(?:\\.|[^`\\])*`)|(-[a-zA-Z0-9_-]+)|(\b\d+(?:\.\d+)?\b|\b(?:true|false|null|nil)\b)|(\b(?:import|export|from|const|let|var|await|async|function|return|def|func|package|type|struct|interface|class|if|else|try|catch|panic|defer|echo|new|CREATE|TABLE|UUID|DEFAULT|REFERENCES|NOT|NULL|TEXT|INTEGER|TIMESTAMPTZ|NOW|PRIMARY|KEY|INDEX|ON)\b)|(\b(?:curl|POST|GET|PUT|DELETE|PATCH|fetch|print|console|json_encode|curl_init|curl_setopt|curl_exec|curl_close|curl_getinfo|main|Marshal|NewBuffer|NewRequest|Header|Client|Set|Close|NextResponse|Response|Error|JSON)\b)|([{}()[\],;:\\=><!+\-*&|%?]+)/g;

  const tokens: Token[] = [];
  let lastIndex = 0;
  let match: RegExpExecArray | null;

  while ((match = tokenRegex.exec(line)) !== null) {
    if (match.index > lastIndex) {
      tokens.push({
        type: "plain",
        text: line.slice(lastIndex, match.index),
      });
    }

    const [full, prop, str, flag, numOrBool, keyword, builtin, punct] = match;

    if (prop) {
      tokens.push({ type: "property", text: prop });
    } else if (str) {
      tokens.push({ type: "string", text: str });
    } else if (flag) {
      tokens.push({ type: "flag", text: flag });
    } else if (numOrBool) {
      tokens.push({ type: "number", text: numOrBool });
    } else if (keyword) {
      tokens.push({ type: "keyword", text: keyword });
    } else if (builtin) {
      tokens.push({ type: "builtin", text: builtin });
    } else if (punct) {
      tokens.push({ type: "punctuation", text: punct });
    } else {
      tokens.push({ type: "plain", text: full });
    }

    lastIndex = tokenRegex.lastIndex;
  }

  if (lastIndex < line.length) {
    tokens.push({
      type: "plain",
      text: line.slice(lastIndex),
    });
  }

  return tokens.length > 0 ? tokens : [{ type: "plain", text: line }];
}

export function CodeEditor({
  code,
  language = "text",
  filename,
  showLineNumbers = true,
  copyable = true,
  className = "",
  maxHeight,
}: CodeEditorProps) {
  const [copied, setCopied] = useState(false);

  const lines = useMemo(() => {
    return code.trim().split("\n");
  }, [code]);

  const handleCopy = async () => {
    await copyToClipboardSafe(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const renderToken = (token: Token, key: number) => {
    switch (token.type) {
      case "comment":
        return (
          <span key={key} className="text-slate-500 italic">
            {token.text}
          </span>
        );
      case "string":
        return (
          <span key={key} className="text-emerald-300">
            {token.text}
          </span>
        );
      case "property":
        // Distinguish the key name and the colon
        return (
          <span key={key} className="text-sky-300 font-medium">
            {token.text}
          </span>
        );
      case "flag":
        return (
          <span key={key} className="text-cyan-300 font-mono font-medium">
            {token.text}
          </span>
        );
      case "keyword":
        return (
          <span key={key} className="text-purple-400 font-semibold">
            {token.text}
          </span>
        );
      case "builtin":
        return (
          <span key={key} className="text-blue-400 font-medium">
            {token.text}
          </span>
        );
      case "number":
        return (
          <span key={key} className="text-amber-200">
            {token.text}
          </span>
        );
      case "punctuation":
        return (
          <span key={key} className="text-slate-400">
            {token.text}
          </span>
        );
      case "plain":
      default:
        return (
          <span key={key} className="text-slate-200">
            {token.text}
          </span>
        );
    }
  };

  return (
    <div
      className={`rounded-xl border border-slate-800 bg-[#0d1117] overflow-hidden shadow-2xl text-left ${className}`}
    >
      {/* Code Editor Header Bar */}
      <div className="flex items-center justify-between px-4 py-2.5 bg-slate-900/90 border-b border-slate-800/80">
        <div className="flex items-center gap-3">
          {/* macOS window controls */}
          <div className="flex items-center gap-1.5">
            <div className="w-2.5 h-2.5 rounded-full bg-rose-500/80" />
            <div className="w-2.5 h-2.5 rounded-full bg-amber-500/80" />
            <div className="w-2.5 h-2.5 rounded-full bg-emerald-500/80" />
          </div>

          {/* Filename or Language Tab */}
          <div className="flex items-center gap-1.5 text-xs font-mono text-slate-300 bg-slate-950/80 px-2.5 py-1 rounded border border-slate-800/80">
            {language === "bash" || language === "curl" ? (
              <Terminal className="w-3.5 h-3.5 text-sky-400" />
            ) : (
              <FileCode className="w-3.5 h-3.5 text-purple-400" />
            )}
            <span>{filename || language.toUpperCase()}</span>
          </div>
        </div>

        {copyable && (
          <button
            onClick={handleCopy}
            className="flex items-center gap-1.5 px-2.5 py-1 text-xs font-mono text-slate-400 hover:text-slate-100 hover:bg-slate-800 rounded transition-colors"
            title="Copy code"
          >
            {copied ? (
              <>
                <Check className="w-3.5 h-3.5 text-emerald-400" />
                <span className="text-emerald-400 font-semibold">Copied!</span>
              </>
            ) : (
              <>
                <Copy className="w-3.5 h-3.5" />
                <span>Copy</span>
              </>
            )}
          </button>
        )}
      </div>

      {/* Editor Content Gutter + Code Lines */}
      <div
        className="overflow-x-auto p-4 font-mono text-xs leading-relaxed"
        style={{ maxHeight: maxHeight || undefined }}
      >
        <table className="w-full border-collapse">
          <tbody>
            {lines.map((lineText, idx) => {
              const tokens = tokenizeLine(lineText, language);
              return (
                <tr key={idx} className="hover:bg-slate-800/20 transition-colors">
                  {showLineNumbers && (
                    <td className="w-9 pr-4 text-right text-slate-600 select-none align-top font-mono text-[11px] border-r border-slate-800/60">
                      {idx + 1}
                    </td>
                  )}
                  <td className={`${showLineNumbers ? "pl-4" : ""} whitespace-pre align-top`}>
                    {tokens.map((token, tIdx) => renderToken(token, tIdx))}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
