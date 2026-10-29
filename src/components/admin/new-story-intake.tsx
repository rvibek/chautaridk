"use client";

import { useActionState, useState } from "react";

import {
  createDraftFromText,
  createDraftFromUrl,
  type IntakeFormState,
} from "@/actions/intake";
import { StoryForm } from "@/components/admin/story-form";

type CategoryOption = {
  id: string;
  slug: string;
  nameNp: string;
  kind: "NEWS" | "OPINION" | "NEPAL";
};

type ColumnistOption = {
  id: string;
  name: string;
};

const tabs = [
  { id: "url", label: "लिङ्कबाट सुरु" },
  { id: "text", label: "सामग्री टाँस्नुहोस्" },
  { id: "blank", label: "खाली मस्यौदा" },
] as const;

type TabID = (typeof tabs)[number]["id"];

export function NewStoryIntake({
  categories,
  columnists,
  initialTab = "url",
}: {
  categories: CategoryOption[];
  columnists: ColumnistOption[];
  initialTab?: TabID;
}) {
  const [tab, setTab] = useState<TabID>(initialTab);
  const [urlState, urlAction, urlPending] = useActionState<
    IntakeFormState,
    FormData
  >(createDraftFromUrl, {});
  const [textState, textAction, textPending] = useActionState<
    IntakeFormState,
    FormData
  >(createDraftFromText, {});
  const busy = urlPending || textPending;

  return (
    <div>
      <nav className="category-pills" aria-label="सुरु गर्ने तरिका">
        {tabs.map((item) => (
          <button
            key={item.id}
            type="button"
            className={tab === item.id ? "active" : undefined}
            onClick={() => setTab(item.id)}
            disabled={busy}
          >
            {item.label}
          </button>
        ))}
      </nav>

      {busy ? (
        <div className="form-success" style={{ marginBottom: "1rem" }}>
          स्रोत ल्याउँदै र एआईले नेपाली मस्यौदा तयार गर्दै छ। यसले ३०–६०
          सेकेन्ड लिन सक्छ; पृष्ठ बन्द नगर्नुहोस्।
        </div>
      ) : null}

      {tab === "url" ? (
        <form action={urlAction} className="admin-form">
          {urlState.error ? (
            <div className="form-error">{urlState.error}</div>
          ) : null}

          <div className="field">
            <label htmlFor="url">स्रोत लिङ्क</label>
            <input
              id="url"
              name="url"
              type="url"
              required
              placeholder="https://www.dr.dk/..."
            />
            <span className="hint">
              सार्वजनिक समाचार पृष्ठको लिङ्क। सर्भरले लेख पाठ ल्याएर एआईलाई
              दिन्छ। निजी वा स्थानीय लिङ्क स्वीकार गरिँदैन।
            </span>
          </div>

          <div className="form-grid">
            <div className="field">
              <label htmlFor="sourcePublisher">प्रकाशक (वैकल्पिक)</label>
              <input
                id="sourcePublisher"
                name="sourcePublisher"
                type="text"
                placeholder="DR, Politiken, Reuters..."
              />
            </div>
            <div className="field">
              <label htmlFor="sourceLanguage">स्रोत भाषा (वैकल्पिक)</label>
              <input
                id="sourceLanguage"
                name="sourceLanguage"
                type="text"
                placeholder="da, en..."
              />
            </div>
          </div>

          <CategoryKindRights categories={categories} />

          <div className="field">
            <label htmlFor="instruction">सम्पादकीय निर्देशन (वैकल्पिक)</label>
            <textarea
              id="instruction"
              name="instruction"
              rows={3}
              placeholder="जस्तै: छोटो राख्नुहोस्; भिसा प्रक्रियामा केन्द्रित गर्नुहोस्..."
            />
          </div>

          <div className="admin-actions">
            <button type="submit" className="btn" disabled={busy}>
              {urlPending
                ? "स्रोत ल्याउँदै..."
                : "स्रोत ल्याएर एआई मस्यौदा बनाउनुहोस्"}
            </button>
          </div>
        </form>
      ) : null}

      {tab === "text" ? (
        <form action={textAction} className="admin-form">
          {textState.error ? (
            <div className="form-error">{textState.error}</div>
          ) : null}

          <div className="field">
            <label htmlFor="sourceText">स्रोत पाठ</label>
            <textarea
              id="sourceText"
              name="sourceText"
              rows={14}
              required
              placeholder="यहाँ स्रोत लेखको पूरा वा मुख्य पाठ टाँस्नुहोस्..."
            />
            <span className="hint">
              स्रोत पृष्ठ खोल्न नमिल्ने भए, वा PDF/न्यूजलेटरबाट सामग्री
              लिइएको भए यो विकल्प प्रयोग गर्नुहोस्।
            </span>
          </div>

          <div className="form-grid">
            <div className="field">
              <label htmlFor="sourcePublisher">प्रकाशक</label>
              <input
                id="sourcePublisher"
                name="sourcePublisher"
                type="text"
                placeholder="DR, Politiken, Reuters..."
              />
            </div>
            <div className="field">
              <label htmlFor="sourceLanguage">स्रोत भाषा</label>
              <input
                id="sourceLanguage"
                name="sourceLanguage"
                type="text"
                placeholder="da, en, ne..."
              />
            </div>
          </div>

          <div className="form-grid">
            <div className="field">
              <label htmlFor="sourceUrl">मूल लिङ्क (वैकल्पिक)</label>
              <input
                id="sourceUrl"
                name="sourceUrl"
                type="url"
                placeholder="https://..."
              />
            </div>
            <div className="field">
              <label htmlFor="sourceOriginalTitle">मूल शीर्षक</label>
              <input
                id="sourceOriginalTitle"
                name="sourceOriginalTitle"
                type="text"
              />
            </div>
          </div>

          <CategoryKindRights categories={categories} />

          <div className="field">
            <label htmlFor="instruction">सम्पादकीय निर्देशन (वैकल्पिक)</label>
            <textarea
              id="instruction"
              name="instruction"
              rows={3}
              placeholder="जस्तै: तथ्यमा केन्द्रित; ६०० शब्दभन्दा छोटो..."
            />
          </div>

          <div className="admin-actions">
            <button type="submit" className="btn" disabled={busy}>
              {textPending
                ? "एआई मस्यौदा बन्दै..."
                : "टाँसिएको सामग्रीबाट एआई मस्यौदा बनाउनुहोस्"}
            </button>
          </div>
        </form>
      ) : null}

      {tab === "blank" ? (
        <StoryForm
          mode="create"
          categories={categories}
          columnists={columnists}
        />
      ) : null}
    </div>
  );
}

