"use client";

import React from "react";

// ── Inline parser ──────────────────────────────────────────────────────────────

type InlineNode =
  | { type: "text"; content: string }
  | { type: "bold"; content: string }
  | { type: "code"; content: string }
  | { type: "link"; content: string; href: string };

function parseInline(text: string): InlineNode[] {
  const nodes: InlineNode[] = [];
  let rest = text;

  while (rest.length > 0) {
    const bold = rest.match(/^\*\*(.+?)\*\*/);
    if (bold) { nodes.push({ type: "bold", content: bold[1] }); rest = rest.slice(bold[0].length); continue; }

    const code = rest.match(/^`([^`]+)`/);
    if (code) { nodes.push({ type: "code", content: code[1] }); rest = rest.slice(code[0].length); continue; }

    const link = rest.match(/^\[([^\]]+)\]\(([^)]+)\)/);
    if (link) { nodes.push({ type: "link", content: link[1], href: link[2] }); rest = rest.slice(link[0].length); continue; }

    const next = rest.search(/\*\*|`|\[/);
    if (next === -1) { nodes.push({ type: "text", content: rest }); break; }
    if (next === 0)  { nodes.push({ type: "text", content: rest[0] }); rest = rest.slice(1); continue; }
    nodes.push({ type: "text", content: rest.slice(0, next) });
    rest = rest.slice(next);
  }

  return nodes;
}

function Inline({ nodes, id }: { nodes: InlineNode[]; id: string }) {
  return (
    <>
      {nodes.map((n, i) => {
        if (n.type === "bold") return <strong key={`${id}-${i}`} className="font-semibold text-brand-text-primary">{n.content}</strong>;
        if (n.type === "code") return <code key={`${id}-${i}`} className="bg-brand-purple/10 text-brand-purple px-1.5 py-0.5 rounded text-[13px] font-mono">{n.content}</code>;
        if (n.type === "link") return (
          <a key={`${id}-${i}`} href={n.href} target={n.href.startsWith("http") ? "_blank" : undefined} rel="noopener noreferrer"
            className="text-brand-purple underline underline-offset-2 hover:text-brand-purple-dark">
            {n.content}
          </a>
        );
        return <span key={`${id}-${i}`}>{n.content}</span>;
      })}
    </>
  );
}

function il(text: string, id: string) {
  return <Inline nodes={parseInline(text)} id={id} />;
}

// ── Block parser ──────────────────────────────────────────────────────────────

