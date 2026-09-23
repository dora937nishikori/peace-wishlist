import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type FormEvent,
} from "react";
import {
  useBlocker,
  useLocation,
  useNavigate,
  useParams,
} from "react-router";

import {
  createWishItem,
  deleteWishItem,
  getGroup,
  getWishItem,
  updateWishItem,
  type Group,
} from "../api";
import { Brand } from "../components/Brand";
import { Icon } from "../components/Icon";
import { getDisplayName } from "../storage";

type ItemFields = {
  content: string;
  comment: string;
  url: string;
};

const EMPTY_FIELDS: ItemFields = {
  content: "",
  comment: "",
  url: "",
};

function WishItemPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { groupId, itemId } = useParams();
  const isNew = itemId === "new";
  const accessToken = new URLSearchParams(
    location.hash.slice(1),
  ).get("token");
  const displayName = groupId
    ? getDisplayName(groupId)
    : null;

  const [group, setGroup] = useState<Group | null>(null);
  const [fields, setFields] = useState<ItemFields>(EMPTY_FIELDS);
  const [initialFields, setInitialFields] =
    useState<ItemFields>(EMPTY_FIELDS);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [confirmingDelete, setConfirmingDelete] = useState(false);
  const [urlEditing, setUrlEditing] = useState(isNew);
  const [loadError, setLoadError] = useState("");
  const [formError, setFormError] = useState("");
  const [notice, setNotice] = useState("");
  const skipBlock = useRef(false);
  const contentInput = useRef<HTMLInputElement>(null);
  const deleteCancelButton = useRef<HTMLButtonElement>(null);

  const isDirty =
    fields.content !== initialFields.content ||
    fields.comment !== initialFields.comment ||
    fields.url !== initialFields.url;

  const blocker = useBlocker(
    () => isDirty && !skipBlock.current,
  );

  useEffect(() => {
    if (blocker.state !== "blocked") return;

    const shouldLeave = window.confirm(
      "変更が保存されていません。破棄して一覧へ戻りますか？",
    );

    if (shouldLeave) {
      blocker.proceed();
    } else {
      blocker.reset();
    }
  }, [blocker]);

  useEffect(() => {
    const handleBeforeUnload = (event: BeforeUnloadEvent) => {
      if (!isDirty || skipBlock.current) return;
      event.preventDefault();
    };

    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => {
      window.removeEventListener(
        "beforeunload",
        handleBeforeUnload,
      );
    };
  }, [isDirty]);

  const loadData = useCallback(async () => {
    if (!groupId || !itemId || !accessToken) {
      setLoadError(
        "共有URLが正しくありません。リストからもう一度開いてください。",
      );
      setLoading(false);
      return;
    }

    if (!displayName) {
      skipBlock.current = true;
      navigate(`/groups/${groupId}${location.hash}`, {
        replace: true,
      });
      return;
    }

    try {
      setLoadError("");
      const [groupResult, itemResult] = await Promise.all([
        getGroup(groupId, accessToken),
        isNew
          ? Promise.resolve(null)
          : getWishItem(groupId, itemId, accessToken),
      ]);

      setGroup(groupResult);

      if (itemResult) {
        const loadedFields = {
          content: itemResult.content,
          comment: itemResult.comment ?? "",
          url: itemResult.url ?? "",
        };
        setFields(loadedFields);
        setInitialFields(loadedFields);
        setUrlEditing(!loadedFields.url);
      }
    } catch (caughtError) {
      console.error(caughtError);
      setLoadError(
        "やりたいことを開けませんでした。通信環境を確認して、もう一度お試しください。",
      );
    } finally {
      setLoading(false);
    }
  }, [
    accessToken,
    displayName,
    groupId,
    isNew,
    itemId,
    location.hash,
    navigate,
  ]);

  useEffect(() => {
    void loadData();
  }, [loadData]);

  useEffect(() => {
    const state = location.state as {
      itemCreated?: boolean;
    } | null;
    if (!state?.itemCreated || loading) return;

    setNotice("リストに追加しました。");
    navigate(`${location.pathname}${location.hash}`, {
      replace: true,
      state: null,
    });
  }, [
    loading,
    location.hash,
    location.pathname,
    location.state,
    navigate,
  ]);

  useEffect(() => {
    if (!notice) return;
    const timer = window.setTimeout(() => setNotice(""), 3600);
    return () => window.clearTimeout(timer);
  }, [notice]);

  const listUrl = groupId
    ? `/groups/${encodeURIComponent(groupId)}${location.hash}`
    : "/";

  const handleSubmit = async (
    event: FormEvent<HTMLFormElement>,
  ) => {
    event.preventDefault();
    const content = fields.content.trim();

    if (!content) {
      setFormError("やりたいことを入力してください。");
      contentInput.current?.focus();
      return;
    }

    if (
      !groupId ||
      !itemId ||
      !accessToken ||
      !displayName
    ) {
      return;
    }

    try {
      setSaving(true);
      setFormError("");
      const savedItem = isNew
        ? await createWishItem(groupId, accessToken, {
            ...fields,
            displayName,
          })
        : await updateWishItem(
            groupId,
            itemId,
            accessToken,
            {
              ...fields,
              displayName,
            },
          );

      const savedFields = {
        content: savedItem.content,
        comment: savedItem.comment ?? "",
        url: savedItem.url ?? "",
      };
      setFields(savedFields);
      setInitialFields(savedFields);
      setUrlEditing(!savedFields.url);

      if (isNew) {
        skipBlock.current = true;
        navigate(
          `/groups/${encodeURIComponent(groupId)}/items/${encodeURIComponent(savedItem.itemId)}${location.hash}`,
          {
            replace: true,
            state: { itemCreated: true },
          },
        );
      } else {
        setNotice("保存しました。");
      }
    } catch (caughtError) {
      console.error(caughtError);
      setFormError(
        caughtError instanceof Error &&
          !caughtError.message.startsWith("HTTPエラー")
          ? caughtError.message
          : "保存できませんでした。通信環境を確認して、もう一度お試しください。",
      );
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (
      !groupId ||
      !itemId ||
      !accessToken ||
      isNew
    ) {
      return;
    }

    try {
      setDeleting(true);
      setFormError("");
      await deleteWishItem(groupId, itemId, accessToken);
      skipBlock.current = true;
      navigate(listUrl, {
        replace: true,
        state: { itemDeleted: true },
      });
    } catch (caughtError) {
      console.error(caughtError);
      setConfirmingDelete(false);
      setFormError(
        "削除できませんでした。通信環境を確認して、もう一度お試しください。",
      );
    } finally {
      setDeleting(false);
    }
  };

  if (loading) {
    return (
      <main className="item-page" aria-busy="true">
        <header className="group-topbar">
          <div className="group-topbar-inner">
            <Brand compact />
          </div>
        </header>
        <div className="item-shell">
          <div className="skeleton skeleton-title" />
          <div className="skeleton skeleton-form" />
          <span className="sr-only">読み込んでいます</span>
        </div>
      </main>
    );
  }

  if (loadError || !group) {
    return (
      <main className="state-page">
        <section className="state-panel">
          <Brand />
          <h1>詳細を開けませんでした</h1>
          <p>{loadError}</p>
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
            onClick={() => navigate(listUrl)}
          >
            一覧へ戻る
          </button>
        </section>
      </main>
    );
  }

  return (
    <main className="item-page">
      <header className="group-topbar">
        <div className="group-topbar-inner item-topbar-inner">
          <button
            type="button"
            className="back-button"
            onClick={() => navigate(listUrl)}
          >
            <Icon name="arrow-left" />
            <span>一覧へ戻る</span>
          </button>
          <Brand compact />
        </div>
      </header>

      <div className="item-shell">
        {!isNew && (
          <header className="item-heading">
            <h1
              className={
                initialFields.content.length > 30
                  ? "item-heading-title-long"
                  : undefined
              }
            >
              {initialFields.content || fields.content}
            </h1>
          </header>
        )}

        <form className="item-form" onSubmit={handleSubmit}>
          <label className="field item-field">
            <span>やりたいこと</span>
            <span className="input-edge">
              <input
                ref={contentInput}
                value={fields.content}
                onChange={(event) => {
                  setFields((current) => ({
                    ...current,
                    content: event.target.value,
                  }));
                  if (formError) setFormError("");
                }}
                placeholder="例：海が見える場所でキャンプ"
                maxLength={200}
                autoComplete="off"
                aria-invalid={Boolean(formError)}
              />
            </span>
            {fields.content.length >= 160 && (
              <span className="field-count">
                {fields.content.length}/200
              </span>
            )}
          </label>

          <label className="field item-field">
            <span>
              コメント
              <span className="optional-label">任意</span>
            </span>
            <span className="input-edge textarea-edge">
              <textarea
                value={fields.comment}
                onChange={(event) => {
                  setFields((current) => ({
                    ...current,
                    comment: event.target.value,
                  }));
                  if (formError) setFormError("");
                }}
                placeholder="行きたい時期や、気になっていることなど"
                maxLength={1000}
                rows={7}
                aria-invalid={Boolean(formError)}
              />
            </span>
            {fields.comment.length >= 800 && (
              <span className="field-count">
                {fields.comment.length}/1,000
              </span>
            )}
          </label>

          <div className="field item-field">
            <span>
              URL
              <span className="optional-label">任意</span>
            </span>

            {urlEditing || !fields.url ? (
              <div className="url-editor">
                <span className="input-edge">
                  <input
                    value={fields.url}
                    onChange={(event) => {
                      setFields((current) => ({
                        ...current,
                        url: event.target.value,
                      }));
                      if (formError) setFormError("");
                    }}
                    placeholder="example.com"
                    maxLength={2048}
                    inputMode="url"
                    autoComplete="url"
                    aria-label="URL"
                    aria-invalid={Boolean(formError)}
                  />
                </span>
                {!isNew && Boolean(initialFields.url) && (
                  <button
                    type="button"
                    className="text-button url-cancel"
                    onClick={() => {
                      setFields((current) => ({
                        ...current,
                        url: initialFields.url,
                      }));
                      setUrlEditing(false);
                    }}
                  >
                    入力をやめる
                  </button>
                )}
              </div>
            ) : (
              <div className="url-display">
                <a
                  href={fields.url}
                  target="_blank"
                  rel="noreferrer"
                >
                  {fields.url}
                </a>
                <button
                  type="button"
                  className="icon-button url-edit-button"
                  onClick={() => setUrlEditing(true)}
                  aria-label="URLを編集"
                >
                  <Icon name="edit" />
                </button>
              </div>
            )}
          </div>

          {formError && (
            <p className="form-error item-form-error" role="alert">
              {formError}
            </p>
          )}

          <div className="item-save-actions">
            <button
              type="submit"
              className="primary-button"
              disabled={saving || (!isNew && !isDirty)}
            >
              {saving
                ? isNew
                  ? "追加中…"
                  : "保存中…"
                : isNew
                  ? "追加する"
                  : "保存する"}
            </button>
          </div>
        </form>

        {!isNew && (
          <section className="item-danger-zone">
            {confirmingDelete ? (
              <div className="item-delete-confirmation">
                <div>
                  <strong>この項目を削除しますか？</strong>
                  <p>削除すると元に戻せません。</p>
                </div>
                <div className="inline-actions">
                  <button
                    ref={deleteCancelButton}
                    type="button"
                    className="text-button"
                    onClick={() => setConfirmingDelete(false)}
                  >
                    やめる
                  </button>
                  <button
                    type="button"
                    className="danger-button"
                    onClick={() => void handleDelete()}
                    disabled={deleting}
                  >
                    <Icon name="trash" />
                    {deleting ? "削除中…" : "削除する"}
                  </button>
                </div>
              </div>
            ) : (
              <button
                type="button"
                className="text-button item-delete-button"
                onClick={() => {
                  setConfirmingDelete(true);
                  window.requestAnimationFrame(() => {
                    deleteCancelButton.current?.focus();
                  });
                }}
              >
                <Icon name="trash" />
                この項目を削除
              </button>
            )}
          </section>
        )}
      </div>

      {notice && (
        <div
          className="notice notice-success"
          role="status"
          aria-live="polite"
        >
          {notice}
        </div>
      )}
    </main>
  );
}

export default WishItemPage;
