"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";

import { BrandMark } from "@/components/brand-mark";

type TickerItem = {
  slug: string;
  title: string;
};

const navItems = [
  { href: "/", label: "गृहपृष्ठ" },
  { href: "/samachar", label: "समाचार" },
  { href: "/vichar", label: "विचार" },
  { href: "/about", label: "हाम्रोबारे" },
  { href: "/contact", label: "सम्पर्क" },
];

export function SiteHeader({
  ticker,
  todayLabel,
}: {
  ticker: TickerItem[];
  todayLabel: string;
}) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  useEffect(() => {
    document.body.classList.toggle("nav-open", open);
    return () => document.body.classList.remove("nav-open");
  }, [open]);

  const tickerItems = ticker.length > 0 ? ticker : [{ slug: "", title: "चौतारी.dk — डेनमार्कका नेपालीहरूको साझा डिजिटल चौतारी" }];

  return (
    <>
      <div className="topbar">
        <div className="container topbar-inner">
          <div className="topbar-left">
            <span className="topbar-date">
              <span className="live-dot" aria-hidden="true" />
              {todayLabel}
            </span>
            <span className="topbar-sep" aria-hidden="true" />
            <span className="topbar-location">कोपनहेगन, डेनमार्क</span>
          </div>
          <div className="topbar-right">
            <Link className="topbar-link topbar-link--accent" href="/contact">
              समाचार सुझाव
            </Link>
            <a className="topbar-link" href="mailto:ads@chautari.dk">
              विज्ञापन
            </a>
            <span className="socials">
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
            </span>
          </div>
        </div>
      </div>

      <div className="masthead">
        <div className="container masthead-inner">
          <Link href="/" className="brand" aria-label="चौतारी डट डिके — गृहपृष्ठ">
            <BrandMark />
            <span className="brand-text">
              <span className="brand-name">
                चौतारी<span className="dk">.dk</span>
              </span>
              <span className="brand-tagline">
                डेनमार्कका नेपालीहरूको साझा डिजिटल चौतारी
              </span>
            </span>
          </Link>

          <div className="masthead-promo">
            <div className="promo-copy">
              <span className="promo-kicker">सम्पादकीय डेस्क</span>
              <span className="promo-text">समाचार, सूचना वा सुझाव पठाउनुहोस्</span>
            </div>
            <Link href="/contact" className="btn btn--sm">
              सम्पर्क गर्नुहोस्
            </Link>
          </div>
        </div>
      </div>

      <nav className="navbar" aria-label="मुख्य मेनु">
        <div className="container nav-inner">
          <div className={`site-nav${open ? " is-open" : ""}`} id="site-nav">
            <ul>
              {navItems.map((item) => {
                const active =
                  item.href === "/"
                    ? pathname === "/"
                    : pathname.startsWith(item.href);
                return (
                  <li key={item.href}>
                    <Link
                      href={item.href}
                      className={active ? "active" : undefined}
                      aria-current={active ? "page" : undefined}
                      onClick={() => setOpen(false)}
                    >
                      {item.label}
                    </Link>
                  </li>
                );
              })}
            </ul>
          </div>

          <div className="nav-tools">
            <form className="search" role="search" action="/search">
              <input
                type="search"
                name="q"
                placeholder="खोज्नुहोस्..."
                aria-label="समाचार खोज्नुहोस्"
              />
              <button type="submit" aria-label="खोज्नुहोस्">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
                  <circle cx="11" cy="11" r="7" />
                  <path d="m20 20-3.5-3.5" strokeLinecap="round" />
                </svg>
              </button>
            </form>
            <button
              className="nav-toggle"
              type="button"
              aria-expanded={open}
              aria-controls="site-nav"
              aria-label="मेनु खोल्नुहोस्"
              onClick={() => setOpen((value) => !value)}
            >
              <span className="bars" aria-hidden="true">
                <span />
                <span />
              </span>
              <span className="nav-toggle-label">मेनु</span>
            </button>
          </div>
        </div>
      </nav>

      <div className="nav-backdrop" aria-hidden="true" onClick={() => setOpen(false)} />

      <div className="ticker" aria-label="ताजा समाचार">
        <div className="container ticker-inner">
          <span className="ticker-label">
            <span className="live-dot" aria-hidden="true" />
            ताजा
          </span>
          <div className="ticker-viewport">
            <div className="ticker-track">
              {[0, 1].map((group) => (
                <div className="ticker-group" key={group} aria-hidden={group === 1}>
                  {tickerItems.slice(0, 5).map((item, index) => (
                    <span key={`${group}-${item.slug}-${index}`} style={{ display: "inline-flex", alignItems: "center", gap: "1.4rem" }}>
                      {item.slug ? (
                        <Link className="ticker-item" href={`/article/${item.slug}`}>
                          {item.title}
                        </Link>
                      ) : (
                        <span className="ticker-item">{item.title}</span>
                      )}
                      <span className="ticker-dot" aria-hidden="true" />
                    </span>
                  ))}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
