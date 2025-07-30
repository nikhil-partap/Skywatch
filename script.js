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

    // ===== GA4 TRACKING FUNCTIONS =====
    
    // Track weather search event
    trackWeatherSearch(city, method, coordinates = null) {
        if (typeof gtag === 'undefined') {
            console.warn('Google Analytics not loaded');
            return;
        }

        const eventData = {
            event_category: 'weather_search',
            event_label: method,
            city: city,
            method: method,
            timestamp: Date.now(),
            user_agent: navigator.userAgent,
            language: navigator.language,
            platform: navigator.platform,
            timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
            screen_width: screen.width,
            screen_height: screen.height
        };

        // Add coordinates for geolocation searches
        if (coordinates && coordinates.lat && coordinates.lon) {
            eventData.lat = coordinates.lat;
            eventData.lon = coordinates.lon;
        }

        // Send event to GA4
        gtag('event', 'weather_search', eventData);
        
        console.log('Weather search tracked:', eventData);
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

    // ===== DOM ELEMENT CACHING =====
    cacheDOMElements() {
        // Search elements
        this.searchBtn = document.getElementById('searchBtn');
        this.searchInput = document.getElementById('searchInput');
        this.welcomeSearchBtn = document.getElementById('welcomeSearchBtn');
        this.welcomeSearchInput = document.getElementById('welcomeSearchInput');
        
        // Location elements
        this.locationBtn = document.getElementById('locationBtn');
        this.welcomeLocationBtn = document.getElementById('welcomeLocationBtn');
        
        // Retry element
        this.retryBtn = document.getElementById('retryBtn');
        
        // State containers
        this.loadingState = document.getElementById('loadingState');
        this.errorState = document.getElementById('errorState');
        this.errorMessage = document.getElementById('errorMessage');
        this.welcomeState = document.getElementById('welcomeState');
        this.weatherDisplay = document.getElementById('weatherDisplay');
        
        // Weather display elements
        this.cityName = document.getElementById('cityName');
        this.countryName = document.getElementById('countryName');
        this.dateTime = document.getElementById('dateTime');
        this.temperature = document.getElementById('temperature');
        this.weatherDescription = document.getElementById('weatherDescription');
        this.weatherIcon = document.getElementById('weatherIcon');
        this.feelsLike = document.getElementById('feelsLike');
        this.humidity = document.getElementById('humidity');
        this.windSpeed = document.getElementById('windSpeed');
        this.visibility = document.getElementById('visibility');
        
        // Forecast elements
        this.forecastContainer = document.getElementById('forecastContainer');
        
        // Additional info elements
        this.sunrise = document.getElementById('sunrise');
        this.sunset = document.getElementById('sunset');
        this.pressure = document.getElementById('pressure');
        this.uvIndex = document.getElementById('uvIndex');
    }

    // ===== INITIALIZATION =====
    initializeApp() {
        this.showWelcomeState();   // without this we will load a blank welcome page 
        this.loadLastLocation();  // this function is responsible for loading the last location from localStorage 
    }

    // ===== EVENT HANDLING =====
    bindEvents() {
        // Search functionality 
        // 1 : grab the input field + search button for both Main, Welcome screen.
        // 2 : When the search button is clicked, grab the current value from the input field and call handleSearch() with that. The ?. ensures the app doesn't crash if the element is null.
        this.searchBtn?.addEventListener('click', () => this.handleSearch(this.searchInput.value));
        this.welcomeSearchBtn?.addEventListener('click', () => this.handleSearch(this.welcomeSearchInput.value));

        // Enter key support  : if the user press the enter key it will trigger the handleSearch() same behavior as clicking the search button.
        this.searchInput?.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') this.handleSearch(this.searchInput.value);
        });
        this.welcomeSearchInput?.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') this.handleSearch(this.welcomeSearchInput.value);
        });

        // Location button  : These buttons use the browser's geolocation API to get current location weather.
        this.locationBtn?.addEventListener('click', () => this.getCurrentLocation());
        this.welcomeLocationBtn?.addEventListener('click', () => this.getCurrentLocation());

        // Retry button  : This gives the user a way to retry the last failed search, using stored city data.
        this.retryBtn?.addEventListener('click', () => this.retryLastSearch());
    }

    // ===== SEARCH & LOCATION HANDLING =====
    async handleSearch(cityName) {
        if (!cityName.trim()) {    // trim removes the whitespace like "  " from the start and end of the string(cityName)
            this.showError('Please enter a city name');
            return;
        }

        this.showLoadingState();
        
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
            
            // Track the weather search
            this.trackWeatherSearch(cityName.trim(), 'typed');
            
            // Smooth scroll to weather display
            this.smoothScrollToWeather();
        } catch (error) {
            clearTimeout(searchTimeout); // Clear timeout on error
            console.error('Search error:', error);
            this.showError(error.message);
        }
    }

    async getCurrentLocation() {
        // Prevent multiple rapid calls
        if (this.isGettingLocation) {
            console.log('Location request already in progress');
            return;
        }

        if (!navigator.geolocation) {
            this.showError('Geolocation is not supported by your browser');
            return;
        }

        this.isGettingLocation = true;
        this.showLoadingState();
        
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
            
            const { latitude, longitude } = position.coords;
            await this.fetchWeatherDataByCoords(latitude, longitude);
            
            // Get city name from the fetched weather data for tracking
            const cityName = this.currentWeather ? this.currentWeather.name : 'Unknown Location';
            
            // Track the weather search with coordinates
            this.trackWeatherSearch(cityName, 'geolocation', {
                lat: latitude,
                lon: longitude
            });
            
            // Smooth scroll to weather display
            this.smoothScrollToWeather();
        } catch (error) {
            clearTimeout(locationTimeout); // Clear timeout on error
            
            console.warn('Location access failed:', error.message);
            
            // Handle different types of location errors
            if (error.message.includes('permission') || error.message.includes('denied')) {
                console.log('Location permission denied by user');
                this.showError('Location access denied. Please enable location permissions in your browser settings.');
            } else if (error.message.includes('unavailable')) {
                console.log('Location information temporarily unavailable');
                this.showError('Location service temporarily unavailable. Please try again in a few moments.');
            } else if (error.message.includes('timeout')) {
                console.log('Location request timed out');
                this.showError('Location request timed out. Please check your internet connection and try again.');
            } else {
                console.log('Unknown location error:', error.message);
                this.showError('Unable to get your location. Please try searching for a city instead.');
            }
        } finally {
            this.isGettingLocation = false;
        }
    }

    getCurrentPosition() {
        return new Promise((resolve, reject) => {
            const timeoutId = setTimeout(() => {
                reject(new Error('Location request timed out'));
            }, 10000);

            navigator.geolocation.getCurrentPosition(
                (position) => {
                    clearTimeout(timeoutId);
                    resolve(position);
                },
                (error) => {
                    clearTimeout(timeoutId);
                    reject(new Error(this.getGeolocationErrorMessage(error)));
                },
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
            case error.PERMISSION_DENIED:
                return 'Location access denied. Please enable location permissions.';
            case error.POSITION_UNAVAILABLE:
                return 'Location information is unavailable.';
            case error.TIMEOUT:
                return 'Location request timed out.';
            default:
                return 'An unknown error occurred while getting location.';
        }
    }

    // ===== WEATHER DATA FETCHING =====
    async fetchWeatherData(cityName) {
        try {
            const [currentWeather, forecast] = await Promise.all([
                this.fetchCurrentWeather(cityName),
                this.fetchForecast(cityName)
            ]);

            this.currentWeather = currentWeather;
            this.forecast = forecast;
            this.displayWeatherData();
        } catch (error) {
            throw new Error(`Unable to fetch weather data for ${cityName}. Please check the city name and try again.`);
        }
    }

    async fetchWeatherDataByCoords(lat, lon) {
        try {
            const [currentWeather, forecast] = await Promise.all([
                this.fetchCurrentWeatherByCoords(lat, lon),
                this.fetchForecastByCoords(lat, lon)
            ]);

            this.currentWeather = currentWeather;
            this.forecast = forecast;
            this.displayWeatherData();
        } catch (error) {
            throw new Error('Unable to fetch weather data for your location. Please try again.');
        }
    }

    async fetchCurrentWeather(cityName) {
        const url = `${this.backendUrl}/weather?city=${encodeURIComponent(cityName)}`;
        const response = await this.makeApiRequest(url);
        return response;
    }

    async fetchCurrentWeatherByCoords(lat, lon) {
        const url = `${this.backendUrl}/weather?lat=${lat}&lon=${lon}`;
        const response = await this.makeApiRequest(url);
        return response;
    }

    async fetchForecast(cityName) {
        const url = `${this.backendUrl}/forecast?city=${encodeURIComponent(cityName)}`;
        const response = await this.makeApiRequest(url);
        return response;
    }

    async fetchForecastByCoords(lat, lon) {
        const url = `${this.backendUrl}/forecast?lat=${lat}&lon=${lon}`;
        const response = await this.makeApiRequest(url);
        return response;
    }

    async makeApiRequest(url) {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 15000); // Increased to 15 seconds

        try {
            const response = await fetch(url, {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                    'Accept': 'application/json'
                },
                signal: controller.signal    // fetch() does not support a built-in timeout. It will wait forever unless you cancel it. That's why this external controller is needed.
            });

            clearTimeout(timeoutId);
            
            // error handling block
            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}));
                
                if (response.status === 400) {
                    throw new Error(errorData.details || 'Invalid request parameters');
                } else if (response.status === 404) {
                    throw new Error(errorData.details || 'City not found. Please check the spelling and try again.');
                } else if (response.status === 429) {
                    throw new Error(errorData.details || 'Too many requests. Please try again later.');
                } else if (response.status === 500) {
                    throw new Error(errorData.details || 'Server error. Please try again later.');
                } else if (response.status === 502 || response.status === 503) {
                    throw new Error(errorData.details || 'Weather service temporarily unavailable. Please try again later.');
                } else if (response.status === 504) {
                    throw new Error(errorData.details || 'Request timeout. Please try again.');  // works only if the server sends a 504 status code in its response.
                } else {
                    throw new Error(errorData.details || `Request failed with status ${response.status}`);
                }
            }
            // Success case : if the response is ok then the data is returned.
            const data = await response.json();
            return data;
        }
        // Catch block – non-HTTP errors
        catch (error) {
            
            if (error.name === 'AbortError') {
                throw new Error('Request timed out. Please check your internet connection and try again.');   // adding new error message for the abort error ()
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
        
        // Make the weather display visible immediately
        this.weatherDisplay.classList.add('animate');
        
        this.updateCurrentWeather();
        this.updateForecast();
        this.updateAdditionalInfo();
    }

    updateCurrentWeather() {
        const weather = this.currentWeather;
        
        // Update location
        this.cityName.textContent = weather.name;
        this.countryName.textContent = weather.sys.country;
        this.dateTime.textContent = this.formatDateTime(weather.dt, weather.timezone);

        // Update temperature and description with animation
        this.animateValue(this.temperature, Math.round(weather.main.temp));
        this.weatherDescription.textContent = weather.weather[0].description;
        this.weatherIcon.className = `weather-icon ${this.getWeatherIcon(weather.weather[0].id)}`;

        // Update weather details
        this.animateValue(this.feelsLike, `${Math.round(weather.main.feels_like)}°C`);
        this.animateValue(this.humidity, `${weather.main.humidity}%`);
        this.animateValue(this.windSpeed, this.convertWindSpeed(weather.wind.speed));
        this.animateValue(this.visibility, `${(weather.visibility / 1000).toFixed(1)} km`);
    }

    updateForecast() {
        this.forecastContainer.innerHTML = '';

        // Group forecast by day and get daily data
        const dailyForecast = this.getDailyForecast();   
        // this function takes the raw forecast data (which usually gives data every 3 hours), and groups it into daily summaries.
        
        dailyForecast.forEach((day, index) => {
            const forecastCard = this.createForecastCard(day);
            this.forecastContainer.appendChild(forecastCard);
        });
    }

    createForecastCard(day) {
        const card = document.createElement('div');
        card.className = 'forecast-card';
        
        card.innerHTML = `
            <div class="forecast-date">${this.formatDate(day.date)}</div>
            <i class="forecast-icon ${this.getWeatherIcon(day.weatherId)}"></i>
            <div class="forecast-temp">${Math.round(day.temp)}°C</div>
            <div class="forecast-desc">${day.description}</div>
        `;
        
        return card;
    }

    getDailyForecast() {
        const dailyData = {};
        
        this.forecast.list.forEach(item => {
            const date = new Date(item.dt * 1000);
            const dayKey = date.toDateString();
            
            if (!dailyData[dayKey]) {
                dailyData[dayKey] = {
                    date: date,
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

        // Calculate average temperature and return array
        return Object.values(dailyData)
            .map(day => ({
                ...day,
                temp: day.temp / day.count
            }))
            .slice(0, 5); // Return only 5 days
    }

    updateAdditionalInfo() {
        const weather = this.currentWeather;
        
        // Update sunrise and sunset
        this.sunrise.textContent = this.formatTime(weather.sys.sunrise, weather.timezone);
        this.sunset.textContent = this.formatTime(weather.sys.sunset, weather.timezone);
        
        // Update pressure
        this.pressure.textContent = `${weather.main.pressure} hPa`;
        
        // Note: UV index is not available in the free API tier
        // You would need to make an additional API call for this
        this.uvIndex.textContent = 'N/A';
    }

    // ===== UTILITY FUNCTIONS =====
    getWeatherIcon(weatherId) {
        const iconMap = {
            // Clear
            800: 'fas fa-sun',
            
            // Clouds
            801: 'fas fa-cloud-sun',
            802: 'fas fa-cloud',
            803: 'fas fa-cloud',
            804: 'fas fa-clouds',
            
            // Rain
            200: 'fas fa-bolt',
            201: 'fas fa-cloud-rain',
            202: 'fas fa-cloud-showers-heavy',
            210: 'fas fa-bolt',
            211: 'fas fa-bolt',
            212: 'fas fa-bolt',
            221: 'fas fa-bolt',
            230: 'fas fa-cloud-rain',
            231: 'fas fa-cloud-rain',
            232: 'fas fa-cloud-showers-heavy',
            
            // Drizzle
            300: 'fas fa-cloud-rain',
            301: 'fas fa-cloud-rain',
            302: 'fas fa-cloud-rain',
            310: 'fas fa-cloud-rain',
            311: 'fas fa-cloud-rain',
            312: 'fas fa-cloud-rain',
            313: 'fas fa-cloud-rain',
            314: 'fas fa-cloud-rain',
            321: 'fas fa-cloud-rain',
            
            // Rain
            500: 'fas fa-cloud-rain',
            501: 'fas fa-cloud-rain',
            502: 'fas fa-cloud-showers-heavy',
            503: 'fas fa-cloud-showers-heavy',
            504: 'fas fa-cloud-showers-heavy',
            511: 'fas fa-cloud-rain',
            520: 'fas fa-cloud-rain',
            521: 'fas fa-cloud-rain',
            522: 'fas fa-cloud-showers-heavy',
            531: 'fas fa-cloud-showers-heavy',
            
            // Snow
            600: 'fas fa-snowflake',
            601: 'fas fa-snowflake',
            602: 'fas fa-snowflake',
            611: 'fas fa-snowflake',
            612: 'fas fa-snowflake',
            613: 'fas fa-snowflake',
            615: 'fas fa-snowflake',
            616: 'fas fa-snowflake',
            620: 'fas fa-snowflake',
            621: 'fas fa-snowflake',
            622: 'fas fa-snowflake',
            
            // Atmosphere
            701: 'fas fa-smog',
            711: 'fas fa-smog',
            721: 'fas fa-smog',
            731: 'fas fa-smog',
            741: 'fas fa-smog',
            751: 'fas fa-smog',
            761: 'fas fa-smog',
            762: 'fas fa-smog',
            771: 'fas fa-wind',
            781: 'fas fa-tornado'
        };
        
        return iconMap[weatherId] || 'fas fa-cloud';
    }

    convertWindSpeed(speedMs) {
        const speedKmh = (speedMs * 3.6).toFixed(1);
        return `${speedKmh} km/h`;
    }

    formatDate(timestamp) {
        const date = new Date(timestamp);
        return date.toLocaleDateString('en-US', { 
            weekday: 'short',
            month: 'short',
            day: 'numeric'
        });
    }

    formatTime(timestamp, timezone) {
        const date = new Date((timestamp + timezone) * 1000);
        return date.toLocaleTimeString('en-US', {
            hour: '2-digit',
            minute: '2-digit',
            hour12: false
        });
    }

    formatDateTime(timestamp, timezone) {
        const date = new Date((timestamp + timezone) * 1000);
        return date.toLocaleString('en-US', {
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
            hour12: false
        });
    }

    // ===== UI STATE MANAGEMENT =====
    showLoadingState() {
        this.hideAllStates();
        this.loadingState.classList.remove('hidden');
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
    
    // Add some additional features
    app.debouncedSearch = app.debounce(app.handleSearch.bind(app), 500);
    
    // Add input event listeners for real-time search suggestions (optional)
    const searchInput = document.getElementById('searchInput');
    const welcomeSearchInput = document.getElementById('welcomeSearchInput');
    
    searchInput?.addEventListener('input', (e) => {
        if (e.target.value.length > 2) {
            app.debouncedSearch(e.target.value);
        }
    });
    
    welcomeSearchInput?.addEventListener('input', (e) => {
        if (e.target.value.length > 2) {
            app.debouncedSearch(e.target.value);
        }
    });
});

// Add service worker for PWA capabilities (optional)
if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
        console.log('Attempting to register service worker...');
        console.log('Current location:', window.location.href);
        console.log('Hostname:', window.location.hostname);
        
        // Check if we're on GitHub Pages and adjust the path
        const isGitHubPages = window.location.hostname === 'nikhil-partap.github.io';
        const swPath = isGitHubPages ? '/Skywatch/sw.js' : '/sw.js';
        
        console.log('Service worker path:', swPath);
        
        // First, check if the service worker file exists
        fetch(swPath, { method: 'HEAD' })
            .then(response => {
                if (response.ok) {
                    console.log('Service worker file found at:', swPath);
                    return navigator.serviceWorker.register(swPath);
                } else {
                    throw new Error(`Service worker file not found at ${swPath}`);
                }
            })
            .then(registration => {
                console.log('SW registered successfully: ', registration);
                
                // Check for updates
                registration.addEventListener('updatefound', () => {
                    const newWorker = registration.installing;
                    newWorker.addEventListener('statechange', () => {
                        if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
                            // New service worker available
                            console.log('New service worker available');
                        }
                    });
                });
            })
            .catch(registrationError => {
                console.log('SW registration failed: ', registrationError);
                
                // Try alternative path for GitHub Pages
                if (isGitHubPages) {
                    console.log('Trying fallback path: /sw.js');
                    navigator.serviceWorker.register('/sw.js')
                        .then(registration => {
                            console.log('SW registered with fallback path: ', registration);
                        })
                        .catch(fallbackError => {
                            console.log('SW fallback registration also failed: ', fallbackError);
                            console.log('Service worker registration completely failed. This is normal for development.');
                        });
                }
            });
    });
}

// Add keyboard shortcuts
document.addEventListener('keydown', (e) => {
    // Ctrl/Cmd + K to focus search
    if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault();
        const searchInput = document.getElementById('searchInput');
        if (searchInput) {
            searchInput.focus();
        }
    }
    
    // Escape to clear search
    if (e.key === 'Escape') {
        const searchInput = document.getElementById('searchInput');
        const welcomeSearchInput = document.getElementById('welcomeSearchInput');
        
        if (searchInput) searchInput.value = '';
        if (welcomeSearchInput) welcomeSearchInput.value = '';
        
        document.activeElement.blur();
    }
});

// Add offline detection
window.addEventListener('online', () => {
    console.log('App is online');
    // You could show a notification here
});

window.addEventListener('offline', () => {
    console.log('App is offline');
    // You could show a notification here
});
