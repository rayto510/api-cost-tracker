// src/services/userService.effect.ts
import * as Effect from "@effect/io/Effect";
import { v4 as uuidv4 } from "uuid";
import bcrypt from "bcryptjs";

export interface User {
  id: string;
  name: string;
  email: string;
  passwordHash: string;
}

export const users: Record<string, User> = {};

// --- Create a user ---
export const createUserEffect = (user: {
  name: string;
  email: string;
  password: string;
}) =>
  Effect.sync(() => {
    const id = uuidv4();
    const passwordHash = bcrypt.hashSync(user.password, 10);
    const newUser: User = {
      id,
      name: user.name,
      email: user.email,
      passwordHash,
    };
    users[id] = newUser;
    return { id, name: newUser.name, email: newUser.email };
  });

// --- Get user by ID ---
export const getUserEffect = (id: string) =>
  Effect.sync(() => {
    const user = users[id];
    if (!user) return null;
    return { id: user.id, name: user.name, email: user.email };
  });

// --- Update user ---
export const updateUserEffect = (
  id: string,
  data: { name?: string; email?: string }
) =>
  Effect.sync(() => {
    if (!users[id]) return null;
    users[id] = { ...users[id], ...data };
    const { passwordHash, ...rest } = users[id];
    return rest;
  });

// --- Delete user ---
export const deleteUserEffect = (id: string) =>
  Effect.sync(() => {
    if (!users[id]) return null;
    delete users[id];
    return { message: "User deleted" };
  });

// --- Authenticate user ---
export const authenticateUserEffect = (email: string, password: string) =>
  Effect.sync(() => {
    const user = Object.values(users).find((u) => u.email === email);
    if (!user) return null;
    const valid = bcrypt.compareSync(password, user.passwordHash);
    return valid ? { id: user.id, name: user.name, email: user.email } : null;
  });
