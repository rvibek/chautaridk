export default function MediaPage() {
  return (
    <>
      <div className="admin-page-head">
        <div>
          <h1>मिडिया</h1>
          <p>तस्बिर, क्याप्सन र alt पाठको भण्डार।</p>
        </div>
      </div>

      <section className="admin-card">
        <p className="admin-empty">
          मिडिया लाइब्रेरी R1 मा सक्रिय हुनेछ। त्यतिबेला Cloudflare R2
          मा तस्बिर अपलोड, क्याप्सन, alt पाठ र विभिन्न साइज
          स्वचालित रूपमा तयार हुनेछन्।
        </p>
      </section>

      <section className="admin-card">
        <h2>अहिलेको अवस्था</h2>
        <p className="admin-side-meta">
          R0 मा लेखहरू ग्राफिक प्लेसहोल्डरसहित देखिन्छन्। वास्तविक
          तस्बिर थप्ने काम R1 को मिडिया मोड्युलसँग जोडिनेछ।
        </p>
      </section>
    </>
  );
}
