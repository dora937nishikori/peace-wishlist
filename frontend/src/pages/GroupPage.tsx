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
  useSearchParams,
} from "react-router";
import {
  getGroup,
  getWishItems,
  type Group,
  type WishItemSummary,
} from "../api";
import { Brand } from "../components/Brand";
import { Icon } from "../components/Icon";
import { PhotoImage } from "../components/PhotoImage";
import { getDisplayName, saveDisplayName, rememberGroup } from "../storage";

function GroupPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { groupId } = useParams();
  const [searchParams] = useSearchParams();
  const view = searchParams.get("view") === "memories" ? "memory" : "wish";
  const accessToken = new URLSearchParams(location.hash.slice(1)).get("token");
  const [group, setGroup] = useState<Group | null>(null);
  const [items, setItems] = useState<WishItemSummary[]>([]);
  const [displayName, setDisplayName] = useState("");
  const [nameInput, setNameInput] = useState("");
  const [changingName, setChangingName] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [joinError, setJoinError] = useState("");
  const [notice, setNotice] = useState("");
  const [sharing, setSharing] = useState(false);
  const [shareUrl, setShareUrl] = useState("");
  const dialog = useRef<HTMLDialogElement>(null);
  const shareButton = useRef<HTMLButtonElement>(null);

  const loadData = useCallback(async () => {
    if (!groupId || !accessToken) {
      setError("共有URLから、もう一度開いてください。");
      setLoading(false);
      return;
    }
    try {
      const [nextGroup, nextItems] = await Promise.all([
        getGroup(groupId, accessToken),
        getWishItems(groupId, accessToken),
      ]);
      setGroup(nextGroup);
      setItems(nextItems);
      setError("");
      const name = getDisplayName(groupId);
      if (name) {
        setDisplayName(name);
        rememberGroup(nextGroup, accessToken);
      }
    } catch {
      setError(
        "グループを開けませんでした。URLと通信環境を確認して、もう一度お試しください。",
      );
    } finally {
      setLoading(false);
    }
  }, [groupId, accessToken]);

  useEffect(() => {
    void loadData();
  }, [loadData]);
  useEffect(() => {
    const refresh = () => {
      if (document.visibilityState === "visible") void loadData();
    };
    document.addEventListener("visibilitychange", refresh);
    return () => document.removeEventListener("visibilitychange", refresh);
  }, [loadData]);
  useEffect(() => {
    if (!(location.state as { itemDeleted?: boolean } | null)?.itemDeleted)
      return;
    setNotice("削除しました。");
    navigate(`${location.pathname}${location.search}${location.hash}`, {
      replace: true,
      state: null,
    });
  }, [location, navigate]);
  useEffect(() => {
    if (!notice) return;
    const timer = window.setTimeout(() => setNotice(""), 4000);
    return () => window.clearTimeout(timer);
  }, [notice]);
  useEffect(() => {
    if (shareUrl && dialog.current && !dialog.current.open)
      dialog.current.showModal();
  }, [shareUrl]);

  function saveName(event: FormEvent) {
    event.preventDefault();
    if (!groupId || !group || !accessToken) return;
    if (!nameInput.trim()) {
      setJoinError("表示名を入力してください。");
      return;
    }
    saveDisplayName(groupId, nameInput.trim());
    rememberGroup(group, accessToken);
    setDisplayName(nameInput.trim());
    setChangingName(false);
    setJoinError("");
  }
  async function share() {
    if (!group || !groupId || !accessToken) return;
    const url = `${window.location.origin}/groups/${encodeURIComponent(groupId)}#token=${encodeURIComponent(accessToken)}`;
    setSharing(true);
    try {
      if (navigator.share) {
        try {
          await navigator.share({
            title: group.groupName,
            text: `「${group.groupName}」のやりたいことリスト`,
            url,
          });
          return;
        } catch (caught) {
          if (caught instanceof DOMException && caught.name === "AbortError")
            return;
        }
      }
      try {
        await navigator.clipboard.writeText(url);
        setNotice("共有URLをコピーしました。");
      } catch {
        setShareUrl(url);
      }
    } finally {
      setSharing(false);
    }
  }
  function closeShare() {
    dialog.current?.close();
    setShareUrl("");
    shareButton.current?.focus();
  }
  const newItem = () =>
    navigate(
      `/groups/${encodeURIComponent(groupId!)}/items/new${location.hash}`,
    );

  if (loading)
    return (
      <main className="group-page" aria-busy="true">
        <header className="group-topbar">
          <div className="group-topbar-inner">
            <Brand compact />
          </div>
        </header>
        <div className="group-shell">
          <div className="skeleton skeleton-title" />
          <div className="collection-grid">
            {[0, 1, 2].map((i) => (
              <div className="skeleton skeleton-photo" key={i} />
            ))}
          </div>
          <span className="sr-only">読み込んでいます</span>
        </div>
      </main>
    );
  if (error || !group)
    return (
      <main className="state-page">
        <section className="state-panel">
          <Brand />
          <h1>グループを開けませんでした</h1>
          <p>{error}</p>
          <button className="primary-button" onClick={() => void loadData()}>
            もう一度読み込む
          </button>
          <Link className="text-button" to="/">
            グループ一覧へ
          </Link>
        </section>
      </main>
    );
  if (!displayName || changingName)
    return (
      <main className="join-page">
        <div className="join-shell">
          <Brand />
          <section className="join-panel">
            <h1>{group.groupName}</h1>
            <form className="join-form" onSubmit={saveName}>
              <label className="field">
                <span>あなたの表示名</span>
                <span className="input-edge">
                  <input
                    value={nameInput}
                    onChange={(event) => {
                      setNameInput(event.target.value);
                      setJoinError("");
                    }}
                    placeholder="例：あおい"
                    maxLength={30}
                    autoComplete="nickname"
                    aria-invalid={!!joinError}
                  />
                </span>
              </label>
              {joinError && (
                <p className="form-error" role="alert">
                  {joinError}
                </p>
              )}
              <button className="primary-button" type="submit">
                {changingName ? "変更する" : "リストに参加する"}
                <Icon name="arrow-right" />
              </button>
              {changingName ? (
                <button
                  type="button"
                  className="text-button"
                  onClick={() => setChangingName(false)}
                >
                  やめる
                </button>
              ) : (
                <p className="legal-consent">
                  参加すると、
                  <Link to="/terms" target="_blank" rel="noreferrer">
                    利用規約
                  </Link>
                  と
                  <Link to="/privacy" target="_blank" rel="noreferrer">
                    プライバシーポリシー
                  </Link>
                  に同意したものとみなします。
                </p>
              )}
            </form>
          </section>
        </div>
      </main>
    );

  const visibleItems = items
    .filter((item) => item.status === view)
    .sort((a, b) =>
      view === "memory"
        ? (b.completedAt || b.updatedAt).localeCompare(
            a.completedAt || a.updatedAt,
          )
        : 0,
    );
  const wishCount = items.filter((item) => item.status !== "memory").length;
  return (
    <main className="group-page">
      <header className="group-topbar">
        <div className="group-topbar-inner">
          <Link to="/" className="brand-button" aria-label="グループ一覧へ">
            <Brand compact />
          </Link>
          <div className="topbar-actions">
            <button
              ref={shareButton}
              type="button"
              className="share-button"
              aria-label={sharing ? "共有中" : "グループを共有"}
              onClick={() => void share()}
              disabled={sharing}
            >
              <Icon name="share" />
              <span>{sharing ? "共有中…" : "共有"}</span>
            </button>
            <details
              className="profile-menu"
              onKeyDown={(event) => {
                if (event.key === "Escape") {
                  event.currentTarget.open = false;
                  event.currentTarget.querySelector("summary")?.focus();
                }
              }}
            >
              <summary aria-label="メニューを開く">
                <span aria-hidden="true">{displayName.slice(0, 1)}</span>
              </summary>
              <div className="menu-popover profile-popover">
                <p>
                  <span>表示名</span>
                  <strong>{displayName}</strong>
                </p>
                <button
                  onClick={() => {
                    setNameInput(displayName);
                    setChangingName(true);
                  }}
                >
                  表示名を変更
                </button>
                <button onClick={() => navigate("/")}>グループ一覧へ</button>
              </div>
            </details>
          </div>
        </div>
      </header>
      <div className="group-shell">
        <section className="collection-heading">
          <h1>{group.groupName}</h1>
          {view === "wish" && (
            <button
              type="button"
              className="primary-button collection-add"
              onClick={newItem}
            >
              <Icon name="plus" />
              追加
            </button>
          )}
        </section>
        <div className="collection-toolbar">
          <nav className="collection-tabs" aria-label="リストの切り替え">
            <Link
              to={`${location.pathname}${location.hash}`}
              aria-current={view === "wish" ? "page" : undefined}
            >
              <span className="tab-label">やりたいこと</span>
              <span className="tab-count">{wishCount}</span>
            </Link>
            <Link
              to={`${location.pathname}?view=memories${location.hash}`}
              aria-current={view === "memory" ? "page" : undefined}
            >
              <span className="tab-label">思い出</span>
              <span className="tab-count">{items.length - wishCount}</span>
            </Link>
          </nav>
        </div>
        <section
          className="collection"
          aria-label={view === "memory" ? "思い出" : "やりたいこと"}
        >
          {visibleItems.length === 0 ? (
            <div className="collection-empty">
              <p>
                {view === "memory"
                  ? "思い出はまだありません"
                  : "やりたいことはまだありません"}
              </p>
            </div>
          ) : (
            <ul className="collection-list">
              {visibleItems.map((item, index) => (
                <li key={item.itemId}>
                  <button
                    type="button"
                    className={`collection-entry ${!item.coverImageUrl ? "entry-without-photo" : ""}`}
                    onClick={() =>
                      navigate(
                        `/groups/${encodeURIComponent(groupId!)}/items/${encodeURIComponent(item.itemId)}${location.hash}`,
                      )
                    }
                    aria-label={`${item.content}の詳細を開く`}
                  >
                    <div className="collection-caption">
                      <h2>{item.content}</h2>
                      <p>{item.createdByDisplayName}が追加</p>
                    </div>
                    {item.coverImageUrl && (
                      <div className="collection-photo">
                        <PhotoImage
                          src={item.coverImageUrl}
                          alt=""
                          eager={index < 3}
                        />
                        {item.photoCount > 0 && (
                          <span className="photo-count">
                            <Icon name="photo" size={14} />
                            {item.photoCount}
                          </span>
                        )}
                      </div>
                    )}
                  </button>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>
      {notice && (
        <div className="notice" role="status">
          {notice}
        </div>
      )}
      <dialog
        ref={dialog}
        className="share-fallback"
        aria-labelledby="share-title"
        onCancel={(event) => {
          event.preventDefault();
          closeShare();
        }}
      >
        <button
          type="button"
          className="icon-button share-fallback-close"
          aria-label="閉じる"
          onClick={closeShare}
        >
          <Icon name="close" />
        </button>
        <h2 id="share-title">共有URL</h2>
        <p>URLを長押ししてコピーし、LINEなどに貼り付けてください。</p>
        <span className="input-edge">
          <input
            value={shareUrl}
            readOnly
            aria-label="共有URL"
            onFocus={(event) => event.currentTarget.select()}
          />
        </span>
        <button type="button" className="secondary-button" onClick={closeShare}>
          閉じる
        </button>
      </dialog>
    </main>
  );
}
export default GroupPage;
