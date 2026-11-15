require('dotenv').config();
const express = require('express');
const mysql = require('mysql2/promise');
const path = require('path');

const app = express();
app.disable('x-powered-by');

const USE_MOCK_DB = process.env.USE_MOCK_DB === 'true';

// Mock database for testing without MySQL
let mockContacts = [
  { id: 1, nama: 'Budi Santoso', no_hp: '081234567890', email: 'budi@example.com', alamat: 'Jl. Melati No. 1, Jakarta' },
  { id: 2, nama: 'Siti Rahayu', no_hp: '081298765432', email: 'siti@example.com', alamat: 'Jl. Anggrek No. 2, Bandung' },
  { id: 3, nama: 'Ahmad Hidayat', no_hp: '081234560099', email: 'ahmad@example.com', alamat: 'Jl. Mawar No. 3, Surabaya' }
];

// Cloud DB hosts (TiDB Cloud, PlanetScale, RDS, ...) require TLS; localhost does not.
const dbHost = process.env.DB_HOST || 'localhost';
const isLocalDb = dbHost === 'localhost' || dbHost === '127.0.0.1';
const useSsl = process.env.DB_SSL !== undefined ? process.env.DB_SSL === 'true' : !isLocalDb;

const pool = USE_MOCK_DB ? null : mysql.createPool({
  host: dbHost,
  port: process.env.DB_PORT || 3306,
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'buku_kontak',
  ssl: useSsl ? { minVersion: 'TLSv1.2', rejectUnauthorized: true } : undefined,
  waitForConnections: true,
  connectionLimit: 5,
  queueLimit: 0,
  charset: 'utf8mb4'
});

// Security headers
app.use((req, res, next) => {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('X-XSS-Protection', '1; mode=block');
  next();
});

app.use(express.json({ limit: '10kb' }));
app.use(express.static(path.join(__dirname, '..', 'public')));

// Allow frontend in public/ to call the API when served from a different port during development
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Content-Type');
  res.header('Vary', 'Origin');
  if (req.method === 'OPTIONS') {
    return res.status(204).end();
  }
  next();
});

const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const noHpRegex = /^[0-9]{10,15}$/;
const LIMITS = { nama: 100, no_hp: 15, email: 100, alamat: 1000 };
const VALIDATION_ERROR = 'Data tidak valid. Pastikan nama (maks 100 karakter), nomor HP (10-15 digit angka), email valid (maks 100 karakter), dan alamat (maks 1000 karakter) diisi dengan benar.';
const ID_ERROR = 'ID kontak tidak valid';

// Trim, validate, and return a clean record. Returns null when invalid.
function sanitizeContact(body) {
  if (!body || typeof body !== 'object' || Array.isArray(body)) return null;

  const out = {};
  for (const field of ['nama', 'no_hp', 'email', 'alamat']) {
    const value = body[field];
    if (typeof value !== 'string') return null;
    const trimmed = value.trim();
    if (trimmed === '') return null;
    if (trimmed.length > LIMITS[field]) return null;
    out[field] = trimmed;
  }

  if (!emailRegex.test(out.email)) return null;
  if (!noHpRegex.test(out.no_hp)) return null;

  return out;
}

// :id must be a strictly positive decimal integer
function parseId(raw) {
  if (typeof raw !== 'string' && typeof raw !== 'number') return null;
  const str = String(raw).trim();
  if (!/^[1-9]\d*$/.test(str)) return null;
  const id = parseInt(str, 10);
  return Number.isSafeInteger(id) && id > 0 ? id : null;
}

// GET all contacts
app.get('/api/contacts', async (req, res) => {
  try {
    if (USE_MOCK_DB) {
      return res.json([...mockContacts].sort((a, b) => b.id - a.id));
    }
    const [rows] = await pool.query('SELECT id, nama, no_hp, email, alamat FROM contacts ORDER BY id DESC');
    res.json(rows);
  } catch (error) {
    console.error('GET /api/contacts failed:', error.message);
    res.status(500).json({ error: 'Gagal mengambil data kontak' });
  }
});

