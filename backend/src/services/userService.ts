// src/services/userService.ts
import * as Effect from "@effect/io/Effect";
import { prisma } from "@db/db.js";
import bcrypt from "bcryptjs";

export interface User {
  id: string;
  name: string;
  email: string;
  passwordHash: string;
}

// --- Create a user ---
export const createUserEffect = (
  name: string,
  email: string,
  password: string
) =>
  Effect.tryPromise({
    try: async () => {
      const hashed = await bcrypt.hash(password, 10);
      const user = await prisma.user.create({
        data: { name, email, passwordHash: hashed },
      });
      return user;
    },
    catch: (err) => new Error(`Failed to create user: ${String(err)}`),
  });

// --- Get user by ID ---
export const getUserEffect = (id: string) =>
  Effect.tryPromise({
    try: async () => {
      const user = await prisma.user.findUnique({ where: { id } });
      if (!user) return null;
      const { passwordHash, ...rest } = user;
      return rest;
    },
    catch: (err) => err as Error,
  });

// --- Update user ---
export const updateUserEffect = (
  id: string,
  data: { name?: string; email?: string }
) =>
  Effect.tryPromise({
    try: async () => {
      const user = await prisma.user.update({
        where: { id },
        data,
      });
      const { passwordHash, ...rest } = user;
      return rest;
    },
    catch: (err) => err as Error,
  });

// --- Delete user ---
export const deleteUserEffect = (id: string) =>
  Effect.tryPromise({
    try: async () => {
      await prisma.user.delete({ where: { id } });
      return { message: "User deleted" };
    },
    catch: (err) => err as Error,
  });

// --- Authenticate user ---
export const authenticateUserEffect = (email: string, password: string) =>
  Effect.tryPromise({
    try: async () => {
      const user = await prisma.user.findUnique({ where: { email } });
      if (!user) return null;

      const valid = await bcrypt.compare(password, user.passwordHash);
      if (!valid) return null;

      const { passwordHash, ...rest } = user;
      return rest;
    },
    catch: (err) => err as Error,
  });
