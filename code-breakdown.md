 I am Going through the entire Skywatch code line-by-line and 
 Following questions will be answered 
1. What does this block do?
2. What DOM element is being selected?
3. How is the data from the API being processed and displayed?
4. Which function is responsible for what?
5. What part is reusable? What part is not?
6. How is the 5-day forecast being calculated?

Lets start with script.js
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
What does this block do?
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
