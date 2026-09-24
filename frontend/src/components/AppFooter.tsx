import { Link, useLocation } from "react-router";

import { OPERATOR_NAME } from "../legal";

export function AppFooter() {
  const { pathname } = useLocation();
  const isLegalPage = pathname === "/terms" || pathname === "/privacy";
  const externalPageProps = isLegalPage
    ? {}
    : { target: "_blank", rel: "noreferrer" };

  return (
    <footer className="app-footer">
      <div className="app-footer-inner">
        <p>© 2026 {OPERATOR_NAME}</p>
        <nav aria-label="法的情報">
          <Link
            to="/terms"
            {...externalPageProps}
            aria-label={
              isLegalPage
                ? "利用規約"
                : "利用規約（新しいタブで開く）"
            }
          >
            利用規約
          </Link>
          <Link
            to="/privacy"
            {...externalPageProps}
            aria-label={
              isLegalPage
                ? "プライバシーポリシー"
                : "プライバシーポリシー（新しいタブで開く）"
            }
          >
            プライバシーポリシー
          </Link>
        </nav>
      </div>
    </footer>
  );
}
