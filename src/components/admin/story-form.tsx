"use client";

import { useRouter } from "next/navigation";
import { useActionState, useEffect } from "react";

import {
  createDraft,
  updateArticle,
  type StoryFormState,
} from "@/actions/articles";
import type { TipTapDoc } from "@/db/schema";
import { plainTextForEditor } from "@/lib/content";

type CategoryOption = {
  id: string;
  slug: string;
  nameNp: string;
  kind: "NEWS" | "OPINION" | "NEPAL";
};

type ArticleDefaults = {
  id: string;
  title: string;
  slug: string;
  categoryId: string | null;
  kind: "NEWS" | "OPINION" | "NEPAL";
  columnistId: string | null;
  dek: string | null;
  body: TipTapDoc;
  seoTitle: string | null;
  seoDescription: string | null;
  canonicalUrl: string | null;
  rightsStatus:
    | "ORIGINAL"
    | "LICENSED"
    | "PERMISSION_GRANTED"
    | "FAIR_USE_SUMMARY"
    | "UNKNOWN";
};

type SourceDefaults = {
  url: string | null;
  publisher: string | null;
  originalTitle: string | null;
  language: string | null;
} | null;

type RevisionDefaults = {
  id: string;
  version: number;
} | null;

type ColumnistOption = {
  id: string;
  name: string;
};

