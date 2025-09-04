// src/start.ts
import { buildServer } from "./server";

const app = buildServer();

app.listen({ port: 3000 }).then(() => {
  console.log("🚀 Server running at http://localhost:3000");
});
