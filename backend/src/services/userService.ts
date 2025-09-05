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
export const createUserEffect = (user: {
  name: string;
  email: string;
  password: string;
}) =>
  Effect.tryPromise({
    try: async () => {
      const passwordHash = await bcrypt.hash(user.password, 10);
      const newUser = await prisma.user.create({
        data: {
          name: user.name,
          email: user.email,
          passwordHash,
        },
      });
      return { id: newUser.id, name: newUser.name, email: newUser.email };
    },
    catch: (err) => err as Error,
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
