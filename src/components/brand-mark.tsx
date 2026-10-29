export function BrandMark({ className = "brand-mark" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 48 48" aria-hidden="true">
      <circle cx="24" cy="24" r="23" fill="#123a63" />
      <circle cx="24" cy="17.5" r="8.2" fill="#ffffff" opacity=".96" />
      <circle cx="16.5" cy="21.5" r="5.2" fill="#ffffff" opacity=".9" />
      <circle cx="31.5" cy="21.5" r="5.2" fill="#ffffff" opacity=".9" />
      <path d="M23 23.5h2v11h-2z" fill="#ffffff" />
      <rect x="17" y="33" width="14" height="2.4" rx="1.2" fill="#f87171" />
      <rect x="19.4" y="35.4" width="1.6" height="3" fill="#f87171" opacity=".8" />
      <rect x="27" y="35.4" width="1.6" height="3" fill="#f87171" opacity=".8" />
      <circle cx="32.5" cy="12.5" r="1.6" fill="#f59e0b" />
    </svg>
  );
}
