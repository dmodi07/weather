class WeatherApp {
    constructor() {
        this.API_KEY = 'ed48f58cb8c0dd262b1f880d4da29c72';
        this.BASE_URL = 'https://api.openweathermap.org/data/2.5';
        this.cities = JSON.parse(localStorage.getItem('weatherCities')) || [];
        this.isMetric = JSON.parse(localStorage.getItem('isMetric')) || true;
        this.isDark = JSON.parse(localStorage.getItem('isDark')) || false;
        
        this.init();
    }

    init() {
        this.setupEventListeners();
        this.applyTheme();
        this.updateUnitButton();
        this.loadCities();
        this.startAutoRefresh();
    }

    setupEventListeners() {
        document.getElementById('searchBtn').addEventListener('click', () => this.addCity());
        document.getElementById('citySearch').addEventListener('keypress', (e) => {
            if (e.key === 'Enter') this.addCity();
        });
        document.getElementById('citySearch').addEventListener('input', (e) => {
            this.handleAutocomplete(e.target.value);
        });
        document.addEventListener('click', (e) => {
            if (!e.target.closest('.search-container')) {
                this.hideAutocomplete();
            }
        });

        document.getElementById('themeToggle').addEventListener('click', () => this.toggleTheme());
        document.getElementById('unitToggle').addEventListener('click', () => this.toggleUnits());
        document.getElementById('locationBtn').addEventListener('click', () => this.getCurrentLocation());
        
        // Modal events
        document.querySelector('.close').addEventListener('click', () => this.closeModal());
        document.getElementById('forecastModal').addEventListener('click', (e) => {
            if (e.target.id === 'forecastModal') this.closeModal();
        });
    }

    async addCity() {
        const cityInput = document.getElementById('citySearch');
        const cityName = cityInput.value.trim();
        
        if (!cityName) return;
        

        
        if (this.cities.some(city => city.name.toLowerCase() === cityName.toLowerCase())) {
            this.showError('City already added');
            return;
        }

        this.showLoading(true);
        
        try {
            const weatherData = await this.fetchWeatherData(cityName);
            const cityData = {
                id: weatherData.id,
                name: weatherData.name,
                country: weatherData.sys.country,
                coord: weatherData.coord
            };
            
            this.cities.push(cityData);
            this.saveCities();
            this.renderWeatherCard(weatherData);
            cityInput.value = '';
            this.hideError();
        } catch (error) {
            console.error('API Error:', error);
            this.showError(`Failed to load weather for ${cityName}`);
        }
        
        this.showLoading(false);
    }

    async fetchWeatherData(city) {
        const url = `${this.BASE_URL}/weather?q=${city}&appid=${this.API_KEY}&units=${this.isMetric ? 'metric' : 'imperial'}`;
        const response = await fetch(url);
        
        if (!response.ok) throw new Error('City not found');
        
        return await response.json();
    }

    async fetchWeatherByCoords(lat, lon) {
        const url = `${this.BASE_URL}/weather?lat=${lat}&lon=${lon}&appid=${this.API_KEY}&units=${this.isMetric ? 'metric' : 'imperial'}`;
        const response = await fetch(url);
        return await response.json();
    }

    async fetchForecastData(lat, lon) {
        const url = `${this.BASE_URL}/forecast?lat=${lat}&lon=${lon}&appid=${this.API_KEY}&units=${this.isMetric ? 'metric' : 'imperial'}`;
        const response = await fetch(url);
        return await response.json();
    }

    renderWeatherCard(data) {
        const grid = document.getElementById('weatherGrid');
        const card = document.createElement('div');
        card.className = 'weather-card';
        card.dataset.cityId = data.id;
        
        const localTime = new Date((data.dt + data.timezone) * 1000).toLocaleString();
        const iconUrl = `https://openweathermap.org/img/wn/${data.weather[0].icon}@2x.png`;
        
        card.innerHTML = `
            <div class="card-header">
                <div class="city-name">${data.name}, ${data.sys.country}</div>
                <button class="remove-btn" onclick="weatherApp.removeCity(${data.id})">×</button>
            </div>
            <div class="weather-main">
                <img src="${iconUrl}" alt="${data.weather[0].description}" class="weather-icon">
                <div class="temperature">${Math.round(data.main.temp)}°${this.isMetric ? 'C' : 'F'}</div>
            </div>
            <div class="weather-description">${data.weather[0].description}</div>
            <div class="weather-details">
                <div class="detail-item">
                    <span>Feels like:</span>
                    <span>${Math.round(data.main.feels_like)}°${this.isMetric ? 'C' : 'F'}</span>
                </div>
                <div class="detail-item">
                    <span>Humidity:</span>
                    <span>${data.main.humidity}%</span>
                </div>
                <div class="detail-item">
                    <span>Wind:</span>
                    <span>${data.wind.speed} ${this.isMetric ? 'm/s' : 'mph'}</span>
                </div>
                <div class="detail-item">
                    <span>Pressure:</span>
                    <span>${data.main.pressure} hPa</span>
                </div>
            </div>
            <div class="local-time">Local time: ${localTime}</div>
        `;
        
        card.addEventListener('click', (e) => {
            if (!e.target.classList.contains('remove-btn')) {
                this.showForecast(data.coord.lat, data.coord.lon, data.name);
            }
        });
        
        grid.appendChild(card);
    }

    async showForecast(lat, lon, cityName) {
        try {
            const forecastData = await this.fetchForecastData(lat, lon);
            const modal = document.getElementById('forecastModal');
            const title = document.getElementById('forecastTitle');
            const content = document.getElementById('forecastData');
            
            title.textContent = `5-Day Forecast for ${cityName}`;
            
            const dailyForecasts = this.processForecastData(forecastData.list);
            
            content.innerHTML = dailyForecasts.map(day => `
                <div class="forecast-day">
                    <div class="forecast-date">${day.date}</div>
                    <div class="forecast-weather">
                        <img src="https://openweathermap.org/img/wn/${day.icon}.png" alt="${day.description}" width="40">
                        <span>${day.description}</span>
                    </div>
                    <div class="forecast-temps">
                        <span class="temp-high">${day.high}°</span>
                        <span class="temp-low">${day.low}°</span>
                    </div>
                </div>
            `).join('');
            
            modal.classList.remove('hidden');
        } catch (error) {
            this.showError('Failed to load forecast');
        }
    }

    processForecastData(list) {
        const dailyData = {};
        
        list.forEach(item => {
            const date = new Date(item.dt * 1000).toDateString();
            if (!dailyData[date]) {
                dailyData[date] = {
                    date: new Date(item.dt * 1000).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' }),
                    temps: [],
                    icon: item.weather[0].icon,
                    description: item.weather[0].description
                };
            }
            dailyData[date].temps.push(item.main.temp);
        });
        
        return Object.values(dailyData).slice(0, 5).map(day => ({
            ...day,
            high: Math.round(Math.max(...day.temps)),
            low: Math.round(Math.min(...day.temps))
        }));
    }

    closeModal() {
        document.getElementById('forecastModal').classList.add('hidden');
    }

    removeCity(cityId) {
        this.cities = this.cities.filter(city => city.id !== cityId);
        this.saveCities();
        document.querySelector(`[data-city-id="${cityId}"]`).remove();
    }

    async loadCities() {
        if (this.cities.length === 0) return;
        
        this.showLoading(true);
        document.getElementById('weatherGrid').innerHTML = '';
        
        for (const city of this.cities) {
            try {
                const weatherData = await this.fetchWeatherByCoords(city.coord.lat, city.coord.lon);
                this.renderWeatherCard(weatherData);
            } catch (error) {
                console.error(`Failed to load weather for ${city.name}`);
            }
        }
        
        this.showLoading(false);
    }

    async getCurrentLocation() {
        if (!navigator.geolocation) {
            this.showError('Geolocation not supported');
            return;
        }
        
        this.showLoading(true);
        
        navigator.geolocation.getCurrentPosition(
            async (position) => {
                try {
                    const { latitude, longitude } = position.coords;
                    const weatherData = await this.fetchWeatherByCoords(latitude, longitude);
                    
                    const cityData = {
                        id: weatherData.id,
                        name: weatherData.name,
                        country: weatherData.sys.country,
                        coord: { lat: latitude, lon: longitude }
                    };
                    
                    if (!this.cities.some(city => city.id === cityData.id)) {
                        this.cities.unshift(cityData);
                        this.saveCities();
                        this.renderWeatherCard(weatherData);
                    }
                } catch (error) {
                    this.showError('Failed to get location weather');
                }
                this.showLoading(false);
            },
            () => {
                this.showError('Location access denied');
                this.showLoading(false);
            }
        );
    }

    toggleTheme() {
        this.isDark = !this.isDark;
        this.applyTheme();
        localStorage.setItem('isDark', JSON.stringify(this.isDark));
    }

    applyTheme() {
        document.documentElement.setAttribute('data-theme', this.isDark ? 'dark' : 'light');
        document.getElementById('themeToggle').textContent = this.isDark ? '☀️' : '🌙';
    }

    toggleUnits() {
        this.isMetric = !this.isMetric;
        this.updateUnitButton();
        localStorage.setItem('isMetric', JSON.stringify(this.isMetric));
        this.loadCities();
    }

    updateUnitButton() {
        document.getElementById('unitToggle').textContent = this.isMetric ? '°C' : '°F';
    }

    saveCities() {
        localStorage.setItem('weatherCities', JSON.stringify(this.cities));
    }

    showLoading(show) {
        document.getElementById('loading').classList.toggle('hidden', !show);
    }

    showError(message) {
        const errorEl = document.getElementById('error');
        errorEl.textContent = message;
        errorEl.classList.remove('hidden');
        setTimeout(() => this.hideError(), 5000);
    }

    hideError() {
        document.getElementById('error').classList.add('hidden');
    }

    checkApiKey() {
        const apiSetup = document.getElementById('apiSetup');
        if (this.API_KEY) {
            apiSetup.style.display = 'none';
        } else {
            apiSetup.style.display = 'block';
        }
    }

    saveApiKey() {
        const apiKeyInput = document.getElementById('apiKeyInput');
        const apiKey = apiKeyInput.value.trim();
        if (apiKey) {
            this.API_KEY = apiKey;
            localStorage.setItem('weatherApiKey', apiKey);
            this.checkApiKey();
            apiKeyInput.value = '';
            this.showError = () => {}; // Clear any previous errors
        }
    }

    enableDemoMode() {
        this.API_KEY = 'DEMO_MODE';
        localStorage.setItem('weatherApiKey', 'DEMO_MODE');
        this.checkApiKey();
        this.loadDemoData();
    }

    loadDemoData() {
        const demoData = [
            { name: 'New York', country: 'US', temp: 72, feels_like: 75, humidity: 65, wind: 8, description: 'partly cloudy', icon: '02d', id: 1 },
            { name: 'London', country: 'GB', temp: 59, feels_like: 61, humidity: 78, wind: 12, description: 'light rain', icon: '10d', id: 2 },
            { name: 'Tokyo', country: 'JP', temp: 68, feels_like: 70, humidity: 72, wind: 6, description: 'clear sky', icon: '01d', id: 3 }
        ];
        
        demoData.forEach(city => {
            const weatherData = {
                id: city.id,
                name: city.name,
                sys: { country: city.country },
                main: { temp: city.temp, feels_like: city.feels_like, humidity: city.humidity, pressure: 1013 },
                weather: [{ description: city.description, icon: city.icon }],
                wind: { speed: city.wind },
                dt: Date.now() / 1000,
                timezone: 0,
                coord: { lat: 0, lon: 0 }
            };
            this.renderWeatherCard(weatherData);
        });
    }

    async fetchWeatherData(city) {
        const url = `${this.BASE_URL}/weather?q=${city}&appid=${this.API_KEY}&units=${this.isMetric ? 'metric' : 'imperial'}`;
        const response = await fetch(url);
        if (!response.ok) throw new Error('City not found');
        return await response.json();
    }

    getDemoWeatherData(city) {
        const demoWeather = {
            'London': { temp: 59, feels_like: 61, humidity: 78, wind: 12, description: 'light rain', icon: '10d' },
            'Toronto': { temp: 68, feels_like: 70, humidity: 65, wind: 8, description: 'partly cloudy', icon: '02d' },
            'Kolkata': { temp: 84, feels_like: 88, humidity: 82, wind: 6, description: 'clear sky', icon: '01d' },
            'Mumbai': { temp: 86, feels_like: 92, humidity: 75, wind: 10, description: 'scattered clouds', icon: '03d' },
            'New York': { temp: 72, feels_like: 75, humidity: 65, wind: 8, description: 'partly cloudy', icon: '02d' },
            'Paris': { temp: 64, feels_like: 66, humidity: 70, wind: 7, description: 'overcast clouds', icon: '04d' },
            'Tokyo': { temp: 75, feels_like: 78, humidity: 68, wind: 5, description: 'clear sky', icon: '01d' }
        };
        
        const weather = demoWeather[city] || demoWeather['London'];
        return {
            id: Math.random() * 1000,
            name: city,
            sys: { country: 'XX' },
            main: { temp: weather.temp, feels_like: weather.feels_like, humidity: weather.humidity, pressure: 1013 },
            weather: [{ description: weather.description, icon: weather.icon }],
            wind: { speed: weather.wind },
            dt: Date.now() / 1000,
            timezone: 0,
            coord: { lat: 0, lon: 0 }
        };
    }

    showApiKeyPrompt() {
        this.showError('Please enter your API key or try demo mode');
    }

    async handleAutocomplete(query) {
        if (query.length < 2) {
            this.hideAutocomplete();
            return;
        }
        
        try {
            const url = `https://api.openweathermap.org/geo/1.0/direct?q=${query}&limit=8&appid=${this.API_KEY}`;
            const response = await fetch(url);
            const cities = await response.json();
            
            this.showAutocomplete(cities);
        } catch (error) {
            this.hideAutocomplete();
        }
    }
    
    showAutocomplete(cities) {
        const dropdown = document.getElementById('autocomplete');
        
        if (cities.length === 0) {
            this.hideAutocomplete();
            return;
        }
        
        dropdown.innerHTML = cities.map(city => 
            `<div class="autocomplete-item" data-city="${city.name}" data-country="${city.country}">
                ${city.name.replace(',CA', '')}, ${city.country}
            </div>`
        ).join('');
        
        dropdown.classList.remove('hidden');
        
        dropdown.querySelectorAll('.autocomplete-item').forEach(item => {
            item.addEventListener('click', () => {
                const cityName = item.dataset.city;
                document.getElementById('citySearch').value = cityName;
                this.hideAutocomplete();
                setTimeout(() => this.addCity(), 100);
            });
        });
    }
    
    hideAutocomplete() {
        document.getElementById('autocomplete').classList.add('hidden');
    }

    startAutoRefresh() {
        setInterval(() => {
            if (this.cities.length > 0) {
                this.loadCities();
            }
        }, 600000); // 10 minutes
    }
}

// Initialize the app
const weatherApp = new WeatherApp();