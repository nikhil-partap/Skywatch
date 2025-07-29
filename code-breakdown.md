 I am Going through the entire Skywatch script.js code line-by-line  

Lets start 
```js
constructor() {
        // Backend API configuration
        this.backendUrl = 'https://your_backend_link.com'; 
        this.currentWeather = null;
        this.forecast = null;
        this.lastSearchedCity = null;
        
        this.initializeApp();    
        this.bindEvents();       
    }
```
What does this block do?
ans - 
1) sends request to the backend server and recieve the weather data like temp, humidity,air velocity, etc 
2) setup data storage to hold the weather data once it is fetched 
3) call the initilizeApp function which loads the welcome page and last location from the localStorage 
4) it calls the bindEvents function which connects the event listeners to the buttons and inputs

```js
    bindEvents() {
        // Search functionality
        const searchBtn = document.getElementById('searchBtn');
        const searchInput = document.getElementById('searchInput');
        const welcomeSearchBtn = document.getElementById('welcomeSearchBtn');
        const welcomeSearchInput = document.getElementById('welcomeSearchInput');  // corrected the typo in the id from welcomeaSearchInput to welcomeSearchInput

        searchBtn?.addEventListener('click', () => this.handleSearch(searchInput.value));
        welcomeSearchBtn?.addEventListener('click', () => this.handleSearch(welcomeSearchInput.value));

        // Enter key support
        searchInput?.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') this.handleSearch(searchInput.value);
        });
        welcomeSearchInput?.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') this.handleSearch(welcomeSearchInput.value);
        });

        // Location button
        const locationBtn = document.getElementById('locationBtn');
        const welcomeLocationBtn = document.getElementById('welcomeLocationBtn');
        
        locationBtn?.addEventListener('click', () => this.getCurrentLocation());
        welcomeLocationBtn?.addEventListener('click', () => this.getCurrentLocation());

        // Retry button
        const retryBtn = document.getElementById('retryBtn');
        retryBtn?.addEventListener('click', () => this.retryLastSearch());
    }
```
What does this block do?
ans- 
1) grab the input field + search button for both Main, Welcome screen.
2) When the search button is clicked, grab the current value from the input field and call handleSearch() with that. The ?. ensures the app doesn’t crash if the element is null.
3) Enter key support: if the user press the enter key it will trigger the handleSearch() same behavior as clicking the search button.
4) Location button: These buttons use the browser's geolocation API to get current location weather.
5) This gives the user a way to retry the last failed search, using stored city data.

```js
    // Handle search functionality
    async handleSearch(cityName) {
        if (!cityName.trim()) {
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
```
What does this block do?
ans- 
1) it take the cityName check if the city name is not null 
2) then send the request to backend server for the weather data and store the lastSearchedCity in localstorage 

```js
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
```
What does this block do?
ans-
1) check if the browser can get the current location if not return and error will be displayed 
2) then it calls the getCurrentPosition function store the latitude and long.. and then call the fetchWeatherDataBy Coords and give the lat.. and long.. as input and after that fetchWeatherDataByCoords take care of the rest 
3) and after that just simple error handeling nothing much

```js
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
```
What does this block do?
ans- 
1) Makes a promise so we can wait for either: a Successful location (resolve), or an error (reject).
2) sets a timer for 10 sec to fetch the location reject with error if the timer runs out
3) navigator.geolocation.getCurrentPosition(): This is the browser’s built-in function to get user current location. if it successed it clears the timeout (so it doesn’t reject later), and resolves the Promise with the user
4) settings to control how the location is fetched
enableHighAccuracy: true → try using GPS if possible.
timeout: 10000 → max wait = 10 seconds.
maximumAge: 300000 → allow cached location if it's < 5 min old.
```js
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
```
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

ans-
it try to find out the reason due to which the location was not fetch the display it as a error 

```js
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
```
What does this block do?
ans-
1) it get`s the city name entered by the user 
2) call`s the fetchCurrentWeather function and gives the cityName as input the fetchCurrentWeather function make a url to request the backend for data 
3) same for the fetchForcast function  
4) Stores the data receved from the backend 
5) then display the data on screen 
6) give error is the data is not fetched 

```js
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
```
What does this block do?
ans-
it is same as above just the difference is that it uses the coords to fetch the weather data insted of cityName

```js
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
```
What does this block do?
ans-
1) it takes the cityName and make a url for api request

2) the other one use coords for the same process

```js
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
```
What does this block do?
ans-
fetch the forcast the 5 day forcast using either the cityName or through coords by making a request to the backend server 

```js
// Make API request with error handling
    async makeApiRequest(url) {
        try {
            const response = await fetch(url, {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                    'Accept': 'application/json'
                },
                timeout: 10000
            });
            
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
                    throw new Error(errorData.details || 'Request timeout. Please try again.');
                } else {
                    throw new Error(errorData.details || `Request failed with status ${response.status}`);
                }
            }

            const data = await response.json();
            return data;
        } catch (error) {
            if (error.name === 'TypeError' && error.message.includes('fetch')) {
                throw new Error('Network error. Please check your internet connection and ensure the backend server is running.');
            }
            throw error;
        }
    }
```
What does this block do?
ans-
1) Declares an asynchronous function that takes a url string.
2) Creates an AbortController, which allows you to cancel the fetch request manually. Starts a 10-second timer: if the request isn't completed in 10s, it calls controller.abort().
3) Sends the GET request with standard JSON headers.
signal: controller.signal ties this request to the abort timer. If the timer calls controller.abort(), the request is canceled with an AbortError.
4) after getting a response (success or failure), cancel the timer to prevent unnecessary aborts.
5) if .ok is false then the error handeling block handles all HTTP error responses.
6) Success case : if the response is ok then the data is returned.
7) non-HTTP errors  : client-side timeout caused by the 10s setTimeout.
TypeError + "fetch" in message = likely causes: No internet, DNS issue, Server unreachable
Any other unexpected errors are re-thrown.

