# SkyWatch Weather App

A modern, responsive weather application with a secure backend API and beautiful frontend interface.

## 📁 Project Structure

```
root/
├── skywatch/             ← Frontend (HTML, CSS, JS)
│   ├── index.html
│   ├── style.css
│   ├── script.js
│   ├── sw.js
│   └── README.md
└── skywatch-backend/     ← Backend (Node.js + Express)
    ├── server.js
    ├── package.json
    ├── env.example
    ├── BACKEND_SETUP.md
    ├── .gitignore
    └── (node_modules/ etc.)
```

## 🚀 Quick Start

### Frontend Setup

1. **Open the frontend**:
   ```bash
   cd skywatch
   # Open index.html in your browser or serve it
   ```

2. **Serve the frontend** (optional):
   ```bash
   # Using Python
   python -m http.server 8000
   
   # Using Node.js
   npx http-server
   
   # Using PHP
   php -S localhost:8000
   ```

### Backend Setup

1. **Navigate to backend directory**:
   ```bash
   cd skywatch-backend
   ```

2. **Install dependencies**:
   ```bash
   npm install
   ```

3. **Create environment file**:
   ```bash
   cp env.example .env
   # Edit .env and add your OpenWeatherMap API key
   ```

4. **Start the backend server**:
   ```bash
   npm run dev
   ```

## 🔐 API Key Security

Your OpenWeatherMap API key is securely stored in the backend and hidden from the frontend code. The frontend communicates with your backend API, which then makes requests to OpenWeatherMap.

## 🌟 Features

### Frontend Features
- **Modern UI/UX**: Glassmorphism design with smooth animations
- **Responsive Design**: Works on all devices
- **Real-time Weather**: Current conditions and 5-day forecast
- **Location-based**: GPS integration for current location
- **City Search**: Global city lookup
- **PWA Ready**: Service worker for offline functionality

### Backend Features
- **Secure API**: API key hidden from frontend
- **CORS Support**: Works with GitHub Pages
- **Rate Limiting**: Prevents abuse
- **Error Handling**: Comprehensive error responses
- **Health Monitoring**: Health check endpoint

## 🔧 Configuration

### Frontend Configuration
Update the backend URL in `skywatch/script.js`:
```javascript
this.backendUrl = 'http://localhost:3000'; // Change to your deployed backend URL
```

### Backend Configuration
Create `.env` file in `skywatch-backend/`:
```env
OPENWEATHER_API_KEY=your_api_key_here
PORT=3000
NODE_ENV=development
ALLOWED_ORIGINS=https://yourusername.github.io,http://localhost:3000
```

## 🚀 Deployment

### Frontend Deployment (GitHub Pages)
1. Push your `skywatch/` folder to GitHub
2. Enable GitHub Pages in repository settings
3. Update backend URL in `script.js` to your deployed backend

### Backend Deployment
See `skywatch-backend/BACKEND_SETUP.md` for detailed deployment instructions.

## 📊 API Endpoints

### Backend Endpoints
- `GET /health` - Health check
- `GET /weather?city=London` - Current weather by city
- `GET /weather?lat=51.5074&lon=-0.1278` - Current weather by coordinates
- `GET /forecast?city=London` - 5-day forecast by city
- `GET /forecast?lat=51.5074&lon=-0.1278` - 5-day forecast by coordinates

## 🛠️ Development

### Frontend Development
```bash
cd skywatch
# Edit HTML, CSS, or JS files
# Open index.html in browser to test
```

### Backend Development
```bash
cd skywatch-backend
npm run dev  # Auto-restart on file changes
```

## 🔒 Security

- ✅ API key hidden from frontend
- ✅ CORS protection
- ✅ Rate limiting
- ✅ Input validation
- ✅ Error handling
- ✅ Security headers

## 📱 Browser Support

- Chrome 60+
- Firefox 55+
- Safari 12+
- Edge 79+

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## 📄 License

This project is open source and available under the MIT License.

## 🔗 Links

- [Frontend Documentation](skywatch/README.md)
- [Backend Setup Guide](skywatch-backend/BACKEND_SETUP.md)
- [OpenWeatherMap API](https://openweathermap.org/api)

---

**Built with ❤️ using modern web technologies** 