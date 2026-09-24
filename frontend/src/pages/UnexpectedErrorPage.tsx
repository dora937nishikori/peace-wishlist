import {
  isRouteErrorResponse,
  useNavigate,
  useRouteError,
} from "react-router";

import { AppFooter } from "../components/AppFooter";
import { Brand } from "../components/Brand";

function UnexpectedErrorPage() {
  const navigate = useNavigate();
  const routeError = useRouteError();

  const isNotFound =
    isRouteErrorResponse(routeError) &&
    routeError.status === 404;

  return (
    <div className="app-frame">
      <div className="app-content">
        <main className="state-page">
          <section className="state-panel" role="alert">
            <Brand />
            <h1>
              {isNotFound
                ? "ページが見つかりませんでした"
                : "画面を表示できませんでした"}
            </h1>
            <p>
              {isNotFound
                ? "URLを確認するか、リストからもう一度開いてください。"
                : "一時的な問題が発生しました。もう一度読み込んでください。"}
            </p>
            <button
              type="button"
              className="primary-button"
              onClick={() => window.location.reload()}
            >
              もう一度読み込む
            </button>
            <button
              type="button"
              className="text-button"
              onClick={() => navigate("/")}
            >
              トップへ戻る
            </button>
          </section>
        </main>
      </div>
      <AppFooter />
    </div>
  );
}

export default UnexpectedErrorPage;
