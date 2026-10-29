import { getAdForSlot } from "@/lib/articles";

type AdSize = "leaderboard" | "box" | "inline" | "tall";

export async function AdSlot({
  slotKey,
  label,
  size = "leaderboard",
}: {
  slotKey: string;
  label: string;
  size?: AdSize;
}) {
  const ad = await getAdForSlot(slotKey);

  return (
    <aside className={`ad-slot ad-slot--${size}`} aria-label={`विज्ञापन ${label}`}>
      <span className="ad-label">{label}</span>
      {ad ? (
        <a
          href={ad.targetUrl}
          target="_blank"
          rel="sponsored noopener noreferrer"
          style={{ display: "block", width: "100%" }}
        >
          {ad.imageUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={ad.imageUrl}
              alt={ad.altText ?? ad.name}
              loading="lazy"
              style={{ width: "100%", height: "auto", borderRadius: 6 }}
            />
          ) : (
            <strong>{ad.name}</strong>
          )}
        </a>
      ) : (
        <>
          <strong>तपाईंको ब्रान्ड यहाँ</strong>
          <span>विज्ञापन स्थान · {slotKey}</span>
          <a href="mailto:ads@chautari.dk">विज्ञापनका लागि सम्पर्क गर्नुहोस्</a>
        </>
      )}
    </aside>
  );
}
