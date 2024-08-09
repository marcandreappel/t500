import { Hono } from "hono";
import { cors } from "hono/cors";
import { z as validator } from "zod";
import { createClient } from "@libsql/client";

// Type declaration for variables
type Bindings = {
  FRONTEND_URL: string;
  SQLITE_URL: string;
  SQLITE_TOKEN: string;
};

// Configuration for libSQL
const db = (env: Bindings) => {
  return createClient({
    url: env.SQLITE_URL || "",
    authToken: env.SQLITE_TOKEN,
  });
};

// Validation rules
const CartItemSchema = validator.object({
  product_id: validator.string().ulid(),
});
const CartSchema = validator.array(CartItemSchema);

// SQLite helpers
async function getCart(session_id: string, env: any) {
  const result = await db(env).execute({
    sql: "SELECT cart FROM carts WHERE session_id = ?",
    args: [session_id],
  });
  if (result.rows.length === 0 || result.rows[0].cart === null) {
    return [];
  }
  
  return JSON.parse(result.rows[0].cart as string);
}

async function updateCart(session_id: string, env: any, cart: any[]) {
  await db(env).execute({
    sql: "INSERT OR REPLACE INTO carts (session_id, cart) VALUES (?, ?) ON CONFLICT (session_id) DO UPDATE SET cart = ?",
    args: [session_id, JSON.stringify(cart), JSON.stringify(cart)],
  });
}

// Application init
const app = new Hono<{ Bindings: Bindings }>();

// Configuration for CORS
app.use("/*", async (ctx, next) => {
  const cors_middleware = cors({
    origin: ctx.env.FRONTEND_URL,
    allowMethods: ["GET", "POST", "DELETE"],
  });

  return cors_middleware(ctx, next);
});

// Routes
app.get("/", (c) =>
  c.text(
    "Hello there! \nThis is not the page you're looking for... \nmove along... \nmove along!"
  )
);

app.get("/cart", async (ctx) => {
  const session_id = ctx.req.header("X-Session-ID");
  if (!session_id) {
    return ctx.json({ error: "Missing session ID" }, 400);
  }
  const cart = await getCart(session_id, ctx.env);

  return ctx.json(cart);
});

app.post("/cart", async (ctx) => {
  const session_id = ctx.req.header("X-Session-ID");
  if (!session_id) {
    return ctx.json({ error: "Missing session ID" }, 400);
  }

  try {
    const body = await ctx.req.json();
    const item = CartItemSchema.parse(body);

    let cart = await getCart(session_id, ctx.env);
    const existing_item_index = cart.findIndex(
      (i: any) => i.product_id === item.product_id
    );

    if (existing_item_index === -1) {
      cart.push(item);
    }
    await updateCart(session_id, ctx.env, cart);

    return ctx.json({ message: "Item added to cart" });
  } catch (error) {
    if (error instanceof validator.ZodError) {
      return ctx.json({ error: "Zod: " + error.errors }, 400);
    }
    return ctx.json({ error: "An unexpected error occurred" }, 400);
  }
});

app.delete("/cart/:product_id", async (ctx) => {
  const session_id = ctx.req.header("X-Session-ID");
  if (!session_id) return ctx.json({ error: "Missing session ID" }, 400);

  const product_id = ctx.req.param("product_id");
  let cart = await getCart(session_id, ctx.env);
  cart = cart.filter((item: any) => item.product_id !== product_id);

  await updateCart(session_id, ctx.env, cart);

  return ctx.json({ message: "Item removed from cart" });
});

export default app;


