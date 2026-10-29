import type { ReactNode } from "react";

import type { TipTapDoc, TipTapNode } from "@/db/schema";

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
