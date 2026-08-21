import {
  useState,
  type FormEvent,
} from "react";

import {
  useNavigate,
} from "react-router";

import {
  createGroup,
} from "../api";

import {
  saveDisplayName,
} from "../storage";

function CreateGroupPage() {
  const navigate = useNavigate();

  const [
    groupName,
    setGroupName,
  ] = useState("");

  const [
    displayName,
    setDisplayName,
  ] = useState("");

  const [
    error,
    setError,
  ] = useState("");

  const [
    loading,
    setLoading,
  ] = useState(false);

  const handleSubmit =
    async (
      event:
        FormEvent<HTMLFormElement>,
    ) => {
      event.preventDefault();

      setError("");

      const trimmedGroupName =
        groupName.trim();

      const trimmedDisplayName =
        displayName.trim();

      if (!trimmedGroupName) {
        setError(
          "グループ名を入力してください",
        );
        return;
      }

      if (!trimmedDisplayName) {
        setError(
          "表示名を入力してください",
        );
        return;
      }

      try {
        setLoading(true);

        const result =
          await createGroup({
            groupName:
              trimmedGroupName,

            createdByDisplayName:
              trimmedDisplayName,
          });

        saveDisplayName(
          result.groupId,
          trimmedDisplayName,
        );

        const path =
          `/groups/${result.groupId}` +
          `#token=${encodeURIComponent(
            result.accessToken,
          )}`;

        navigate(path);
      } catch (error) {
        console.error(error);

        setError(
          error instanceof Error
            ? error.message
            : "グループの作成に失敗しました",
        );
      } finally {
        setLoading(false);
      }
    };

  return (
    <main className="page">
      <section className="card create-card">
        <div className="brand">
          Peace Wishlist
        </div>

        <h1>
          みんなの「やりたい」を
          <br />
          忘れないために。
        </h1>

        <p className="description">
          アカウント登録なしで、
          友達や家族とやりたいことを
          共有できます。
        </p>

        <form
          onSubmit={handleSubmit}
          className="form"
        >
          <label className="field">
            <span>
              グループ名
            </span>

            <input
              value={groupName}
              onChange={(event) =>
                setGroupName(
                  event.target.value,
                )
              }
              placeholder="例：夏休みにやりたいこと"
              maxLength={50}
            />
          </label>

          <label className="field">
            <span>
              あなたの表示名
            </span>

            <input
              value={displayName}
              onChange={(event) =>
                setDisplayName(
                  event.target.value,
                )
              }
              placeholder="例：こり"
              maxLength={30}
            />
          </label>

          {error && (
            <p className="error">
              {error}
            </p>
          )}

          <button
            type="submit"
            className="primary-button"
            disabled={loading}
          >
            {loading
              ? "作成中..."
              : "グループを作成"}
          </button>
        </form>

        <p className="hint">
          作成後に表示されるURLを
          共有するだけで参加できます。
        </p>
      </section>
    </main>
  );
}

export default CreateGroupPage;