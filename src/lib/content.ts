import type { TipTapDoc, TipTapNode } from "@/db/schema";

const NEPALI_DIGITS = ["०", "१", "२", "३", "४", "५", "६", "७", "८", "९"];

const NEPALI_MONTHS = [
  "जनवरी",
  "फेब्रुअरी",
  "मार्च",
  "अप्रिल",
  "मे",
  "जुन",
  "जुलाई",
  "अगस्ट",
  "सेप्टेम्बर",
  "अक्टोबर",
  "नोभेम्बर",
  "डिसेम्बर",
];

export function toNepaliDigits(value: string | number): string {
  return String(value).replace(/[0-9]/g, (digit) => NEPALI_DIGITS[Number(digit)]);
}

export function formatNepaliDate(value: Date | string | null | undefined): string {
  if (!value) return "";
  const date = typeof value === "string" ? new Date(value) : value;
  if (Number.isNaN(date.getTime())) return "";
  return `${toNepaliDigits(date.getDate())} ${NEPALI_MONTHS[date.getMonth()]} ${toNepaliDigits(date.getFullYear())}`;
}

export function formatNepaliDateTime(
  value: Date | string | null | undefined,
): string {
  if (!value) return "";
  const date = typeof value === "string" ? new Date(value) : value;
  if (Number.isNaN(date.getTime())) return "";
  const hours = date.getHours();
  const minutes = String(date.getMinutes()).padStart(2, "0");
  const period = hours < 12 ? "बिहान" : hours < 17 ? "दिउँसो" : "साँझ";
  const displayHour = hours % 12 || 12;
  return `${formatNepaliDate(date)} · ${period} ${toNepaliDigits(displayHour)}:${toNepaliDigits(minutes)}`;
}