export function StoryForm({
  categories,
  columnists = [],
  mode,
  article,
  revision,
  source,
  lockSlug = false,
}: {
  categories: CategoryOption[];
  columnists?: ColumnistOption[];
  mode: "create" | "edit";
  article?: ArticleDefaults | null;
  revision?: RevisionDefaults;
  source?: SourceDefaults;
  lockSlug?: boolean;
}) {
  const router = useRouter();
  const action = mode === "edit" ? updateArticle : createDraft;
  const [state, formAction, pending] = useActionState<StoryFormState, FormData>(
    action,
    {},
  );

  useEffect(() => {
    if (state.success) {
      router.refresh();
    }
  }, [state.success, router]);

  return (
    <form action={formAction} className="admin-form">
      {mode === "edit" && article && revision ? (
        <>
          <input type="hidden" name="articleId" value={article.id} />
          <input type="hidden" name="revisionId" value={revision.id} />
          <input type="hidden" name="version" value={revision.version} />
        </>
      ) : null}

      {state.error ? <div className="form-error">{state.error}</div> : null}
      {state.success ? <div className="form-success">{state.success}</div> : null}

      <div className="field">
        <label htmlFor="title">शीर्षक</label>
        <input
          id="title"
          name="title"
          type="text"
          required
          defaultValue={article?.title ?? ""}
          placeholder="नेपाली शीर्षक..."
        />
      </div>

      <div className="form-grid">
        <div className="field">
          <label htmlFor="slug">URL स्लग</label>
          <input
            id="slug"
            name="slug"
            type="text"
            defaultValue={article?.slug ?? ""}
            placeholder="latin-slug-here"
            readOnly={lockSlug}
          />
          <span className="hint">
            {lockSlug
              ? "प्रकाशित लेखको URL स्लग परिवर्तन गर्न मिल्दैन। पहिले अनपब्लिश गर्नुहोस्।"
              : "खाली राखेमा शीर्षकबाट बनाइन्छ। ल्याटिन अक्षर, संख्या र हाइफन मात्र प्रयोग गर्नुहोस्।"}
          </span>
        </div>

        <div className="field">
          <label htmlFor="categoryId">खण्ड</label>
          <select
            id="categoryId"
            name="categoryId"
            defaultValue={article?.categoryId ?? ""}
          >
            <option value="">— खण्ड छान्नुहोस् —</option>
            {categories.map((category) => (
              <option value={category.id} key={category.id}>
                {category.nameNp}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="form-grid">
        <div className="field">
          <label htmlFor="kind">सामग्री प्रकार</label>
          <select id="kind" name="kind" defaultValue={article?.kind ?? "NEWS"}>
            <option value="NEWS">समाचार</option>
            <option value="OPINION">विचार</option>
            <option value="NEPAL">नेपाल (R2)</option>
          </select>
        </div>

        <div className="field">
          <label htmlFor="rightsStatus">अधिकार स्थिति</label>
          <select
            id="rightsStatus"
            name="rightsStatus"
            defaultValue={
              article?.rightsStatus ??
              (source?.url ? "UNKNOWN" : "ORIGINAL")
            }
          >
            <option value="ORIGINAL">मौलिक सामग्री</option>
            <option value="LICENSED">लाइसेन्स प्राप्त</option>
            <option value="PERMISSION_GRANTED">अनुमति प्राप्त</option>
            <option value="FAIR_USE_SUMMARY">सारांश र साभार</option>
            <option value="UNKNOWN">अज्ञात / जाँच बाँकी</option>
          </select>
        </div>
      </div>

      {columnists.length > 0 ? (
        <div className="field">
          <label htmlFor="columnistId">स्तम्भकार (विचारका लागि)</label>
          <select
            id="columnistId"
            name="columnistId"
            defaultValue={article?.columnistId ?? ""}
          >
            <option value="">— स्तम्भकार छान्नुहोस् —</option>
            {columnists.map((columnist) => (
              <option value={columnist.id} key={columnist.id}>
                {columnist.name}
              </option>
            ))}
          </select>
        </div>
      ) : null}

      <div className="field">
        <label htmlFor="dek">डेक / सारांश</label>
        <textarea
          id="dek"
          name="dek"
          rows={3}
          defaultValue={article?.dek ?? ""}
          placeholder="एक वा दुई वाक्यमा लेखको सार..."
        />
      </div>

      <div className="field">
        <label htmlFor="bodyText">मुख्य पाठ</label>
        <textarea
          id="bodyText"
          name="bodyText"
          rows={18}
          required
          defaultValue={plainTextForEditor(article?.body)}
          placeholder={"पहिलो अनुच्छेद...\n\n## उपशीर्षक\n\nअर्को अनुच्छेद...\n\n- सूचीको पहिलो बुँदा\n- दोस्रो बुँदा"}
        />
        <span className="hint">
          R0 सम्पादक: अनुच्छेदबीच खाली लाइन राख्नुहोस्। “## ” ले उपशीर्षक
          र “- ” ले सूची बनाउँछ। R1 मा TipTap सम्पादक थपिनेछ।
        </span>
      </div>

      <details className="admin-card" style={{ padding: "0.8rem 1rem" }}>
        <summary style={{ cursor: "pointer", fontSize: "0.82rem", fontWeight: 700 }}>
          स्रोत र अधिकार विवरण (वैकल्पिक)
        </summary>
        <div style={{ marginTop: "0.9rem", display: "grid", gap: "0.8rem" }}>
          <div className="form-grid">
            <div className="field">
              <label htmlFor="sourcePublisher">प्रकाशक</label>
              <input
                id="sourcePublisher"
                name="sourcePublisher"
                type="text"
                defaultValue={source?.publisher ?? ""}
                placeholder="DR, Politiken, Reuters..."
              />
            </div>
            <div className="field">
              <label htmlFor="sourceLanguage">स्रोत भाषा</label>
              <input
                id="sourceLanguage"
                name="sourceLanguage"
                type="text"
                defaultValue={source?.language ?? ""}
                placeholder="da, en, ne..."
              />
            </div>
          </div>
          <div className="field">
            <label htmlFor="sourceUrl">मूल लिङ्क</label>
            <input
              id="sourceUrl"
              name="sourceUrl"
              type="url"
              defaultValue={source?.url ?? ""}
              placeholder="https://..."
            />
          </div>
          <div className="form-grid">
            <div className="field">
              <label htmlFor="sourceOriginalTitle">मूल शीर्षक</label>
              <input
                id="sourceOriginalTitle"
                name="sourceOriginalTitle"
                type="text"
                defaultValue={source?.originalTitle ?? ""}
              />
            </div>
            <div className="field">
              <label htmlFor="sourcePublishedAt">मूल प्रकाशन मिति</label>
              <input
                id="sourcePublishedAt"
                name="sourcePublishedAt"
                type="date"
              />
            </div>
          </div>
        </div>
      </details>

      <div className="form-grid">
        <div className="field">
          <label htmlFor="seoTitle">SEO शीर्षक</label>
          <input
            id="seoTitle"
            name="seoTitle"
            type="text"
            defaultValue={article?.seoTitle ?? ""}
          />
        </div>
        <div className="field">
          <label htmlFor="seoDescription">SEO विवरण</label>
          <input
            id="seoDescription"
            name="seoDescription"
            type="text"
            defaultValue={article?.seoDescription ?? ""}
          />
        </div>
      </div>

      <div className="field">
        <label htmlFor="canonicalUrl">Canonical URL (वैकल्पिक)</label>
        <input
          id="canonicalUrl"
          name="canonicalUrl"
          type="url"
          defaultValue={article?.canonicalUrl ?? ""}
          placeholder="https://..."
        />
      </div>

      {mode === "edit" ? (
        <div className="field">
          <label htmlFor="changeReason">परिवर्तनको कारण</label>
          <input
            id="changeReason"
            name="changeReason"
            type="text"
            placeholder="संक्षिप्त नोट (अडिट लगमा जान्छ)"
          />
        </div>
      ) : null}

      <div className="admin-actions">
        <button type="submit" className="btn" disabled={pending}>
          {pending
            ? "सुरक्षित गर्दै..."
            : mode === "edit"
              ? "परिवर्तन सुरक्षित गर्नुहोस्"
              : "मस्यौदा सुरु गर्नुहोस्"}
        </button>
      </div>
    </form>
  );
}
