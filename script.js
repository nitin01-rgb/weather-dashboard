let currentUnit = "C";
let lastWeather = null;

async function searchWeather() {
    const input = document.getElementById("cityInput");
    const city = input.value.trim();

    if (!city) {
        alert("Please enter a city name");
        return;
    }

    await loadWeatherByCity(city);
}

async function loadWeatherByCity(city) {
    try {
        const geoResponse = await fetch(
            `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(city)}&count=1&language=en&format=json`
        );

        const geoData = await geoResponse.json();

        if (!geoData.results?.length) {
            alert("City not found");
            return;
        }

        const location = geoData.results[0];

        await loadWeather(
            location.latitude,
            location.longitude,
            `${location.name}, ${location.country}`
        );

        document.getElementById("cityInput").value = "";

    } catch (error) {
        console.error(error);
        alert("Unable to load weather");
    }
}

async function loadWeather(latitude, longitude, name) {
    const response = await fetch(
        `https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}&current=temperature_2m,relative_humidity_2m,apparent_temperature,wind_speed_10m,weather_code&daily=weather_code,temperature_2m_max,temperature_2m_min,precipitation_probability_max,sunrise,sunset&timezone=auto`
    );

    const data = await response.json();

    lastWeather = data;

    updateCurrentWeather(data, name);
    updateForecast(data);
}

function updateCurrentWeather(data, name) {
    const current = data.current;

    document.getElementById("cityName").textContent = name;
    document.getElementById("condition").textContent =
        getWeatherCondition(current.weather_code);

    document.getElementById("temperature").textContent =
        convertTemperature(current.temperature_2m);

    document.getElementById("humidity").textContent =
        current.relative_humidity_2m + "%";

    document.getElementById("wind").textContent =
        Math.round(current.wind_speed_10m) + " km/h";

    document.getElementById("feels").textContent =
        convertTemperature(current.apparent_temperature);
}

function updateForecast(data) {
    const container = document.querySelector(".forecast-container");
    container.innerHTML = "";

    for (let i = 0; i < 7; i++) {
        const date = new Date(data.daily.time[i]);

        const card = document.createElement("div");
        card.className = "forecast-card";

        card.innerHTML = `
            <p>${i === 0 ? "Today" : date.toLocaleDateString("en-US", { weekday: "short" })}</p>
            <span>${getWeatherIcon(data.daily.weather_code[i])}</span>
            <h3>${convertTemperature(data.daily.temperature_2m_max[i])}</h3>
            <small>${convertTemperature(data.daily.temperature_2m_min[i])}</small>
            <p>🌧️ ${data.daily.precipitation_probability_max[i] ?? 0}%</p>
        `;

        container.appendChild(card);
    }
}

function convertTemperature(temp) {
    if (currentUnit === "F") {
        return Math.round((temp * 9 / 5) + 32) + "°F";
    }

    return Math.round(temp) + "°C";
}

function toggleUnit() {
    currentUnit = currentUnit === "C" ? "F" : "C";

    if (lastWeather) {
        updateCurrentWeather(
            lastWeather,
            document.getElementById("cityName").textContent
        );

        updateForecast(lastWeather);
    }

    document.getElementById("unitButton").textContent =
        currentUnit === "C" ? "°F" : "°C";
}

function getWeatherIcon(code) {
    if (code === 0) return "☀️";
    if (code <= 3) return "🌤️";
    if (code <= 48) return "🌫️";
    if (code <= 67) return "🌧️";
    if (code <= 77) return "❄️";
    if (code <= 82) return "🌦️";
    if (code <= 99) return "⛈️";
    return "🌡️";
}

function getWeatherCondition(code) {
    if (code === 0) return "Clear Sky";
    if (code <= 3) return "Partly Cloudy";
    if (code <= 48) return "Foggy";
    if (code <= 67) return "Rainy";
    if (code <= 77) return "Snowy";
    if (code <= 82) return "Rain Showers";
    if (code <= 99) return "Thunderstorm";
    return "Unknown";
}

function getMyLocation() {
    if (!navigator.geolocation) {
        alert("Geolocation is not supported");
        return;
    }

    navigator.geolocation.getCurrentPosition(
        async (position) => {
            const { latitude, longitude } = position.coords;

            await loadWeather(
                latitude,
                longitude,
                "My Location"
            );
        },
        () => {
            alert("Location permission was denied");
        }
    );
}

const cityInput = document.getElementById("cityInput");
const suggestions = document.getElementById("suggestions");

const cities = [
    "Delhi",
    "Mumbai",
    "Jaipur",
    "Bangalore",
    "Kolkata",
    "Chennai",
    "Hyderabad",
    "Pune",
    "Ahmedabad",
    "Lucknow",
    "Agra",
    "Udaipur",
    "Jodhpur",
    "Indore",
    "Chandigarh"
];

cityInput.addEventListener("input", function () {
    const value = this.value.trim().toLowerCase();
    suggestions.innerHTML = "";

    if (!value) return;

    const matches = cities.filter(city =>
        city.toLowerCase().startsWith(value)
    );

    matches.forEach(city => {
        const item = document.createElement("div");
        item.className = "suggestion-item";
        item.textContent = city;

        item.onclick = function () {
            cityInput.value = city;
            suggestions.innerHTML = "";
        };

        suggestions.appendChild(item);
    });
});

document.getElementById("cityInput").addEventListener("keydown", function(event) {
    if (event.key === "Enter") {
        event.preventDefault();
        searchWeather();
    }
});
