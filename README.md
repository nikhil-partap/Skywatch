# SkyWatch - Professional Weather App

A modern, responsive weather application built with vanilla JavaScript, featuring beautiful UI design and comprehensive weather data from OpenWeatherMap API.

![SkyWatch Weather App](https://img.shields.io/badge/Weather-App-blue?style=for-the-badge&logo=weather)
![JavaScript](https://img.shields.io/badge/JavaScript-ES6+-yellow?style=for-the-badge&logo=javascript)
![CSS3](https://img.shields.io/badge/CSS3-Modern-blue?style=for-the-badge&logo=css3)
![HTML5](https://img.shields.io/badge/HTML5-Semantic-orange?style=for-the-badge&logo=html5)

## 🌟 Features

### Core Functionality
- **Real-time Weather Data**: Current weather conditions for any location
- **5-Day Forecast**: Detailed weather predictions for the upcoming week
- **Location-based Weather**: Automatic weather detection using GPS
- **City Search**: Search for weather in any city worldwide
- **Responsive Design**: Works perfectly on desktop, tablet, and mobile devices

### Advanced Features
- **Beautiful UI/UX**: Modern glassmorphism design with smooth animations
- **Error Handling**: Comprehensive error handling with user-friendly messages
- **Loading States**: Smooth loading animations and state management
- **Offline Detection**: Detects network connectivity status
- **Keyboard Shortcuts**: Quick access with keyboard navigation
- **Local Storage**: Remembers your last searched location
- **Accessibility**: WCAG compliant with proper focus management

### Weather Information Displayed
- Current temperature and "feels like" temperature
- Weather description with dynamic icons
- Humidity, wind speed, and visibility
- Sunrise and sunset times
- Atmospheric pressure
- 5-day weather forecast with daily averages

## 🚀 Quick Start

### Prerequisites
- A modern web browser (Chrome, Firefox, Safari, Edge)
- An OpenWeatherMap API key (free tier available)

### Installation

1. **Clone or download the project**
   ```bash
   git clone <repository-url>
   cd SkyWatch
   ```

2. **Get your API key**
   - Visit [OpenWeatherMap](https://openweathermap.org/api)
   - Sign up for a free account
   - Get your API key from the dashboard

3. **Configure the API key**
   - Open `script.js`
   - Replace `'YOUR_API_KEY'` on line 4 with your actual API key:
   ```javascript
   this.apiKey = 'your_actual_api_key_here';
   ```

4. **Run the application**
   - Open `index.html` in your web browser
   - Or serve it using a local server:
   ```bash
   # Using Python 3
   python -m http.server 8000
   
   # Using Node.js (if you have http-server installed)
   npx http-server
   
   # Using PHP
   php -S localhost:8000
   ```

5. **Access the app**
   - Navigate to `http://localhost:8000` in your browser

## 📱 Usage

### Basic Usage
1. **Search for a city**: Type a city name in the search box and press Enter or click the search button
2. **Use current location**: Click the location button to get weather for your current position
3. **View forecast**: Scroll down to see the 5-day weather forecast
4. **Check details**: View additional weather information like humidity, wind speed, etc.

### Keyboard Shortcuts
- `Ctrl/Cmd + K`: Focus the search input
- `Enter`: Search for the entered city
- `Escape`: Clear the search input

## 🛠️ Technical Details

### Architecture
- **Vanilla JavaScript**: No frameworks, pure ES6+ JavaScript
- **CSS Grid & Flexbox**: Modern layout techniques
- **CSS Custom Properties**: Dynamic theming and consistent styling
- **Fetch API**: Modern HTTP requests with proper error handling
- **Geolocation API**: Browser-based location detection

### API Integration
- **OpenWeatherMap API v2.5**: Current weather and forecast data
- **RESTful endpoints**: Clean API integration
- **Error handling**: Comprehensive error management for all API responses
- **Rate limiting**: Proper handling of API rate limits

### Performance Optimizations
- **Debounced search**: Prevents excessive API calls during typing
- **Efficient DOM manipulation**: Minimal reflows and repaints
- **Optimized animations**: Hardware-accelerated CSS transitions
- **Lazy loading**: Efficient data loading and rendering

## 🎨 Design Features

### Visual Design
- **Glassmorphism**: Modern frosted glass effect with backdrop blur
- **Gradient backgrounds**: Beautiful color transitions
- **Smooth animations**: CSS transitions and keyframe animations
- **Responsive icons**: Font Awesome icons for weather conditions
- **Typography**: Inter font family for excellent readability

### User Experience
- **Loading states**: Clear feedback during data fetching
- **Error states**: Helpful error messages with retry options
- **Welcome screen**: Engaging onboarding experience
- **Hover effects**: Interactive elements with smooth transitions
- **Mobile-first**: Optimized for touch interactions

## 🔧 Customization

### Styling
The app uses CSS custom properties for easy theming. You can modify the colors in `style.css`:

```css
:root {
    --primary-color: #667eea;
    --secondary-color: #764ba2;
    --accent-color: #f093fb;
    /* ... other variables */
}
```

### Features
You can easily extend the app by:
- Adding more weather data points
- Implementing unit conversion (Celsius/Fahrenheit)
- Adding weather alerts
- Integrating with additional weather APIs
- Adding weather maps integration

## 🌐 Browser Support

- Chrome 60+
- Firefox 55+
- Safari 12+
- Edge 79+

## 📄 License

This project is open source and available under the [MIT License](LICENSE).

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## 📞 Support

If you encounter any issues or have questions:
1. Check the browser console for error messages
2. Verify your API key is correctly configured
3. Ensure you have an active internet connection
4. Check if the OpenWeatherMap API is accessible

## 🔗 Links

- [OpenWeatherMap API Documentation](https://openweathermap.org/api)
- [Font Awesome Icons](https://fontawesome.com/)
- [Inter Font Family](https://rsms.me/inter/)

## 📊 API Usage

The app uses the following OpenWeatherMap API endpoints:
- Current Weather: `/weather`
- 5-Day Forecast: `/forecast`

**Note**: The free tier of OpenWeatherMap API has rate limits. For production use, consider upgrading to a paid plan.

---

**Built with ❤️ using modern web technologies** # Skywatch
