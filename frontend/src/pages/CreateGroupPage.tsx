import { useState, type FormEvent } from "react";
import { Link, useNavigate } from "react-router";

import { createGroup } from "../api";
import { Brand } from "../components/Brand";
import { Icon } from "../components/Icon";
import {
  saveDisplayName,
  getRecentGroups,
  forgetGroup,
  recentGroupUrl,
  rememberGroup,
} from "../storage";

function CreateGroupPage() {
  const navigate = useNavigate();
  const [recentGroups, setRecentGroups] = useState(getRecentGroups);
  const [showCreate, setShowCreate] = useState(recentGroups.length === 0);
  const [groupName, setGroupName] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError("");

    const trimmedGroupName = groupName.trim();
    const trimmedDisplayName = displayName.trim();

    if (!trimmedGroupName) {
      setError("グループ名を入力してください。");
      return;
    }

    if (!trimmedDisplayName) {
      setError("あなたの表示名を入力してください。");
      return;
    }

    try {
      setLoading(true);
      const result = await createGroup({
        groupName: trimmedGroupName,
        createdByDisplayName: trimmedDisplayName,
      });

      saveDisplayName(result.groupId, trimmedDisplayName);
      rememberGroup(result, result.accessToken);

      navigate(
        `/groups/${result.groupId}#token=${encodeURIComponent(
          result.accessToken,
        )}`,
      );
    } catch (caughtError) {
      console.error(caughtError);
      setError(
        "グループを作成できませんでした。通信環境を確認して、もう一度お試しください。",
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <main
      className={`create-page ${recentGroups.length ? "returning-page" : ""}`}
    >
      {recentGroups.length > 0 && (
        <section className="recent-shell">
          <header className="recent-header">
            <Brand />
            <button
              className={showCreate ? "text-button" : "primary-button"}
              type="button"
              onClick={() => setShowCreate((value) => !value)}
            >
              <Icon name={showCreate ? "close" : "plus"} />
              {showCreate ? "閉じる" : "グループを作る"}
            </button>
          </header>
          <h1>グループ</h1>

          <ul className="recent-list">
            {recentGroups.map((group) => (
              <li key={group.groupId}>
                <Link to={recentGroupUrl(group)}>
                  <span>{group.groupName}</span>
                  <Icon name="arrow-right" />
                </Link>
                <button
                  type="button"
                  className="icon-button recent-forget"
                  aria-label={`${group.groupName}をこの端末の履歴から外す`}
                  title="この端末の履歴から外す"
                  onClick={() => {
                    forgetGroup(group.groupId);
                    const remaining = getRecentGroups();
                    setRecentGroups(remaining);
                    if (!remaining.length) setShowCreate(true);
                  }}
                >
                  <Icon name="close" size={17} />
                </button>
              </li>
            ))}
          </ul>
        </section>
      )}
      {showCreate && (
        <div className="create-shell">
          <section className="create-intro">
            <Brand />
          </section>

          <section className="create-panel" aria-labelledby="create-heading">
            <div className="panel-heading">
              <h2 id="create-heading">新しいグループを作る</h2>
            </div>

            <form onSubmit={handleSubmit} className="create-form">
              <label className="field">
                <span>グループ名</span>
                <span className="input-edge">
                  <input
                    value={groupName}
                    onChange={(event) => setGroupName(event.target.value)}
                    placeholder="例：夏休みにやりたいこと"
                    maxLength={50}
                    autoComplete="off"
                  />
                </span>
              </label>

              <label className="field">
                <span>あなたの表示名</span>
                <span className="input-edge">
                  <input
                    value={displayName}
                    onChange={(event) => setDisplayName(event.target.value)}
                    placeholder="例：たけし"
                    maxLength={30}
                    autoComplete="nickname"
                  />
                </span>
              </label>

              {error && (
                <p className="form-error" role="alert">
                  {error}
                </p>
              )}

              <button
                type="submit"
                className="primary-button create-submit"
                disabled={loading}
              >
                <span>{loading ? "作成しています…" : "グループを作成"}</span>
                {!loading && <Icon name="arrow-right" />}
              </button>

              <p className="legal-consent">
                作成すると、
                <Link
                  to="/terms"
                  target="_blank"
                  rel="noreferrer"
                  aria-label="利用規約（新しいタブで開く）"
                >
                  利用規約
                </Link>
                と
                <Link
                  to="/privacy"
                  target="_blank"
                  rel="noreferrer"
                  aria-label="プライバシーポリシー（新しいタブで開く）"
                >
                  プライバシーポリシー
                </Link>
                に同意したものとみなします。
              </p>
            </form>
          </section>
        </div>
      )}
    </main>
  );
}

export default CreateGroupPage;
