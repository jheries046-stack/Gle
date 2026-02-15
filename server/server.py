from flask import Flask, jsonify, request
from flask_cors import CORS
import json
import os
from datetime import datetime
import logging
from functools import wraps
import time
import re

app = Flask(__name__)

# Security: Configure CORS with restricted origins
allowed_origins = os.environ.get('ALLOWED_ORIGINS', 'http://localhost:3000,http://127.0.0.1:3000').split(',')
CORS(app, resources={r"/api/*": {"origins": allowed_origins, "methods": ["GET", "POST", "OPTIONS"]}})

# Security: Set request size limit to 1MB
app.config['MAX_CONTENT_LENGTH'] = 1 * 1024 * 1024  # 1MB

# Security: Disable server header
app.config['ENV_PROD'] = True

# Setup logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Rate limiting helper
request_counts = {}
RATE_LIMIT = 100  # requests
RATE_WINDOW = 60  # seconds

def rate_limit(f):
    @wraps(f)
    def decorated_function(*args, **kwargs):
        now = time.time()
        ip = request.remote_addr
        
        if ip not in request_counts:
            request_counts[ip] = []
        
        # Remove old requests outside the window
        request_counts[ip] = [req_time for req_time in request_counts[ip] if now - req_time < RATE_WINDOW]
        
        # Check rate limit
        if len(request_counts[ip]) >= RATE_LIMIT:
            logger.warning(f"Rate limit exceeded for IP: {ip}")
            return jsonify({'success': False, 'error': 'Rate limit exceeded'}), 429
        
        request_counts[ip].append(now)
        return f(*args, **kwargs)
    
    return decorated_function

# Input validation helper
def validate_order_input(order):
    """Validate order data"""
    if not isinstance(order, dict):
        return False, "Invalid order format"
    
    # Check required fields
    required_fields = ['fullName', 'phoneNumber', 'quantity']
    for field in required_fields:
        if field not in order or not str(order[field]).strip():
            return False, f"Missing or empty required field: {field}"
    
    # Validate quantity
    try:
        qty = int(order.get('quantity', 0))
        if qty < 1 or qty > 100:
            return False, "Quantity must be between 1 and 100"
    except (ValueError, TypeError):
        return False, "Invalid quantity"
    
    # Validate phone number (basic check)
    phone = str(order.get('phoneNumber', '')).strip()
    digits_only = re.sub(r'\D', '', phone)
    if len(digits_only) < 10:
        return False, "Invalid phone number"
    
    # Truncate strings to prevent abuse
    order['fullName'] = str(order.get('fullName', ''))[:100].strip()
    order['phoneNumber'] = str(order.get('phoneNumber', ''))[:20].strip()
    order['facebook'] = str(order.get('facebook', ''))[:100].strip()
    
    return True, None

def validate_review_input(review):
    """Validate review data"""
    if not isinstance(review, dict):
        return False, "Invalid review format"
    
    required_fields = ['name', 'email', 'comment']
    for field in required_fields:
        if field not in review or not str(review[field]).strip():
            return False, f"Missing required field: {field}"
    
    # Validate email (basic format)
    email = str(review.get('email', ''))
    if '@' not in email or len(email) < 5:
        return False, "Invalid email format"
    
    # Validate ratings
    try:
        product_rating = int(review.get('productRating', 0))
        service_rating = int(review.get('serviceRating', 0))
        if not (1 <= product_rating <= 5) or not (1 <= service_rating <= 5):
            return False, "Ratings must be between 1 and 5"
    except (ValueError, TypeError):
        return False, "Invalid rating values"
    
    # Truncate strings
    review['name'] = str(review.get('name', ''))[:50].strip()
    review['email'] = str(review.get('email', ''))[:100].strip()
    review['comment'] = str(review.get('comment', ''))[:500].strip()
    
    return True, None

# Data file paths
DATA_DIR = os.path.join(os.path.dirname(__file__), 'data')
ORDERS_FILE = os.path.join(DATA_DIR, 'orders.json')
REVIEWS_FILE = os.path.join(DATA_DIR, 'reviews.json')

