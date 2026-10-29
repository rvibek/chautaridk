import Link from "next/link";

export default function NotFound() {
  return (
    <main className="container">
      <div className="static-page" style={{ textAlign: "center", marginTop: "4rem" }}>
        <span className="kicker">४०४</span>
        <h1>पृष्ठ भेटिएन</h1>
        <p className="static-intro" style={{ borderBottom: 0 }}>
          तपाईंले खोज्नुभएको पृष्ठ उपलब्ध छैन वा सारिएको हुन सक्छ।
        </p>
        <Link href="/" className="btn">
          गृहपृष्ठमा फर्कनुहोस्
        </Link>
      </div>
    </main>
  );
}
