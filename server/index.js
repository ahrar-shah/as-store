import express from "express";
import bodyParser from "body-parser";
import cors from "cors";
import sqlite3 from "sqlite3";
import { open } from "sqlite";
import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";
import Stripe from "stripe";

const stripe = new Stripe("sk_test_dummy"); // replace with real key
const SECRET = "supersecretkey";
const app = express();
app.use(cors());
app.use(bodyParser.json());

let db;
(async () => {
  db = await open({ filename: "asstore.db", driver: sqlite3.Database });

  await db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      email TEXT UNIQUE,
      password TEXT,
      role TEXT
    );
    CREATE TABLE IF NOT EXISTS products (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      seller_id INTEGER,
      title TEXT,
      description TEXT,
      price INTEGER
    );
    CREATE TABLE IF NOT EXISTS orders (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      buyer_id INTEGER,
      total INTEGER,
      status TEXT
    );
  `);

  // insert sample product
  await db.run(
    `INSERT OR IGNORE INTO products (id, seller_id, title, description, price)
     VALUES (1,1,'Sample Product','Demo item',1000)`
  );
})();

function auth(requiredRole) {
  return (req, res, next) => {
    const token = req.headers.authorization?.split(" ")[1];
    if (!token) return res.sendStatus(401);
    try {
      const user = jwt.verify(token, SECRET);
      if (requiredRole && user.role !== requiredRole && user.role !== "admin") {
        return res.sendStatus(403);
      }
      req.user = user;
      next();
    } catch {
      res.sendStatus(401);
    }
  };
}

// Auth
app.post("/api/auth/register", async (req, res) => {
  const { email, password, role } = req.body;
  const hash = await bcrypt.hash(password, 10);
  try {
    await db.run("INSERT INTO users (email,password,role) VALUES (?,?,?)", [
      email,
      hash,
      role || "buyer",
    ]);
    res.json({ success: true });
  } catch {
    res.status(400).json({ error: "Email exists" });
  }
});

app.post("/api/auth/login", async (req, res) => {
  const { email, password } = req.body;
  const user = await db.get("SELECT * FROM users WHERE email=?", [email]);
  if (!user) return res.status(400).json({ error: "Invalid" });
  const valid = await bcrypt.compare(password, user.password);
  if (!valid) return res.status(400).json({ error: "Invalid" });
  const token = jwt.sign(
    { id: user.id, role: user.role, email: user.email },
    SECRET,
    { expiresIn: "2h" }
  );
  res.json({ token, role: user.role });
});

// Products
app.get("/api/products", async (req, res) => {
  const rows = await db.all("SELECT * FROM products");
  res.json(rows);
});

app.post("/api/seller/products", auth("seller"), async (req, res) => {
  const { title, description, price } = req.body;
  await db.run(
    "INSERT INTO products (seller_id,title,description,price) VALUES (?,?,?,?)",
    [req.user.id, title, description, price]
  );
  res.json({ success: true });
});

// Checkout
app.post("/api/checkout", auth("buyer"), async (req, res) => {
  const { items } = req.body; // [{id, qty}]
  const dbProducts = await db.all(
    `SELECT * FROM products WHERE id IN (${items.map(() => "?").join(",")})`,
    items.map((i) => i.id)
  );
  const total = dbProducts.reduce((sum, p) => {
    const qty = items.find((i) => i.id === p.id)?.qty || 1;
    return sum + p.price * qty;
  }, 0);

  const paymentIntent = await stripe.paymentIntents.create({
    amount: total,
    currency: "usd",
    automatic_payment_methods: { enabled: true },
  });

  const order = await db.run(
    "INSERT INTO orders (buyer_id,total,status) VALUES (?,?,?)",
    [req.user.id, total, "pending"]
  );

  res.json({ clientSecret: paymentIntent.client_secret, orderId: order.lastID });
});

// Admin endpoints
app.get("/api/admin/users", auth("admin"), async (req, res) => {
  const users = await db.all("SELECT id,email,role FROM users");
  res.json(users);
});

app.get("/api/admin/orders", auth("admin"), async (req, res) => {
  const orders = await db.all("SELECT * FROM orders");
  res.json(orders);
});

app.listen(4000, () => console.log("AS Store API running on 4000"));
