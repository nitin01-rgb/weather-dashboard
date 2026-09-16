let currentUnit = "C";
let lastWeather = null;

// ===============================
// SEARCH WEATHER
// ===============================

async function searchWeather() {
    const input = document.getElementById("cityInput");
    const city = input.value.trim();

    if (!city) {
        alert("Please enter a city name");
        return;
    }

    hideSuggestions();
    await loadWeatherByCity(city);
}


// ===============================
// FIND CITY
// ===============================

async function loadWeatherByCity(city) {
    try {
        const geoResponse = await fetch(
            `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(city)}&count=1&language=en&format=json`
        );

        const geoData = await geoResponse.json();

        if (!geoData.results || !geoData.results.length) {
            alert("City not found");
            return;
        }

        const location = geoData.results[0];

        const locationName =
            `${location.name}${location.country ? ", " + location.country : ""}`;

        await loadWeather(
            location.latitude,
            location.longitude,
            locationName
        );

        document.getElementById("cityInput").value = "";

    } catch (error) {
        console.error(error);
        alert("Unable to load weather");
    }
}


// ===============================
// LOAD WEATHER DATA
// ===============================

async function loadWeather(latitude, longitude, name) {
    try {
        const response = await fetch(
            `https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}&current=temperature_2m,relative_humidity_2m,apparent_temperature,wind_speed_10m,weather_code&daily=weather_code,temperature_2m_max,temperature_2m_min,precipitation_probability_max,sunrise,sunset&timezone=auto`
        );

        if (!response.ok) {
            throw new Error("Weather API error");
        }

        const data = await response.json();

        lastWeather = data;

        updateCurrentWeather(data, name);
        updateForecast(data);

    } catch (error) {
        console.error(error);
        alert("Unable to load weather data");
    }
}


// ===============================
// CURRENT WEATHER
// ===============================

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

    // UV element is not currently provided by the API.
    const uvElement = document.getElementById("uv");

    if (uvElement) {
        uvElement.textContent = "—";
    }
}


// ===============================
// 7 DAY FORECAST
// ===============================

function updateForecast(data) {
    const container = document.querySelector(".forecast-container");

    if (!container || !data.daily) return;

    container.innerHTML = "";

    for (let i = 0; i < 7; i++) {

        const date = new Date(data.daily.time[i]);

        const dayName =
            i === 0
                ? "Today"
                : date.toLocaleDateString("en-US", {
                    weekday: "short"
                });

        const maxTemp =
            convertTemperature(data.daily.temperature_2m_max[i]);

        const minTemp =
            convertTemperature(data.daily.temperature_2m_min[i]);

        const rainChance =
            data.daily.precipitation_probability_max[i] ?? 0;

        const icon =
            getWeatherIcon(data.daily.weather_code[i]);

        const card = document.createElement("div");

        card.className = "forecast-card";

        card.innerHTML = `
            <p>${dayName}</p>

            <span class="forecast-icon">${icon}</span>

            <h3>${maxTemp}</h3>

            <small>${minTemp}</small>

            <div class="rain-chance">
                ${rainChance}% rain
            </div>
        `;

        container.appendChild(card);
    }
}


// ===============================
// TEMPERATURE CONVERSION
// ===============================

function convertTemperature(temp) {

    if (temp === null || temp === undefined) {
        return "—";
    }

    if (currentUnit === "F") {
        return Math.round((temp * 9 / 5) + 32) + "°F";
    }

    return Math.round(temp) + "°C";
}


// ===============================
// CELSIUS / FAHRENHEIT
// ===============================

function toggleUnit() {

    currentUnit = currentUnit === "C" ? "F" : "C";

    if (lastWeather) {

        updateCurrentWeather(
            lastWeather,
            document.getElementById("cityName").textContent
        );

        updateForecast(lastWeather);
    }

    const unitButton =
        document.getElementById("unitButton");

    if (unitButton) {
        unitButton.textContent =
            currentUnit === "C" ? "°F" : "°C";
    }
}


// ===============================
// WEATHER ICON
// ===============================

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


// ===============================
// WEATHER CONDITION
// ===============================

function getWeatherCondition(code) {

    if (code === 0)
        return "Clear Sky";

    if (code <= 3)
        return "Partly Cloudy";

    if (code <= 48)
        return "Foggy";

    if (code <= 67)
        return "Rainy";

    if (code <= 77)
        return "Snowy";

    if (code <= 82)
        return "Rain Showers";

    if (code <= 99)
        return "Thunderstorm";

    return "Unknown";
}


// ===============================
// MY LOCATION
// ===============================

function getMyLocation() {

    if (!navigator.geolocation) {
        alert("Geolocation is not supported by your browser.");
        return;
    }

    navigator.geolocation.getCurrentPosition(
        async function (position) {

            const latitude =
                position.coords.latitude;

            const longitude =
                position.coords.longitude;

            await loadWeather(
                latitude,
                longitude,
                "My Location"
            );
        },

        function () {
            alert("Location permission was denied.");
        }
    );
}


// ===============================
// CITY AUTOCOMPLETE
// ===============================

const cityInput =
    document.getElementById("cityInput");

let suggestionBox =
    document.getElementById("suggestionBox");


// Create suggestion box if it doesn't exist
if (!suggestionBox && cityInput) {

    suggestionBox =
        document.createElement("div");

    suggestionBox.id =
        "suggestionBox";

    cityInput.parentElement.style.position =
        "relative";

    cityInput.parentElement.appendChild(
        suggestionBox
    );
}


// ===============================
// AUTOCOMPLETE SEARCH
// ===============================

if (cityInput) {

    cityInput.addEventListener(
        "input",
        async function () {

            const query =
                this.value.trim();

            if (suggestionBox) {
                suggestionBox.innerHTML = "";
            }

            if (query.length < 2) {
                return;
            }

            try {

                const response = await fetch(
                    `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(query)}&count=8&language=en&format=json&countryCode=IN`
                );

                const data =
                    await response.json();

                if (!data.results || !suggestionBox) {
                    return;
                }

                data.results.forEach(city => {

                    const item =
                        document.createElement("div");

                    item.className =
                        "suggestion-item";

                    item.textContent =
                        `${city.name}${city.admin1 ? ", " + city.admin1 : ""}`;

                    item.addEventListener(
                        "click",
                        function () {

                            cityInput.value =
                                city.name;

                            hideSuggestions();

                            searchWeather();
                        }
                    );

                    suggestionBox.appendChild(
                        item
                    );
                });

            } catch (error) {

                console.error(
                    "Autocomplete error:",
                    error
                );
            }
        }
    );


    // Search with Enter
    cityInput.addEventListener(
        "keydown",
        function (event) {

            if (event.key === "Enter") {

                event.preventDefault();

                searchWeather();
            }
        }
    );
}


// ===============================
// HIDE SUGGESTIONS
// ===============================

function hideSuggestions() {

    if (suggestionBox) {
        suggestionBox.innerHTML = "";
    }
}


// ===============================
// CLICK OUTSIDE
// ===============================

document.addEventListener(
    "click",
    function (event) {

        if (
            cityInput &&
            suggestionBox &&
            !cityInput.parentElement.contains(event.target)
        ) {
            hideSuggestions();
        }
    }
);
