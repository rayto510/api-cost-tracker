// src/services/authService.effect.ts
import jwt from "jsonwebtoken";
import * as Effect from "@effect/io/Effect";
import { prisma } from "@db/db";
import { compare } from "bcryptjs";

const SECRET = "super-secret-jwt-key"; // for MVP, in env later
const REFRESH_SECRET = "refresh-secret-key";

export const signTokenEffect = (userId: string) =>
  Effect.sync(() => jwt.sign({ userId }, SECRET, { expiresIn: "15m" }));

export const signRefreshTokenEffect = (userId: string) =>
  Effect.sync(() => jwt.sign({ userId }, REFRESH_SECRET, { expiresIn: "7d" }));

export const verifyTokenEffect = (token: string) =>
  Effect.sync(() => jwt.verify(token, SECRET) as { userId: string });

export const verifyRefreshTokenEffect = (token: string) =>
  Effect.sync(() => jwt.verify(token, REFRESH_SECRET) as { userId: string });
