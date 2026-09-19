import {
  useState,
  type FormEvent,
} from "react";
import { useNavigate } from "react-router";

import { createGroup } from "../api";
import { Brand } from "../components/Brand";
import { Icon } from "../components/Icon";
import { saveDisplayName } from "../storage";

function CreateGroupPage() {
  const navigate = useNavigate();
  const [groupName, setGroupName] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (
    event: FormEvent<HTMLFormElement>,
  ) => {
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

      saveDisplayName(
        result.groupId,
        trimmedDisplayName,
      );

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
    <main className="create-page">
      <div className="create-shell">
        <section className="create-intro">
          <Brand />

          <div className="create-copy">
            <h1>
              それ、しよう！を
              <br />
              みんなのリストに。
            </h1>
          </div>

          <ul className="create-benefits">
            <li>アカウント登録なし</li>
            <li>共有URLを送るだけ</li>
          </ul>
        </section>

        <section
          className="create-panel"
          aria-labelledby="create-heading"
        >
          <div className="panel-heading">
            <h2 id="create-heading">
              新しいグループを作る
            </h2>
          </div>

          <form
            onSubmit={handleSubmit}
            className="create-form"
          >
            <label className="field">
              <span>グループ名</span>
              <span className="input-edge">
                <input
                  value={groupName}
                  onChange={(event) =>
                    setGroupName(event.target.value)
                  }
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
                  onChange={(event) =>
                    setDisplayName(event.target.value)
                  }
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
              <span>
                {loading
                  ? "作成しています…"
                  : "グループを作成"}
              </span>
              {!loading && <Icon name="arrow-right" />}
            </button>
          </form>

          <p className="privacy-note">
            共有URLを知っている人は、リストの追加・編集ができます。
          </p>
        </section>
      </div>
    </main>
  );
}

export default CreateGroupPage;
