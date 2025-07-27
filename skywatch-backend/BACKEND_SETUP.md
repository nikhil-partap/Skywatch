# Backend Setup Guide

## 🔐 API Key Security

Your OpenWeatherMap API key is now securely stored in the backend and hidden from the frontend code. Here's how to set it up:

## 📋 Prerequisites

- Node.js (version 14 or higher)
- npm or yarn package manager
- Your OpenWeatherMap API key: `6f17e5a7248147ee5ea6c35160f18a7`

## 🚀 Quick Setup

### 1. Navigate to Backend Directory

```bash
cd skywatch-backend
```

### 2. Install Dependencies

```bash
npm install
```

### 3. Create Environment File

Create a `.env` file in the `skywatch-backend` directory with your API key:

```bash
# Copy the example file
cp env.example .env

# Edit the .env file and add your API key
```

Your `.env` file should look like this:

```env
# OpenWeatherMap API Configuration
OPENWEATHER_API_KEY=6f17e5a7248147ee5ea6c35160f18a7a

# Server Configuration
PORT=3000
NODE_ENV=development

# CORS Configuration (update with your GitHub Pages URL)
ALLOWED_ORIGINS=https://yourusername.github.io,http://localhost:3000,http://127.0.0.1:5500

# Rate Limiting
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100
```

### 4. Start the Backend Server

```bash
# Development mode (with auto-restart)
npm run dev

# Production mode
npm start
```

The server will start on `http://localhost:3000`

## 🌐 API Endpoints

### Current Weather
- **GET** `/weather?city=London`
- **GET** `/weather?lat=51.5074&lon=-0.1278`

### 5-Day Forecast
- **GET** `/forecast?city=London`
- **GET** `/forecast?lat=51.5074&lon=-0.1278`

### Health Check
- **GET** `/health`

## 🔧 Configuration Options

### Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `OPENWEATHER_API_KEY` | Your OpenWeatherMap API key | Required |
| `PORT` | Server port | 3000 |
| `NODE_ENV` | Environment (development/production) | development |
| `ALLOWED_ORIGINS` | CORS allowed origins (comma-separated) | localhost URLs |
| `RATE_LIMIT_WINDOW_MS` | Rate limit window in milliseconds | 900000 (15 min) |
| `RATE_LIMIT_MAX_REQUESTS` | Max requests per window | 100 |

### CORS Configuration

Update the `ALLOWED_ORIGINS` in your `.env` file to include your GitHub Pages URL:

```env
ALLOWED_ORIGINS=https://yourusername.github.io,http://localhost:3000,http://127.0.0.1:5500
```

Replace `yourusername` with your actual GitHub username.

## 🚀 Deployment Options

### Option 1: Heroku

1. Create a Heroku account
2. Install Heroku CLI
3. Create a new Heroku app
4. Set environment variables:

```bash
heroku config:set OPENWEATHER_API_KEY=6f17e5a7248147ee5ea6c35160f18a7a
heroku config:set NODE_ENV=production
heroku config:set ALLOWED_ORIGINS=https://yourusername.github.io
```

5. Deploy:

```bash
git add .
git commit -m "Add backend server"
git push heroku main
```

### Option 2: Railway

1. Connect your GitHub repository to Railway
2. Set environment variables in Railway dashboard
3. Deploy automatically

### Option 3: Render

1. Create a Render account
2. Connect your GitHub repository
3. Set environment variables
4. Deploy

## 🔄 Update Frontend

After deploying your backend, update the `backendUrl` in `skywatch/script.js`:

```javascript
// Change this line in skywatch/script.js
this.backendUrl = 'https://your-backend-url.herokuapp.com'; // or your deployed URL
```

## 🔒 Security Features

- **API Key Protection**: API key is stored server-side only
- **CORS Protection**: Only allowed origins can access the API
- **Rate Limiting**: Prevents abuse (100 requests per 15 minutes)
- **Input Validation**: Validates all incoming requests
- **Error Handling**: Comprehensive error responses
- **Security Headers**: Helmet.js for security headers

## 🧪 Testing

Test your backend endpoints:

```bash
# Health check
curl http://localhost:3000/health

# Weather by city
curl http://localhost:3000/weather?city=London

# Weather by coordinates
curl http://localhost:3000/weather?lat=51.5074&lon=-0.1278

# Forecast
curl http://localhost:3000/forecast?city=London
```

## 📊 Monitoring

The backend includes:
- Request logging
- Error tracking
- Performance monitoring
- Health check endpoint

## 🛠️ Troubleshooting

### Common Issues

1. **CORS Error**: Update `ALLOWED_ORIGINS` in `.env`
2. **API Key Error**: Ensure `.env` file exists with correct API key
3. **Port Already in Use**: Change `PORT` in `.env`
4. **Rate Limit**: Wait 15 minutes or increase limits

### Debug Mode

Run with debug logging:

```bash
NODE_ENV=development DEBUG=* npm start
```

## 📝 Environment File Template

Create your `.env` file in the `skywatch-backend` directory:

```env
# OpenWeatherMap API Configuration
OPENWEATHER_API_KEY=6f17e5a7248147ee5ea6c35160f18a7a

# Server Configuration
PORT=3000
NODE_ENV=development

# CORS Configuration (update with your actual URLs)
ALLOWED_ORIGINS=https://yourusername.github.io,http://localhost:3000,http://127.0.0.1:5500

# Rate Limiting
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100
```

## 📁 Project Structure

```
root/
├── skywatch/             ← Frontend
│   ├── index.html
│   ├── style.css
│   ├── script.js
│   ├── sw.js
│   └── README.md
└── skywatch-backend/     ← Backend
    ├── server.js
    ├── package.json
    ├── env.example
    ├── BACKEND_SETUP.md
    ├── .gitignore
    └── (node_modules/ etc.)
```

## ✅ Checklist

- [ ] Navigate to `skywatch-backend` directory
- [ ] API key added to `.env` file
- [ ] Dependencies installed (`npm install`)
- [ ] Backend server running (`npm run dev`)
- [ ] CORS origins updated for your domain
- [ ] Frontend `backendUrl` updated in `skywatch/script.js`
- [ ] Health check endpoint working
- [ ] Weather endpoint tested
- [ ] Deployed to hosting platform (optional)

Your API key is now completely hidden from the frontend and securely stored in the backend! 🎉 