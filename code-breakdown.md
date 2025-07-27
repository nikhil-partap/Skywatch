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