export default function MarkdownRenderer({ content }: { content: string }) {
  const lines = content.split("\n");
  const out: React.ReactNode[] = [];
  let i = 0;

  while (i < lines.length) {
    const line = lines[i];

    // ── Fenced code block ───────────────────────────────────────────────────
    if (line.startsWith("```")) {
      const lang = line.slice(3).trim() || "";
      const code: string[] = [];
      i++;
      while (i < lines.length && !lines[i].startsWith("```")) { code.push(lines[i]); i++; }
      out.push(
        <div key={`cb-${i}`} className="my-5 rounded-xl overflow-hidden border border-gray-700 shadow-sm">
          {lang && (
            <div className="flex items-center gap-2 bg-gray-800 px-4 py-2 border-b border-gray-700">
              <span className="text-[11px] font-mono font-medium text-gray-400 uppercase tracking-wider">{lang}</span>
            </div>
          )}
          <pre className="bg-gray-900 text-gray-100 px-5 py-4 overflow-x-auto text-[13px] font-mono leading-relaxed">
            <code>{code.join("\n")}</code>
          </pre>
        </div>
      );
      i++;
      continue;
    }

    // ── Headers ─────────────────────────────────────────────────────────────
    if (line.startsWith("#### ")) {
      out.push(<h4 key={`h4-${i}`} className="text-base font-semibold text-brand-text-primary mt-6 mb-2">{il(line.slice(5), `h4-${i}`)}</h4>);
      i++; continue;
    }
    if (line.startsWith("### ")) {
      out.push(<h3 key={`h3-${i}`} className="text-xl font-semibold text-brand-text-primary mt-8 mb-3">{il(line.slice(4), `h3-${i}`)}</h3>);
      i++; continue;
    }
    if (line.startsWith("## ")) {
      out.push(
        <h2 key={`h2-${i}`} className="text-2xl font-bold text-brand-text-primary mt-10 mb-4 pb-2 border-b border-brand-border">
          {il(line.slice(3), `h2-${i}`)}
        </h2>
      );
      i++; continue;
    }
    if (line.startsWith("# ")) {
      out.push(
        <h1 key={`h1-${i}`} className="text-3xl font-bold text-brand-text-primary mt-2 mb-6 pb-3 border-b-2 border-brand-border">
          {il(line.slice(2), `h1-${i}`)}
        </h1>
      );
      i++; continue;
    }

    // ── Horizontal rule ─────────────────────────────────────────────────────
    if (/^---+$/.test(line.trim())) {
      out.push(<hr key={`hr-${i}`} className="my-8 border-brand-border" />);
      i++; continue;
    }

    // ── Table ───────────────────────────────────────────────────────────────
    if (line.startsWith("|") && line.trimEnd().endsWith("|")) {
      const headers = line.split("|").filter(Boolean).map((c) => c.trim());
      i++;
      // skip separator row
      if (i < lines.length && /^\|[-| :]+\|$/.test(lines[i])) i++;
      const rows: string[][] = [];
      while (i < lines.length && lines[i].startsWith("|") && lines[i].trimEnd().endsWith("|")) {
        rows.push(lines[i].split("|").filter(Boolean).map((c) => c.trim()));
        i++;
      }
      out.push(
        <div key={`tbl-${i}`} className="my-5 overflow-x-auto rounded-xl border border-brand-border">
          <table className="w-full text-sm border-collapse">
            <thead>
              <tr className="bg-gray-50">
                {headers.map((h, hi) => (
                  <th key={hi} className="px-4 py-3 text-left text-xs font-semibold text-brand-text-secondary uppercase tracking-wide border-b border-brand-border">
                    {il(h, `th-${i}-${hi}`)}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rows.map((row, ri) => (
                <tr key={ri} className="border-b border-brand-border last:border-0 hover:bg-gray-50/60">
                  {row.map((cell, ci) => (
                    <td key={ci} className="px-4 py-3 text-brand-text-primary align-top">
                      {il(cell, `td-${i}-${ri}-${ci}`)}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      );
      continue;
    }

    // ── Checklist item: - [ ] or - [x] ─────────────────────────────────────
    if (/^- \[[ x]\] /.test(line)) {
      const items: { checked: boolean; text: string }[] = [];
      while (i < lines.length && /^- \[[ x]\] /.test(lines[i])) {
        items.push({ checked: lines[i][3] === "x", text: lines[i].slice(6) });
        i++;
      }
      out.push(
        <ul key={`cl-${i}`} className="my-3 space-y-2 pl-1">
          {items.map((item, li) => (
            <li key={li} className="flex items-start gap-2.5 text-brand-text-primary">
              <span className={`mt-0.5 h-4 w-4 shrink-0 rounded border flex items-center justify-center text-[10px] font-bold ${item.checked ? "bg-brand-purple border-brand-purple text-white" : "border-gray-300"}`}>
                {item.checked && "✓"}
              </span>
              <span className={item.checked ? "line-through text-brand-text-secondary" : ""}>
                {il(item.text, `cl-${i}-${li}`)}
              </span>
            </li>
          ))}
        </ul>
      );
      continue;
    }

    // ── Unordered list ──────────────────────────────────────────────────────
    if (/^[-*] /.test(line)) {
      const items: string[] = [];
      while (i < lines.length && /^[-*] /.test(lines[i])) {
        items.push(lines[i].slice(2));
        i++;
      }
      out.push(
        <ul key={`ul-${i}`} className="my-3 space-y-1.5 pl-1">
          {items.map((item, li) => (
            <li key={li} className="flex items-start gap-2.5 text-brand-text-primary">
              <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-brand-purple" />
              <span>{il(item, `ul-${i}-${li}`)}</span>
            </li>
          ))}
        </ul>
      );
      continue;
    }

    // ── Numbered list ───────────────────────────────────────────────────────
    if (/^\d+\. /.test(line)) {
      const items: string[] = [];
      while (i < lines.length && /^\d+\. /.test(lines[i])) {
        items.push(lines[i].replace(/^\d+\. /, ""));
        i++;
      }
      out.push(
        <ol key={`ol-${i}`} className="my-3 space-y-1.5 pl-1">
          {items.map((item, li) => (
            <li key={li} className="flex items-start gap-2.5 text-brand-text-primary">
              <span className="mt-0.5 min-w-[1.25rem] text-sm font-semibold text-brand-purple">{li + 1}.</span>
              <span>{il(item, `ol-${i}-${li}`)}</span>
            </li>
          ))}
        </ol>
      );
      continue;
    }

    // ── Blockquote ──────────────────────────────────────────────────────────
    if (line.startsWith("> ")) {
      const qlines: string[] = [];
      while (i < lines.length && lines[i].startsWith("> ")) {
        qlines.push(lines[i].slice(2));
        i++;
      }
      out.push(
        <blockquote key={`bq-${i}`} className="my-4 pl-4 border-l-4 border-brand-purple/40 text-brand-text-secondary italic bg-purple-50/40 py-2 pr-3 rounded-r-lg">
          {qlines.map((ql, qi) => <p key={qi}>{il(ql, `bq-${i}-${qi}`)}</p>)}
        </blockquote>
      );
      continue;
    }

    // ── Empty line ──────────────────────────────────────────────────────────
    if (line.trim() === "") { i++; continue; }

    // ── Paragraph ───────────────────────────────────────────────────────────
    out.push(
      <p key={`p-${i}`} className="text-brand-text-primary leading-relaxed my-2">
        {il(line, `p-${i}`)}
      </p>
    );
    i++;
  }

  return <div className="max-w-none">{out}</div>;
}
