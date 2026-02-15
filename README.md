# GleeJeYly - Full Stack Jelly Cheesecake Ordering System

A modern, responsive web application for ordering premium jelly cheesecake with an integrated backend API.

## Features

- 🎨 Responsive design for desktop and mobile
- 📱 Order form with real-time validation
- 🍰 **Product Variants**: Choose from Plain Classic, Ube Jam, or Extra Crashed Graham
- ⭐ Customer reviews and ratings system
- 📝 Order management via REST API
- 💾 Persistent data storage (JSON files)
- 🔄 CORS enabled for cross-origin requests
- ♿ Accessibility features (ARIA labels, semantic HTML)
- 🔐 Admin login & dashboard with order tracking

## Project Structure

```
├── index.html              # Main HTML file
├── styles/
│   └── style.css          # Styling
├── scripts/
│   └── script.js          # Frontend logic (API calls, form handling)
├── images/                # Product images
├── server/
│   ├── server.js          # Express server with API endpoints
│   └── data/
│       ├── orders.json    # Stored orders
│       └── reviews.json   # Stored reviews
├── package.json           # Node dependencies
└── .gitignore            # Git ignore file
```

## Getting Started

### Prerequisites

- **Node.js** (v14 or higher) - [Download](https://nodejs.org/)
- **npm** (comes with Node.js)

### Installation

1. **Install dependencies**
   ```bash
   npm install
   ```

   This installs:
   - `express` - Web server framework
   - `cors` - Cross-Origin Resource Sharing middleware

### Running the Application

#### Start the Backend Server

```bash
npm start
```

The server will run on `http://localhost:3000` with these endpoints:
- `GET /` - Server root/health message
- `GET /api/health` - Server health check
- `GET /api/orders` - Retrieve all orders
- `POST /api/orders` - Submit a new order
- `GET /api/reviews` - Retrieve all reviews
- `POST /api/reviews` - Submit a new review
- `GET /dashboard` - **Admin Dashboard** (View all orders & reviews)
- `GET /api/dashboard/orders` - Get all orders (JSON format)
- `GET /api/dashboard/reviews` - Get all reviews (JSON format)
- `DELETE /api/dashboard/orders` - Clear all orders
- `DELETE /api/dashboard/reviews` - Clear all reviews

#### Open the Frontend

1. Open `index.html` in your web browser (or use a local dev server)
   
   **Option A: Simple way**
   ```bash
   # On Linux/Mac
   open index.html
   
   # On Windows
   start index.html
   ```

   **Option B: Using VS Code**
   - Right-click on `index.html` → "Open with Live Server"

   **Option C: Using Python**
   ```bash
   python3 -m http.server 8000
   ```
   Then visit `http://localhost:8000`

## Admin Login System 🔐

The dashboard is now protected with admin authentication!

### Default Credentials
- **Username**: `admin`
- **Password**: `admin123`

### Login URL
```
http://localhost:3000/login
```

### Features
✅ **Secure Session Management** - 24-hour session timeout
✅ **Remember Me** - Saves username to browser (password never saved)
✅ **Automatic Redirect** - Unauthenticated users redirected to login
✅ **Activity Logging** - All login attempts logged for security
✅ **Protected Endpoints** - All dashboard APIs require authentication

### Changing Admin Credentials

**Option 1: Environment Variables (Recommended for Production)**
```bash
export ADMIN_USERNAME="your_admin_username"
export ADMIN_PASSWORD="your_admin_password"
python server/server.py
```

**Option 2: Direct Code Update (Development Only)**
Edit `server/server.py`:
```python
ADMIN_USERNAME = 'your_admin_username'
ADMIN_PASSWORD = 'your_admin_password'
```

### Security Best Practices
- ✅ Change default credentials immediately
- ✅ Use strong passwords (mix of letters, numbers, symbols)
- ✅ Enable HTTPS in production
- ✅ Regularly review login logs
- ✅ Never share admin credentials
- ✅ Use environment variables for credentials

## Product Variants 🍰

Customers can now choose from three delicious flavor options:

### Available Flavors

1. **Plain Classic** (Default)
   - Traditional jelly cheesecake
   - With crushed graham base
   - ₱25.00

2. **Ube Jam** 
   - Rich purple yam flavor
   - Creamy and aromatic
   - ₱25.00

3. **Extra Crashed Graham**
   - More graham on top & base
   - Crunchy texture
   - ₱25.00

### How It Works
- Customer selects flavor in the order form (radio buttons with visual indicators)
- Flavor is displayed in the order summary
- Flavor information is saved with each order
- Admin dashboard shows which flavor was ordered
- All flavors are at the same price point

### Customization
To add more flavors, edit the flavor options in:

**Frontend**:
- `index.html` - Update the flavor radio button options
- `scripts/script.js` - Update the flavor name mapping in `updateOrderSummary()`

**Backend**:
- `server/server.py` - Update the `valid_flavors` list in `validate_order_input()`

### API Documentation

## Admin Dashboard 📊

Access the admin dashboard to view all orders and reviews:

**Dashboard URL**: `http://localhost:3000/dashboard`
**Login URL**: `http://localhost:3000/login`

### Dashboard Features

✅ **Real-Time Statistics**
- Total Orders count
- Total Reviews count
- Total Revenue (sum of all orders)
- Average Product Rating

✅ **Orders Table**
- View all customer orders with details:
  - Order ID, Customer Name, Phone, Facebook
  - Pickup/Delivery Date, Quantity, Total Price
  - Order creation date
- Export orders as JSON
- Clear all orders (with confirmation)

✅ **Reviews Table**
- View all customer reviews:
  - Customer name & email
  - Product rating (⭐⭐⭐⭐⭐)
  - Service rating (⭐⭐⭐⭐⭐)
  - Review comment (preview)
  - Review date
- Export reviews as JSON
- Clear all reviews (with confirmation)

✅ **Auto-Refresh**
- Dashboard automatically refreshes every 30 seconds
- See live updates without manual refresh

### API Documentation

#### POST /api/orders
Submit a new order
```json
{
  "fullName": "Juan Dela Cruz",
  "phoneNumber": "09123456789",
  "facebook": "juan.delacruz",
  "pickupDate": "2026-02-28",
  "quantity": 2,
  "total": 50.00
}
```

#### POST /api/reviews
Submit a new review
```json
{
  "name": "Maria Santos",
  "email": "maria@example.com",
  "productRating": 5,
  "serviceRating": 5,
  "comment": "Absolutely delicious! Highly recommended."
}
```

#### GET /api/dashboard/orders
Get all orders in JSON format
```bash
curl http://localhost:3000/api/dashboard/orders
```
Returns array of all orders

#### GET /api/dashboard/reviews
Get all reviews in JSON format
```bash
curl http://localhost:3000/api/dashboard/reviews
```
Returns array of all reviews

#### DELETE /api/dashboard/orders
Clear all orders (requires confirmation in UI)
```bash
curl -X DELETE http://localhost:3000/api/dashboard/orders
```

#### DELETE /api/dashboard/reviews
Clear all reviews (requires confirmation in UI)
```bash
curl -X DELETE http://localhost:3000/api/dashboard/reviews
```

## Troubleshooting

**Issue: "Cannot find module 'express'"**
- Solution: Run `npm install`

**Issue: "Address already in use :::3000"**
- Solution: Change the PORT in `server.js` or kill the existing process on port 3000

**Issue: CORS errors in browser console**
- Solution: Make sure the server is running on `http://localhost:3000`

**Issue: API calls not working**
- Solution: Open browser DevTools (F12) → Console tab to see error messages

## Deploying Online (Railway)

### Prerequisites
- GitHub account
- Railway account (free at https://railway.app)

### Step 1: Push to GitHub

```bash
git add .
git commit -m "Add full-stack Gleejeyly app"
git push origin main
```

### Step 2: Deploy to Railway

1. Go to [railway.app](https://railway.app)
2. Click **"New Project"** → **"Deploy from GitHub Repo"**
3. Authorize Railway with your GitHub account
4. Select this repository (`Gle`)
5. Railway will auto-detect the Python app and deploy

### Step 3: Update Frontend API URL

Once deployed, Railway will provide your app URL (e.g., `https://gleejeyly-production.up.railway.app`).

Update the API base URL in [scripts/script.js](scripts/script.js):

```javascript
// Change this:
const API_BASE = 'http://localhost:3000/api';

// To this (replace with your Railway URL):
const API_BASE = 'https://your-railway-app-url.up.railway.app/api';
```

### Step 4: Deploy Frontend (Static Hosting)

Option A: **Vercel (Recommended for static sites)**
1. Go to [vercel.com](https://vercel.com)
2. Click **"Add New Project"** → **"Import Git Repository"**
3. Select your repo and deploy

Option B: **GitHub Pages**
1. Push your updated code to GitHub
2. Go to repo Settings → Pages
3. Set source to `main` branch

Option C: **Keep on Railway**
Railway can serve static files! Just keep both frontend and backend together.

### Mobile Access

Once deployed on Railway, your app will be accessible globally at:
```
https://your-railway-app-url.up.railway.app
```

Share this link with anyone to let them order cheesecake! 🍰

## Development Notes

- The frontend gracefully falls back to localStorage if the API is unavailable
- All data is stored in JSON files in `server/data/`
- The API is configured with CORS to allow requests from specific origins
- Railway automatically manages environment variables and PORT configuration

## Security Features

### Backend Security (`server.py`)

✅ **CORS Protection**: Restricted to allowed origins (configurable via `ALLOWED_ORIGINS` environment variable)
✅ **Input Validation**: All user inputs are validated and sanitized
- Order validation: Checks required fields, quantity limits (1-100), phone number format
- Review validation: Validates email format, ratings (1-5), and truncates strings

✅ **Rate Limiting**: Prevents abuse with 100 requests per minute per IP
✅ **Request Size Limit**: Maximum 1MB payload to prevent DoS attacks
✅ **Security Headers**:
- `X-Content-Type-Options: nosniff` - Prevents MIME sniffing
- `X-Frame-Options: DENY` - Prevents clickjacking
- `X-XSS-Protection: 1; mode=block` - XSS protection
- `Strict-Transport-Security` - Enforces HTTPS when deployed

✅ **Error Handling**: Generic error messages (no sensitive data leakage)
✅ **Logging**: All suspicious activities are logged for monitoring
✅ **Localhost Binding**: Server binds to 127.0.0.1 by default (not 0.0.0.0)

### Frontend Security (`script.js`)

✅ **HTML Escaping**: All user-generated content is escaped before displaying
✅ **Request Timeout**: 10-second timeout on all API requests
✅ **Secure Fetch Wrapper**: Custom fetch with abort signal and error handling
✅ **Dynamic API URL**: Takes into account current domain for flexible deployment
✅ **Local Storage Fallback**: Graceful degradation with encrypted/scoped storage key

### HTML Security (`index.html`)

✅ **Meta Tags**: Proper character encoding and viewport settings
✅ **CSP-Ready**: Structure supports Content Security Policy headers
✅ **Semantic HTML**: Proper use of semantic elements
✅ **ARIA Labels**: Screen reader accessible form fields

### Deployment Security Checklist

When deploying to production:

1. **Environment Variables**:
   ```bash
   export ALLOWED_ORIGINS="https://yourdomain.com,https://www.yourdomain.com"
   export FLASK_DEBUG=False
   export PORT=3000
   ```

2. **Enable HTTPS**: Always use HTTPS in production (handled by Railway)

3. **Update API URL**: Set `window.API_URL` in your hosting template:
   ```html
   <script>
     window.API_URL = 'https://api.yourdomain.com/api';
   </script>
   ```

4. **Monitor Logs**: Check server logs for suspicious patterns

5. **Database Backups**: Regularly backup `server/data/` files

6. **Rate Limiting**: Adjust `RATE_LIMIT` based on your traffic needs

### Known Limitations

- No authentication/authorization (suitable for public submissions)
- JSON file storage (not suitable for high-traffic production)
- For enterprise use, migrate to a proper database with user authentication

## License

MIT License - Feel free to use this project as a template for your own cheesecake ordering system!

---

Made with ❤️ by GleeJeYly Team

