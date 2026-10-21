import { APP_NAME } from "../brand";

type BrandProps = {
  compact?: boolean;
};

export function Brand({ compact = false }: BrandProps) {
  return (
    <div
      className={compact ? "brand-lockup brand-lockup-compact" : "brand-lockup"}
    >
      <span className="brand-mark" aria-hidden="true">
        <span />
      </span>
      <span className="brand-name">{APP_NAME}</span>
    </div>
  );
}
