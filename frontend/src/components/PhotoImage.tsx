import { useState } from "react";

export function PhotoImage({
  src,
  alt,
  className = "",
  eager = false,
}: {
  src: string;
  alt: string;
  className?: string;
  eager?: boolean;
}) {
  const [failedSrc, setFailedSrc] = useState("");
  if (!src || failedSrc === src)
    return (
      <div
        className={`photo-unavailable ${className}`}
        role="img"
        aria-label={`${alt}（写真を表示できません）`}
      >
        <span>写真を表示できません</span>
      </div>
    );
  return (
    <img
      src={src}
      alt={alt}
      className={className}
      loading={eager ? "eager" : "lazy"}
      decoding="async"
      referrerPolicy="no-referrer"
      onError={() => setFailedSrc(src)}
    />
  );
}
