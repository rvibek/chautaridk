import { lookup } from "node:dns/promises";
import { isIP } from "node:net";

import { Readability } from "@mozilla/readability";
import { JSDOM } from "jsdom";

const MAX_BYTES = 2_500_000;
const MAX_REDIRECTS = 3;
const FETCH_TIMEOUT_MS = 20_000;

export type ExtractedSource = {
  url: string;
  title: string;
  text: string;
  excerpt: string;
  byline: string | null;
  publisher: string | null;
  language: string | null;
  publishedAt: Date | null;
};

function isPrivateIpv4(address: string): boolean {
  const parts = address.split(".").map(Number);
  if (parts.length !== 4 || parts.some((part) => Number.isNaN(part))) {
    return true;
  }

  const [a, b] = parts;
  return (
    a === 0 ||
    a === 10 ||
    a === 127 ||
    (a === 169 && b === 254) ||
    (a === 172 && b >= 16 && b <= 31) ||
    (a === 192 && b === 168) ||
    (a === 100 && b >= 64 && b <= 127) ||
    (a === 192 && b === 0 && parts[2] === 2) ||
    (a === 198 && (b === 18 || b === 19)) ||
    a >= 224
  );
}

function isPrivateAddress(address: string): boolean {
  const version = isIP(address);
  if (version === 4) return isPrivateIpv4(address);
  if (version !== 6) return true;

  const normalized = address.toLowerCase();
  if (normalized === "::1" || normalized === "::") return true;
  if (
    normalized.startsWith("fe80:") ||
    normalized.startsWith("fec0:") ||
    normalized.startsWith("fc") ||
    normalized.startsWith("fd") ||
    normalized.startsWith("ff")
  ) {
    return true;
  }

  const mapped = normalized.match(/^::ffff:(\d+\.\d+\.\d+\.\d+)$/);
  if (mapped) return isPrivateIpv4(mapped[1]);

  return false;
}

async function assertSafeUrl(rawUrl: string): Promise<URL> {
  let url: URL;
  try {
    url = new URL(rawUrl);
  } catch {
    throw new Error("URL ढाँचा मिलेन।");
  }

  if (!["http:", "https:"].includes(url.protocol)) {
    throw new Error("केवल http वा https लिङ्क स्वीकार गरिन्छ।");
  }

  const hostname = url.hostname.toLowerCase();
  if (
    hostname === "localhost" ||
    hostname.endsWith(".local") ||
    hostname.endsWith(".internal") ||
    hostname.endsWith(".localhost") ||
    hostname === "metadata.google.internal"
  ) {
    throw new Error("आन्तरिक वा स्थानीय लिङ्क ल्याउन मिल्दैन।");
  }

  if (isIP(hostname)) {
    if (isPrivateAddress(hostname)) {
      throw new Error("निजी वा आन्तरिक IP ठेगाना ल्याउन मिल्दैन।");
    }
    return url;
  }

  const addresses = await lookup(hostname, { all: true, verbatim: true });
  if (addresses.length === 0) {
    throw new Error("लिङ्कको होस्ट भेटिएन।");
  }

  if (addresses.some((entry) => isPrivateAddress(entry.address))) {
    throw new Error("लिङ्क निजी वा आन्तरिक नेटवर्कमा जान्छ।");
  }

  return url;
}

async function readLimitedText(response: Response): Promise<string> {
  if (!response.body) return "";

  const reader = response.body.getReader();
  const chunks: Uint8Array[] = [];
  let total = 0;

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    if (!value) continue;

    total += value.byteLength;
    if (total > MAX_BYTES) {
      await reader.cancel();
      throw new Error("स्रोत पृष्ठ धेरै ठूलो छ (२.५ MB भन्दा बढी)।");
    }
    chunks.push(value);
  }

  const merged = new Uint8Array(total);
  let offset = 0;
  for (const chunk of chunks) {
    merged.set(chunk, offset);
    offset += chunk.byteLength;
  }

  return new TextDecoder("utf-8").decode(merged);
}

async function safeFetch(rawUrl: string) {
  let current = await assertSafeUrl(rawUrl);

  for (let hop = 0; hop <= MAX_REDIRECTS; hop += 1) {
    const response = await fetch(current, {
      redirect: "manual",
      signal: AbortSignal.timeout(FETCH_TIMEOUT_MS),
      headers: {
        "user-agent":
          "ChautariBot/0.1 (+https://chautari.dk; editorial source intake)",
        accept: "text/html,application/xhtml+xml",
        "accept-language": "en,da;q=0.9,ne;q=0.8",
      },
    });

    if ([301, 302, 303, 307, 308].includes(response.status)) {
      const location = response.headers.get("location");
      if (!location) throw new Error("स्रोत लिङ्कले अमान्य रिडाइरेक्ट फर्कायो।");
      current = await assertSafeUrl(new URL(location, current).toString());
      continue;
    }

    if (!response.ok) {
      throw new Error(`स्रोत पृष्ठ खोल्न सकिएन (HTTP ${response.status})।`);
    }

    const contentType = response.headers.get("content-type") ?? "";
    if (
      !contentType.includes("text/html") &&
      !contentType.includes("application/xhtml+xml")
    ) {
      throw new Error("यो लिङ्क HTML लेख होइन; सामग्री टाँस्ने विकल्प प्रयोग गर्नुहोस्।");
    }

    const html = await readLimitedText(response);
    return { html, finalUrl: current.toString() };
  }

  throw new Error("धेरै रिडाइरेक्ट भए; स्रोत लिङ्क जाँच्नुहोस्।");
}

function metaContent(document: Document, names: string[]): string | null {
  for (const name of names) {
    const element =
      document.querySelector(`meta[property="${name}"]`) ??
      document.querySelector(`meta[name="${name}"]`);
    const content = element?.getAttribute("content")?.trim();
    if (content) return content;
  }
  return null;
}

function parseDate(value: string | null): Date | null {
  if (!value) return null;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
}

function cleanExtractedText(value: string): string {
  return value
    .replace(/\r\n/g, "\n")
    .replace(/[ \t]+\n/g, "\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

export async function extractSourceFromUrl(
  rawUrl: string,
): Promise<ExtractedSource> {
  const { html, finalUrl } = await safeFetch(rawUrl);
  const dom = new JSDOM(html, { url: finalUrl });
  const document = dom.window.document;

  const article = new Readability(document, { charThreshold: 200 }).parse();

  const text = cleanExtractedText(article?.textContent ?? "");
  if (text.length < 200) {
    throw new Error(
      "स्रोत पृष्ठबाट पर्याप्त लेख पाठ भेटिएन। सामग्री टाँस्ने विकल्प प्रयोग गर्नुहोस्।",
    );
  }

  const title =
    article?.title?.trim() ||
    metaContent(document, ["og:title", "twitter:title"]) ||
    document.title.trim() ||
    finalUrl;

  return {
    url: finalUrl,
    title,
    text,
    excerpt: article?.excerpt?.trim() ?? "",
    byline: article?.byline?.trim() || null,
    publisher:
      article?.siteName?.trim() ||
      metaContent(document, ["og:site_name"]) ||
      new URL(finalUrl).hostname,
    language:
      document.documentElement.getAttribute("lang")?.trim() ||
      metaContent(document, ["og:locale", "language"]) ||
      null,
    publishedAt: parseDate(
      metaContent(document, [
        "article:published_time",
        "og:article:published_time",
        "datePublished",
        "date",
      ]),
    ),
  };
}
