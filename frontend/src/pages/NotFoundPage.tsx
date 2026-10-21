import { useEffect } from "react";
import { useNavigate } from "react-router";

import { Brand } from "../components/Brand";
import { APP_NAME } from "../brand";

function NotFoundPage() {
  const navigate = useNavigate();

  useEffect(() => {
    const previousTitle = document.title;
    document.title = `ページが見つかりません | ${APP_NAME}`;

    return () => {
      document.title = previousTitle;
    };
  }, []);

  return (
    <main className="state-page">
      <section className="state-panel" role="alert">
        <Brand />
        <h1>ページが見つかりませんでした</h1>
        <p>URLを確認するか、トップからもう一度お試しください。</p>
        <button
          type="button"
          className="primary-button"
          onClick={() => navigate("/")}
        >
          トップへ戻る
        </button>
      </section>
    </main>
  );
}

export default NotFoundPage;
