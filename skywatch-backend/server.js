const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const compression = require('compression');
const rateLimit = require('express-rate-limit');
const axios = require('axios');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;

// Security middleware
app.use(helmet({
    contentSecurityPolicy: {
        directives: {
            defaultSrc: ["'self'"],
            styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com", "https://cdnjs.cloudflare.com"],
            fontSrc: ["'self'", "https://fonts.gstatic.com", "https://cdnjs.cloudflare.com"],
            scriptSrc: ["'self'"],
            imgSrc: ["'self'", "data:", "https:"],
        },
    },
}));

// Compression middleware
app.use(compression());

// CORS configuration
const corsOptions = {
    origin: function (origin, callback) {
        const allowedOrigins = process.env.ALLOWED_ORIGINS 
            ? process.env.ALLOWED_ORIGINS.split(',') 
            : ['http://localhost:3000', 'http://127.0.0.1:5500'];
        
        // Allow requests with no origin (like mobile apps or curl requests)
        if (!origin) return callback(null, true);
        
        if (allowedOrigins.indexOf(origin) !== -1) {
            callback(null, true);
        } else {
            callback(new Error('Not allowed by CORS'));
        }
    },
    credentials: true,
    optionsSuccessStatus: 200
};

app.use(cors(corsOptions));

// Rate limiting
const limiter = rateLimit({
    windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 15 * 60 * 1000, // 15 minutes
    max: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS) || 100, // limit each IP to 100 requests per windowMs
    message: {
        error: 'Too many requests from this IP, please try again later.',
        retryAfter: Math.ceil((parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 15 * 60 * 1000) / 1000)
    },
    standardHeaders: true,
    legacyHeaders: false,
});

app.use('/weather', limiter);

// Body parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Weather endpoint
app.get('/weather', async (req, res) => {
    try {
        const { city, lat, lon } = req.query;
        
        // Validate input
        if (!city && (!lat || !lon)) {
            return res.status(400).json({
                error: 'Missing required parameter. Please provide either "city" or both "lat" and "lon" coordinates.',
                example: {
                    byCity: '/weather?city=London',
                    byCoords: '/weather?lat=51.5074&lon=-0.1278'
                }
            });
        }

        // Get API key from environment
        const apiKey = process.env.OPENWEATHER_API_KEY;
        if (!apiKey) {
            console.error('OpenWeatherMap API key not found in environment variables');
            return res.status(500).json({
                error: 'Server configuration error',
                details: 'Weather service is not properly configured.'
            });
        }

        // Build API URL
        let apiUrl;
        if (city) {
            apiUrl = `https://api.openweathermap.org/data/2.5/weather?q=${encodeURIComponent(city)}&appid=${apiKey}&units=metric`;
        } else {
            apiUrl = `https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lon}&appid=${apiKey}&units=metric`;
        }

        // Make API request
        const response = await axios.get(apiUrl, {
            timeout: 10000
        });

        res.json(response.data);
    } catch (error) {
        console.error('Weather API error:', error.message);
        
        if (error.response) {
            switch (error.response.status) {
                case 400:
                    return res.status(400).json({
                        error: 'Invalid request',
                        details: 'Please check your input parameters.'
                    });
                case 401:
                    return res.status(500).json({
                        error: 'API key error',
                        details: 'Weather service authentication failed.'
                    });
                case 404:
                    return res.status(404).json({
                        error: 'City not found',
                        details: 'The specified city could not be found. Please check the spelling and try again.'
                    });
                case 429:
                    return res.status(429).json({
                        error: 'API rate limit exceeded',
                        details: 'Too many requests to the weather service. Please try again later.',
                        retryAfter: error.response.headers['retry-after'] || 60
                    });
                default:
                    return res.status(502).json({
                        error: 'Weather service temporarily unavailable',
                        details: 'The weather service is experiencing issues. Please try again later.'
                    });
            }
        } else if (error.code === 'ECONNABORTED') {
            return res.status(504).json({
                error: 'Request timeout',
                details: 'The weather service is taking too long to respond. Please try again.'
            });
        } else if (error.code === 'ENOTFOUND' || error.code === 'ECONNREFUSED') {
            return res.status(503).json({
                error: 'Service unavailable',
                details: 'Unable to connect to the weather service. Please check your internet connection.'
            });
        } else {
            return res.status(500).json({
                error: 'Internal server error',
                details: process.env.NODE_ENV === 'development' ? error.message : 'An unexpected error occurred'
            });
        }
    }
});

