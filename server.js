const express = require('express');
const Database = require('better-sqlite3');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

// ミドルウェア
app.use(express.json());
app.use(express.static(path.join(__dirname)));

// データベース初期化
const db = new Database('stock.db');
db.pragma('journal_mode = WAL');

db.exec(`
  CREATE TABLE IF NOT EXISTS items (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    category TEXT NOT NULL,
    quantity INTEGER NOT NULL DEFAULT 0,
    minQuantity INTEGER NOT NULL DEFAULT 1,
    unit TEXT NOT NULL DEFAULT '個',
    createdAt TEXT NOT NULL,
    updatedAt TEXT NOT NULL
  )
`);

// API: アイテム一覧取得
app.get('/api/items', (req, res) => {
  const items = db.prepare('SELECT * FROM items ORDER BY category, name').all();
  res.json(items);
});

// API: アイテム追加
app.post('/api/items', (req, res) => {
  const { id, name, category, quantity, minQuantity, unit, createdAt, updatedAt } = req.body;

  const stmt = db.prepare(`
    INSERT INTO items (id, name, category, quantity, minQuantity, unit, createdAt, updatedAt)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `);

  stmt.run(id, name, category, quantity, minQuantity, unit, createdAt, updatedAt);
  res.status(201).json({ success: true });
});

// API: アイテム更新
app.put('/api/items/:id', (req, res) => {
  const { id } = req.params;
  const { name, category, quantity, minQuantity, unit, updatedAt } = req.body;

  const stmt = db.prepare(`
    UPDATE items
    SET name = ?, category = ?, quantity = ?, minQuantity = ?, unit = ?, updatedAt = ?
    WHERE id = ?
  `);

  const result = stmt.run(name, category, quantity, minQuantity, unit, updatedAt, id);

  if (result.changes === 0) {
    res.status(404).json({ error: 'Item not found' });
  } else {
    res.json({ success: true });
  }
});

// API: アイテム削除
app.delete('/api/items/:id', (req, res) => {
  const { id } = req.params;

  const stmt = db.prepare('DELETE FROM items WHERE id = ?');
  const result = stmt.run(id);

  if (result.changes === 0) {
    res.status(404).json({ error: 'Item not found' });
  } else {
    res.json({ success: true });
  }
});

// サーバー起動
app.listen(PORT, '0.0.0.0', () => {
  console.log(`在庫管理サーバー起動: http://localhost:${PORT}`);
});
