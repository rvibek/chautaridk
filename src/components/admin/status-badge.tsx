const labels: Record<string, string> = {
  DRAFT: "मस्यौदा",
  NEEDS_REVIEW: "समीक्षामा",
  CHANGES_REQUESTED: "सुधार चाहिएको",
  APPROVED: "स्वीकृत",
  SCHEDULED: "तालिकाबद्ध",
  PUBLISHED: "प्रकाशित",
  REJECTED: "अस्वीकृत",
  ARCHIVED: "अभिलेख",
};

export function StatusBadge({ status }: { status: string }) {
  return (
    <span className={`status-badge status-${status}`}>
      {labels[status] ?? status}
    </span>
  );
}