```js
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
```
These two functions are responsible for showing the weather data on your screen after it’s fetched from the API. They make sure:
All sections are clean and updated
The right values appear in the right HTML elements
It looks smooth with animation

```js
// Update forecast display
    updateForecast() {
        const forecastContainer = document.getElementById('forecastContainer');
        forecastContainer.innerHTML = '';

        // Group forecast by day and get daily data
        const dailyForecast = this.getDailyForecast();
        
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
```
What This Code Does
ans- 
This code updates the 5-day weather forecast section on the web page.
It gets the daily forecast data, creates little weather cards for each day (like "Tuesday – Sunny – 32°C"), and adds them to the webpage.

What does this block do?
ans- 
1) removes everything inside forecastContainer, in case there were old forecast cards already displayed.
2) calls a function getDailyForecast() (written somewhere else in your code).
It takes the raw forecast data (which usually gives data every 3 hours), and groups it into daily summaries.
3) Create and add each forecast card 

```js
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
```
What does this block do?
ans- 
PART 1: getDailyForecast()
1) takes a huge list of forecast data (every 3 hours for 5 days) and groups it day by day, giving you one summary per day — average temperature, weather description, etc. 
2) creates an empty object called dailyData. this.forecast.list is an array of forecast items from the API (every 3 hours). This line loops through each item using .forEach().
3) If this is the first time we see this day, we create a new entry. If we've already seen this date, just add the new temp to the total and increase the count.
PART 2: updateAdditionalInfo()
1) updates the extra information section in your app:sunrise, sunset, pressure, UV index.

```js
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
```
What does this block do?
ans-
takes a weather condition code (e.g. 800, 501, 601) — which is returned by the OpenWeatherMap API — and returns a corresponding icon class name from Font Awesome (like fas fa-sun, fas fa-cloud-rain, etc.)

```js
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
```
What does this block do?
ans-
1) convertWindSpeed that takes one input: speedMs (meters per second, as given by the OpenWeatherMap API). Converts the speed from m/s to km/h.
2) Format a Timestamp into a Readable Date
3) format sunrise/sunset times (or any time) in a way that respects the user’s timezone offset from UTC

```js
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
```
What does this block do?
ans-
🔹 formatDateTime(timestamp, timezone)
Formats a UTC timestamp (plus a timezone offset) into a full date & time string like "Monday, July 29, 2025, 14:30" in 24-hour format.

🔹 showLoadingState()
Hides all UI sections and then shows the loading spinner or loading screen.

🔹 showError(message)
Hides all UI sections and then displays the error screen with a custom message.

🔹 showWelcomeState()
Hides all UI sections and shows the initial welcome screen (used before any search is made).

```js
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
```
What does this block do?
ans-

✅ showWeatherDisplay()
Reveals the weather display section by removing the 'hidden' class.
Used after successfully fetching and preparing weather data.

✅ hideAllStates()
Hides all major UI states (loading, error, welcome, weatherDisplay) by adding 'hidden' to each one.
Prevents UI overlap before showing the desired state.

✅ retryLastSearch()
If a city was previously searched, it re-fetches weather data for it.
If not, it tries to use the user's current location instead.

✅ saveLastLocation(cityName)
Stores the last searched city name in localStorage so it can be reloaded later.
Includes error handling if localStorage fails.

```js
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
```
What does this block do?
ans-
✅ loadLastLocation()
Tries to retrieve the last searched city from localStorage and save it to this.lastSearchedCity.
Gracefully handles failure if localStorage isn’t available.

✅ debounce(func, wait)
Returns a version of func that delays execution until after wait ms of no calls.
Useful for limiting API calls while typing (like in search inputs).

```js
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
```
What does this block do?
ans-
1) Initializes the app and adds real-time search
2) Registers a service worker for offline/PWA features

1. DOMContentLoaded Listener: Initialize the App

    Waits for the DOM to fully load.

    Creates a new WeatherApp() instance.

    Sets up a debounced version of the search function (delays search by 500ms to reduce API calls).

    Adds input listeners on both searchInput and welcomeSearchInput:

        If the user types more than 2 characters, it triggers the debounced search.

2. Service Worker Registration (Progressive Web App support)

    After the page fully loads, it checks if the browser supports service workers.

    If yes, it tries to register the sw.js file.

    Logs whether the registration succeeds or fails.        




```js
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
```
What does this block do?
ans-
This block adds two key features:
 1. Keyboard Shortcuts

It listens for key presses and:

    Ctrl/Cmd + K → focuses the search input
    (makes it easy to quickly start a new search without using the mouse)

    Escape key → clears both search inputs and removes focus
    (helps the user quickly cancel their input)

 2. Offline Detection

It listens for network status changes:

    When the app goes online, it logs "App is online"

    When the app goes offline, it logs "App is offline"

