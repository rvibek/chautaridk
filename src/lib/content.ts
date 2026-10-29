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

/**
 * Temporary R0 editor format: plain text in, TipTap-compatible JSON out.
 * Headings use "## ", list items use "- ", everything else becomes a paragraph.
 */
export function docFromPlainText(input: string): TipTapDoc {
  const blocks = input
    .replace(/\r\n/g, "\n")
    .split(/\n{2,}/)
    .map((block) => block.trim())
    .filter(Boolean);

  const content: TipTapNode[] = blocks.map((block) => {
    if (block.startsWith("## ")) {
      return {
        type: "heading",
        attrs: { level: 2 },
        content: [{ type: "text", text: block.slice(3).trim() }],
      };
    }

    if (block.startsWith("# ")) {
      return {
        type: "heading",
        attrs: { level: 1 },
        content: [{ type: "text", text: block.slice(2).trim() }],
      };
    }

    if (block.split("\n").every((line) => line.startsWith("- "))) {
      return {
        type: "bulletList",
        content: block.split("\n").map((line) => ({
          type: "listItem",
          content: [
            {
              type: "paragraph",
              content: [{ type: "text", text: line.slice(2).trim() }],
            },
          ],
        })),
      };
    }

    return {
      type: "paragraph",
      content: [{ type: "text", text: block.replace(/\n/g, " ") }],
    };
  });

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
    if (node.type === "text") return node.text ?? "";
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
