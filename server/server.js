const express = require('express');
const fs = require('fs').promises;
const path = require('path');
const cors = require('cors');

const app = express();
app.use(cors());
app.use(express.json());

const DATA_DIR = path.join(__dirname, 'data');
const REVIEWS_FILE = path.join(DATA_DIR, 'reviews.json');
const ORDERS_FILE = path.join(DATA_DIR, 'orders.json');

async function ensureDataDir() {
    try {
        await fs.mkdir(DATA_DIR, { recursive: true });
    } catch (e) {
        // ignore
    }
}

async function readJson(file) {
    try {
        const txt = await fs.readFile(file, 'utf8');
        return JSON.parse(txt || '[]');
    } catch (e) {
        return [];
    }
}

async function writeJson(file, data) {
    await fs.writeFile(file, JSON.stringify(data, null, 2), 'utf8');
}

app.get('/api/health', (req, res) => res.json({ ok: true, time: Date.now() }));

app.get('/api/reviews', async (req, res) => {
    await ensureDataDir();
    const reviews = await readJson(REVIEWS_FILE);
    res.json(reviews);
});

app.post('/api/reviews', async (req, res) => {
    const review = req.body;
    if (!review) return res.status(400).json({ error: 'Missing review body' });
    await ensureDataDir();
    const reviews = await readJson(REVIEWS_FILE);
    review.id = review.id || Date.now();
    review.date = review.date || new Date().toLocaleDateString();
    reviews.unshift(review);
    await writeJson(REVIEWS_FILE, reviews);
    res.json({ ok: true, reviews });
});

app.post('/api/orders', async (req, res) => {
    const order = req.body;
    if (!order) return res.status(400).json({ error: 'Missing order body' });
    await ensureDataDir();
    const orders = await readJson(ORDERS_FILE);
    order.id = order.id || Date.now();
    order.date = order.date || new Date().toISOString();
    orders.unshift(order);
    await writeJson(ORDERS_FILE, orders);
    res.json({ ok: true, order });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`GleeJeYly API server listening on http://localhost:${PORT}`);
});
