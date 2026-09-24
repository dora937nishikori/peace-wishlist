import { useEffect, type ReactNode } from "react";
import { Link } from "react-router";

import { Brand } from "./Brand";

type LegalPageLayoutProps = {
  title: string;
  effectiveDate: string;
  children: ReactNode;
};

export function LegalPageLayout({
  title,
  effectiveDate,
  children,
}: LegalPageLayoutProps) {
  useEffect(() => {
    const previousTitle = document.title;
    document.title = `${title} | peace wishlist`;
    window.scrollTo({ top: 0 });

    return () => {
      document.title = previousTitle;
    };
  }, [title]);

  return (
    <main className="legal-page">
      <div className="legal-shell">
        <div className="legal-topbar">
          <Link
            to="/"
            className="legal-brand-link"
            aria-label="トップへ戻る"
          >
            <Brand />
          </Link>
          <Link to="/" className="legal-home-link">
            トップへ戻る
          </Link>
        </div>

        <article className="legal-document">
          <header className="legal-heading">
            <h1>{title}</h1>
            <p>制定日・最終改定日：{effectiveDate}</p>
          </header>
          {children}
        </article>
      </div>
    </main>
  );
}