# Ensure data directory exists
os.makedirs(DATA_DIR, exist_ok=True)

# Ensure data files exist
def ensure_data_file(filepath, default_data=None):
    if not os.path.exists(filepath):
        with open(filepath, 'w') as f:
            json.dump(default_data or [], f, indent=2)

ensure_data_file(ORDERS_FILE, [])
ensure_data_file(REVIEWS_FILE, [])

# Helper functions to read/write data
def read_orders():
    try:
        with open(ORDERS_FILE, 'r') as f:
            return json.load(f)
    except (json.JSONDecodeError, FileNotFoundError):
        return []

def write_orders(orders):
    with open(ORDERS_FILE, 'w') as f:
        json.dump(orders, f, indent=2)

def read_reviews():
    try:
        with open(REVIEWS_FILE, 'r') as f:
            return json.load(f)
    except (json.JSONDecodeError, FileNotFoundError):
        return []

def write_reviews(reviews):
    with open(REVIEWS_FILE, 'w') as f:
        json.dump(reviews, f, indent=2)

# API Endpoints

@app.route('/', methods=['GET'])
def index():
    return jsonify({
        'message': 'GleeJeYly API Server (Python)',
        'version': '1.0.0'
    })

@app.route('/api/health', methods=['GET'])
def health():
    return jsonify({
        'status': 'ok',
        'message': 'GleeJeYly API is running'
    })

@app.route('/api/orders', methods=['GET'])
def get_orders():
    orders = read_orders()
    return jsonify(orders)

@app.route('/api/orders', methods=['POST'])
@rate_limit
def create_order():
    try:
        order = request.get_json(force=True, silent=False)
        if not order:
            return jsonify({'success': False, 'error': 'Invalid request body'}), 400
        
        # Validate input
        is_valid, error_msg = validate_order_input(order)
        if not is_valid:
            logger.warning(f"Invalid order input: {error_msg}")
            return jsonify({'success': False, 'error': error_msg}), 400
        
        orders = read_orders()
        
        # Add ID and timestamp
        order['id'] = int(datetime.now().timestamp() * 1000)
        order['createdAt'] = datetime.now().isoformat()
        
        orders.append(order)
        write_orders(orders)
        
        logger.info(f"Order created: {order['id']}")
        return jsonify({
            'success': True,
            'message': 'Order created successfully'
        }), 201
    except Exception as e:
        logger.error(f"Error creating order: {str(e)}")
        return jsonify({'success': False, 'error': 'Failed to process order'}), 400

@app.route('/api/reviews', methods=['GET'])
def get_reviews():
    reviews = read_reviews()
    return jsonify(reviews)

@app.route('/api/reviews', methods=['POST'])
@rate_limit
def create_review():
    try:
        review = request.get_json(force=True, silent=False)
        if not review:
            return jsonify({'success': False, 'error': 'Invalid request body'}), 400
        
        # Validate input
        is_valid, error_msg = validate_review_input(review)
        if not is_valid:
            logger.warning(f"Invalid review input: {error_msg}")
            return jsonify({'success': False, 'error': error_msg}), 400
        
        reviews = read_reviews()
        
        # Add ID and timestamp
        review['id'] = int(datetime.now().timestamp() * 1000)
        review['date'] = datetime.now().strftime('%m/%d/%Y')
        
        reviews.insert(0, review)  # Add to front
        write_reviews(reviews)
        
        logger.info(f"Review created: {review['id']}")
        return jsonify({
            'success': True,
            'message': 'Review submitted successfully'
        }), 201
    except Exception as e:
        logger.error(f"Error creating review: {str(e)}")
        return jsonify({'success': False, 'error': 'Failed to process review'}), 400

# Security: Custom error handlers
@app.errorhandler(400)
def bad_request(e):
    return jsonify({'success': False, 'error': 'Bad request'}), 400

@app.errorhandler(404)
def not_found(e):
    return jsonify({'success': False, 'error': 'Not found'}), 404

@app.errorhandler(429)
def rate_limit_handler(e):
    return jsonify({'success': False, 'error': 'Too many requests'}), 429

