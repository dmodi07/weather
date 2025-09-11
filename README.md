# Weather Dashboard

An interactive weather application that displays current weather information for multiple cities using the OpenWeatherMap API.

## Features

- **API Integration**: Uses OpenWeatherMap API to fetch real-time weather data
- **Interactive City Selection**: Search and add cities to your dashboard
- **Weather Cards**: Display multiple city cards with comprehensive weather information
- **Temperature Unit Toggle**: Switch between Fahrenheit and Celsius
- **Dark/Light Theme**: Toggle between themes for better user experience
- **Geolocation**: Get weather for your current location
- **5-Day Forecast**: Click on any city card to view detailed forecast
- **Auto-refresh**: Weather data updates every 10 minutes
- **Responsive Design**: Works on desktop and mobile devices
- **Local Storage**: Saves your cities and preferences

## Setup Instructions

1. **Get API Key**:
   - Sign up at [OpenWeatherMap](https://openweathermap.org/api)
   - Get your free API key
   - Replace `YOUR_API_KEY_HERE` in `script.js` with your actual API key

2. **Run the Application**:
   - Open `index.html` in your web browser
   - Or serve it using a local server for better performance

## Usage

1. **Add Cities**: Use the search bar to add cities to your dashboard
2. **Remove Cities**: Click the × button on any weather card
3. **View Forecast**: Click on any weather card to see 5-day forecast
4. **Toggle Units**: Click °F/°C button to switch temperature units
5. **Change Theme**: Click 🌙/☀️ button to toggle dark/light theme
6. **Current Location**: Click 📍 button to add your current location

## Weather Information Displayed

- City name and country
- Current temperature with unit toggle
- Weather condition with icon
- Local time
- "Feels like" temperature
- Humidity percentage
- Wind speed
- Atmospheric pressure

## Technical Details

- **Frontend**: HTML5, CSS3, Vanilla JavaScript
- **API**: OpenWeatherMap Current Weather API & 5-day Forecast API
- **Storage**: Local Storage for persistence
- **Responsive**: CSS Grid and Flexbox
- **Icons**: Weather condition icons from OpenWeatherMap

## Browser Support

- Chrome 60+
- Firefox 55+
- Safari 12+
- Edge 79+

## File Structure

```
weather/
├── index.html          # Main HTML file
├── styles.css          # CSS styles with theme support
├── script.js           # JavaScript functionality
└── README.md          # This file
```