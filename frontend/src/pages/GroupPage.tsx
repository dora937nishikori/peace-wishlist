import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type FormEvent,
} from "react";
import {
  useLocation,
  useNavigate,
  useParams,
} from "react-router";

import {
  createWishItem,
  deleteWishItem,
  getGroup,
  getWishItems,
  updateWishItem,
  type Group,
  type WishItem,
} from "../api";
import { Brand } from "../components/Brand";
import { Icon } from "../components/Icon";
import {
  getDisplayName,
  removeDisplayName,
  saveDisplayName,
} from "../storage";

type Notice = {
  message: string;
  tone: "success" | "error";
};

function GroupPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { groupId } = useParams();
  const accessToken = new URLSearchParams(
    location.hash.slice(1),
  ).get("token");
  const wasJustCreated = Boolean(
    (
      location.state as {
        groupCreated?: boolean;
      } | null
    )?.groupCreated,
  );

  const [group, setGroup] = useState<Group | null>(null);
  const [items, setItems] = useState<WishItem[]>([]);
  const [displayName, setDisplayName] = useState("");
  const [displayNameInput, setDisplayNameInput] =
    useState("");
  const [newItemContent, setNewItemContent] = useState("");
  const [editingItemId, setEditingItemId] = useState<
    string | null
  >(null);
  const [editingContent, setEditingContent] = useState("");
  const [confirmingItemId, setConfirmingItemId] = useState<
    string | null
  >(null);
  const [newItemId, setNewItemId] = useState<string | null>(
    null,
  );
  const [showCreatedGuide, setShowCreatedGuide] =
    useState(wasJustCreated);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [sharing, setSharing] = useState(false);
  const [updatingItemId, setUpdatingItemId] = useState<
    string | null
  >(null);
  const [deletingItemId, setDeletingItemId] = useState<
    string | null
  >(null);
  const [loadError, setLoadError] = useState("");
  const [formError, setFormError] = useState("");
  const [editError, setEditError] = useState("");
  const [notice, setNotice] = useState<Notice | null>(null);
  const [shareFallbackUrl, setShareFallbackUrl] = useState("");
  const noticeTimer = useRef<number | null>(null);
  const newItemInput = useRef<HTMLInputElement>(null);
  const deleteCancelButton = useRef<HTMLButtonElement>(null);
  const shareDialog = useRef<HTMLDialogElement>(null);
  const shareFallbackInput = useRef<HTMLInputElement>(null);
  const shareReturnFocus = useRef<HTMLElement | null>(null);
  const itemMenuSummaries = useRef(
    new Map<string, HTMLElement>(),
  );

  const announce = useCallback((nextNotice: Notice) => {
    if (noticeTimer.current) {
      window.clearTimeout(noticeTimer.current);
    }

    setNotice(nextNotice);
    noticeTimer.current = window.setTimeout(() => {
      setNotice(null);
    }, 3600);
  }, []);

  useEffect(
    () => () => {
      if (noticeTimer.current) {
        window.clearTimeout(noticeTimer.current);
      }
    },
    [],
  );

  useEffect(() => {
    const dialog = shareDialog.current;
    if (!shareFallbackUrl || !dialog || dialog.open) return;

    dialog.showModal();
    window.requestAnimationFrame(() => {
      shareFallbackInput.current?.focus();
      shareFallbackInput.current?.select();
    });
  }, [shareFallbackUrl]);

  const loadData = useCallback(async () => {
    if (!groupId || !accessToken) {
      setLoadError(
        "共有URLが正しくありません。送られてきたURLをもう一度開いてください。",
      );
      setLoading(false);
      return;
    }

    try {
      setLoadError("");
      const [groupResult, itemResult] = await Promise.all([
        getGroup(groupId, accessToken),
        getWishItems(groupId, accessToken),
      ]);

      setGroup(groupResult);
      setItems(itemResult);

      const savedName = getDisplayName(groupId);
      if (savedName) {
        setDisplayName(savedName);
      }
    } catch (caughtError) {
      console.error(caughtError);
      setLoadError(
        "グループを開けませんでした。URLと通信環境を確認して、もう一度お試しください。",
      );
    } finally {
      setLoading(false);
    }
  }, [accessToken, groupId]);

  useEffect(() => {
    void loadData();
  }, [loadData]);

  const handleSaveDisplayName = (
    event: FormEvent<HTMLFormElement>,
  ) => {
    event.preventDefault();
    const name = displayNameInput.trim();

    if (!groupId || !name) {
      setFormError("表示名を入力してください。");
      return;
    }

    saveDisplayName(groupId, name);
    setDisplayName(name);
    setDisplayNameInput("");
    setFormError("");
  };

  const handleChangeDisplayName = () => {
    if (!groupId) return;
    removeDisplayName(groupId);
    setDisplayNameInput(displayName);
    setDisplayName("");
    setFormError("");
  };

  const handleCreateItem = async (
    event: FormEvent<HTMLFormElement>,
  ) => {
    event.preventDefault();
    const content = newItemContent.trim();

    if (!groupId || !accessToken || !displayName) return;
    if (!content) {
      setFormError("やりたいことを入力してください。");
      newItemInput.current?.focus();
      return;
    }

    try {
      setCreating(true);
      setFormError("");
      const item = await createWishItem(
        groupId,
        accessToken,
        { content, displayName },
      );

      setItems((currentItems) => [item, ...currentItems]);
      setNewItemContent("");
      setNewItemId(item.itemId);
      window.setTimeout(() => setNewItemId(null), 1100);
      announce({
        message: "リストに追加しました。",
        tone: "success",
      });
    } catch (caughtError) {
      console.error(caughtError);
      setFormError(
        "追加できませんでした。通信環境を確認して、もう一度お試しください。",
      );
    } finally {
      setCreating(false);
    }
  };

  const startEditing = (item: WishItem) => {
    setEditingItemId(item.itemId);
    setEditingContent(item.content);
    setConfirmingItemId(null);
    setFormError("");
    setEditError("");
  };

  const cancelEditing = (itemId?: string) => {
    setEditingItemId(null);
    setEditingContent("");
    setEditError("");

    if (itemId) {
      window.requestAnimationFrame(() => {
        itemMenuSummaries.current.get(itemId)?.focus();
      });
    }
  };

  const handleUpdateItem = async (itemId: string) => {
    const content = editingContent.trim();
    if (!groupId || !accessToken || !displayName) return;
    if (!content) {
      setEditError("やりたいことを入力してください。");
      return;
    }

    try {
      setUpdatingItemId(itemId);
      setEditError("");
      const updatedItem = await updateWishItem(
        groupId,
        itemId,
        accessToken,
        { content, displayName },
      );

      setItems((currentItems) =>
        currentItems.map((item) =>
          item.itemId === itemId ? updatedItem : item,
        ),
      );
      cancelEditing();
      announce({ message: "更新しました。", tone: "success" });
    } catch (caughtError) {
      console.error(caughtError);
      setEditError(
        "更新できませんでした。時間をおいて、もう一度お試しください。",
      );
    } finally {
      setUpdatingItemId(null);
    }
  };

  const handleDeleteItem = async (itemId: string) => {
    if (!groupId || !accessToken) return;

    try {
      setDeletingItemId(itemId);
      setFormError("");
      await deleteWishItem(groupId, itemId, accessToken);
      setItems((currentItems) =>
        currentItems.filter((item) => item.itemId !== itemId),
      );
      setConfirmingItemId(null);
      announce({ message: "削除しました。", tone: "success" });
    } catch (caughtError) {
      console.error(caughtError);
      announce({
        message: "削除できませんでした。もう一度お試しください。",
        tone: "error",
      });
    } finally {
      setDeletingItemId(null);
    }
  };

  const copyShareUrl = async (): Promise<boolean> => {
    const shareUrl = window.location.href;
    if (navigator.clipboard?.writeText) {
      try {
        await navigator.clipboard.writeText(shareUrl);
        return true;
      } catch (caughtError) {
        console.warn("Clipboard API was unavailable", caughtError);
      }
    }

    const textArea = document.createElement("textarea");
    textArea.value = shareUrl;
    textArea.style.position = "fixed";
    textArea.style.opacity = "0";
    document.body.appendChild(textArea);
    textArea.select();
    try {
      return document.execCommand("copy");
    } catch (caughtError) {
      console.warn("Legacy copy was unavailable", caughtError);
      return false;
    } finally {
      textArea.remove();
    }
  };

  const handleShare = async () => {
    if (!group) return;

    try {
      if (document.activeElement instanceof HTMLElement) {
        shareReturnFocus.current = document.activeElement;
      }
      setSharing(true);
      setShareFallbackUrl("");
      if (navigator.share) {
        try {
          await navigator.share({
            title: group.groupName,
            text: `「${group.groupName}」のやりたいことリストに参加しよう`,
            url: window.location.href,
          });
          announce({ message: "共有しました。", tone: "success" });
          setShowCreatedGuide(false);
          return;
        } catch (caughtError) {
          if (
            caughtError instanceof DOMException &&
            caughtError.name === "AbortError"
          ) {
            return;
          }
          console.warn("Native share was unavailable", caughtError);
        }
      }

      const copied = await copyShareUrl();
      if (copied) {
        announce({
          message: "共有URLをコピーしました。LINEに貼り付けて送れます。",
          tone: "success",
        });
      } else {
        setShareFallbackUrl(window.location.href);
        announce({
          message: "URLを長押ししてコピーしてください。",
          tone: "error",
        });
      }
      setShowCreatedGuide(false);
    } catch (caughtError) {
      console.error(caughtError);
      setShareFallbackUrl(window.location.href);
      announce({
        message: "URLを長押ししてコピーしてください。",
        tone: "error",
      });
    } finally {
      setSharing(false);
    }
  };

  const closeShareFallback = () => {
    if (shareDialog.current?.open) {
      shareDialog.current.close();
    }
    setShareFallbackUrl("");
    window.requestAnimationFrame(() => {
      shareReturnFocus.current?.focus();
    });
  };

  if (loading) {
    return (
      <main className="group-page">
        <header className="group-topbar">
          <div className="group-topbar-inner">
            <Brand compact />
            <span className="skeleton skeleton-button" />
          </div>
        </header>
        <div className="group-shell" aria-busy="true">
          <div className="skeleton skeleton-title" />
          <div className="skeleton skeleton-subtitle" />
          <div className="skeleton skeleton-form" />
          <div className="skeleton skeleton-row" />
          <div className="skeleton skeleton-row skeleton-row-short" />
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
          <h1>グループを開けませんでした</h1>
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
            onClick={() => navigate("/")}
          >
            新しいグループを作る
          </button>
        </section>
      </main>
    );
  }

  if (!displayName) {
    return (
      <main className="join-page">
        <div className="join-shell">
          <Brand />
          <section className="join-panel">
            <p className="join-inviter">
              {group.createdByDisplayName}さんから届きました
            </p>
            <h1>{group.groupName}</h1>
            <p className="join-description">
              表示名を入れると、みんなのやりたいことを見たり追加したりできます。
            </p>

            <form
              onSubmit={handleSaveDisplayName}
              className="join-form"
            >
              <label className="field">
                <span>あなたの表示名</span>
                <span className="field-hint">
                  このグループ内で表示されます
                </span>
                <span className="input-edge">
                  <input
                    id="join-display-name"
                    value={displayNameInput}
                    onChange={(event) => {
                      setDisplayNameInput(event.target.value);
                      if (formError) setFormError("");
                    }}
                    placeholder="例：あおい"
                    maxLength={30}
                    autoComplete="nickname"
                    aria-invalid={Boolean(formError)}
                    aria-describedby={
                      formError ? "join-name-error" : undefined
                    }
                  />
                </span>
              </label>

              {formError && (
                <p
                  id="join-name-error"
                  className="form-error"
                  role="alert"
                >
                  {formError}
                </p>
              )}

              <button type="submit" className="primary-button">
                リストに参加する
                <Icon name="arrow-right" />
              </button>
            </form>
          </section>
          <p className="join-note">
            アカウント登録はありません。表示名はこの端末にだけ保存されます。
          </p>
        </div>
      </main>
    );
  }

  return (
    <main className="group-page">
      <header className="group-topbar">
        <div className="group-topbar-inner">
          <button
            type="button"
            className="brand-button"
            onClick={() => navigate("/")}
            aria-label="新しいグループを作る"
          >
            <Brand compact />
          </button>

          <div className="topbar-actions">
            <button
              type="button"
              className="share-button"
              onClick={() => void handleShare()}
              disabled={sharing}
            >
              <Icon name="share" />
              <span>{sharing ? "共有中…" : "共有"}</span>
            </button>

            <details className="profile-menu">
              <summary aria-label="メニューを開く">
                <span aria-hidden="true">
                  {displayName.slice(0, 1)}
                </span>
              </summary>
              <div className="menu-popover profile-popover">
                <p>
                  <span>表示名</span>
                  <strong>{displayName}</strong>
                </p>
                <button
                  type="button"
                  onClick={handleChangeDisplayName}
                >
                  表示名を変更
                </button>
                <button
                  type="button"
                  onClick={() => navigate("/")}
                >
                  新しいグループを作る
                </button>
              </div>
            </details>
          </div>
        </div>
      </header>

      <div className="group-shell">
        <section className="group-heading">
          <div>
            <h1>{group.groupName}</h1>
            <p>{items.length}件のやりたいこと</p>
          </div>
        </section>

        {showCreatedGuide && (
          <section className="creation-guide" aria-label="次のステップ">
            <div>
              <strong>グループができました</strong>
              <p>まずURLをLINEで送りましょう。</p>
            </div>
            <button
              type="button"
              className="secondary-button"
              onClick={() => void handleShare()}
              disabled={sharing}
            >
              <Icon name="share" />
              LINEなどで共有
            </button>
            <button
              type="button"
              className="icon-button guide-close"
              onClick={() => setShowCreatedGuide(false)}
              aria-label="案内を閉じる"
            >
              <Icon name="close" />
            </button>
          </section>
        )}

        <form
          className="quick-add"
          onSubmit={handleCreateItem}
        >
          <label htmlFor="new-wish">やりたいことを追加</label>
          <div className="quick-add-row">
            <span className="input-edge">
              <input
                ref={newItemInput}
                id="new-wish"
                value={newItemContent}
                onChange={(event) => {
                  setNewItemContent(event.target.value);
                  if (formError) setFormError("");
                }}
                placeholder="例：海が見える場所でキャンプ"
                maxLength={200}
                autoComplete="off"
                aria-invalid={Boolean(formError)}
                aria-describedby={
                  formError ? "new-wish-error" : undefined
                }
              />
            </span>
            <button
              type="submit"
              className="primary-button add-button"
              disabled={creating}
            >
              {creating ? "追加中…" : "追加する"}
            </button>
          </div>
          {formError && (
            <p
              id="new-wish-error"
              className="form-error"
              role="alert"
            >
              {formError}
            </p>
          )}
        </form>

        <section
          className="wishlist"
          aria-labelledby="wishlist-heading"
        >
          <div className="list-heading">
            <h2 id="wishlist-heading">みんなのリスト</h2>
            <span>{items.length}</span>
          </div>

          {items.length === 0 ? (
            <div className="empty-state">
              <span className="empty-mark" aria-hidden="true">
                <span />
              </span>
              <h3>まだ何もありません</h3>
              <p>
                思いついたことをひとつ入れると、みんなも続けやすくなります。
              </p>
              <button
                type="button"
                className="secondary-button"
                onClick={() => newItemInput.current?.focus()}
              >
                最初のひとつを追加
              </button>
            </div>
          ) : (
            <ul className="wish-list">
              {items.map((item) => (
                <li
                  key={item.itemId}
                  className={
                    item.itemId === newItemId
                      ? "wish-row is-new"
                      : "wish-row"
                  }
                >
                  {editingItemId === item.itemId ? (
                    <div className="inline-editor">
                      <label
                        htmlFor={`edit-${item.itemId}`}
                        className="sr-only"
                      >
                        やりたいことを編集
                      </label>
                      <span className="input-edge">
                        <input
                          id={`edit-${item.itemId}`}
                          value={editingContent}
                          onChange={(event) => {
                            setEditingContent(event.target.value);
                            if (editError) setEditError("");
                          }}
                          maxLength={200}
                          autoFocus
                          aria-invalid={Boolean(editError)}
                          aria-describedby={
                            editError
                              ? `edit-error-${item.itemId}`
                              : undefined
                          }
                        />
                      </span>
                      {editError && (
                        <p
                          id={`edit-error-${item.itemId}`}
                          className="form-error edit-error"
                          role="alert"
                        >
                          {editError}
                        </p>
                      )}
                      <div className="inline-actions">
                        <button
                          type="button"
                          className="text-button"
                          onClick={() => cancelEditing(item.itemId)}
                        >
                          キャンセル
                        </button>
                        <button
                          type="button"
                          className="secondary-button"
                          onClick={() =>
                            void handleUpdateItem(item.itemId)
                          }
                          disabled={updatingItemId === item.itemId}
                        >
                          {updatingItemId === item.itemId
                            ? "保存中…"
                            : "保存"}
                        </button>
                      </div>
                    </div>
                  ) : confirmingItemId === item.itemId ? (
                    <div className="delete-confirmation">
                      <div>
                        <strong>この項目を削除しますか？</strong>
                        <p>削除すると元に戻せません。</p>
                      </div>
                      <div className="inline-actions">
                        <button
                          ref={deleteCancelButton}
                          type="button"
                          className="text-button"
                          onClick={() => {
                            setConfirmingItemId(null);
                            window.requestAnimationFrame(() => {
                              itemMenuSummaries.current
                                .get(item.itemId)
                                ?.focus();
                            });
                          }}
                        >
                          やめる
                        </button>
                        <button
                          type="button"
                          className="danger-button"
                          onClick={() =>
                            void handleDeleteItem(item.itemId)
                          }
                          disabled={deletingItemId === item.itemId}
                        >
                          <Icon name="trash" />
                          {deletingItemId === item.itemId
                            ? "削除中…"
                            : "削除"}
                        </button>
                      </div>
                    </div>
                  ) : (
                    <>
                      <div className="wish-content">
                        <p>{item.content}</p>
                        <span>
                          {item.updatedByDisplayName ||
                            item.createdByDisplayName}
                          さん
                        </span>
                      </div>

                      <details className="item-menu">
                        <summary
                          ref={(element) => {
                            if (element) {
                              itemMenuSummaries.current.set(
                                item.itemId,
                                element,
                              );
                            } else {
                              itemMenuSummaries.current.delete(
                                item.itemId,
                              );
                            }
                          }}
                          aria-label={`${item.content}のメニュー`}
                        >
                          <Icon name="more" />
                        </summary>
                        <div className="menu-popover item-popover">
                          <button
                            type="button"
                            onClick={() => startEditing(item)}
                          >
                            <Icon name="edit" />
                            編集
                          </button>
                          <button
                            type="button"
                            className="menu-danger"
                            onClick={() => {
                              setConfirmingItemId(item.itemId);
                              setEditingItemId(null);
                              setEditError("");
                              window.requestAnimationFrame(() => {
                                deleteCancelButton.current?.focus();
                              });
                            }}
                          >
                            <Icon name="trash" />
                            削除
                          </button>
                        </div>
                      </details>
                    </>
                  )}
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>

      {notice && (
        <div
          className={`notice notice-${notice.tone}`}
          role="status"
          aria-live="polite"
        >
          {notice.message}
        </div>
      )}

      {shareFallbackUrl && (
        <dialog
          ref={shareDialog}
          className="share-fallback"
          aria-labelledby="share-fallback-heading"
          onCancel={(event) => {
            event.preventDefault();
            closeShareFallback();
          }}
        >
          <button
            type="button"
            className="icon-button share-fallback-close"
            onClick={closeShareFallback}
            aria-label="共有URLを閉じる"
          >
            <Icon name="close" />
          </button>
          <h2 id="share-fallback-heading">
            URLをコピーしてください
          </h2>
          <p>
            下のURLを長押ししてコピーし、LINEに貼り付けて送れます。
          </p>
          <input
            ref={shareFallbackInput}
            value={shareFallbackUrl}
            readOnly
            onFocus={(event) => event.currentTarget.select()}
            aria-label="共有URL"
          />
          <button
            type="button"
            className="secondary-button"
            onClick={closeShareFallback}
          >
            閉じる
          </button>
        </dialog>
      )}
    </main>
  );
}

export default GroupPage;
