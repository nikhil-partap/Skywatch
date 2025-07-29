// Weather App - Professional Implementation
class WeatherApp {
    constructor() {
        // Backend API configuration - update this URL when you deploy your backend
        this.backendUrl = 'https://skywatch-336o.onrender.com'; // Change this to your deployed backend URL
        this.currentWeather = null;
        this.forecast = null;
        this.lastSearchedCity = null;

        this.initializeApp();    // this function is responsible for showing the welcome page and loading the last location from localStorage without it we will load a blank welcome page
        this.bindEvents();       // this function is responsible for the working of all the buttons and inputs in the app it connects the event listeners to the buttons and inputs 
    }

    // Initialize the application
    initializeApp() {
        this.showWelcomeState();   // without this we will load a blank welcome page 
        this.loadLastLocation();  // this function is responsible for loading the last location from localStorage 
    }

    // Bind all event listeners
    bindEvents() {
        // Search functionality 
        // 1 : grab the input field + search button for both Main, Welcome screen.
        const searchBtn = document.getElementById('searchBtn');
        const searchInput = document.getElementById('searchInput');
        const welcomeSearchBtn = document.getElementById('welcomeSearchBtn');
        const welcomeSearchInput = document.getElementById('welcomeSearchInput');  // corrected the typo in the id from welcomeaSearchInput to welcomeSearchInput

        // 2 : When the search button is clicked, grab the current value from the input field and call handleSearch() with that. The ?. ensures the app doesn’t crash if the element is null.
        searchBtn?.addEventListener('click', () => this.handleSearch(searchInput.value));
        welcomeSearchBtn?.addEventListener('click', () => this.handleSearch(welcomeSearchInput.value));

        // Enter key support  : if the user press the enter key it will trigger the handleSearch() same behavior as clicking the search button.
        searchInput?.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') this.handleSearch(searchInput.value);
        });
        welcomeSearchInput?.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') this.handleSearch(welcomeSearchInput.value);
        });

        // Location button  : These buttons use the browser's geolocation API to get current location weather.
        const locationBtn = document.getElementById('locationBtn');
        const welcomeLocationBtn = document.getElementById('welcomeLocationBtn');
        
        locationBtn?.addEventListener('click', () => this.getCurrentLocation());
        welcomeLocationBtn?.addEventListener('click', () => this.getCurrentLocation());

        // Retry button  : This gives the user a way to retry the last failed search, using stored city data.
        const retryBtn = document.getElementById('retryBtn');
        retryBtn?.addEventListener('click', () => this.retryLastSearch());
    }

    // Handle search functionality
    async handleSearch(cityName) {
        if (!cityName.trim()) {    // trim removes the whitespace like "  " from the start and end of the string(cityName)
            this.showError('Please enter a city name');
            return;
        }

        this.showLoadingState();
        try {
            await this.fetchWeatherData(cityName);
            this.lastSearchedCity = cityName;
            this.saveLastLocation(cityName);
        } catch (error) {
            console.error('Search error:', error);
            this.showError(error.message);
        }
    }

    // Get current location and fetch weather
    async getCurrentLocation() {
        if (!navigator.geolocation) {
            this.showError('Geolocation is not supported by your browser');
            return;
        }

        this.showLoadingState();
        
        try {
            const position = await this.getCurrentPosition();
            const { latitude, longitude } = position.coords;
            await this.fetchWeatherDataByCoords(latitude, longitude);
        } catch (error) {
            console.error('Location error:', error);
            this.showError('Unable to get your location. Please check your permissions.');
        }
    }

    // Get current position with timeout
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
                    maximumAge: 300000 // 5 minutes
                }
            );
        });
    }

    // Get geolocation error message
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

    // Fetch weather data by city name
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

    // Fetch weather data by coordinates
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

    // Fetch current weather by city name from backend
    async fetchCurrentWeather(cityName) {
        const url = `${this.backendUrl}/weather?city=${encodeURIComponent(cityName)}`;
        const response = await this.makeApiRequest(url);
        return response;
    }

    // Fetch current weather by coordinates from backend
    async fetchCurrentWeatherByCoords(lat, lon) {
        const url = `${this.backendUrl}/weather?lat=${lat}&lon=${lon}`;
        const response = await this.makeApiRequest(url);
        return response;
    }

    // Fetch 5-day forecast by city name from backend
    async fetchForecast(cityName) {
        const url = `${this.backendUrl}/forecast?city=${encodeURIComponent(cityName)}`;
        const response = await this.makeApiRequest(url);
        return response;
    }

    // Fetch 5-day forecast by coordinates from backend
    async fetchForecastByCoords(lat, lon) {
        const url = `${this.backendUrl}/forecast?lat=${lat}&lon=${lon}`;
        const response = await this.makeApiRequest(url);
        return response;
    }

    // Make API request with error handling
    async makeApiRequest(url) {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 10000);

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
                throw new Error('Request timed out. Please try again.');   // adding new error message for the abort error ()
            }

            if (error.name === 'TypeError' && error.message.includes('fetch')) {
                throw new Error('Network error. Please check your internet connection and ensure the backend server is running.');
            }
            throw error;
        }
    }

    // Display weather data in the UI
    displayWeatherData() {
        this.hideAllStates();
        this.showWeatherDisplay();
        
        this.updateCurrentWeather();
        this.updateForecast();
        this.updateAdditionalInfo();
        
        // Add animation delay for smooth transitions
        setTimeout(() => {
            document.getElementById('weatherDisplay').classList.add('animate');
        }, 100);
    }

    // Update current weather display
    updateCurrentWeather() {
        const weather = this.currentWeather;
        
        // Update location
        document.getElementById('cityName').textContent = weather.name;
        document.getElementById('countryName').textContent = weather.sys.country;
        document.getElementById('dateTime').textContent = this.formatDateTime(weather.dt, weather.timezone);

        // Update temperature and description
        document.getElementById('temperature').textContent = Math.round(weather.main.temp);
        document.getElementById('weatherDescription').textContent = weather.weather[0].description;
        document.getElementById('weatherIcon').className = `weather-icon ${this.getWeatherIcon(weather.weather[0].id)}`;

        // Update weather details
        document.getElementById('feelsLike').textContent = `${Math.round(weather.main.feels_like)}°C`;
        document.getElementById('humidity').textContent = `${weather.main.humidity}%`;
        document.getElementById('windSpeed').textContent = `${this.convertWindSpeed(weather.wind.speed)}`;
        document.getElementById('visibility').textContent = `${(weather.visibility / 1000).toFixed(1)} km`;
    }

    // Update forecast display
    updateForecast() {
        const forecastContainer = document.getElementById('forecastContainer');
        forecastContainer.innerHTML = '';

        // Group forecast by day and get daily data
        const dailyForecast = this.getDailyForecast();   
        // this function takes the raw forecast data (which usually gives data every 3 hours), and groups it into daily summaries.
        
        dailyForecast.forEach(day => {
            const forecastCard = this.createForecastCard(day);
            forecastContainer.appendChild(forecastCard);
        });
    }

    // Create forecast card element
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



    // this function takes the raw forecast data (which usually gives data every 3 hours), and groups it into daily summaries.
        /* So instead of:                                You get this:
        [   { time: 9 AM, temp: 30 },                    [{ date: "2025-07-29", temp: 33, weatherId: 801, description: "scattered clouds" },
            { time: 12 PM, temp: 32 },                    { date: "2025-07-30", temp: 32, weatherId: 801, description: "scattered clouds" },
            { time: 3 PM, temp: 31 },                     { date: "2025-07-31", temp: 31, weatherId: 801, description: "scattered clouds" },
            { time: 6 PM, temp: 29 },                     { date: "2025-08-01", temp: 29, weatherId: 801, description: "scattered clouds" },
            { time: 9 PM, temp: 28 },                     { date: "2025-08-02", temp: 28, weatherId: 801, description: "scattered clouds" },
            { time: 12 AM, temp: 27 },
            { time: 3 AM, temp: 26 },
            { time: 6 AM, temp: 25 },]*/
    // Get daily forecast from 3-hour data
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

    // Update additional weather information
    updateAdditionalInfo() {
        const weather = this.currentWeather;
        
        // Update sunrise and sunset
        document.getElementById('sunrise').textContent = this.formatTime(weather.sys.sunrise, weather.timezone);
        document.getElementById('sunset').textContent = this.formatTime(weather.sys.sunset, weather.timezone);
        
        // Update pressure
        document.getElementById('pressure').textContent = `${weather.main.pressure} hPa`;
        
        // Note: UV index is not available in the free API tier
        // You would need to make an additional API call for this
        document.getElementById('uvIndex').textContent = 'N/A';
    }

    // Get weather icon based on weather condition code
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

    // Convert wind speed from m/s to km/h
    convertWindSpeed(speedMs) {
        const speedKmh = (speedMs * 3.6).toFixed(1);
        return `${speedKmh} km/h`;
    }

    // Format date for display
    formatDate(timestamp) {
        const date = new Date(timestamp);
        return date.toLocaleDateString('en-US', { 
            weekday: 'short',
            month: 'short',
            day: 'numeric'
        });
    }

    // Format time for display
    formatTime(timestamp, timezone) {
        const date = new Date((timestamp + timezone) * 1000);
        return date.toLocaleTimeString('en-US', {
            hour: '2-digit',
            minute: '2-digit',
            hour12: false
        });
    }

    // Format date and time for display
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

    // Show loading state
    showLoadingState() {
        this.hideAllStates();
        document.getElementById('loadingState').classList.remove('hidden');
    }

    // Show error state
    showError(message) {
        this.hideAllStates();
        const errorState = document.getElementById('errorState');
        const errorMessage = document.getElementById('errorMessage');
        
        errorMessage.textContent = message;
        errorState.classList.remove('hidden');
    }

    // Show welcome state
    showWelcomeState() {
        this.hideAllStates();
        document.getElementById('welcomeState').classList.remove('hidden');
    }

    // Show weather display
    showWeatherDisplay() {
        document.getElementById('weatherDisplay').classList.remove('hidden');
    }

    // Hide all states
    hideAllStates() {
        const states = ['loadingState', 'errorState', 'welcomeState', 'weatherDisplay'];
        states.forEach(stateId => {
            document.getElementById(stateId).classList.add('hidden');
        });
    }

    // Retry last search
    retryLastSearch() {
        if (this.lastSearchedCity) {
            this.handleSearch(this.lastSearchedCity);
        } else {
            this.getCurrentLocation();
        }
    }

    // Save last location to localStorage
    saveLastLocation(cityName) {
        try {
            localStorage.setItem('lastLocation', cityName);
        } catch (error) {
            console.warn('Could not save location to localStorage:', error);
        }
    }

    // Load last location from localStorage
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

    // Debounce function for search optimization
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
        navigator.serviceWorker.register('/sw.js')
            .then(registration => {
                console.log('SW registered: ', registration);
            })
            .catch(registrationError => {
                console.log('SW registration failed: ', registrationError);
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