function CategoryKindRights({ categories }: { categories: CategoryOption[] }) {
  return (
    <>
      <div className="form-grid">
        <div className="field">
          <label htmlFor="categoryId">खण्ड</label>
          <select id="categoryId" name="categoryId" defaultValue="">
            <option value="">— खण्ड छान्नुहोस् —</option>
            {categories.map((category) => (
              <option value={category.id} key={category.id}>
                {category.nameNp}
              </option>
            ))}
          </select>
        </div>

        <div className="field">
          <label htmlFor="kind">सामग्री प्रकार</label>
          <select id="kind" name="kind" defaultValue="NEWS">
            <option value="NEWS">समाचार</option>
            <option value="OPINION">विचार</option>
            <option value="NEPAL">नेपाल (R2)</option>
          </select>
        </div>
      </div>

      <div className="field">
        <label htmlFor="rightsStatus">अधिकार स्थिति</label>
        <select
          id="rightsStatus"
          name="rightsStatus"
          defaultValue="FAIR_USE_SUMMARY"
        >
          <option value="FAIR_USE_SUMMARY">सारांश र साभार</option>
          <option value="LICENSED">लाइसेन्स प्राप्त</option>
          <option value="PERMISSION_GRANTED">अनुमति प्राप्त</option>
          <option value="ORIGINAL">मौलिक सामग्री</option>
          <option value="UNKNOWN">अज्ञात / जाँच बाँकी</option>
        </select>
        <span className="hint">
          स्रोतबाट तयार गरिएको सामग्रीमा सारांश, छोटा उद्धरण र स्पष्ट साभार
          प्रयोग गरिन्छ।
        </span>
      </div>
    </>
  );
}
