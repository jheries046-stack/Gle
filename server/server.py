from flask import Flask, jsonify, request
from flask_cors import CORS
import json
import os
from datetime import datetime

app = Flask(__name__)
CORS(app)

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
def create_order():
    try:
        order = request.json
        orders = read_orders()
        
        # Add ID and timestamp if not present
        order['id'] = order.get('id', int(datetime.now().timestamp() * 1000))
        order['createdAt'] = order.get('createdAt', datetime.now().isoformat())
        
        orders.append(order)
        write_orders(orders)
        
        return jsonify({
            'success': True,
            'order': order,
            'orders': orders
        }), 201
    except Exception as e:
        return jsonify({
            'success': False,
            'error': str(e)
        }), 400

@app.route('/api/reviews', methods=['GET'])
def get_reviews():
    reviews = read_reviews()
    return jsonify(reviews)

@app.route('/api/reviews', methods=['POST'])
def create_review():
    try:
        review = request.json
        reviews = read_reviews()
        
        # Add ID and timestamp if not present
        review['id'] = review.get('id', int(datetime.now().timestamp() * 1000))
        review['date'] = review.get('date', datetime.now().strftime('%m/%d/%Y'))
        
        reviews.insert(0, review)  # Add to front
        write_reviews(reviews)
        
        return jsonify({
            'success': True,
            'review': review,
            'reviews': reviews
        }), 201
    except Exception as e:
        return jsonify({
            'success': False,
            'error': str(e)
        }), 400

if __name__ == '__main__':
    port = int(os.environ.get('PORT', 3000))
    host = '0.0.0.0'
    print(f'🍰 GleeJeYly API server is running on port {port}')
    print('📝 Orders API: /api/orders')
    print('⭐ Reviews API: /api/reviews')
    print('💚 Health check: /api/health')
    app.run(host=host, port=port, debug=False)