// Forecast endpoint
app.get('/forecast', async (req, res) => {
    try {
        const { city, lat, lon } = req.query;
        
        // Validate input
        if (!city && (!lat || !lon)) {
            return res.status(400).json({
                error: 'Missing required parameter. Please provide either "city" or both "lat" and "lon" coordinates.',
                example: {
                    byCity: '/forecast?city=London',
                    byCoords: '/forecast?lat=51.5074&lon=-0.1278'
                }
            });
        }

        // Get API key from environment
        const apiKey = process.env.OPENWEATHER_API_KEY;
        if (!apiKey) {
            console.error('OpenWeatherMap API key not found in environment variables');
            return res.status(500).json({
                error: 'Server configuration error',
                details: 'Weather service is not properly configured.'
            });
        }

        // Build API URL
        let apiUrl;
        if (city) {
            apiUrl = `https://api.openweathermap.org/data/2.5/forecast?q=${encodeURIComponent(city)}&appid=${apiKey}&units=metric`;
        } else {
            apiUrl = `https://api.openweathermap.org/data/2.5/forecast?lat=${lat}&lon=${lon}&appid=${apiKey}&units=metric`;
        }

        // Make API request
        const response = await axios.get(apiUrl, {
            timeout: 10000
        });

        res.json(response.data);
    } catch (error) {
        console.error('Forecast API error:', error.message);
        
        if (error.response) {
            switch (error.response.status) {
                case 400:
                    return res.status(400).json({
                        error: 'Invalid request',
                        details: 'Please check your input parameters.'
                    });
                case 401:
                    return res.status(500).json({
                        error: 'API key error',
                        details: 'Weather service authentication failed.'
                    });
                case 404:
                    return res.status(404).json({
                        error: 'City not found',
                        details: 'The specified city could not be found. Please check the spelling and try again.'
                    });
                case 429:
                    return res.status(429).json({
                        error: 'API rate limit exceeded',
                        details: 'Too many requests to the weather service. Please try again later.',
                        retryAfter: error.response.headers['retry-after'] || 60
                    });
                default:
                    return res.status(502).json({
                        error: 'Weather service temporarily unavailable',
                        details: 'The weather service is experiencing issues. Please try again later.'
                    });
            }
        } else if (error.code === 'ECONNABORTED') {
            return res.status(504).json({
                error: 'Request timeout',
                details: 'The weather service is taking too long to respond. Please try again.'
            });
        } else if (error.code === 'ENOTFOUND' || error.code === 'ECONNREFUSED') {
            return res.status(503).json({
                error: 'Service unavailable',
                details: 'Unable to connect to the weather service. Please check your internet connection.'
            });
        } else {
            return res.status(500).json({
                error: 'Internal server error',
                details: process.env.NODE_ENV === 'development' ? error.message : 'An unexpected error occurred'
            });
        }
    }
});

// Simple health check endpoint
app.get('/health', (req, res) => {
    res.status(200).json({
        status: 'OK',
        timestamp: new Date().toISOString(),
        uptime: process.uptime(),
        environment: process.env.NODE_ENV || 'development'
    });
});

// 404 handler
app.use('*', (req, res) => {
    res.status(404).json({
        error: 'Endpoint not found',
        message: 'The requested endpoint does not exist.',
        availableEndpoints: {
            'GET /health': 'Health check endpoint',
            'GET /weather': 'Current weather data (query params: city OR lat,lon)',
            'GET /forecast': '5-day forecast data (query params: city OR lat,lon)',
        }
    });
});

// Global error handler
app.use((error, req, res, next) => {
    console.error('Unhandled Error:', error);
    
    res.status(500).json({
        error: 'Internal server error',
        message: 'An unexpected error occurred on the server.',
        ...(process.env.NODE_ENV === 'development' && { stack: error.stack })
    });
});

// Start server
app.listen(PORT, () => {
    console.log(`🚀 SkyWatch Backend Server running on port ${PORT}`);
    console.log(`📊 Health check: http://localhost:${PORT}/health`);
    console.log(`🌤️  Weather endpoint: http://localhost:${PORT}/weather?city=London`);
    console.log(`📅 Forecast endpoint: http://localhost:${PORT}/forecast?city=London`);
    console.log(`🌍 Environment: ${process.env.NODE_ENV || 'development'}`);
});

// Graceful shutdown
process.on('SIGTERM', () => {
    console.log('SIGTERM received, shutting down gracefully');
    process.exit(0);
});

process.on('SIGINT', () => {
    console.log('SIGINT received, shutting down gracefully');
    process.exit(0);
}); 