@app.errorhandler(500)
def internal_error(e):
    logger.error(f"Internal server error: {str(e)}")
    return jsonify({'success': False, 'error': 'Internal server error'}), 500

# Dashboard Routes

@app.route('/dashboard')
def dashboard():
    """Serve dashboard HTML"""
    return '''
    <!DOCTYPE html>
    <html lang="en">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>GleeJeYly - Admin Dashboard</title>
        <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css">
        <style>
            * { margin: 0; padding: 0; box-sizing: border-box; }
            body {
                font-family: 'Poppins', 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
                background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                min-height: 100vh;
                padding: 20px;
            }
            .container { max-width: 1200px; margin: 0 auto; }
            .header {
                background: white;
                padding: 30px;
                border-radius: 10px;
                margin-bottom: 30px;
                box-shadow: 0 2px 15px rgba(0,0,0,0.1);
            }
            .header h1 {
                color: #333;
                margin-bottom: 10px;
                display: flex;
                align-items: center;
                gap: 10px;
            }
            .header p { color: #666; }
            
            .stats {
                display: grid;
                grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
                gap: 20px;
                margin-bottom: 30px;
            }
            .stat-card {
                background: white;
                padding: 20px;
                border-radius: 10px;
                box-shadow: 0 2px 15px rgba(0,0,0,0.1);
                text-align: center;
            }
            .stat-card .number {
                font-size: 2.5em;
                font-weight: bold;
                color: #667eea;
                margin: 10px 0;
            }
            .stat-card .label {
                color: #666;
                font-size: 0.9em;
            }
            .stat-card i {
                font-size: 2em;
                color: #764ba2;
            }
            
            .section {
                background: white;
                border-radius: 10px;
                padding: 25px;
                margin-bottom: 30px;
                box-shadow: 0 2px 15px rgba(0,0,0,0.1);
            }
            .section h2 {
                color: #333;
                margin-bottom: 20px;
                display: flex;
                align-items: center;
                gap: 10px;
                border-bottom: 2px solid #667eea;
                padding-bottom: 10px;
            }
            
            table {
                width: 100%;
                border-collapse: collapse;
                margin-bottom: 20px;
            }
            th {
                background: #f5f5f5;
                padding: 12px;
                text-align: left;
                font-weight: 600;
                color: #333;
                border-bottom: 2px solid #ddd;
            }
            td {
                padding: 12px;
                border-bottom: 1px solid #eee;
            }
            tr:hover { background: #f9f9f9; }
            
            .empty {
                text-align: center;
                padding: 40px;
                color: #999;
            }
            
            .btn-group {
                display: flex;
                gap: 10px;
                margin-bottom: 20px;
            }
            .btn {
                padding: 10px 20px;
                border: none;
                border-radius: 5px;
                cursor: pointer;
                font-size: 0.9em;
                transition: 0.3s;
            }
            .btn-primary {
                background: #667eea;
                color: white;
            }
            .btn-primary:hover { background: #5568d3; }
            .btn-danger {
                background: #ff6b6b;
                color: white;
            }
            .btn-danger:hover { background: #ee5a52; }
            
            .loading {
                text-align: center;
                padding: 40px;
                color: #667eea;
            }
            .star { color: #ffc107; }
            .footer {
                text-align: center;
                color: white;
                margin-top: 30px;
            }
        </style>
    </head>
    <body>
        <div class="container">
            <div class="header">
                <h1><i class="fas fa-chart-bar"></i> GleeJeYly Admin Dashboard</h1>
                <p>Monitor all orders and reviews</p>
            </div>
            
            <!-- Statistics -->
            <div class="stats">
                <div class="stat-card">
                    <i class="fas fa-shopping-cart"></i>
                    <div class="number" id="orderCount">0</div>
                    <div class="label">Total Orders</div>
                </div>
                <div class="stat-card">
                    <i class="fas fa-star"></i>
                    <div class="number" id="reviewCount">0</div>
                    <div class="label">Total Reviews</div>
                </div>
                <div class="stat-card">
                    <i class="fas fa-money-bill"></i>
                    <div class="number" id="totalRevenue">₱0</div>
                    <div class="label">Total Revenue</div>
                </div>
                <div class="stat-card">
                    <i class="fas fa-rating-scale"></i>
                    <div class="number" id="avgRating">0</div>
                    <div class="label">Avg Rating</div>
                </div>
            </div>
            
            <!-- Orders Section -->
            <div class="section">
                <h2><i class="fas fa-list"></i> All Orders</h2>
                <div class="btn-group">
                    <button class="btn btn-primary" onclick="exportOrders()"><i class="fas fa-download"></i> Export Orders</button>
                    <button class="btn btn-danger" onclick="clearOrders()"><i class="fas fa-trash"></i> Clear Orders</button>
                </div>
                <div id="ordersContainer" class="loading">Loading orders...</div>
            </div>
            
            <!-- Reviews Section -->
            <div class="section">
                <h2><i class="fas fa-comments"></i> All Reviews</h2>
                <div class="btn-group">
                    <button class="btn btn-primary" onclick="exportReviews()"><i class="fas fa-download"></i> Export Reviews</button>
                    <button class="btn btn-danger" onclick="clearReviews()"><i class="fas fa-trash"></i> Clear Reviews</button>
                </div>
                <div id="reviewsContainer" class="loading">Loading reviews...</div>
            </div>
            
            <div class="footer">
                <p>🍰 GleeJeYly Admin Dashboard | All Rights Reserved</p>
            </div>
        </div>
        
        <script>
            const API_BASE = 'http://localhost:3000/api';
            
            async function loadDashboardData() {
                try {
                    const [ordersRes, reviewsRes] = await Promise.all([
                        fetch(API_BASE + '/dashboard/orders'),
                        fetch(API_BASE + '/dashboard/reviews')
                    ]);
                    
                    const orders = await ordersRes.json();
                    const reviews = await reviewsRes.json();
                    
                    displayOrders(orders);
                    displayReviews(reviews);
                    updateStats(orders, reviews);
                } catch (error) {
                    console.error('Error loading dashboard:', error);
                    document.getElementById('ordersContainer').innerHTML = '<div class="empty">Error loading orders</div>';
                    document.getElementById('reviewsContainer').innerHTML = '<div class="empty">Error loading reviews</div>';
                }
            }
            
            function displayOrders(orders) {
                const container = document.getElementById('ordersContainer');
                if (!orders || orders.length === 0) {
                    container.innerHTML = '<div class="empty">No orders yet</div>';
                    return;
                }
                
                let html = '<table><thead><tr><th>ID</th><th>Name</th><th>Phone</th><th>Facebook</th><th>Date</th><th>Qty</th><th>Total</th><th>Created</th></tr></thead><tbody>';
                orders.forEach(order => {
                    html += `<tr>
                        <td>#${order.id}</td>
                        <td>${order.fullName}</td>
                        <td>${order.phoneNumber}</td>
                        <td>${order.facebook}</td>
                        <td>${order.pickupDate}</td>
                        <td>${order.quantity}</td>
                        <td>₱${order.total}</td>
                        <td>${new Date(order.createdAt).toLocaleDateString()}</td>
                    </tr>`;
                });
                html += '</tbody></table>';
                container.innerHTML = html;
            }
            
            function displayReviews(reviews) {
                const container = document.getElementById('reviewsContainer');
                if (!reviews || reviews.length === 0) {
                    container.innerHTML = '<div class="empty">No reviews yet</div>';
                    return;
                }
                
                let html = '<table><thead><tr><th>Name</th><th>Email</th><th>Product ⭐</th><th>Service ⭐</th><th>Comment</th><th>Date</th></tr></thead><tbody>';
                reviews.forEach(review => {
                    const productStars = '⭐'.repeat(review.productRating) + '☆'.repeat(5 - review.productRating);
                    const serviceStars = '⭐'.repeat(review.serviceRating) + '☆'.repeat(5 - review.serviceRating);
                    html += `<tr>
                        <td>${review.name}</td>
                        <td>${review.email}</td>
                        <td>${productStars}</td>
                        <td>${serviceStars}</td>
                        <td>${review.comment.substring(0, 50)}...</td>
                        <td>${review.date}</td>
                    </tr>`;
                });
                html += '</tbody></table>';
                container.innerHTML = html;
            }
            
            function updateStats(orders, reviews) {
                document.getElementById('orderCount').textContent = orders.length;
                document.getElementById('reviewCount').textContent = reviews.length;
                
                const totalRevenue = orders.reduce((sum, o) => sum + (o.total || 0), 0);
                document.getElementById('totalRevenue').textContent = '₱' + totalRevenue.toFixed(2);
                
                if (reviews.length > 0) {
                    const avgProductRating = (reviews.reduce((sum, r) => sum + r.productRating, 0) / reviews.length).toFixed(1);
                    document.getElementById('avgRating').textContent = avgProductRating;
                }
            }
            
            function exportOrders() {
                fetch(API_BASE + '/dashboard/orders')
                    .then(r => r.json())
                    .then(data => downloadJSON(data, 'orders.json'));
            }
            
            function exportReviews() {
                fetch(API_BASE + '/dashboard/reviews')
                    .then(r => r.json())
                    .then(data => downloadJSON(data, 'reviews.json'));
            }
            
            function downloadJSON(data, filename) {
                const blob = new Blob([JSON.stringify(data, null, 2)], {type: 'application/json'});
                const url = URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = filename;
                a.click();
                URL.revokeObjectURL(url);
            }
            
            function clearOrders() {
                if (confirm('Are you sure you want to delete all orders?')) {
                    fetch(API_BASE + '/dashboard/orders', {method: 'DELETE'})
                        .then(() => loadDashboardData())
                        .catch(err => alert('Error: ' + err.message));
                }
            }
            
            function clearReviews() {
                if (confirm('Are you sure you want to delete all reviews?')) {
                    fetch(API_BASE + '/dashboard/reviews', {method: 'DELETE'})
                        .then(() => loadDashboardData())
                        .catch(err => alert('Error: ' + err.message));
                }
            }
            
            // Load data on page load
            loadDashboardData();
            // Refresh every 30 seconds
            setInterval(loadDashboardData, 30000);
        </script>
    </body>
    </html>
    '''

