import { createCipheriv, createDecipheriv, createHash, randomBytes } from "node:crypto";

const ALGORITHM = "aes-256-gcm";
const IV_LENGTH = 12;

const getRawKeyMaterial = (env: NodeJS.ProcessEnv = process.env) => env.CREDENTIAL_ENCRYPTION_KEY || "";

const getKey = (env: NodeJS.ProcessEnv = process.env) => {
  const rawKeyMaterial = getRawKeyMaterial(env);
  if (!rawKeyMaterial) {
    throw new Error(
      "CREDENTIAL_ENCRYPTION_KEY must be configured to encrypt stored provider credentials.",
    );
  }

  return createHash("sha256").update(rawKeyMaterial).digest();
};

export const encryptCredentials = (
  credentials: Record<string, unknown>,
  env: NodeJS.ProcessEnv = process.env,
) => {
  const iv = randomBytes(IV_LENGTH);
  const cipher = createCipheriv(ALGORITHM, getKey(env), iv);
  const plaintext = Buffer.from(JSON.stringify(credentials), "utf8");
  const ciphertext = Buffer.concat([cipher.update(plaintext), cipher.final()]);
  const authTag = cipher.getAuthTag();

  return Buffer.concat([iv, authTag, ciphertext]).toString("base64url");
};

export const decryptCredentials = <T extends Record<string, unknown>>(
  payload: string,
  env: NodeJS.ProcessEnv = process.env,
): T => {
  const buffer = Buffer.from(payload, "base64url");
  const iv = buffer.subarray(0, IV_LENGTH);
  const authTag = buffer.subarray(IV_LENGTH, IV_LENGTH + 16);
  const ciphertext = buffer.subarray(IV_LENGTH + 16);
  const decipher = createDecipheriv(ALGORITHM, getKey(env), iv);
  decipher.setAuthTag(authTag);
  const plaintext = Buffer.concat([
    decipher.update(ciphertext),
    decipher.final(),
  ]).toString("utf8");

  return JSON.parse(plaintext) as T;
};
