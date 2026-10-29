import Link from "next/link";

import { NewStoryIntake } from "@/components/admin/new-story-intake";
import { getColumnists } from "@/lib/admin";
import { getCategories } from "@/lib/articles";

export default async function NewStoryPage({
  searchParams,
}: {
  searchParams: Promise<{ tab?: string }>;
}) {
  const [{ tab }, categories, columnists] = await Promise.all([
    searchParams,
    getCategories(),
    getColumnists(),
  ]);
  const initialTab =
    tab === "text" || tab === "blank" || tab === "url" ? tab : "url";

  return (
    <>
      <div className="admin-page-head">
        <div>
          <h1>नयाँ स्टोरी</h1>
          <p>
            स्रोत लिङ्क वा टाँसिएको सामग्रीबाट एआई नेपाली मस्यौदा बनाउनुहोस्,
            वा खाली मस्यौदा सिधै लेख्नुहोस्। प्रकाशनअघि समीक्षा अनिवार्य छ।
          </p>
        </div>
        <Link href="/admin/stories" className="btn btn--outline">
          ← सूचीमा फर्कनुहोस्
        </Link>
      </div>

      <section className="admin-card">
        <NewStoryIntake
          initialTab={initialTab}
          categories={categories.map((category) => ({
            id: category.id,
            slug: category.slug,
            nameNp: category.nameNp,
            kind: category.kind,
          }))}
          columnists={columnists.map((columnist) => ({
            id: columnist.id,
            name: columnist.name,
          }))}
        />
      </section>
    </>
  );
}