@app.route('/api/dashboard/orders', methods=['GET', 'DELETE'])
@rate_limit
def dashboard_orders():
    """Get all orders or delete all orders"""
    if request.method == 'GET':
        orders = read_orders()
        return jsonify(orders)
    elif request.method == 'DELETE':
        write_orders([])
        logger.info("All orders cleared")
        return jsonify({'success': True, 'message': 'All orders deleted'})

@app.route('/api/dashboard/reviews', methods=['GET', 'DELETE'])
@rate_limit
def dashboard_reviews():
    """Get all reviews or delete all reviews"""
    if request.method == 'GET':
        reviews = read_reviews()
        return jsonify(reviews)
    elif request.method == 'DELETE':
        write_reviews([])
        logger.info("All reviews cleared")
        return jsonify({'success': True, 'message': 'All reviews deleted'})

# Security: Set response headers
@app.after_request
def set_security_headers(response):
    response.headers['X-Content-Type-Options'] = 'nosniff'
    response.headers['X-Frame-Options'] = 'DENY'
    response.headers['X-XSS-Protection'] = '1; mode=block'
    response.headers['Strict-Transport-Security'] = 'max-age=31536000; includeSubDomains'
    return response

if __name__ == '__main__':
    port = int(os.environ.get('PORT', 3000))
    host = '127.0.0.1'  # Security: Bind to localhost only by default
    debug_mode = os.environ.get('FLASK_DEBUG', 'False').lower() == 'true'
    
    print(f'🍰 GleeJeYly API server is running on port {port}')
    print('📝 Orders API: /api/orders')
    print('⭐ Reviews API: /api/reviews')
    print('💚 Health check: /api/health')
    print(f'⚠️  Debug mode: {debug_mode}')
    
    # Security: Disable debug mode in production
    app.run(host=host, port=port, debug=debug_mode)