export function formatRelativeNepali(
  value: Date | string | null | undefined,
): string {
  if (!value) return "";
  const date = typeof value === "string" ? new Date(value) : value;
  if (Number.isNaN(date.getTime())) return "";

  const diffMs = Date.now() - date.getTime();
  const minutes = Math.max(0, Math.floor(diffMs / 60_000));

  if (minutes < 1) return "अहिले";
  if (minutes < 60) return `${toNepaliDigits(minutes)} मिनेट अघि`;

  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${toNepaliDigits(hours)} घण्टा अघि`;

  const days = Math.floor(hours / 24);
  if (days === 1) return "हिजो";
  if (days < 7) return `${toNepaliDigits(days)} दिन अघि`;

  return formatNepaliDate(date);
}

export function slugify(input: string): string {
  const base = input
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 90);

  return base || `story-${crypto.randomUUID().slice(0, 8)}`;
}

function textNode(text: string): TipTapNode {
  return { type: "text", text };
}

export function parseInlineNodes(text: string): TipTapNode[] {
  const nodes: TipTapNode[] = [];
  const pattern = /(\*\*[^*]+\*\*|\*[^*]+\*|\[[^\]]+\]\([^)]+\))/g;
  let lastIndex = 0;

  for (const match of text.matchAll(pattern)) {
    const index = match.index ?? 0;
    if (index > lastIndex) {
      nodes.push(textNode(text.slice(lastIndex, index)));
    }

    const token = match[0];
    if (token.startsWith("**") && token.endsWith("**")) {
      nodes.push({
        type: "text",
        text: token.slice(2, -2),
        marks: [{ type: "bold" }],
      });
    } else if (token.startsWith("*") && token.endsWith("*")) {
      nodes.push({
        type: "text",
        text: token.slice(1, -1),
        marks: [{ type: "italic" }],
      });
    } else {
      const linkMatch = token.match(/^\[([^\]]+)\]\(([^)]+)\)$/);
      if (linkMatch) {
        nodes.push({
          type: "text",
          text: linkMatch[1],
          marks: [{ type: "link", attrs: { href: linkMatch[2] } }],
        });
      } else {
        nodes.push(textNode(token));
      }
    }

    lastIndex = index + token.length;
  }

  if (lastIndex < text.length) {
    nodes.push(textNode(text.slice(lastIndex)));
  }

  return nodes.length > 0 ? nodes : [textNode("")];
}

function paragraphNode(text: string): TipTapNode {
  return {
    type: "paragraph",
    content: text ? parseInlineNodes(text) : [],
  };
}

function listNode(type: "bulletList" | "orderedList", items: string[]): TipTapNode {
  return {
    type,
    content: items.map((item) => ({
      type: "listItem",
      content: [paragraphNode(item)],
    })),
  };
}

function parseFence(
  lines: string[],
  start: number,
): { node: TipTapNode; next: number } | null {
  const header = lines[start].trim();
  const end = lines.findIndex(
    (line, index) => index > start && line.trim() === ":::",
  );

  if (end === -1) return null;

  const spec = header.slice(3).trim();
  const [kindPart, ...titleParts] = spec.split("|");
  const [kind, ...toneParts] = kindPart.trim().split(/\s+/);
  const tone = toneParts.join(" ").trim();
  const title = titleParts.join("|").trim();
  const body = lines.slice(start + 1, end);
  const bodyText = body.join("\n").trim();

  if (kind === "alert") {
    return {
      node: {
        type: "alertBox",
        attrs: {
          tone: tone || "info",
          title: title || "महत्त्वपूर्ण सूचना",
          text: bodyText,
        },
      },
      next: end + 1,
    };
  }

  if (kind === "verdict") {
    return {
      node: {
        type: "verdictBox",
        attrs: {
          title: title || "चौतारी सम्पादकीय दृष्टिकोण",
          text: bodyText,
        },
      },
      next: end + 1,
    };
  }

  if (kind === "conditions" || kind === "options") {
    const items = body
      .map((line) => line.trim())
      .filter((line) => line.startsWith("- "))
      .map((line) => line.slice(2).trim())
      .filter(Boolean);

    return {
      node: {
        type: kind === "conditions" ? "conditionsCard" : "optionsCard",
        attrs: {
          title:
            title ||
            (kind === "conditions"
              ? "मुख्य सर्तहरू"
              : "व्यावहारिक विकल्प"),
          items,
        },
      },
      next: end + 1,
    };
  }

  if (kind === "table") {
    const rows = body
      .map((line) => line.trim())
      .filter((line) => line.startsWith("|") && line.endsWith("|"))
      .map((line) =>
        line
          .slice(1, -1)
          .split("|")
          .map((cell) => cell.trim()),
      )
      .filter(
        (cells) =>
          cells.length > 0 &&
          !cells.every((cell) => /^:?-{3,}:?$/.test(cell)),
      );

    const [headers = [], ...dataRows] = rows;

    return {
      node: {
        type: "dataTable",
        attrs: { title, headers, rows: dataRows },
      },
      next: end + 1,
    };
  }

  return null;
}

/**
 * Temporary R0 editor format: plain text in, TipTap-compatible JSON out.
 *
 * Supported syntax:
 * - `## Heading`, `# Heading`
 * - `- list item`, `1. list item`
 * - `> quoted text`
 * - `:::alert safety|Title` ... `:::`
 * - `:::verdict|Title` ... `:::`
 * - `:::conditions|Title` with `- ` items ... `:::`
 * - `:::options|Title` with `- ` items ... `:::`
 * - `:::table|Title` with pipe rows ... `:::`
 */
export function docFromPlainText(input: string): TipTapDoc {
  const lines = input.replace(/\r\n/g, "\n").split("\n");
  const content: TipTapNode[] = [];
  let index = 0;

  while (index < lines.length) {
    const line = lines[index].trim();

    if (!line) {
      index += 1;
      continue;
    }

    if (line.startsWith(":::")) {
      const fenced = parseFence(lines, index);
      if (fenced) {
        content.push(fenced.node);
        index = fenced.next;
        continue;
      }

      // Unrecognised or unclosed directive: keep the text visible instead of
      // looping forever.
      content.push(
        paragraphNode(line.replace(/^:::\s*/, "").trim() || ":::"),
      );
      index += 1;
      continue;
    }

    if (line.startsWith("## ")) {
      content.push({
        type: "heading",
        attrs: { level: 2 },
        content: parseInlineNodes(line.slice(3).trim()),
      });
      index += 1;
      continue;
    }

    if (line.startsWith("# ")) {
      content.push({
        type: "heading",
        attrs: { level: 1 },
        content: parseInlineNodes(line.slice(2).trim()),
      });
      index += 1;
      continue;
    }

    if (line.startsWith("> ")) {
      const quoteLines: string[] = [];
      while (index < lines.length && lines[index].trim().startsWith("> ")) {
        quoteLines.push(lines[index].trim().slice(2).trim());
        index += 1;
      }
      content.push({
        type: "blockquote",
        content: [paragraphNode(quoteLines.join(" "))],
      });
      continue;
    }

    if (line.startsWith("- ")) {
      const items: string[] = [];
      while (index < lines.length && lines[index].trim().startsWith("- ")) {
        items.push(lines[index].trim().slice(2).trim());
        index += 1;
      }
      content.push(listNode("bulletList", items));
      continue;
    }

    if (/^\d+\.\s/.test(line)) {
      const items: string[] = [];
      while (index < lines.length && /^\d+\.\s/.test(lines[index].trim())) {
        items.push(lines[index].trim().replace(/^\d+\.\s+/, ""));
        index += 1;
      }
      content.push(listNode("orderedList", items));
      continue;
    }

    const paragraphLines: string[] = [];
    while (index < lines.length) {
      const current = lines[index].trim();
      if (!current) break;
      if (
        current.startsWith(":::") ||
        current.startsWith("## ") ||
        current.startsWith("# ") ||
        current.startsWith("> ") ||
        current.startsWith("- ") ||
        /^\d+\.\s/.test(current)
      ) {
        break;
      }
      paragraphLines.push(current);
      index += 1;
    }

    if (paragraphLines.length > 0) {
      content.push(paragraphNode(paragraphLines.join(" ")));
    }
  }

  return {
    type: "doc",
    content: content.length > 0 ? content : [{ type: "paragraph" }],
  };
}

export function plainTextFromDoc(doc: TipTapDoc | null | undefined): string {
  if (!doc) return "";

  const walk = (node: TipTapNode): string => {
    if (node.type === "text") return node.text ?? "";
    if (node.type === "hardBreak") return "\n";

    if (node.type === "alertBox" || node.type === "verdictBox") {
      return `${String(node.attrs?.title ?? "")}\n${String(node.attrs?.text ?? "")}\n`;
    }

    if (node.type === "conditionsCard" || node.type === "optionsCard") {
      const items = Array.isArray(node.attrs?.items)
        ? (node.attrs.items as string[])
        : [];
      return `${String(node.attrs?.title ?? "")}\n${items.join("\n")}\n`;
    }

    if (node.type === "dataTable") {
      const headers = Array.isArray(node.attrs?.headers)
        ? (node.attrs.headers as string[])
        : [];
      const rows = Array.isArray(node.attrs?.rows)
        ? (node.attrs.rows as string[][])
        : [];
      return `${[
        String(node.attrs?.title ?? ""),
        headers.join(" | "),
        ...rows.map((row) => row.join(" | ")),
      ].join("\n")}\n`;
    }

    const inner = (node.content ?? []).map(walk).join("");
    if (
      node.type === "paragraph" ||
      node.type === "heading" ||
      node.type === "listItem" ||
      node.type === "blockquote"
    ) {
      return `${inner}\n`;
    }

    return inner;
  };

  return (doc.content ?? []).map(walk).join("").trim();
}

export function plainTextForEditor(doc: TipTapDoc | null | undefined): string {
  if (!doc) return "";

  const render = (node: TipTapNode, depth = 0): string => {
    if (node.type === "text") {
      let text = node.text ?? "";
      for (const mark of node.marks ?? []) {
        if (mark.type === "bold") text = `**${text}**`;
        if (mark.type === "italic") text = `*${text}*`;
        if (mark.type === "link") {
          const href = String(mark.attrs?.href ?? "");
          if (href) text = `[${text}](${href})`;
        }
      }
      return text;
    }

    if (node.type === "alertBox") {
      return `:::alert ${String(node.attrs?.tone ?? "info")}|${String(node.attrs?.title ?? "महत्त्वपूर्ण सूचना")}\n${String(node.attrs?.text ?? "")}\n:::`;
    }

    if (node.type === "verdictBox") {
      return `:::verdict|${String(node.attrs?.title ?? "चौतारी सम्पादकीय दृष्टिकोण")}\n${String(node.attrs?.text ?? "")}\n:::`;
    }

    if (node.type === "conditionsCard" || node.type === "optionsCard") {
      const kind = node.type === "conditionsCard" ? "conditions" : "options";
      const items = Array.isArray(node.attrs?.items)
        ? (node.attrs.items as string[])
        : [];
      return `:::${kind}|${String(node.attrs?.title ?? "")}\n${items.map((item) => `- ${item}`).join("\n")}\n:::`;
    }

    if (node.type === "dataTable") {
      const headers = Array.isArray(node.attrs?.headers)
        ? (node.attrs.headers as string[])
        : [];
      const rows = Array.isArray(node.attrs?.rows)
        ? (node.attrs.rows as string[][])
        : [];
      return [
        `:::table|${String(node.attrs?.title ?? "")}`,
        `| ${headers.join(" | ")} |`,
        `| ${headers.map(() => "---").join(" | ")} |`,
        ...rows.map((row) => `| ${row.join(" | ")} |`),
        ":::",
      ].join("\n");
    }

    if (node.type === "heading") {
      const level = Number(node.attrs?.level ?? 2);
      return `${"#".repeat(level)} ${(node.content ?? []).map((child) => render(child)).join("")}`;
    }
    if (node.type === "bulletList") {
      return (node.content ?? [])
        .map(
          (item) =>
            `${"  ".repeat(depth)}- ${(item.content ?? [])
              .map((child) => render(child, depth + 1))
              .join(" ")
              .trim()}`,
        )
        .join("\n");
    }
    if (node.type === "orderedList") {
      return (node.content ?? [])
        .map(
          (item, index) =>
            `${"  ".repeat(depth)}${index + 1}. ${(item.content ?? [])
              .map((child) => render(child, depth + 1))
              .join(" ")
              .trim()}`,
        )
        .join("\n");
    }
    if (node.type === "listItem") {
      return (node.content ?? []).map((child) => render(child, depth)).join("\n");
    }
    if (node.type === "paragraph") {
      return (node.content ?? []).map((child) => render(child, depth)).join("");
    }
    if (node.type === "blockquote") {
      return (node.content ?? [])
        .map((child) => `> ${render(child, depth)}`)
        .join("\n");
    }

    return (node.content ?? []).map((child) => render(child, depth)).join("");
  };

  return (doc.content ?? []).map((node) => render(node)).join("\n\n").trim();
}

export function excerptFromDoc(
  doc: TipTapDoc | null | undefined,
  maxLength = 180,
): string {
  const text = plainTextFromDoc(doc).replace(/\s+/g, " ").trim();
  if (text.length <= maxLength) return text;
  return `${text.slice(0, maxLength).replace(/\s+\S*$/, "")}…`;
}

export function readingMinutes(doc: TipTapDoc | null | undefined): number {
  const words = plainTextFromDoc(doc).split(/\s+/).filter(Boolean).length;
  return Math.max(1, Math.ceil(words / 180));
}
