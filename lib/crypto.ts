import { createCipheriv, createDecipheriv, createHash, randomBytes } from "crypto";

const ENCRYPTION_ALGORITHM = "aes-256-gcm";

function getEncryptionKey(): Buffer {
  const secret = process.env.COOKIE_ENCRYPTION_SECRET;

  if (!secret) {
    throw new Error("COOKIE_ENCRYPTION_SECRET is required for token encryption.");
  }

  return createHash("sha256").update(secret).digest();
}

export function encryptToken(token: string): string {
  const key = getEncryptionKey();
  const iv = randomBytes(12);
  const cipher = createCipheriv(ENCRYPTION_ALGORITHM, key, iv);

  const encrypted = Buffer.concat([cipher.update(token, "utf8"), cipher.final()]);
  const tag = cipher.getAuthTag();

  return `${iv.toString("base64url")}.${tag.toString("base64url")}.${encrypted.toString("base64url")}`;
}

export function decryptToken(payload: string): string {
  const [ivPart, tagPart, encryptedPart] = payload.split(".");

  if (!ivPart || !tagPart || !encryptedPart) {
    throw new Error("Invalid encrypted token payload.");
  }

  const key = getEncryptionKey();
  const decipher = createDecipheriv(
    ENCRYPTION_ALGORITHM,
    key,
    Buffer.from(ivPart, "base64url"),
  );

  decipher.setAuthTag(Buffer.from(tagPart, "base64url"));

  const decrypted = Buffer.concat([
    decipher.update(Buffer.from(encryptedPart, "base64url")),
    decipher.final(),
  ]);

  return decrypted.toString("utf8");
}
