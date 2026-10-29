import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";

import { signInWithDevEmail, signInWithGoogle } from "@/actions/auth";
import { auth } from "@/auth";
import { BrandMark } from "@/components/brand-mark";
import { isDevLoginEnabled, isGoogleEnabled } from "@/lib/env";

export const metadata: Metadata = {
  title: "सम्पादकीय लगइन",
  robots: { index: false, follow: false },
};

const errorMessages: Record<string, string> = {
  unauthorized: "तपाईंको इमेल सम्पादकीय अनुमति सूचीमा छैन।",
  "missing-email": "कृपया इमेल ठेगाना लेख्नुहोस्।",
  CredentialsSignin: "यो इमेललाई प्रवेश अनुमति छैन।",
  AccessDenied: "यो इमेललाई प्रवेश अनुमति छैन।",
  OAuthAccountNotLinked: "यो इमेल पहिले अर्को विधिबाट प्रयोग भएको छ।",
};

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const session = await auth();
  if (session?.user?.id) {
    redirect("/admin");
  }

  const { error } = await searchParams;
  const message = error
    ? errorMessages[error] ?? "लगइन गर्न सकिएन। फेरि प्रयास गर्नुहोस्।"
    : null;

  return (
    <main className="login-page">
      <div className="login-card">
        <Link href="/" className="login-brand">
          <BrandMark />
          <span className="brand-name">
            चौतारी<span className="dk">.dk</span>
          </span>
        </Link>

        <h1>सम्पादकीय लगइन</h1>
        <p>
          यो कन्सोल चौतारीका अनुमति प्राप्त सम्पादकका लागि मात्र हो।
          लगइन गरेपछि तपाईंको भूमिका अनुसार काम देखिनेछ।
        </p>

        {message ? <div className="login-error" style={{ marginTop: "1rem" }}>{message}</div> : null}

        {isGoogleEnabled ? (
          <form action={signInWithGoogle} style={{ marginTop: "1.1rem" }}>
            <button type="submit" className="btn" style={{ width: "100%" }}>
              Google बाट लगइन गर्नुहोस्
            </button>
          </form>
        ) : null}

        {isGoogleEnabled && isDevLoginEnabled ? (
          <div className="login-divider">वा</div>
        ) : null}

        {isDevLoginEnabled ? (
          <form action={signInWithDevEmail} className="login-form">
            <label htmlFor="email">स्थानीय विकास लगइन</label>
            <input
              id="email"
              name="email"
              type="email"
              required
              placeholder="admin@chautari.dk"
              autoComplete="email"
            />
            <button type="submit" className="btn btn--dark">
              इमेलले प्रवेश गर्नुहोस्
            </button>
            <p className="login-note">
              यो विकल्प स्थानीय विकासका लागि मात्र हो। उत्पादनमा
              DEV_LOGIN_ENABLED बन्द गरिन्छ र Google OAuth मात्र
              प्रयोग हुन्छ।
            </p>
          </form>
        ) : !isGoogleEnabled ? (
          <div className="login-error" style={{ marginTop: "1rem" }}>
            अहिले कुनै लगइन विधि सक्रिय छैन। प्रशासकसँग सम्पर्क गर्नुहोस्।
          </div>
        ) : null}

        <p className="login-note">
          <Link href="/">← सार्वजनिक साइटमा फर्कनुहोस्</Link>
        </p>
      </div>
    </main>
  );
}
