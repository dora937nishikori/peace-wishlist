import {
  useCallback,
  useEffect,
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
} from "../api";

import type {
  Group,
  WishItem,
} from "../api";

import {
  getDisplayName,
  removeDisplayName,
  saveDisplayName,
} from "../storage";

function GroupPage() {
  const navigate = useNavigate();

  const { groupId } =
    useParams();

  const location =
    useLocation();

  const hashParams =
    new URLSearchParams(
      location.hash.slice(1),
    );

  const accessToken =
    hashParams.get("token");

  const [
    group,
    setGroup,
  ] = useState<Group | null>(
    null,
  );

  const [
    items,
    setItems,
  ] = useState<WishItem[]>(
    [],
  );

  const [
    displayName,
    setDisplayNameState,
  ] = useState("");

  const [
    displayNameInput,
    setDisplayNameInput,
  ] = useState("");

  const [
    newItemContent,
    setNewItemContent,
  ] = useState("");

  const [
    editingItemId,
    setEditingItemId,
  ] = useState<string | null>(
    null,
  );

  const [
    editingContent,
    setEditingContent,
  ] = useState("");

  const [
    loading,
    setLoading,
  ] = useState(true);

  const [
    actionLoading,
    setActionLoading,
  ] = useState(false);

  const [
    error,
    setError,
  ] = useState("");

  const [
    copied,
    setCopied,
  ] = useState(false);

  const loadData =
    useCallback(async () => {
      if (
        !groupId ||
        !accessToken
      ) {
        setError(
          "共有URLが正しくありません",
        );

        setLoading(false);
        return;
      }

      try {
        setError("");

        const [
          groupResult,
          itemResult,
        ] = await Promise.all([
          getGroup(
            groupId,
            accessToken,
          ),

          getWishItems(
            groupId,
            accessToken,
          ),
        ]);

        setGroup(groupResult);
        setItems(itemResult);

        const storedDisplayName =
          getDisplayName(groupId);

        if (storedDisplayName) {
          setDisplayNameState(
            storedDisplayName,
          );
        }
      } catch (error) {
        console.error(error);

        setError(
          error instanceof Error
            ? error.message
            : "グループを取得できませんでした",
        );
      } finally {
        setLoading(false);
      }
    }, [
      groupId,
      accessToken,
    ]);

  useEffect(() => {
    void loadData();
  }, [loadData]);

  const handleSaveDisplayName =
    (
      event:
        FormEvent<HTMLFormElement>,
    ) => {
      event.preventDefault();

      if (!groupId) {
        return;
      }

      const name =
        displayNameInput.trim();

      if (!name) {
        setError(
          "表示名を入力してください",
        );
        return;
      }

      saveDisplayName(
        groupId,
        name,
      );

      setDisplayNameState(
        name,
      );

      setDisplayNameInput("");
      setError("");
    };

  const handleChangeDisplayName =
    () => {
      if (!groupId) {
        return;
      }

      removeDisplayName(groupId);

      setDisplayNameState("");
      setDisplayNameInput(
        displayName,
      );
    };

  const handleCreateItem =
    async (
      event:
        FormEvent<HTMLFormElement>,
    ) => {
      event.preventDefault();

      if (
        !groupId ||
        !accessToken ||
        !displayName
      ) {
        return;
      }

      const content =
        newItemContent.trim();

      if (!content) {
        setError(
          "やりたいことを入力してください",
        );
        return;
      }

      try {
        setActionLoading(true);
        setError("");

        const newItem =
          await createWishItem(
            groupId,
            accessToken,
            {
              content,
              displayName,
            },
          );

        setItems(
          (currentItems) => [
            newItem,
            ...currentItems,
          ],
        );

        setNewItemContent("");
      } catch (error) {
        console.error(error);

        setError(
          error instanceof Error
            ? error.message
            : "やりたいことの追加に失敗しました",
        );
      } finally {
        setActionLoading(false);
      }
    };

  const startEditing =
    (item: WishItem) => {
      setEditingItemId(
        item.itemId,
      );

      setEditingContent(
        item.content,
      );

      setError("");
    };

  const cancelEditing =
    () => {
      setEditingItemId(null);
      setEditingContent("");
    };

  const handleUpdateItem =
    async (
      itemId: string,
    ) => {
      if (
        !groupId ||
        !accessToken ||
        !displayName
      ) {
        return;
      }

      const content =
        editingContent.trim();

      if (!content) {
        setError(
          "やりたいことを入力してください",
        );
        return;
      }

      try {
        setActionLoading(true);
        setError("");

        const updatedItem =
          await updateWishItem(
            groupId,
            itemId,
            accessToken,
            {
              content,
              displayName,
            },
          );

        setItems(
          (currentItems) =>
            currentItems.map(
              (item) =>
                item.itemId ===
                itemId
                  ? updatedItem
                  : item,
            ),
        );

        cancelEditing();
      } catch (error) {
        console.error(error);

        setError(
          error instanceof Error
            ? error.message
            : "更新に失敗しました",
        );
      } finally {
        setActionLoading(false);
      }
    };

  const handleDeleteItem =
    async (
      item: WishItem,
    ) => {
      if (
        !groupId ||
        !accessToken
      ) {
        return;
      }

      const confirmed =
        window.confirm(
          `「${item.content}」を削除しますか？`,
        );

      if (!confirmed) {
        return;
      }

      try {
        setActionLoading(true);
        setError("");

        await deleteWishItem(
          groupId,
          item.itemId,
          accessToken,
        );

        setItems(
          (currentItems) =>
            currentItems.filter(
              (currentItem) =>
                currentItem.itemId !==
                item.itemId,
            ),
        );
      } catch (error) {
        console.error(error);

        setError(
          error instanceof Error
            ? error.message
            : "削除に失敗しました",
        );
      } finally {
        setActionLoading(false);
      }
    };

  const handleCopyUrl =
    async () => {
      try {
        await navigator.clipboard
          .writeText(
            window.location.href,
          );

        setCopied(true);

        window.setTimeout(
          () => {
            setCopied(false);
          },
          2000,
        );
      } catch (error) {
        console.error(error);

        setError(
          "URLのコピーに失敗しました",
        );
      }
    };

  if (loading) {
    return (
      <main className="page">
        <p className="status">
          読み込み中...
        </p>
      </main>
    );
  }

  if (!group) {
    return (
      <main className="page">
        <section className="card">
          <h1>
            グループを開けません
          </h1>

          <p className="error">
            {error ||
              "グループが見つかりません"}
          </p>

          <button
            className="secondary-button"
            onClick={() =>
              navigate("/")
            }
          >
            トップへ戻る
          </button>
        </section>
      </main>
    );
  }

  if (!displayName) {
    return (
      <main className="page">
        <section className="card name-card">
          <div className="brand">
            Peace Wishlist
          </div>

          <h1>
            {group.groupName}
          </h1>

          <p className="description">
            このグループで使う
            表示名を入力してください。
          </p>

          <form
            className="form"
            onSubmit={
              handleSaveDisplayName
            }
          >
            <label className="field">
              <span>
                表示名
              </span>

              <input
                value={
                  displayNameInput
                }
                onChange={(event) =>
                  setDisplayNameInput(
                    event.target.value,
                  )
                }
                placeholder="例：こり"
                maxLength={30}
                autoFocus
              />
            </label>

            {error && (
              <p className="error">
                {error}
              </p>
            )}

            <button
              className="primary-button"
              type="submit"
            >
              この名前で参加
            </button>
          </form>
        </section>
      </main>
    );
  }

  return (
    <main className="group-page">
      <header className="group-header">
        <div>
          <div className="brand">
            Peace Wishlist
          </div>

          <h1>
            {group.groupName}
          </h1>

          <p className="member-name">
            {displayName}
            として参加中
          </p>
        </div>

        <div className="header-actions">
          <button
            type="button"
            className="secondary-button"
            onClick={
              handleCopyUrl
            }
          >
            {copied
              ? "コピーしました"
              : "共有URLをコピー"}
          </button>

          <button
            type="button"
            className="text-button"
            onClick={
              handleChangeDisplayName
            }
          >
            表示名を変更
          </button>
        </div>
      </header>

      <section className="content-container">
        <form
          className="add-item-form"
          onSubmit={
            handleCreateItem
          }
        >
          <input
            value={
              newItemContent
            }
            onChange={(event) =>
              setNewItemContent(
                event.target.value,
              )
            }
            placeholder="行きたい場所・食べたいもの・やりたいこと"
            maxLength={200}
          />

          <button
            type="submit"
            className="primary-button add-button"
            disabled={
              actionLoading
            }
          >
            追加
          </button>
        </form>

        {error && (
          <p className="error">
            {error}
          </p>
        )}

        <div className="list-header">
          <h2>
            やりたいこと
          </h2>

          <span className="item-count">
            {items.length}件
          </span>
        </div>

        {items.length === 0 ? (
          <div className="empty-state">
            <p>
              まだやりたいことが
              登録されていません。
            </p>

            <p>
              最初の1件を追加してみましょう。
            </p>
          </div>
        ) : (
          <div className="wish-list">
            {items.map(
              (item) => (
                <article
                  key={item.itemId}
                  className="wish-item"
                >
                  {editingItemId ===
                  item.itemId ? (
                    <div className="edit-area">
                      <input
                        value={
                          editingContent
                        }
                        onChange={(
                          event,
                        ) =>
                          setEditingContent(
                            event.target
                              .value,
                          )
                        }
                        maxLength={200}
                        autoFocus
                      />

                      <div className="item-actions">
                        <button
                          type="button"
                          className="small-primary-button"
                          disabled={
                            actionLoading
                          }
                          onClick={() =>
                            void handleUpdateItem(
                              item.itemId,
                            )
                          }
                        >
                          保存
                        </button>

                        <button
                          type="button"
                          className="small-button"
                          onClick={
                            cancelEditing
                          }
                        >
                          キャンセル
                        </button>
                      </div>
                    </div>
                  ) : (
                    <>
                      <div className="wish-item-main">
                        <p className="wish-content">
                          {
                            item.content
                          }
                        </p>

                        <p className="wish-meta">
                          登録：
                          {
                            item.createdByDisplayName
                          }
                        </p>

                        {item.updatedByDisplayName !==
                          item.createdByDisplayName && (
                          <p className="wish-meta">
                            最終更新：
                            {
                              item.updatedByDisplayName
                            }
                          </p>
                        )}
                      </div>

                      <div className="item-actions">
                        <button
                          type="button"
                          className="small-button"
                          disabled={
                            actionLoading
                          }
                          onClick={() =>
                            startEditing(
                              item,
                            )
                          }
                        >
                          編集
                        </button>

                        <button
                          type="button"
                          className="small-button danger-button"
                          disabled={
                            actionLoading
                          }
                          onClick={() =>
                            void handleDeleteItem(
                              item,
                            )
                          }
                        >
                          削除
                        </button>
                      </div>
                    </>
                  )}
                </article>
              ),
            )}
          </div>
        )}

        <div className="bottom-actions">
          <button
            type="button"
            className="text-button"
            onClick={() =>
              navigate("/")
            }
          >
            新しいグループを作る
          </button>
        </div>
      </section>
    </main>
  );
}

export default GroupPage;