const express = require('express');
const cors = require('cors');
const fs = require('fs');
const path = require('path');

const app = express();
const PORT = 3000;

// Middleware
app.use(cors());
app.use(express.json());

// Data file paths
const dataDir = path.join(__dirname, 'data');
const ordersFile = path.join(dataDir, 'orders.json');
const reviewsFile = path.join(dataDir, 'reviews.json');

// Ensure data directory exists
if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true });
}

// Ensure data files exist
function ensureDataFile(filepath, defaultData) {
    if (!fs.existsSync(filepath)) {
        fs.writeFileSync(filepath, JSON.stringify(defaultData, null, 2));
    }
}

ensureDataFile(ordersFile, []);
ensureDataFile(reviewsFile, []);

// Helper functions to read/write data
function readOrders() {
    try {
        const data = fs.readFileSync(ordersFile, 'utf-8');
        return JSON.parse(data);
    } catch (e) {
        return [];
    }
}

function writeOrders(orders) {
    fs.writeFileSync(ordersFile, JSON.stringify(orders, null, 2));
}

function readReviews() {
    try {
        const data = fs.readFileSync(reviewsFile, 'utf-8');
        return JSON.parse(data);
    } catch (e) {
        return [];
    }
}

function writeReviews(reviews) {
    fs.writeFileSync(reviewsFile, JSON.stringify(reviews, null, 2));
}

// API Endpoints

// GET /api/orders - Get all orders
app.get('/api/orders', (req, res) => {
    const orders = readOrders();
    res.json(orders);
});

// POST /api/orders - Create a new order
app.post('/api/orders', (req, res) => {
    try {
        const order = req.body;
        const orders = readOrders();
        
        // Add ID and timestamp if not present
        order.id = Date.now();
        order.createdAt = order.createdAt || new Date().toISOString();
        
        orders.push(order);
        writeOrders(orders);
        
        res.json({ success: true, order, orders });
    } catch (e) {
        res.status(400).json({ success: false, error: e.message });
    }
});

// GET /api/reviews - Get all reviews
app.get('/api/reviews', (req, res) => {
    const reviews = readReviews();
    res.json(reviews);
});

// POST /api/reviews - Create a new review
app.post('/api/reviews', (req, res) => {
    try {
        const review = req.body;
        const reviews = readReviews();
        
        // Add ID and timestamp if not present
        review.id = review.id || Date.now();
        review.date = review.date || new Date().toLocaleDateString();
        
        reviews.unshift(review); // Add to front
        writeReviews(reviews);
        
        res.json({ success: true, review, reviews });
    } catch (e) {
        res.status(400).json({ success: false, error: e.message });
    }
});

// Health check
app.get('/api/health', (req, res) => {
    res.json({ status: 'ok', message: 'GleeJeYly API is running' });
});

// Root endpoint
app.get('/', (req, res) => {
    res.json({ message: 'GleeJeYly API Server', version: '1.0.0' });
});

// Start server
app.listen(PORT, () => {
    console.log(`🍰 GleeJeYly API server is running on http://localhost:${PORT}`);
    console.log(`📝 Orders API: http://localhost:${PORT}/api/orders`);
    console.log(`⭐ Reviews API: http://localhost:${PORT}/api/reviews`);
    console.log(`💚 Health check: http://localhost:${PORT}/api/health`);
});
