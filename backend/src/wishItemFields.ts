export const WISH_CONTENT_MAX_LENGTH = 200;
export const WISH_COMMENT_MAX_LENGTH = 1000;
export const WISH_URL_MAX_LENGTH = 2048;

export type WishItemFieldsInput = {
  content: string;
  comment?: string;
  url?: string;
};

export type WishItemFields = {
  content: string;
  comment: string;
  url: string;
};

function normalizeUrl(value: string): string {
  const trimmedValue = value.trim();

  if (trimmedValue.length === 0) {
    return "";
  }

  const valueWithProtocol = /^[a-z][a-z\d+.-]*:/i.test(
    trimmedValue,
  )
    ? trimmedValue
    : `https://${trimmedValue}`;

  let parsedUrl: URL;

  try {
    parsedUrl = new URL(valueWithProtocol);
  } catch {
    throw new Error("正しいURLを入力してください");
  }

  if (
    parsedUrl.protocol !== "http:" &&
    parsedUrl.protocol !== "https:"
  ) {
    throw new Error(
      "httpまたはhttpsのURLを入力してください",
    );
  }

  return parsedUrl.toString();
}

export function normalizeWishItemFields(
  input: WishItemFieldsInput,
): WishItemFields {
  const content = input.content.trim();
  const comment = (input.comment ?? "").trim();
  const rawUrl = (input.url ?? "").trim();

  if (content.length === 0) {
    throw new Error(
      "やりたいことを入力してください",
    );
  }

  if (content.length > WISH_CONTENT_MAX_LENGTH) {
    throw new Error(
      `やりたいことは${WISH_CONTENT_MAX_LENGTH}文字以内で入力してください`,
    );
  }

  if (comment.length > WISH_COMMENT_MAX_LENGTH) {
    throw new Error(
      `コメントは${WISH_COMMENT_MAX_LENGTH}文字以内で入力してください`,
    );
  }

  const url = normalizeUrl(rawUrl);

  if (url.length > WISH_URL_MAX_LENGTH) {
    throw new Error(
      `URLは${WISH_URL_MAX_LENGTH}文字以内で入力してください`,
    );
  }

  return {
    content,
    comment,
    url,
  };
}
