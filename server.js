const express = require("express");
const path = require("path");
require("dotenv").config();
const pool = require("./db");

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());

/* ==========================
   USUARIOS
========================== */
app.get("/api/users", async (req, res) => {
  try {
    const result = await pool.query("SELECT * FROM users");
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: "Error obteniendo usuarios" });
  }
});

app.post("/api/users", async (req, res) => {
  try {
    const { name, role } = req.body;
    const result = await pool.query(
      "INSERT INTO users (name, role) VALUES ($1,$2) RETURNING *",
      [name, role]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: "Error creando usuario" });
  }
});

/* ==========================
   PRODUCTOS
========================== */
app.get("/api/products", async (req, res) => {
  try {
    const result = await pool.query("SELECT * FROM products");
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: "Error obteniendo productos" });
  }
});

app.post("/api/products", async (req, res) => {
  try {
    const { name, price, stock } = req.body;
    const result = await pool.query(
      "INSERT INTO products (name, price, stock) VALUES ($1,$2,$3) RETURNING *",
      [name, price, stock]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: "Error creando producto" });
  }
});

app.put("/api/products/:id", async (req, res) => {
  try {
    const { name, price, stock } = req.body;
    const { id } = req.params;
    const result = await pool.query(
      "UPDATE products SET name=$1, price=$2, stock=$3 WHERE id=$4 RETURNING *",
      [name, price, stock, id]
    );
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: "Error actualizando producto" });
  }
});

app.delete("/api/products/:id", async (req, res) => {
  try {
    const { id } = req.params;
    await pool.query("DELETE FROM products WHERE id=$1", [id]);
    res.json({ message: "Producto eliminado" });
  } catch (err) {
    res.status(500).json({ error: "Error eliminando producto" });
  }
});

/* ==========================
   PEDIDOS
========================== */
app.get("/api/orders", async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT o.id, u.name AS usuario, p.name AS producto, o.quantity, o.status
      FROM orders o
      JOIN users u ON o.user_id = u.id
      JOIN products p ON o.product_id = p.id
    `);
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: "Error obteniendo pedidos" });
  }
});

app.post("/api/orders", async (req, res) => {
  try {
    const { userId, productId, quantity, status } = req.body;

    // verificar stock
    const product = await pool.query("SELECT stock FROM products WHERE id=$1", [productId]);
    if (product.rows.length === 0 || product.rows[0].stock < quantity) {
      return res.status(400).json({ error: "Stock insuficiente" });
    }

    // disminuir stock
    await pool.query("UPDATE products SET stock=stock-$1 WHERE id=$2", [quantity, productId]);

    const result = await pool.query(
      "INSERT INTO orders (user_id, product_id, quantity, status) VALUES ($1,$2,$3,$4) RETURNING *",
      [userId, productId, quantity, status]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: "Error creando pedido" });
  }
});

/* ==========================
   FRONTEND ESTÁTICO
========================== */
app.use(express.static(path.join(__dirname, "public")));

app.listen(PORT, () => {
  console.log(`Servidor corriendo en http://localhost:${PORT}`);
});

/* ==========================
   Health Check
========================== */
app.get("/health", (req, res) => {
  res.status(200).json({
    status: "ok",
    uptime: process.uptime(),
    timestamp: Date.now()
  });
});