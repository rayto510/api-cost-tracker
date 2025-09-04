import { Context, Effect, Layer } from "effect";
import { Schema } from "@effect/schema";
import axios, { AxiosInstance } from "axios";
import type { CostEntry, CreateCostRequest, UpdateCostRequest } from "@shared/types/api";

// Axios-based HTTP client using Effect-TS
export interface HttpClient {
  get: <T>(url: string) => Effect.Effect<T>;
  post: <T>(url: string, data: unknown) => Effect.Effect<T>;
  put: <T>(url: string, data: unknown) => Effect.Effect<T>;
  delete: (url: string) => Effect.Effect<void>;
}

export const HttpClient = Context.GenericTag<HttpClient>("HttpClient");

const createHttpClient = (baseURL: string): HttpClient => {
  const client: AxiosInstance = axios.create({
    baseURL,
    headers: {
      "Content-Type": "application/json",
    },
  });

  return {
    get: <T>(url: string) =>
      Effect.tryPromise({
        try: () => client.get(url).then(response => response.data),
        catch: (error) => new Error(`GET ${url} failed: ${error}`),
      }),
    
    post: <T>(url: string, data: unknown) =>
      Effect.tryPromise({
        try: () => client.post(url, data).then(response => response.data),
        catch: (error) => new Error(`POST ${url} failed: ${error}`),
      }),
    
    put: <T>(url: string, data: unknown) =>
      Effect.tryPromise({
        try: () => client.put(url, data).then(response => response.data),
        catch: (error) => new Error(`PUT ${url} failed: ${error}`),
      }),
    
    delete: (url: string) =>
      Effect.tryPromise({
        try: () => client.delete(url).then(() => void 0),
        catch: (error) => new Error(`DELETE ${url} failed: ${error}`),
      }),
  };
};

// API Client service
export interface ApiClient {
  getAllCosts: () => Effect.Effect<CostEntry[]>;
  getCostById: (id: string) => Effect.Effect<CostEntry>;
  createCost: (request: CreateCostRequest) => Effect.Effect<CostEntry>;
  updateCost: (id: string, request: UpdateCostRequest) => Effect.Effect<CostEntry>;
  deleteCost: (id: string) => Effect.Effect<void>;
}

export const ApiClient = Context.GenericTag<ApiClient>("ApiClient");

const makeApiClient = Effect.gen(function* (_) {
  const http = yield* _(HttpClient);

  const getAllCosts = () => 
    http.get<CostEntry[]>("/api/costs");

  const getCostById = (id: string) =>
    http.get<CostEntry>(`/api/costs/${id}`);

  const createCost = (request: CreateCostRequest) =>
    http.post<CostEntry>("/api/costs", request);

  const updateCost = (id: string, request: UpdateCostRequest) =>
    http.put<CostEntry>(`/api/costs/${id}`, request);

  const deleteCost = (id: string) =>
    http.delete(`/api/costs/${id}`);

  return {
    getAllCosts,
    getCostById,
    createCost,
    updateCost,
    deleteCost,
  } satisfies ApiClient;
});

// Layers
const HttpClientLive = Layer.succeed(
  HttpClient,
  createHttpClient(process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001")
);

export const ApiClientLive = Layer.effect(ApiClient, makeApiClient).pipe(
  Layer.provide(HttpClientLive)
);
