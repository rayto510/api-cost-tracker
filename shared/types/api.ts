import { Schema } from "@effect/schema";

// Shared types for API requests and responses
export interface CostEntry {
  id: string;
  apiName: string;
  provider: string;
  cost: number;
  currency: string;
  timestamp: Date;
  metadata?: Record<string, unknown>;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface CreateCostRequest {
  apiName: string;
  provider: string;
  cost: number;
  currency: string;
  metadata?: Record<string, unknown>;
}

export interface UpdateCostRequest {
  apiName?: string;
  provider?: string;
  cost?: number;
  currency?: string;
  metadata?: Record<string, unknown>;
}

export interface CostQueryParams {
  provider?: string;
  apiName?: string;
  startDate?: string;
  endDate?: string;
  limit?: number;
  offset?: number;
}

export interface ApiResponse<T> {
  data: T;
  message?: string;
  timestamp: string;
}

export interface ApiErrorResponse {
  error: string;
  code?: string;
  timestamp: string;
  details?: unknown;
}

export interface PaginatedResponse<T> {
  data: T[];
  pagination: {
    total: number;
    limit: number;
    offset: number;
    hasNext: boolean;
    hasPrevious: boolean;
  };
}

// Effect-TS Schemas for validation
export const CostEntrySchema = Schema.Struct({
  id: Schema.String,
  apiName: Schema.String,
  provider: Schema.String,
  cost: Schema.Number,
  currency: Schema.String,
  timestamp: Schema.DateFromString,
  metadata: Schema.optional(Schema.Record(Schema.String, Schema.Unknown)),
  createdAt: Schema.optional(Schema.DateFromString),
  updatedAt: Schema.optional(Schema.DateFromString),
});

export const CreateCostRequestSchema = Schema.Struct({
  apiName: Schema.String.pipe(Schema.minLength(1)),
  provider: Schema.String.pipe(Schema.minLength(1)),
  cost: Schema.Number.pipe(Schema.positive()),
  currency: Schema.String.pipe(Schema.minLength(3), Schema.maxLength(3)),
  metadata: Schema.optional(Schema.Record(Schema.String, Schema.Unknown)),
});

export const UpdateCostRequestSchema = Schema.Struct({
  apiName: Schema.optional(Schema.String.pipe(Schema.minLength(1))),
  provider: Schema.optional(Schema.String.pipe(Schema.minLength(1))),
  cost: Schema.optional(Schema.Number.pipe(Schema.positive())),
  currency: Schema.optional(Schema.String.pipe(Schema.minLength(3), Schema.maxLength(3))),
  metadata: Schema.optional(Schema.Record(Schema.String, Schema.Unknown)),
});

export const CostQueryParamsSchema = Schema.Struct({
  provider: Schema.optional(Schema.String),
  apiName: Schema.optional(Schema.String),
  startDate: Schema.optional(Schema.DateFromString),
  endDate: Schema.optional(Schema.DateFromString),
  limit: Schema.optional(Schema.Number.pipe(Schema.positive(), Schema.lessThanOrEqualTo(100))),
  offset: Schema.optional(Schema.Number.pipe(Schema.nonNegative())),
});

// Helper types for common API patterns
export type ApiResult<T> = ApiResponse<T> | ApiErrorResponse;
export type CostEntryResult = ApiResult<CostEntry>;
export type CostListResult = ApiResult<CostEntry[]>;
export type PaginatedCostResult = ApiResult<PaginatedResponse<CostEntry>>;

// Provider and API name enums (can be extended)
export enum ApiProvider {
  OPENAI = "openai",
  ANTHROPIC = "anthropic",
  GOOGLE = "google",
  AWS = "aws",
  AZURE = "azure",
  OTHER = "other",
}

export enum Currency {
  USD = "USD",
  EUR = "EUR",
  GBP = "GBP",
  JPY = "JPY",
  CAD = "CAD",
  AUD = "AUD",
}
