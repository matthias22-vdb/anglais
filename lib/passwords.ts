const PASSWORD_ITERATIONS = 210_000;
const encoder = new TextEncoder();
const TEMP_ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789";

function bytesToHex(bytes: Uint8Array) {
  return Array.from(bytes, (byte) => byte.toString(16).padStart(2, "0")).join("");
}

function hexToBytes(value: string) {
  if (!/^[0-9a-f]+$/i.test(value) || value.length % 2) return new Uint8Array();
  const bytes = new Uint8Array(value.length / 2);
  for (let index = 0; index < bytes.length; index += 1) bytes[index] = Number.parseInt(value.slice(index * 2, index * 2 + 2), 16);
  return bytes;
}

function randomHex(length: number) {
  const bytes = new Uint8Array(length);
  crypto.getRandomValues(bytes);
  return bytesToHex(bytes);
}

async function derive(password: string, salt: Uint8Array, iterations: number) {
  const material = await crypto.subtle.importKey("raw", encoder.encode(password), "PBKDF2", false, ["deriveBits"]);
  const saltBuffer = salt.slice().buffer as ArrayBuffer;
  const bits = await crypto.subtle.deriveBits({ name: "PBKDF2", hash: "SHA-256", salt: saltBuffer, iterations }, material, 256);
  return bytesToHex(new Uint8Array(bits));
}

export function normalizeUsername(value: string) {
  return value.trim().toLocaleLowerCase("fr").normalize("NFKC");
}

export function isValidUsername(value: string) {
  return /^[a-z0-9][a-z0-9._-]{2,39}$/.test(value);
}

export function validatePassword(value: string) {
  if (value.length < 10) return "Le mot de passe doit contenir au moins 10 caractères.";
  if (value.length > 128) return "Le mot de passe est trop long.";
  return null;
}

export async function hashPassword(password: string) {
  const salt = randomHex(16);
  return { hash: await derive(password, hexToBytes(salt), PASSWORD_ITERATIONS), salt, iterations: PASSWORD_ITERATIONS };
}

export async function verifyPassword(password: string, expectedHash: string, salt: string, iterations: number) {
  if (!expectedHash || !salt || iterations < 100_000) return false;
  const actual = await derive(password, hexToBytes(salt), iterations);
  if (actual.length !== expectedHash.length) return false;
  let difference = 0;
  for (let index = 0; index < actual.length; index += 1) difference |= actual.charCodeAt(index) ^ expectedHash.charCodeAt(index);
  return difference === 0;
}

export function generateTemporaryPassword() {
  const bytes = new Uint8Array(12);
  crypto.getRandomValues(bytes);
  let password = "Ep-";
  for (const byte of bytes) password += TEMP_ALPHABET[byte % TEMP_ALPHABET.length];
  return password;
}

export function generateSessionToken() {
  return randomHex(32);
}

export async function hashSessionToken(token: string) {
  const digest = await crypto.subtle.digest("SHA-256", encoder.encode(token));
  return bytesToHex(new Uint8Array(digest));
}
