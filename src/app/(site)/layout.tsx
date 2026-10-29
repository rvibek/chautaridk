import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";
import { getPublishedArticles } from "@/lib/articles";
import { formatNepaliDate } from "@/lib/content";

export const dynamic = "force-dynamic";

export default async function SiteLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const latest = await getPublishedArticles(6);

  return (
    <>
      <a className="skip-link" href="#main">
        मुख्य सामग्रीमा जानुहोस्
      </a>
      <SiteHeader
        todayLabel={formatNepaliDate(new Date())}
        ticker={latest.map((article) => ({
          slug: article.slug,
          title: article.title,
        }))}
      />
      <main id="main">{children}</main>
      <SiteFooter />
    </>
  );
}
