import { TriangleAlert } from "lucide-react";

export default function CatalogServiceError({
  className = "",
  compact = false,
  title = "Ürün hizmetine şu anda erişilemiyor",
  message = "Lütfen kısa süre sonra tekrar deneyin.",
}: {
  className?: string;
  compact?: boolean;
  title?: string;
  message?: string;
}) {
  if (compact) {
    return (
      <div
        role="alert"
        className={`flex items-start gap-2 rounded-xl border border-warning/25 bg-warning/10 px-3 py-2 text-xs font-semibold text-foreground ${className}`}
      >
        <TriangleAlert className="mt-0.5 h-4 w-4 shrink-0 text-warning" />
        <span>
          <strong>{title}.</strong> {message}
        </span>
      </div>
    );
  }

  return (
    <div
      role="alert"
      className={`page-panel-soft concept-surface flex min-h-[220px] flex-col items-center justify-center p-8 text-center ${className}`}
    >
      <div className="relative z-10 flex h-14 w-14 items-center justify-center rounded-2xl border border-border-soft bg-panel-3">
        <TriangleAlert className="h-7 w-7 text-warning" />
      </div>

      <h2 className="relative z-10 mt-4 text-lg font-black text-foreground">
        {title}
      </h2>

      <p className="relative z-10 mt-2 max-w-md text-sm leading-6 text-muted">
        {message}
      </p>
    </div>
  );
}
