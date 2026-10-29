import Link from "next/link";

import { BrandMark } from "@/components/brand-mark";

export function SiteFooter() {
  return (
    <footer className="site-footer" id="contact">
      <div className="footer-top">
        <div className="container">
          <div className="footer-grid">
            <div className="footer-brand" id="about">
              <Link href="/" className="brand" aria-label="चौतारी डट डिके — गृहपृष्ठ">
                <BrandMark />
                <span className="brand-name">
                  चौतारी<span className="dk">.dk</span>
                </span>
              </Link>
              <p>
                डेनमार्कमा बसोबास गर्ने नेपाली समुदायका लागि समाचार, विचार,
                कानुनी सूचना, भाषा, संस्कृति र सामुदायिक गतिविधिको स्वतन्त्र
                डिजिटल मञ्च।
              </p>
              <div className="socials">
                <a className="social-link" href="#" aria-label="फेसबुक">
                  <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                    <path d="M14 8.5V6.8c0-.8.2-1.3 1.4-1.3H17V2.1c-.3 0-1.2-.1-2.2-.1-2.4 0-4 1.5-4 4.2v2.3H8v3.2h2.8V22H14v-10.3h2.8l.4-3.2H14z" />
                  </svg>
                </a>
                <a className="social-link" href="#" aria-label="एक्स (ट्विटर)">
                  <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                    <path d="M3 3h4.6l5 6.7L18.4 3H21l-6.8 8.2L21.4 21H16.8l-5.3-7.1L5.5 21H3l7.2-8.7L3 3zm3.4 1.7 10.9 14.6h1.5L7.9 4.7H6.4z" />
                  </svg>
                </a>
                <a className="social-link" href="#" aria-label="इन्स्टाग्राम">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true">
                    <rect x="3.5" y="3.5" width="17" height="17" rx="5" />
                    <circle cx="12" cy="12" r="3.6" />
                    <circle cx="17.2" cy="6.8" r="1" fill="currentColor" stroke="none" />
                  </svg>
                </a>
              </div>
            </div>

            <div>
              <h3 className="footer-title">खण्डहरू</h3>
              <ul className="footer-links">
                <li><Link href="/">गृहपृष्ठ</Link></li>
                <li><Link href="/samachar">समाचार</Link></li>
                <li><Link href="/samachar/artha-banking">अर्थ र बैंकिङ</Link></li>
                <li><Link href="/samachar/kanun-visa">कानुन र भिसा</Link></li>
                <li><Link href="/samachar/shram-samaj">श्रम र समाज</Link></li>
                <li><Link href="/vichar">विचार</Link></li>
              </ul>
            </div>

            <div>
              <h3 className="footer-title">सूचना</h3>
              <ul className="footer-links">
                <li><Link href="/about">हाम्रोबारे</Link></li>
                <li><Link href="/contact">सम्पर्क</Link></li>
                <li><a href="mailto:ads@chautari.dk">विज्ञापन</a></li>
                <li><Link href="/editorial-policy">सम्पादकीय नीति</Link></li>
                <li><Link href="/privacy">गोपनीयता नीति</Link></li>
                <li><Link href="/terms">प्रयोगका सर्त</Link></li>
              </ul>
            </div>

            <div>
              <h3 className="footer-title">सम्पर्क</h3>
              <ul className="footer-contact">
                <li>
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
                    <path d="M12 21s7-6.3 7-11a7 7 0 1 0-14 0c0 4.7 7 11 7 11z" />
                    <circle cx="12" cy="10" r="2.5" />
                  </svg>
                  <span>Chautari.dk<br />कोपनहेगन, डेनमार्क</span>
                </li>
                <li>
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
                    <rect x="3" y="5" width="18" height="14" rx="2" />
                    <path d="m3 7 9 6 9-6" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                  <span>
                    <a href="mailto:editorial@chautari.dk">editorial@chautari.dk</a>
                    <br />
                    <a href="mailto:news@chautari.dk">news@chautari.dk</a>
                  </span>
                </li>
                <li>
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
                    <path d="M4 4h16v16H4z" />
                    <path d="M8 8h8M8 12h8M8 16h5" strokeLinecap="round" />
                  </svg>
                  <span>विज्ञापन: <a href="mailto:ads@chautari.dk">ads@chautari.dk</a></span>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </div>

      <div className="container footer-bottom">
        <span>© २०२६ चौतारी डट डिके · सर्वाधिकार सुरक्षित</span>
        <span className="footer-bottom-links">
          <Link href="/privacy">गोपनीयता</Link>
          <Link href="/terms">सर्तहरू</Link>
          <Link href="/login">सम्पादकीय लगइन</Link>
          <span className="footer-made">
            <span className="nepal-flag" aria-hidden="true" />
            कोपनहेगनबाट प्रकाशित
          </span>
        </span>
      </div>
    </footer>
  );
}
