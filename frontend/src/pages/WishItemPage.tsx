import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type FormEvent,
} from "react";
import {
  Link,
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
  getLinkPreview,
  uploadPhoto,
  deletePhoto,
  type Group,
  type WishItem,
} from "../api";
import { Brand } from "../components/Brand";
import { Icon } from "../components/Icon";
import { PhotoImage } from "../components/PhotoImage";
import { getDisplayName, rememberGroup } from "../storage";
import { preparePhoto } from "../photos";

type Fields = {
  content: string;
  comment: string;
  url: string;
  coverImageUrl: string;
  completedAt: string;
};
const EMPTY: Fields = {
  content: "",
  comment: "",
  url: "",
  coverImageUrl: "",
  completedAt: "",
};
const toFields = (item: WishItem): Fields => ({
  content: item.content,
  comment: item.comment,
  url: item.url,
  coverImageUrl: item.coverImageUrl,
  completedAt: item.completedAt,
});
const today = () => {
  const date = new Date();
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
};
const errorMessage = (error: unknown) =>
  error instanceof Error
    ? error.message
    : "通信環境を確認して、もう一度お試しください。";

export default function WishItemPage() {
  const { groupId, itemId } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  const isNew = itemId === "new";
  const token = new URLSearchParams(location.hash.slice(1)).get("token");
  const displayName = groupId ? getDisplayName(groupId) : null;
  const [group, setGroup] = useState<Group | null>(null);
  const [item, setItem] = useState<WishItem | null>(null);
  const [fields, setFields] = useState<Fields>(EMPTY);
  const [initial, setInitial] = useState<Fields>(EMPTY);
  const [editing, setEditing] = useState(isNew);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [loadError, setLoadError] = useState("");
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [previewBusy, setPreviewBusy] = useState(false);
  const [previewError, setPreviewError] = useState("");
  const [uploadProgress, setUploadProgress] = useState("");
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [deletePhotoId, setDeletePhotoId] = useState<string | null>(null);
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);
  const lightbox = useRef<HTMLDialogElement>(null);
  const fileInput = useRef<HTMLInputElement>(null);
  const skipBlock = useRef(false);
  const previewRequest = useRef(0);
  const suggestedTitle = useRef("");
  const fetchedUrl = useRef("");
  const isMemory = item?.status === "memory";
  const dirty = editing && JSON.stringify(fields) !== JSON.stringify(initial);
  const blocker = useBlocker(() => (dirty || busy) && !skipBlock.current);
  const listUrl = `/groups/${encodeURIComponent(groupId ?? "")}${isMemory ? "?view=memories" : ""}${location.hash}`;

  const acceptItem = useCallback((next: WishItem) => {
    setItem(next);
    setFields(toFields(next));
    setInitial(toFields(next));
  }, []);
  const load = useCallback(async () => {
    if (!groupId || !itemId || !token) {
      setLoadError("共有URLから、もう一度開いてください。");
      setLoading(false);
      return;
    }
    if (!displayName) {
      skipBlock.current = true;
      navigate(`/groups/${encodeURIComponent(groupId)}${location.hash}`, {
        replace: true,
      });
      return;
    }
    try {
      const [nextGroup, nextItem] = await Promise.all([
        getGroup(groupId, token),
        isNew ? Promise.resolve(null) : getWishItem(groupId, itemId, token),
      ]);
      setGroup(nextGroup);
      rememberGroup(nextGroup, token);
      if (nextItem) acceptItem(nextItem);
      else {
        setItem(null);
        setFields(EMPTY);
        setInitial(EMPTY);
      }
      setEditing(isNew);
      setLoadError("");
      skipBlock.current = false;
      fetchedUrl.current = nextItem?.url ?? "";
    } catch (caught) {
      setLoadError(errorMessage(caught));
    } finally {
      setLoading(false);
    }
  }, [
    groupId,
    itemId,
    token,
    displayName,
    isNew,
    location.hash,
    navigate,
    acceptItem,
  ]);
  useEffect(() => {
    void load();
  }, [load]);
  useEffect(() => {
    if (blocker.state !== "blocked") return;
    if (busy) {
      blocker.reset();
      return;
    }
    if (window.confirm("変更が保存されていません。破棄して移動しますか？"))
      blocker.proceed();
    else blocker.reset();
  }, [blocker, busy]);
  useEffect(() => {
    const prevent = (event: BeforeUnloadEvent) => {
      if ((dirty || busy) && !skipBlock.current) event.preventDefault();
    };
    window.addEventListener("beforeunload", prevent);
    return () => window.removeEventListener("beforeunload", prevent);
  }, [dirty, busy]);
  useEffect(() => {
    if (!notice) return;
    const timer = window.setTimeout(() => setNotice(""), 4000);
    return () => window.clearTimeout(timer);
  }, [notice]);
  useEffect(() => {
    const dialog = lightbox.current;
    if (lightboxIndex !== null && dialog && !dialog.open) dialog.showModal();
    if (lightboxIndex === null && dialog?.open) dialog.close();
  }, [lightboxIndex]);

  const fetchPreview = useCallback(
    async (url: string) => {
      if (!groupId || !token || !url.trim()) return;
      const request = ++previewRequest.current;
      fetchedUrl.current = url;
      setPreviewBusy(true);
      setPreviewError("");
      try {
        const preview = await getLinkPreview(groupId, token, url);
        if (request !== previewRequest.current) return;
        const previousSuggestion = suggestedTitle.current;
        setFields((current) => ({
          ...current,
          content:
            !current.content.trim() || current.content === previousSuggestion
              ? preview.title || current.content
              : current.content,
          coverImageUrl: preview.imageUrl,
        }));
        suggestedTitle.current = preview.title;
        if (!preview.title && !preview.imageUrl)
          setPreviewError(
            "このページから情報を取得できませんでした。名前を入力して保存できます。",
          );
      } catch (caught) {
        if (request === previewRequest.current)
          setPreviewError(errorMessage(caught));
      } finally {
        if (request === previewRequest.current) setPreviewBusy(false);
      }
    },
    [groupId, token],
  );
  useEffect(() => {
    if (
      !editing ||
      busy ||
      !fields.url.trim() ||
      fields.url === fetchedUrl.current
    )
      return;
    const timer = window.setTimeout(() => void fetchPreview(fields.url), 700);
    return () => window.clearTimeout(timer);
  }, [editing, busy, fields.url, fetchPreview]);

  async function save(event: FormEvent) {
    event.preventDefault();
    if (!groupId || !itemId || !token || !displayName || busy) return;
    if (!fields.content.trim()) {
      setError("やりたいことを入力してください。");
      return;
    }
    previewRequest.current++;
    setPreviewBusy(false);
    fetchedUrl.current = fields.url;
    setBusy(true);
    setError("");
    try {
      const input = { ...fields, displayName };
      const next = isNew
        ? await createWishItem(groupId, token, input)
        : await updateWishItem(groupId, itemId, token, {
            ...input,
            expectedUpdatedAt: item?.updatedAt,
          });
      acceptItem(next);
      setEditing(false);
      setNotice(isNew ? "リストに追加しました。" : "保存しました。");
      if (isNew) {
        skipBlock.current = true;
        navigate(
          `/groups/${encodeURIComponent(groupId)}/items/${encodeURIComponent(next.itemId)}${location.hash}`,
          { replace: true },
        );
      }
    } catch (caught) {
      setError(errorMessage(caught));
    } finally {
      setBusy(false);
    }
  }
  async function changeStatus() {
    if (!groupId || !item || !token || !displayName) return;
    setBusy(true);
    setError("");
    try {
      const next = await updateWishItem(groupId, item.itemId, token, {
        ...toFields(item),
        displayName,
        status: isMemory ? "wish" : "memory",
        completedAt: isMemory ? "" : today(),
        expectedUpdatedAt: item.updatedAt,
      });
      acceptItem(next);
      setNotice(
        isMemory ? "やりたいことに戻しました。" : "思い出に残しました。",
      );
    } catch (caught) {
      setError(errorMessage(caught));
    } finally {
      setBusy(false);
    }
  }
  async function removeItem() {
    if (!groupId || !itemId || !token) return;
    setBusy(true);
    setError("");
    try {
      await deleteWishItem(groupId, itemId, token);
      skipBlock.current = true;
      navigate(listUrl, { replace: true, state: { itemDeleted: true } });
    } catch (caught) {
      setError(errorMessage(caught));
      setConfirmDelete(false);
    } finally {
      setBusy(false);
    }
  }
  async function addPhotos(files: FileList | null) {
    if (!files?.length || !groupId || !item || !token || !displayName) return;
    const selected = [...files];
    if (selected.length + item.photos.length > 50) {
      setError("写真は1つの思い出につき50枚まで追加できます。");
      return;
    }
    setBusy(true);
    setError("");
    let saved = 0;
    try {
      for (const file of selected) {
        setUploadProgress(`${saved + 1} / ${selected.length}枚を追加中…`);
        const prepared = await preparePhoto(file);
        const next = await uploadPhoto(
          groupId,
          item.itemId,
          token,
          prepared,
          displayName,
        );
        acceptItem(next);
        saved++;
      }
      setNotice(`${saved}枚の写真を追加しました。`);
    } catch (caught) {
      setError(
        `${saved ? `${saved}枚は保存済みです。` : ""}${errorMessage(caught)}`,
      );
    } finally {
      setBusy(false);
      setUploadProgress("");
      if (fileInput.current) fileInput.current.value = "";
    }
  }
  async function removePhoto() {
    if (!groupId || !item || !token || !deletePhotoId) return;
    setBusy(true);
    setError("");
    try {
      acceptItem(await deletePhoto(groupId, item.itemId, deletePhotoId, token));
      setNotice("写真を削除しました。");
    } catch (caught) {
      setError(errorMessage(caught));
    } finally {
      setBusy(false);
      setDeletePhotoId(null);
    }
  }
  function cancelEdit() {
    previewRequest.current++;
    setPreviewBusy(false);
    setPreviewError("");
    setFields(initial);
    fetchedUrl.current = initial.url;
    setEditing(false);
    setError("");
  }

  if (loading)
    return (
      <main className="item-page" aria-busy="true">
        <div className="story-shell">
          <div className="skeleton skeleton-title" />
          <div className="skeleton skeleton-hero" />
          <span className="sr-only">読み込んでいます</span>
        </div>
      </main>
    );
  if (loadError || !group)
    return (
      <main className="state-page">
        <section className="state-panel">
          <Brand />
          <h1>詳細を開けませんでした</h1>
          <p>{loadError}</p>
          <button className="primary-button" onClick={() => void load()}>
            もう一度読み込む
          </button>
          <Link className="text-button" to={listUrl}>
            一覧へ戻る
          </Link>
        </section>
      </main>
    );
  const photos = item?.photos ?? [];
  const cover =
    isMemory && photos.length ? photos[0].url : fields.coverImageUrl;
  const activePhoto = lightboxIndex !== null ? photos[lightboxIndex] : null;

  return (
    <main className={`item-page ${isMemory ? "memory-page" : ""}`}>
      <header className="group-topbar">
        <div className="group-topbar-inner item-topbar-inner">
          <Link className="back-button" to={listUrl}>
            <Icon name="arrow-left" />
            <span>{isMemory ? "思い出" : "リスト"}へ戻る</span>
          </Link>
          <Link to="/" className="brand-button" aria-label="グループ一覧へ">
            <Brand compact />
          </Link>
        </div>
      </header>
      <article className={`story-shell ${editing ? "story-editing" : ""}`}>
        {editing ? (
          <form className="story-editor" onSubmit={save}>
            {isNew ? <h1 className="sr-only">やりたいことを追加</h1> : (
              <div className="editor-heading">
                <h1>内容を編集</h1>
                <button
                  type="button"
                  className="text-button"
                  onClick={cancelEdit}
                  disabled={busy}
                >
                  やめる
                </button>
              </div>
            )}
            <label className="field">
              <span>
                URL <span className="optional-label">任意</span>
              </span>
              <span className="input-edge url-input-edge">
                <Icon name="link" />
                <input
                  value={fields.url}
                  placeholder="https://example.com"
                  inputMode="url"
                  autoComplete="url"
                  maxLength={2048}
                  disabled={busy}
                  onChange={(event) => {
                    previewRequest.current++;
                    fetchedUrl.current = "";
                    setPreviewBusy(false);
                    setPreviewError("");
                    setFields({
                      ...fields,
                      url: event.target.value,
                      coverImageUrl: "",
                    });
                  }}
                />
              </span>
            </label>
            <div className="preview-status" aria-live="polite">
              {previewBusy ? (
                <span>ページの写真とタイトルを取得中…</span>
              ) : previewError ? (
                <>
                  <span>{previewError}</span>
                  <button
                    className="text-button"
                    type="button"
                    onClick={() => void fetchPreview(fields.url)}
                  >
                    再取得
                  </button>
                </>
              ) : fields.url ? (
                <button
                  className="text-button"
                  type="button"
                  disabled={busy}
                  onClick={() => void fetchPreview(fields.url)}
                >
                  写真とタイトルを再取得
                </button>
              ) : null}
            </div>
            {fields.coverImageUrl && (
              <div className="editor-preview">
                <PhotoImage
                  src={fields.coverImageUrl}
                  alt="リンク先の写真"
                  eager
                />
                <button
                  type="button"
                  className="image-remove"
                  onClick={() => setFields({ ...fields, coverImageUrl: "" })}
                  aria-label="リンク先の写真を外す"
                >
                  <Icon name="close" size={18} />
                </button>
              </div>
            )}
            <label className="field">
              <span>やりたいこと</span>
              <span className="input-edge">
                <input
                  value={fields.content}
                  placeholder="例：海の見えるカフェに行く"
                  maxLength={200}
                  required
                  disabled={busy}
                  onChange={(event) =>
                    setFields({ ...fields, content: event.target.value })
                  }
                />
              </span>
            </label>
            <label className="field">
              <span>
                コメント <span className="optional-label">任意</span>
              </span>
              <span className="input-edge textarea-edge">
                <textarea
                  value={fields.comment}
                  rows={4}
                  maxLength={1000}
                  disabled={busy}
                  onChange={(event) =>
                    setFields({ ...fields, comment: event.target.value })
                  }
                />
              </span>
            </label>
            {isMemory && (
              <label className="field">
                <span>思い出の日付</span>
                <span className="input-edge">
                  <input
                    type="date"
                    value={fields.completedAt}
                    required
                    disabled={busy}
                    onChange={(event) =>
                      setFields({ ...fields, completedAt: event.target.value })
                    }
                  />
                </span>
              </label>
            )}
            {error && (
              <p className="form-error" role="alert">
                {error}
              </p>
            )}
            <button
              className="primary-button editor-save"
              type="submit"
              disabled={busy || previewBusy || (!isNew && !dirty)}
            >
              {busy ? "保存中…" : isNew ? "リストに追加する" : "変更を保存する"}
              <Icon name="check" />
            </button>
          </form>
        ) : (
          <>
            <header className="story-heading">
              <div>
                {isMemory && item?.completedAt && (
                  <p className="memory-date">
                    <time dateTime={item.completedAt}>
                      {item.completedAt.replaceAll("-", ".")}
                    </time>
                  </p>
                )}
                <h1>{item?.content}</h1>
                <p className="story-byline">
                  {group.groupName}
                  <span aria-hidden="true"> / </span>
                  {item?.createdByDisplayName}が追加
                </p>
              </div>
              <button
                type="button"
                className="text-button story-edit"
                onClick={() => {
                  setEditing(true);
                  setError("");
                }}
                disabled={busy}
              >
                <Icon name="edit" size={17} />
                編集
              </button>
            </header>
            {cover &&
              (isMemory && photos.length ? (
                <button
                  className="story-cover-button"
                  onClick={() => setLightboxIndex(0)}
                  aria-label="表紙の写真を大きく表示"
                >
                  <PhotoImage
                    className="story-cover"
                    src={cover}
                    alt={item?.content ?? "思い出の写真"}
                    eager
                  />
                  <span className="cover-open">
                    <Icon name="photo" size={17} />
                    写真を見る
                  </span>
                </button>
              ) : (
                <PhotoImage
                  className="story-cover"
                  src={cover}
                  alt={item?.content ?? "リンク先の写真"}
                  eager
                />
              ))}
            <div className="story-content">
              <div className="story-description">
                {item?.comment && <p>{item.comment}</p>}
                {item?.url && (
                  <a
                    className="story-source"
                    href={item.url}
                    target="_blank"
                    rel="noreferrer"
                  >
                    <Icon name="external" size={17} />
                    <span>
                      {new URL(item.url).hostname.replace(/^www\./, "")}
                    </span>
                  </a>
                )}
              </div>
              <button
                type="button"
                className={
                  isMemory
                    ? "text-button return-to-wish"
                    : "secondary-button complete-button"
                }
                onClick={() => void changeStatus()}
                disabled={busy}
              >
                <Icon name={isMemory ? "undo" : "check"} />
                {busy && !uploadProgress
                  ? "保存中…"
                  : isMemory
                    ? "やりたいことに戻す"
                    : "思い出に残す"}
              </button>
            </div>
            {error && (
              <p className="form-error" role="alert">
                {error}
              </p>
            )}
            {isMemory && (
              <section className="memory-album" aria-labelledby="album-title">
                <div className="album-heading">
                  <div>
                    <h2 id="album-title">この日の写真</h2>
                    <span>{photos.length} / 50枚</span>
                  </div>
                  <button
                    type="button"
                    className="secondary-button"
                    disabled={busy || photos.length >= 50}
                    onClick={() => fileInput.current?.click()}
                  >
                    <Icon name="plus" />
                    写真を追加
                  </button>
                </div>
                <input
                  ref={fileInput}
                  type="file"
                  accept="image/jpeg,image/png,image/webp,image/heic,image/heif"
                  multiple
                  hidden
                  aria-label="思い出の写真を選ぶ"
                  onChange={(event) => void addPhotos(event.target.files)}
                />
                {uploadProgress && (
                  <p className="upload-progress" role="status">
                    {uploadProgress}
                  </p>
                )}
                {photos.length ? (
                  <div className="album-grid">
                    {photos.map((photo, index) => (
                      <figure key={photo.id} className="album-photo">
                        <button
                          className="album-open"
                          type="button"
                          onClick={() => setLightboxIndex(index)}
                          aria-label={`写真${index + 1}を大きく表示`}
                        >
                          <PhotoImage
                            src={photo.url}
                            alt={`${item?.content}の写真${index + 1}`}
                          />
                        </button>
                        <button
                          type="button"
                          className="image-remove"
                          onClick={() => setDeletePhotoId(photo.id)}
                          aria-label={`写真${index + 1}を削除`}
                          disabled={busy}
                        >
                          <Icon name="close" size={17} />
                        </button>
                      </figure>
                    ))}
                  </div>
                ) : (
                  <div className="album-empty">
                    <span>写真はまだありません</span>
                  </div>
                )}
                {deletePhotoId && (
                  <div className="photo-delete-confirm" role="alert">
                    <p>この写真を削除しますか？元に戻せません。</p>
                    <div className="inline-actions">
                      <button
                        type="button"
                        className="text-button"
                        onClick={() => setDeletePhotoId(null)}
                        disabled={busy}
                      >
                        やめる
                      </button>
                      <button
                        type="button"
                        className="danger-button"
                        onClick={() => void removePhoto()}
                        disabled={busy}
                      >
                        削除する
                      </button>
                    </div>
                  </div>
                )}
              </section>
            )}
            <footer className="story-footer">
              {confirmDelete ? (
                <div className="item-delete-confirmation">
                  <div>
                    <strong>
                      この{isMemory ? "思い出" : "項目"}を削除しますか？
                    </strong>
                    <p>写真も削除され、元に戻せません。</p>
                  </div>
                  <div className="inline-actions">
                    <button
                      type="button"
                      className="text-button"
                      onClick={() => setConfirmDelete(false)}
                      disabled={busy}
                    >
                      やめる
                    </button>
                    <button
                      type="button"
                      className="danger-button"
                      onClick={() => void removeItem()}
                      disabled={busy}
                    >
                      削除する
                    </button>
                  </div>
                </div>
              ) : (
                <button
                  type="button"
                  className="text-button item-delete-button"
                  onClick={() => setConfirmDelete(true)}
                  disabled={busy}
                >
                  <Icon name="trash" size={16} />
                  {isMemory ? "この思い出を削除" : "この項目を削除"}
                </button>
              )}
            </footer>
          </>
        )}
      </article>
      {notice && (
        <div className="notice" role="status">
          {notice}
        </div>
      )}
      <dialog
        ref={lightbox}
        className="photo-lightbox"
        aria-label="思い出の写真"
        onCancel={(event) => {
          event.preventDefault();
          setLightboxIndex(null);
        }}
        onKeyDown={(event) => {
          if (event.key === "ArrowRight" && lightboxIndex !== null)
            setLightboxIndex((lightboxIndex + 1) % photos.length);
          if (event.key === "ArrowLeft" && lightboxIndex !== null)
            setLightboxIndex(
              (lightboxIndex + photos.length - 1) % photos.length,
            );
        }}
      >
        <div className="lightbox-toolbar">
          <span>
            {lightboxIndex !== null ? lightboxIndex + 1 : 0} / {photos.length}
          </span>
          <button
            type="button"
            className="icon-button"
            onClick={() => setLightboxIndex(null)}
            aria-label="写真を閉じる"
            autoFocus
          >
            <Icon name="close" />
          </button>
        </div>
        {activePhoto && (
          <PhotoImage
            className="lightbox-photo"
            src={activePhoto.url}
            alt={`${item?.content}の写真`}
            eager
          />
        )}
        {photos.length > 1 && (
          <div className="lightbox-navigation">
            <button
              type="button"
              className="icon-button"
              aria-label="前の写真"
              onClick={() =>
                setLightboxIndex(
                  ((lightboxIndex ?? 0) + photos.length - 1) % photos.length,
                )
              }
            >
              <Icon name="arrow-left" />
            </button>
            <button
              type="button"
              className="icon-button"
              aria-label="次の写真"
              onClick={() =>
                setLightboxIndex(((lightboxIndex ?? 0) + 1) % photos.length)
              }
            >
              <Icon name="arrow-right" />
            </button>
          </div>
        )}
      </dialog>
    </main>
  );
}
