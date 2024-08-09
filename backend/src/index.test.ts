import { Hono } from "hono";
import { Context } from "hono/jsx";
import { cors } from "hono/cors";

// Importing `app` for testing
import app from "./index"; // Ajustez le chemin selon votre structure

describe("API Tests", () => {
  let testApp: Hono;

  beforeAll(() => {
    process.env.FRONTEND_URL = "http://localhost:3000";
  });

  beforeEach(() => {
    // Réinitialisez l'app avant chaque test si nécessaire
    testApp = new Hono();
    // Configurez votre app de test ici...
  });

  it("should return 200 for GET /", async () => {
    const res = await app.request("/");
    expect(res.status).toBe(200);
  });

  /* it("should handle CORS", async () => {
    const res = await app.request("/", {
      method: "OPTIONS",
      headers: {
        Origin: "https://example.com",
      },
    });
    expect(res.headers.get("Access-Control-Allow-Origin")).toBe(
      "https://example.com"
    );
  }); */

  // Ajoutez plus de tests pour vos routes et fonctionnalités
});


