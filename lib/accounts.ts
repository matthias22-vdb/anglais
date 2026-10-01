import { getDb } from "../db";
import { users } from "../db/schema";
import type { UserRole } from "./access";
import { generateTemporaryPassword, hashPassword, isValidUsername, normalizeUsername } from "./passwords";

export async function createLocalAccount(input: { username: string; displayName: string; role: UserRole }) {
  const username = normalizeUsername(input.username);
  const displayName = input.displayName.trim().replace(/\s+/g, " ");
  if (!isValidUsername(username)) throw new Error("IDENTIFIER_INVALID");
  if (displayName.length < 2 || displayName.length > 80) throw new Error("DISPLAY_NAME_INVALID");
  const temporaryPassword = generateTemporaryPassword();
  const password = await hashPassword(temporaryPassword);
  const userId = crypto.randomUUID();
  const now = new Date().toISOString();
  try {
    await getDb().insert(users).values({
      userId,
      email: `${username}@accounts.english-pocket.invalid`,
      displayName,
      role: input.role,
      username,
      passwordHash: password.hash,
      passwordSalt: password.salt,
      passwordIterations: password.iterations,
      mustChangePassword: true,
      updatedAt: now,
    });
  } catch (error) {
    if (String(error).toLocaleLowerCase("fr").includes("unique")) throw new Error("USERNAME_TAKEN");
    throw error;
  }
  return { userId, username, displayName, role: input.role, temporaryPassword };
}
