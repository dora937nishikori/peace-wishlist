import {
  createHash,
  randomBytes,
  timingSafeEqual,
} from "node:crypto";

export function generateAccessToken(): string {
  return randomBytes(32).toString("base64url");
}

export function hashAccessToken(
  accessToken: string,
): string {
  return createHash("sha256")
    .update(accessToken)
    .digest("hex");
}

export function verifyAccessToken(
  accessToken: string,
  expectedHash: string,
): boolean {
  const actualHash = hashAccessToken(accessToken);

  const actualBuffer = Buffer.from(actualHash, "hex");
  const expectedBuffer = Buffer.from(
    expectedHash,
    "hex",
  );

  if (
    actualBuffer.length !== expectedBuffer.length
  ) {
    return false;
  }

  return timingSafeEqual(
    actualBuffer,
    expectedBuffer,
  );
}