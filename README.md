# GleeJeYly - Full Stack Jelly Cheesecake Ordering System

A modern, responsive web application for ordering premium jelly cheesecake with an integrated backend API.

## Features

- 🎨 Responsive design for desktop and mobile
- 📱 Order form with real-time validation
- ⭐ Customer reviews and ratings system
- 📝 Order management via REST API
- 💾 Persistent data storage (JSON files)
- 🔄 CORS enabled for cross-origin requests
- ♿ Accessibility features (ARIA labels, semantic HTML)

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
- `GET /api/health` - Server health check
- `GET /api/orders` - Retrieve all orders
- `POST /api/orders` - Submit a new order
- `GET /api/reviews` - Retrieve all reviews
- `POST /api/reviews` - Submit a new review

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

## Troubleshooting

**Issue: "Cannot find module 'express'"**
- Solution: Run `npm install`

**Issue: "Address already in use :::3000"**
- Solution: Change the PORT in `server.js` or kill the existing process on port 3000

**Issue: CORS errors in browser console**
- Solution: Make sure the server is running on `http://localhost:3000`

**Issue: API calls not working**
- Solution: Open browser DevTools (F12) → Console tab to see error messages

## Development Notes

- The frontend gracefully falls back to localStorage if the API is unavailable
- All data is stored in JSON files in `server/data/`
- The API is configured with CORS to allow requests from `http://localhost:*`

## License

MIT License - Feel free to use this project as a template for your own cheesecake ordering system!

---

Made with ❤️ by GleeJeYly Team
