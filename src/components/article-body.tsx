import type { ReactNode } from "react";

import type { TipTapDoc, TipTapNode } from "@/db/schema";
import { parseInlineNodes } from "@/lib/content";

function applyMarks(text: ReactNode, node: TipTapNode, key: string): ReactNode {
  if (!node.marks?.length) return <span key={key}>{text}</span>;

  return node.marks.reduce<ReactNode>((current, mark, index) => {
    if (mark.type === "bold") {
      return <strong key={`${key}-b-${index}`}>{current}</strong>;
    }
    if (mark.type === "italic") {
      return <em key={`${key}-i-${index}`}>{current}</em>;
    }
    if (mark.type === "underline") {
      return <u key={`${key}-u-${index}`}>{current}</u>;
    }
    if (mark.type === "code") {
      return <code key={`${key}-c-${index}`}>{current}</code>;
    }
    if (mark.type === "link") {
      const href = String(mark.attrs?.href ?? "");
      const safeHref = /^https?:\/\//i.test(href) ? href : "#";
      return (
        <a
          key={`${key}-l-${index}`}
          href={safeHref}
          target="_blank"
          rel="noopener noreferrer"
        >
          {current}
        </a>
      );
    }
    return current;
  }, text);
}

function renderInline(text: string, key: string): ReactNode {
  return parseInlineNodes(text).map((child, index) =>
    renderNode(child, `${key}-inline-${index}`),
  );
}

function renderNode(node: TipTapNode, key: string): ReactNode {
  if (node.type === "text") {
    return applyMarks(node.text ?? "", node, key);
  }

  if (node.type === "hardBreak") {
    return <br key={key} />;
  }

  const children = (node.content ?? []).map((child, index) =>
    renderNode(child, `${key}-${index}`),
  );

  switch (node.type) {
    case "doc":
      return <div key={key}>{children}</div>;
    case "paragraph":
      return <p key={key}>{children}</p>;
    case "heading": {
      const level = Number(node.attrs?.level ?? 2);
      if (level === 1) return <h1 key={key}>{children}</h1>;
      if (level === 3) return <h3 key={key}>{children}</h3>;
      return <h2 key={key}>{children}</h2>;
    }
    case "bulletList":
      return <ul key={key}>{children}</ul>;
    case "orderedList":
      return <ol key={key}>{children}</ol>;
    case "listItem":
      return <li key={key}>{children}</li>;
    case "blockquote":
      return <blockquote key={key}>{children}</blockquote>;
    case "horizontalRule":
      return <hr key={key} />;
    case "alertBox": {
      const tone = String(node.attrs?.tone ?? "info");
      const title = String(node.attrs?.title ?? "महत्त्वपूर्ण सूचना");
      const text = String(node.attrs?.text ?? "");
      return (
        <aside
          key={key}
          className={`fact-check-alert fact-check-alert--${tone}`}
        >
          <strong>{title}</strong>
          {text
            .split(/\n+/)
            .map((line) => line.trim())
            .filter(Boolean)
            .map((line, index) => (
              <p key={`${key}-p-${index}`}>{renderInline(line, `${key}-p-${index}`)}</p>
            ))}
        </aside>
      );
    }
    case "verdictBox": {
      const title = String(
        node.attrs?.title ?? "चौतारी सम्पादकीय दृष्टिकोण",
      );
      const text = String(node.attrs?.text ?? "");
      return (
        <aside key={key} className="verdict-box">
          <h2>{title}</h2>
          {text
            .split(/\n+/)
            .map((line) => line.trim())
            .filter(Boolean)
            .map((line, index) => (
              <p key={`${key}-p-${index}`}>{renderInline(line, `${key}-p-${index}`)}</p>
            ))}
        </aside>
      );
    }
    case "conditionsCard":
    case "optionsCard": {
      const title = String(node.attrs?.title ?? "");
      const items = Array.isArray(node.attrs?.items)
        ? (node.attrs.items as string[])
        : [];
      return (
        <aside
          key={key}
          className={
            node.type === "conditionsCard" ? "condition-card" : "options-box"
          }
        >
          {title ? <h2>{title}</h2> : null}
          <ul>
            {items.map((item, index) => (
              <li key={`${key}-item-${index}`}>{renderInline(item, `${key}-item-${index}`)}</li>
            ))}
          </ul>
        </aside>
      );
    }
    case "dataTable": {
      const title = String(node.attrs?.title ?? "");
      const headers = Array.isArray(node.attrs?.headers)
        ? (node.attrs.headers as string[])
        : [];
      const rows = Array.isArray(node.attrs?.rows)
        ? (node.attrs.rows as string[][])
        : [];
      return (
        <div key={key} className="table-wrap">
          {title ? <h3>{title}</h3> : null}
          <table className="salary-table">
            {headers.length > 0 ? (
              <thead>
                <tr>
                  {headers.map((header, index) => (
                    <th key={`${key}-h-${index}`}>{renderInline(header, `${key}-h-${index}`)}</th>
                  ))}
                </tr>
              </thead>
            ) : null}
            <tbody>
              {rows.map((row, rowIndex) => (
                <tr key={`${key}-r-${rowIndex}`}>
                  {row.map((cell, cellIndex) => (
                    <td key={`${key}-c-${rowIndex}-${cellIndex}`}>{renderInline(cell, `${key}-c-${rowIndex}-${cellIndex}`)}</td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      );
    }
    default:
      return <span key={key}>{children}</span>;
  }
}

export function ArticleBody({ doc }: { doc: TipTapDoc }) {
  return (
    <div className="article-body">
      {(doc.content ?? []).map((node, index) =>
        renderNode(node, `node-${index}`),
      )}
    </div>
  );
}