// GET single contact
app.get('/api/contacts/:id', async (req, res) => {
  const id = parseId(req.params.id);
  if (id === null) {
    return res.status(400).json({ error: ID_ERROR });
  }
  try {
    if (USE_MOCK_DB) {
      const contact = mockContacts.find((c) => c.id === id);
      if (!contact) {
        return res.status(404).json({ error: 'Kontak tidak ditemukan' });
      }
      return res.json(contact);
    }
    const [rows] = await pool.query('SELECT id, nama, no_hp, email, alamat FROM contacts WHERE id = ?', [id]);
    if (rows.length === 0) {
      return res.status(404).json({ error: 'Kontak tidak ditemukan' });
    }
    res.json(rows[0]);
  } catch (error) {
    console.error('GET /api/contacts/:id failed:', error.message);
    res.status(500).json({ error: 'Gagal mengambil data kontak' });
  }
});

// POST new contact
app.post('/api/contacts', async (req, res) => {
  const data = sanitizeContact(req.body);
  if (!data) {
    return res.status(400).json({ error: VALIDATION_ERROR });
  }
  try {
    if (USE_MOCK_DB) {
      const id = mockContacts.reduce((max, c) => Math.max(max, c.id), 0) + 1;
      const contact = { id, ...data };
      mockContacts.push(contact);
      return res.status(201).json(contact);
    }
    const [result] = await pool.query(
      'INSERT INTO contacts (nama, no_hp, email, alamat) VALUES (?, ?, ?, ?)',
      [data.nama, data.no_hp, data.email, data.alamat]
    );
    const [rows] = await pool.query('SELECT id, nama, no_hp, email, alamat FROM contacts WHERE id = ?', [result.insertId]);
    res.status(201).json(rows[0]);
  } catch (error) {
    console.error('POST /api/contacts failed:', error.message);
    res.status(500).json({ error: 'Gagal menyimpan kontak' });
  }
});

// PUT update contact
app.put('/api/contacts/:id', async (req, res) => {
  const id = parseId(req.params.id);
  if (id === null) {
    return res.status(400).json({ error: ID_ERROR });
  }
  const data = sanitizeContact(req.body);
  if (!data) {
    return res.status(400).json({ error: VALIDATION_ERROR });
  }
  try {
    if (USE_MOCK_DB) {
      const index = mockContacts.findIndex((c) => c.id === id);
      if (index === -1) {
        return res.status(404).json({ error: 'Kontak tidak ditemukan' });
      }
      mockContacts[index] = { ...mockContacts[index], ...data };
      return res.json(mockContacts[index]);
    }
    const [result] = await pool.query(
      'UPDATE contacts SET nama = ?, no_hp = ?, email = ?, alamat = ? WHERE id = ?',
      [data.nama, data.no_hp, data.email, data.alamat, id]
    );
    if (result.affectedRows === 0) {
      return res.status(404).json({ error: 'Kontak tidak ditemukan' });
    }
    const [rows] = await pool.query('SELECT id, nama, no_hp, email, alamat FROM contacts WHERE id = ?', [id]);
    res.json(rows[0]);
  } catch (error) {
    console.error('PUT /api/contacts/:id failed:', error.message);
    res.status(500).json({ error: 'Gagal memperbarui kontak' });
  }
});

// DELETE contact
app.delete('/api/contacts/:id', async (req, res) => {
  const id = parseId(req.params.id);
  if (id === null) {
    return res.status(400).json({ error: ID_ERROR });
  }
  try {
    if (USE_MOCK_DB) {
      const index = mockContacts.findIndex((c) => c.id === id);
      if (index === -1) {
        return res.status(404).json({ error: 'Kontak tidak ditemukan' });
      }
      mockContacts.splice(index, 1);
      return res.status(204).send();
    }
    const [result] = await pool.query('DELETE FROM contacts WHERE id = ?', [id]);
    if (result.affectedRows === 0) {
      return res.status(404).json({ error: 'Kontak tidak ditemukan' });
    }
    res.status(204).send();
  } catch (error) {
    console.error('DELETE /api/contacts/:id failed:', error.message);
    res.status(500).json({ error: 'Gagal menghapus kontak' });
  }
});

app.get('/api', (req, res) => {
  res.json({ message: 'Buku Kontak API is running' });
});

// Body-parser / unexpected errors: never leak stack traces or MySQL details to the client.
app.use((err, req, res, next) => {
  const status = err.type === 'entity.too.large' ? 413 : err.status || 500;
  if (status >= 500) {
    console.error('Unhandled error:', err.message);
  }
  res.status(status).json({ error: status === 413 ? 'Ukuran payload terlalu besar (maks 10kb)' : 'Terjadi kesalahan pada server' });
});

module.exports = app;

if (require.main === module) {
  const PORT = process.env.PORT || 3000;
  app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
  });
}