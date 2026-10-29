"use client";

import { useRouter } from "next/navigation";
import { useActionState, useEffect } from "react";

import {
  repromptArticle,
  type IntakeFormState,
} from "@/actions/intake";

export function RepromptForm({
  articleId,
  revisionId,
  version,
}: {
  articleId: string;
  revisionId: string;
  version: number;
}) {
  const router = useRouter();
  const [state, formAction, pending] = useActionState<
    IntakeFormState,
    FormData
  >(repromptArticle, {});

  useEffect(() => {
    if (state.success) router.refresh();
  }, [state.success, router]);

  return (
    <form action={formAction} className="admin-form">
      <input type="hidden" name="articleId" value={articleId} />
      <input type="hidden" name="revisionId" value={revisionId} />
      <input type="hidden" name="version" value={version} />

      {state.error ? <div className="form-error">{state.error}</div> : null}
      {state.success ? (
        <div className="form-success">{state.success}</div>
      ) : null}

      <div className="field">
        <label htmlFor="reprompt-instruction">एआईलाई पुनः निर्देशन</label>
        <textarea
          id="reprompt-instruction"
          name="instruction"
          rows={3}
          required
          placeholder="जस्तै: अझ छोटो बनाउनुहोस्; भिसा प्रक्रियामा केन्द्रित गर्नुहोस्; शीर्षक परिवर्तन गर्नुहोस्..."
        />
        <span className="hint">
          यसले हालको खुला मस्यौदालाई मात्र पुनः तयार गर्छ। प्रकाशित
          संस्करणमा असर पर्दैन।
        </span>
      </div>

      <button type="submit" className="btn btn--outline btn--sm" disabled={pending}>
        {pending ? "पुनः तयार गर्दै..." : "पुनः तयार गर्नुहोस्"}
      </button>
    </form>
  );
}
