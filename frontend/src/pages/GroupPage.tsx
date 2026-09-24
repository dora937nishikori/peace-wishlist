import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type FormEvent,
} from "react";
import {
  Link,
  useLocation,
  useNavigate,
  useParams,
} from "react-router";

import {
  getGroup,
  getWishItems,
  type Group,
  type WishItemSummary,
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

type GroupLocationState = {
  itemDeleted?: boolean;
} | null;

function GroupPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { groupId } = useParams();
  const accessToken = new URLSearchParams(
    location.hash.slice(1),
  ).get("token");
  const locationState =
    location.state as GroupLocationState;

  const [group, setGroup] = useState<Group | null>(null);
  const [items, setItems] = useState<WishItemSummary[]>([]);
  const [displayName, setDisplayName] = useState("");
  const [displayNameInput, setDisplayNameInput] =
    useState("");
  const [loading, setLoading] = useState(true);
  const [sharing, setSharing] = useState(false);
  const [loadError, setLoadError] = useState("");
  const [joinError, setJoinError] = useState("");
  const [notice, setNotice] = useState<Notice | null>(null);
  const [shareFallbackUrl, setShareFallbackUrl] = useState("");
  const noticeTimer = useRef<number | null>(null);
  const shareDialog = useRef<HTMLDialogElement>(null);
  const shareFallbackInput = useRef<HTMLInputElement>(null);
  const shareReturnFocus = useRef<HTMLElement | null>(null);
  const groupPage = useRef<HTMLElement>(null);

  const announce = useCallback((nextNotice: Notice) => {
    if (noticeTimer.current) {
      window.clearTimeout(noticeTimer.current);
    }

    setNotice(nextNotice);
    noticeTimer.current = window.setTimeout(() => {
      setNotice(null);
    }, 3600);
  }, []);

  useEffect(() => {
    if (!locationState?.itemDeleted) return;

    announce({
      message: "削除しました。",
      tone: "success",
    });
    navigate(`${location.pathname}${location.hash}`, {
      replace: true,
      state: null,
    });
  }, [
    announce,
    location.hash,
    location.pathname,
    locationState?.itemDeleted,
    navigate,
  ]);

  useEffect(
    () => () => {
      if (noticeTimer.current) {
        window.clearTimeout(noticeTimer.current);
      }
    },
    [],
  );

  useEffect(() => {
    const handlePointerDown = (event: PointerEvent) => {
      const page = groupPage.current;
      const target = event.target;
      if (!page || !(target instanceof Node)) return;

      page
        .querySelectorAll<HTMLDetailsElement>(
          "details.profile-menu[open]",
        )
        .forEach((menu) => {
          if (!menu.contains(target)) {
            menu.removeAttribute("open");
          }
        });
    };

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key !== "Escape") return;

      const openMenu = groupPage.current?.querySelector<
        HTMLDetailsElement
      >("details.profile-menu[open]");
      if (!openMenu) return;

      event.preventDefault();
      openMenu.removeAttribute("open");
      openMenu.querySelector<HTMLElement>("summary")?.focus();
    };

    document.addEventListener("pointerdown", handlePointerDown);
    document.addEventListener("keydown", handleKeyDown);

    return () => {
      document.removeEventListener(
        "pointerdown",
        handlePointerDown,
      );
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, []);

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
      setJoinError("表示名を入力してください。");
      return;
    }

    saveDisplayName(groupId, name);
    setDisplayName(name);
    setDisplayNameInput("");
    setJoinError("");
  };

  const handleChangeDisplayName = () => {
    if (!groupId) return;
    removeDisplayName(groupId);
    setDisplayNameInput(displayName);
    setDisplayName("");
    setJoinError("");
  };

  const openNewItem = () => {
    if (!groupId) return;
    navigate(
      `/groups/${encodeURIComponent(groupId)}/items/new${location.hash}`,
    );
  };

  const openItem = (itemId: string) => {
    if (!groupId) return;
    navigate(
      `/groups/${encodeURIComponent(groupId)}/items/${encodeURIComponent(itemId)}${location.hash}`,
    );
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
          message: "共有URLをコピーしました。",
          tone: "success",
        });
      } else {
        setShareFallbackUrl(window.location.href);
        announce({
          message: "URLを長押ししてコピーしてください。",
          tone: "error",
        });
      }
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
              {group.createdByDisplayName}から届きました
            </p>
            <h1>{group.groupName}</h1>

            <form
              onSubmit={handleSaveDisplayName}
              className="join-form"
            >
              <label className="field">
                <span>あなたの表示名</span>
                <span className="input-edge">
                  <input
                    id="join-display-name"
                    value={displayNameInput}
                    onChange={(event) => {
                      setDisplayNameInput(event.target.value);
                      if (joinError) setJoinError("");
                    }}
                    placeholder="例：あおい"
                    maxLength={30}
                    autoComplete="nickname"
                    aria-invalid={Boolean(joinError)}
                    aria-describedby={
                      joinError ? "join-name-error" : undefined
                    }
                  />
                </span>
              </label>

              {joinError && (
                <p
                  id="join-name-error"
                  className="form-error"
                  role="alert"
                >
                  {joinError}
                </p>
              )}

              <button type="submit" className="primary-button">
                リストに参加する
                <Icon name="arrow-right" />
              </button>

              <p className="legal-consent">
                参加すると、
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
          <p className="join-note">
            アカウント登録はありません。表示名はこの端末にだけ保存されます。
          </p>
        </div>
      </main>
    );
  }

  return (
    <main ref={groupPage} className="group-page">
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
              aria-label={sharing ? "共有中" : "グループを共有"}
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
          <h1>{group.groupName}</h1>
        </section>

        <section className="add-launch">
          <button
            type="button"
            className="primary-button add-launch-button"
            onClick={openNewItem}
          >
            <Icon name="plus" />
            追加
          </button>
        </section>

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
              <button
                type="button"
                className="secondary-button"
                onClick={openNewItem}
              >
                追加する
              </button>
            </div>
          ) : (
            <ul className="wish-list">
              {items.map((item) => (
                <li key={item.itemId} className="wish-row">
                  <button
                    type="button"
                    className="wish-link"
                    onClick={() => openItem(item.itemId)}
                    aria-label={`${item.content}の詳細を開く`}
                  >
                    <span className="wish-content">
                      <span className="wish-name">
                        {item.content}
                      </span>
                      <span className="wish-author">
                        {item.updatedByDisplayName ||
                          item.createdByDisplayName}
                      </span>
                    </span>
                    <Icon name="arrow-right" />
                  </button>
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
          <h2 id="share-fallback-heading">共有URL</h2>
          <p>
            下のURLを長押ししてコピーし、LINEなどに貼り付けてください。
          </p>
          <span className="input-edge">
            <input
              ref={shareFallbackInput}
              value={shareFallbackUrl}
              readOnly
              aria-label="共有URL"
              onFocus={(event) => event.currentTarget.select()}
            />
          </span>
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
