// SkyWatch Weather App - Professional Version 2.0.0
// Cache-busting mechanism to ensure fresh CSS loading
(function() {
    // Force reload CSS if it's cached
    var links = document.querySelectorAll('link[rel="stylesheet"]');
    links.forEach(function(link) {
        if (link.href.includes('style.css') && !link.href.includes('?v=')) {
            link.href = link.href + '?v=' + Date.now();
        }
    });
})();

// Weather App Class
class WeatherApp {
    constructor() {
        // Backend API configuration - update this URL when you deploy your backend
        this.backendUrl = 'https://skywatch-336o.onrender.com'; // Change this to your deployed backend URL
        this.currentWeather = null;
        this.forecast = null;
        this.lastSearchedCity = null;
        this.isGettingLocation = false; // Track location request state

        // Cache DOM elements for better performance
        this.cacheDOMElements();
        
        this.initializeApp();    // this function is responsible for showing the welcome page and loading the last location from localStorage without it we will load a blank welcome page
        this.bindEvents();       // this function is responsible for the working of all the buttons and inputs in the app it connects the event listeners to the buttons and inputs 
    }

    // ===== CUSTOM LOGGING FUNCTIONS =====
    
    // Log event to backend
    async logEvent(data) {
        try {
            const response = await fetch(`${this.backendUrl}/log`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(data)
            });
            
            if (!response.ok) {
                console.warn('Failed to log event:', response.status);
            }
        } catch (error) {
            console.warn('Error logging event:', error);
        }
    }

    // Detect device type for responsive design insights
    getDeviceType() {
        const userAgent = navigator.userAgent.toLowerCase();
        const screenWidth = window.innerWidth;
        
        // Mobile detection
        if (/mobile|android|iphone|ipad|ipod|blackberry|windows phone/i.test(userAgent)) {
            return 'mobile';
        }
        
        // Tablet detection
        if (/tablet|ipad/i.test(userAgent) || (screenWidth >= 768 && screenWidth <= 1024)) {
            return 'tablet';
        }
        
        // Desktop detection
        if (screenWidth > 1024) {
            return 'desktop';
        }
        
        // Fallback based on screen width
        if (screenWidth < 768) {
            return 'mobile';
        } else if (screenWidth < 1024) {
            return 'tablet';
        } else {
            return 'desktop';
        }
    }

    // Get user coordinates for tracking
    getUserCoordinates() {
        return new Promise((resolve, reject) => {
            if (!navigator.geolocation) {
                reject(new Error('Geolocation not supported'));
                return;
            }

            navigator.geolocation.getCurrentPosition(
                (position) => {
                    resolve({
                        lat: position.coords.latitude,
                        lon: position.coords.longitude
                    });
                },
                (error) => {
                    reject(error);
                },
                {
                    enableHighAccuracy: true,
                    timeout: 10000,
                    maximumAge: 600000 // 10 minutes
                }
            );
        });
    }

    // ===== DOM CACHING =====
    cacheDOMElements() {
        // Main containers
        this.loadingState = document.getElementById('loadingState');
        this.errorState = document.getElementById('errorState');
        this.welcomeState = document.getElementById('welcomeState');
        this.weatherDisplay = document.getElementById('weatherDisplay');
        this.toastContainer = document.getElementById('toastContainer');

        // Search elements
        this.searchInput = document.getElementById('searchInput');
        this.searchBtn = document.getElementById('searchBtn');
        this.locationBtn = document.getElementById('locationBtn');

        // Welcome elements
        this.welcomeSearchInput = document.getElementById('welcomeSearchInput');
        this.welcomeSearchBtn = document.getElementById('welcomeSearchBtn');
        this.welcomeLocationBtn = document.getElementById('welcomeLocationBtn');

        // Error elements
        this.errorMessage = document.getElementById('errorMessage');
        this.retryBtn = document.getElementById('retryBtn');

        // Weather display elements
        this.cityName = document.getElementById('cityName');
        this.countryName = document.getElementById('countryName');
        this.dateTime = document.getElementById('dateTime');
        this.temperature = document.getElementById('temperature');
        this.weatherDescription = document.getElementById('weatherDescription');
        this.weatherIcon = document.getElementById('weatherIcon');

        // Weather details
        this.feelsLike = document.getElementById('feelsLike');
        this.humidity = document.getElementById('humidity');
        this.windSpeed = document.getElementById('windSpeed');
        this.visibility = document.getElementById('visibility');

        // Forecast containers
        this.hourlyContainer = document.getElementById('hourlyContainer');
        this.forecastContainer = document.getElementById('forecastContainer');

        // Additional info
        this.sunrise = document.getElementById('sunrise');
        this.sunset = document.getElementById('sunset');
        this.pressure = document.getElementById('pressure');
        this.uvIndex = document.getElementById('uvIndex');
    }

    // ===== TOAST NOTIFICATIONS =====
    showToast(message, type = 'info', duration = 4000) {
        const toast = document.createElement('div');
        toast.className = `toast ${type}`;
        toast.textContent = message;
        
        this.toastContainer.appendChild(toast);
        
        // Trigger animation
        setTimeout(() => {
            toast.classList.add('show');
        }, 100);
        
        // Auto remove
        setTimeout(() => {
            toast.classList.remove('show');
            setTimeout(() => {
                if (toast.parentNode) {
                    toast.parentNode.removeChild(toast);
                }
            }, 300);
        }, duration);
    }

    // ===== INITIALIZATION =====
    initializeApp() {
        this.loadLastLocation();
        this.showWelcomeState();
    }

    bindEvents() {
        // Search functionality
        this.searchBtn.addEventListener('click', () => {
            const cityName = this.searchInput.value.trim();
            if (cityName) {
                this.handleSearch(cityName);
            }
        });

        this.searchInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                const cityName = this.searchInput.value.trim();
                if (cityName) {
                    this.handleSearch(cityName);
                }
            }
        });

        // Location functionality
        this.locationBtn.addEventListener('click', () => {
            this.getCurrentLocation();
        });

        // Welcome page events
        this.welcomeLocationBtn.addEventListener('click', () => {
            this.getCurrentLocation();
        });

        this.welcomeSearchBtn.addEventListener('click', () => {
            const cityName = this.welcomeSearchInput.value.trim();
            if (cityName) {
                this.handleSearch(cityName);
            }
        });

        this.welcomeSearchInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                const cityName = this.welcomeSearchInput.value.trim();
                if (cityName) {
                    this.handleSearch(cityName);
                }
            }
        });

        // Retry functionality
        this.retryBtn.addEventListener('click', () => {
            this.retryLastSearch();
        });
    }

    // ===== SEARCH & LOCATION HANDLING =====
    async handleSearch(cityName) {
        if (!cityName.trim()) {
            this.showToast('Please enter a city name', 'warning');
            return;
        }

        // Show loading with specific message
        this.showLoadingState('Searching for weather data...');
        
        // Set a timeout for the entire search process
        const searchTimeout = setTimeout(() => {
            console.warn('Search request timed out - clearing state');
            this.hideAllStates();
            this.showWelcomeState();
        }, 25000); // 25 seconds total timeout for search
        
        try {
            await this.fetchWeatherData(cityName);
            clearTimeout(searchTimeout); // Clear timeout on success
            
            this.lastSearchedCity = cityName;
            this.saveLastLocation(cityName);
            
            // Show success toast
            this.showToast(`Weather data loaded for ${cityName}`, 'success');
            
            // Log the search event
            this.logEvent({
                event: 'search',
                method: 'typed',
                query: cityName.trim(),
                device: this.getDeviceType(),
                viewport: { width: window.innerWidth, height: window.innerHeight },
                screen: { 
                    width: screen.width, 
                    height: screen.height, 
                    pixelRatio: window.devicePixelRatio || 1 
                },
                userAgent: navigator.userAgent
            });
            
            // Smooth scroll to weather display
            this.smoothScrollToWeather();
        } catch (error) {
            clearTimeout(searchTimeout); // Clear timeout on error
            console.error('Search error:', error);
            
            // Provide more specific error messages
            let errorMessage = error.message;
            
            // Check for common city name issues
            if (error.message.includes('City not found')) {
                errorMessage = `City "${cityName.trim()}" not found. Please check the spelling and try again.`;
                this.showToast(`City "${cityName.trim()}" not found`, 'error');
            } else if (error.message.includes('Network error')) {
                errorMessage = 'Unable to connect to weather service. Please check your internet connection and try again.';
                this.showToast('Network error. Please check your connection.', 'error');
            } else if (error.message.includes('Request timed out')) {
                errorMessage = 'Request timed out. Please try again or check your internet connection.';
                this.showToast('Request timed out. Please try again.', 'error');
            } else if (error.message.includes('Too many requests')) {
                errorMessage = 'Too many requests. Please wait a moment and try again.';
                this.showToast('Too many requests. Please wait a moment.', 'warning');
            }
            
            this.showError(errorMessage);
        }
    }

    async getCurrentLocation() {
        // Prevent multiple rapid calls
        if (this.isGettingLocation) {
            console.log('Location request already in progress');
            this.showToast('Location request already in progress', 'info');
            return;
        }

        if (!navigator.geolocation) {
            this.showToast('Geolocation not supported by your browser', 'error');
            this.showError('Geolocation is not supported by your browser. Please search for a city instead.');
            return;
        }

        this.isGettingLocation = true;
        this.showLoadingState('Getting your location...');
        
        // Set a global timeout for the entire location process
        const locationTimeout = setTimeout(() => {
            console.warn('Location request timed out - clearing state');
            this.isGettingLocation = false;
            this.hideAllStates();
            this.showWelcomeState();
        }, 15000); // 15 seconds total timeout
        
        try {
            const position = await this.getCurrentPosition();
            clearTimeout(locationTimeout); // Clear timeout on success
            
            this.showLoadingState('Fetching weather for your location...');
            
            const { latitude, longitude } = position.coords;
            await this.fetchWeatherDataByCoords(latitude, longitude);
            
            // Get city name from the fetched weather data for logging
            const cityName = this.currentWeather ? this.currentWeather.name : 'Unknown Location';
            
            // Show success toast
            this.showToast(`Weather data loaded for your location`, 'success');
            
            // Log the location search event
            this.logEvent({
                event: 'search',
                method: 'location',
                query: cityName,
                device: this.getDeviceType(),
                viewport: { width: window.innerWidth, height: window.innerHeight },
                screen: { 
                    width: screen.width, 
                    height: screen.height, 
                    pixelRatio: window.devicePixelRatio || 1 
                },
                userAgent: navigator.userAgent,
                lat: latitude,
                lon: longitude
            });
            
            // Smooth scroll to weather display
            this.smoothScrollToWeather();
        } catch (error) {
            clearTimeout(locationTimeout); // Clear timeout on error
            this.isGettingLocation = false;
            console.error('Location error:', error);
            
            // Provide more specific location error messages
            let errorMessage = error.message;
            
            if (error.code === 1) {
                errorMessage = 'Location access denied. Please allow location access or search for a city instead.';
                this.showToast('Location access denied', 'error');
            } else if (error.code === 2) {
                errorMessage = 'Location unavailable. Please try again or search for a city instead.';
                this.showToast('Location unavailable', 'error');
            } else if (error.code === 3) {
                errorMessage = 'Location request timed out. Please try again or search for a city instead.';
                this.showToast('Location request timed out', 'error');
            } else if (error.message.includes('Network error')) {
                errorMessage = 'Unable to connect to weather service. Please check your internet connection and try again.';
                this.showToast('Network error. Please check your connection.', 'error');
            }
            
            this.showError(errorMessage);
        }
    }

    getCurrentPosition() {
        return new Promise((resolve, reject) => {
            navigator.geolocation.getCurrentPosition(
                resolve,
                reject,
                {
                    enableHighAccuracy: true,
                    timeout: 10000,
                    maximumAge: 600000 // 10 minutes
                }
            );
        });
    }

    getGeolocationErrorMessage(error) {
        switch (error.code) {
            case 1:
                return 'Location access denied. Please allow location access in your browser settings.';
            case 2:
                return 'Location unavailable. Please try again or search for a city instead.';
            case 3:
                return 'Location request timed out. Please try again or search for a city instead.';
            default:
                return 'Unable to get your location. Please search for a city instead.';
        }
    }

    // ===== API REQUEST HANDLING =====
    async fetchWeatherData(cityName) {
        const currentWeather = await this.fetchCurrentWeather(cityName);
        const forecast = await this.fetchForecast(cityName);
        
        this.currentWeather = currentWeather;
        this.forecast = forecast;
        
        this.displayWeatherData();
    }

    async fetchWeatherDataByCoords(lat, lon) {
        const currentWeather = await this.fetchCurrentWeatherByCoords(lat, lon);
        const forecast = await this.fetchForecastByCoords(lat, lon);
        
        this.currentWeather = currentWeather;
        this.forecast = forecast;
        
        this.displayWeatherData();
    }

    async fetchCurrentWeather(cityName) {
        const url = `${this.backendUrl}/weather?city=${encodeURIComponent(cityName)}`;
        return await this.makeApiRequest(url);
    }

    async fetchCurrentWeatherByCoords(lat, lon) {
        const url = `${this.backendUrl}/weather?lat=${lat}&lon=${lon}`;
        return await this.makeApiRequest(url);
    }

    async fetchForecast(cityName) {
        const url = `${this.backendUrl}/forecast?city=${encodeURIComponent(cityName)}`;
        return await this.makeApiRequest(url);
    }

    async fetchForecastByCoords(lat, lon) {
        const url = `${this.backendUrl}/forecast?lat=${lat}&lon=${lon}`;
        return await this.makeApiRequest(url);
    }

    async makeApiRequest(url) {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 15000); // 15 seconds timeout

        try {
            const response = await fetch(url, {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                    'Accept': 'application/json'
                },
                signal: controller.signal
            });

            clearTimeout(timeoutId);
            
            // Enhanced error handling with specific messages
            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}));
                
                if (response.status === 400) {
                    throw new Error(errorData.details || 'Invalid request. Please check your input and try again.');
                } else if (response.status === 404) {
                    throw new Error(errorData.details || 'City not found. Please check the spelling and try again.');
                } else if (response.status === 429) {
                    throw new Error(errorData.details || 'Too many requests. Please wait a moment and try again.');
                } else if (response.status === 500) {
                    throw new Error(errorData.details || 'Server error. Please try again later.');
                } else if (response.status === 502 || response.status === 503) {
                    throw new Error(errorData.details || 'Weather service temporarily unavailable. Please try again later.');
                } else if (response.status === 504) {
                    throw new Error(errorData.details || 'Request timeout. Please try again.');
                } else {
                    throw new Error(errorData.details || `Request failed with status ${response.status}. Please try again.`);
                }
            }
            
            const data = await response.json();
            return data;
        } catch (error) {
            if (error.name === 'AbortError') {
                throw new Error('Request timed out. Please check your internet connection and try again.');
            }

            if (error.name === 'TypeError' && error.message.includes('fetch')) {
                throw new Error('Network error. Please check your internet connection and ensure the backend server is running.');
            }
            
            throw error;
        }
    }

    // ===== WEATHER DATA DISPLAY =====
    displayWeatherData() {
        this.hideAllStates();
        this.showWeatherDisplay();
        
        // Add animation class for smooth transition
        this.weatherDisplay.classList.add('animate');
        
        this.updateCurrentWeather();
        this.updateHourlyForecast();
        this.updateDailyForecast();
        this.updateAdditionalInfo();
    }

    updateCurrentWeather() {
        const weather = this.currentWeather;
        
        // Update location with better formatting
        this.cityName.textContent = weather.name;
        this.countryName.textContent = weather.sys.country;
        this.dateTime.textContent = this.formatDateTime(weather.dt, weather.timezone);

        // Update temperature and description with animation
        this.animateValue(this.temperature, Math.round(weather.main.temp));
        this.weatherDescription.textContent = weather.weather[0].description;
        this.weatherIcon.className = `weather-icon ${this.getWeatherIcon(weather.weather[0].id)}`;

        // Update weather details with better formatting
        this.animateValue(this.feelsLike, `${Math.round(weather.main.feels_like)}°C`);
        this.animateValue(this.humidity, `${weather.main.humidity}%`);
        this.animateValue(this.windSpeed, this.convertWindSpeed(weather.wind.speed));
        this.animateValue(this.visibility, `${(weather.visibility / 1000).toFixed(1)} km`);
    }

    updateHourlyForecast() {
        this.hourlyContainer.innerHTML = '';

        if (!this.forecast || !this.forecast.list) return;

        // Get next 24 hours of forecast
        const hourlyData = this.forecast.list.slice(0, 8); // 3-hour intervals, so 8 = 24 hours
        
        hourlyData.forEach((hour, index) => {
            const hourlyCard = this.createHourlyCard(hour);
            this.hourlyContainer.appendChild(hourlyCard);
        });
    }

    createHourlyCard(hour) {
        const card = document.createElement('div');
        card.className = 'hourly-card';
        
        const time = new Date(hour.dt * 1000);
        const timeString = time.toLocaleTimeString('en-US', { 
            hour: '2-digit', 
            minute: '2-digit',
            hour12: true 
        });
        
        card.innerHTML = `
            <div class="hourly-time">${timeString}</div>
            <i class="hourly-icon ${this.getWeatherIcon(hour.weather[0].id)}"></i>
            <div class="hourly-temp">${Math.round(hour.main.temp)}°C</div>
            <div class="hourly-desc">${hour.weather[0].description}</div>
        `;
        return card;
    }

    updateDailyForecast() {
        this.forecastContainer.innerHTML = '';

        // Group forecast by day and get daily data
        const dailyForecast = this.getDailyForecast();
        
        dailyForecast.forEach((day, index) => {
            const forecastCard = this.createForecastCard(day);
            this.forecastContainer.appendChild(forecastCard);
        });
    }

    createForecastCard(day) {
        const card = document.createElement('div');
        card.className = 'forecast-card';
        card.innerHTML = `
            <div class="forecast-date">${day.date}</div>
            <i class="forecast-icon ${this.getWeatherIcon(day.weatherId)}"></i>
            <div class="forecast-temp">${Math.round(day.temp)}°C</div>
            <div class="forecast-desc">${day.description}</div>
        `;
        return card;
    }

    getDailyForecast() {
        if (!this.forecast || !this.forecast.list) return [];

        const dailyData = {};
        
        this.forecast.list.forEach(item => {
            const date = new Date(item.dt * 1000);
            const dayKey = date.toDateString();
            
            if (!dailyData[dayKey]) {
                dailyData[dayKey] = {
                    date: this.formatDate(item.dt),
                    temp: item.main.temp,
                    weatherId: item.weather[0].id,
                    description: item.weather[0].description,
                    count: 1
                };
            } else {
                dailyData[dayKey].temp += item.main.temp;
                dailyData[dayKey].count += 1;
            }
        });

        // Calculate average temperature and return array (7 days)
        return Object.values(dailyData).map(day => ({
            ...day,
            temp: day.temp / day.count
        })).slice(0, 7); // Return 7 days
    }

    updateAdditionalInfo() {
        const weather = this.currentWeather;
        
        // Update sunrise and sunset times
        this.sunrise.textContent = this.formatTime(weather.sys.sunrise, weather.timezone);
        this.sunset.textContent = this.formatTime(weather.sys.sunset, weather.timezone);
        
        // Update pressure
        this.pressure.textContent = `${weather.main.pressure} hPa`;
        
        // Update UV index (if available)
        if (weather.uvi !== undefined) {
            this.uvIndex.textContent = weather.uvi;
        } else {
            this.uvIndex.textContent = 'N/A';
        }
    }

    // ===== WEATHER ICON MAPPING =====
    getWeatherIcon(weatherId) {
        // Thunderstorm
        if (weatherId >= 200 && weatherId < 300) {
            return 'fas fa-bolt';
        }
        // Drizzle
        else if (weatherId >= 300 && weatherId < 400) {
            return 'fas fa-cloud-rain';
        }
        // Rain
        else if (weatherId >= 500 && weatherId < 600) {
            if (weatherId >= 511 && weatherId <= 531) {
                return 'fas fa-cloud-showers-heavy';
            }
            return 'fas fa-cloud-rain';
        }
        // Snow
        else if (weatherId >= 600 && weatherId < 700) {
            return 'fas fa-snowflake';
        }
        // Atmosphere (fog, mist, etc.)
        else if (weatherId >= 700 && weatherId < 800) {
            return 'fas fa-smog';
        }
        // Clear
        else if (weatherId === 800) {
            return 'fas fa-sun';
        }
        // Clouds
        else if (weatherId >= 801 && weatherId < 900) {
            if (weatherId === 801) {
                return 'fas fa-cloud-sun';
            } else if (weatherId === 802) {
                return 'fas fa-cloud';
            } else {
                return 'fas fa-clouds';
            }
        }
        // Default
        else {
            return 'fas fa-cloud';
        }
    }

    // ===== UTILITY FUNCTIONS =====
    convertWindSpeed(speedMs) {
        const speedKmh = Math.round(speedMs * 3.6);
        return `${speedKmh} km/h`;
    }

    formatDate(timestamp) {
        const date = new Date(timestamp * 1000);
        return date.toLocaleDateString('en-US', { 
            weekday: 'short',
            month: 'short',
            day: 'numeric'
        });
    }

    formatTime(timestamp, timezone) {
        const date = new Date(timestamp * 1000);
        return date.toLocaleTimeString('en-US', { 
            hour: '2-digit', 
            minute: '2-digit',
            hour12: true 
        });
    }

    formatDateTime(timestamp, timezone) {
        const date = new Date(timestamp * 1000);
        return date.toLocaleString('en-US', { 
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
            hour12: true
        });
    }

    // ===== UI STATE MANAGEMENT =====
    showLoadingState(message = 'Loading...') {
        this.hideAllStates();
        this.loadingState.classList.remove('hidden');
        
        // Update loading message if element exists
        const loadingText = this.loadingState.querySelector('p');
        if (loadingText) {
            loadingText.textContent = message;
        }
    }

    showError(message) {
        this.hideAllStates();
        this.errorMessage.textContent = message;
        this.errorState.classList.remove('hidden');
    }

    showWelcomeState() {
        this.hideAllStates();
        this.welcomeState.classList.remove('hidden');
    }

    showWeatherDisplay() {
        this.weatherDisplay.classList.remove('hidden');
    }

    hideAllStates() {
        const states = [this.loadingState, this.errorState, this.welcomeState, this.weatherDisplay];
        states.forEach(state => {
            if (state) state.classList.add('hidden');
        });
    }

    retryLastSearch() {
        if (this.lastSearchedCity) {
            this.handleSearch(this.lastSearchedCity);
        } else {
            this.getCurrentLocation();
        }
    }

    // ===== ANIMATION & UX FUNCTIONS =====
    animateValue(element, newValue) {
        if (!element) return;
        
        // Add animation class
        element.classList.add('value-update');
        
        // Update the value
        element.textContent = newValue;
        
        // Remove animation class after animation completes
        setTimeout(() => {
            element.classList.remove('value-update');
        }, 300);
    }

    smoothScrollToWeather() {
        if (this.weatherDisplay) {
            this.weatherDisplay.scrollIntoView({ 
                behavior: 'smooth', 
                block: 'start' 
            });
        }
    }

    // ===== STORAGE FUNCTIONS =====
    saveLastLocation(cityName) {
        try {
            localStorage.setItem('lastLocation', cityName);
        } catch (error) {
            console.warn('Could not save location to localStorage:', error);
        }
    }

    loadLastLocation() {
        try {
            const lastLocation = localStorage.getItem('lastLocation');
            if (lastLocation) {
                this.lastSearchedCity = lastLocation;
            }
        } catch (error) {
            console.warn('Could not load location from localStorage:', error);
        }
    }

    // ===== UTILITY FUNCTIONS =====
    debounce(func, wait) {
        let timeout;
        return function executedFunction(...args) {
            const later = () => {
                clearTimeout(timeout);
                func(...args);
            };
            clearTimeout(timeout);
            timeout = setTimeout(later, wait);
        };
    }
}

// Initialize the app when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    // Initialize the app
    const app = new WeatherApp();
});
