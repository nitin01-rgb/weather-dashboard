let currentUnit = "C";
let lastWeather = null;
let lastLocationName = "";

const cityInput = document.getElementById("cityInput");
const suggestionBox = document.getElementById("suggestionBox");


// ==========================================
// SEARCH
// ==========================================

async function searchWeather() {

    const city = cityInput.value.trim();

    if (!city) {
        return;
    }

    await loadWeatherByCity(city);
}


// ==========================================
// CITY SEARCH
// ==========================================

async function loadWeatherByCity(city) {

    try {

        const response = await fetch(
            `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(city)}&count=1&language=en&format=json`
        );

        if (!response.ok) {
            throw new Error("Location search failed");
        }

        const data = await response.json();

        if (!data.results || data.results.length === 0) {
            alert("City not found");
            return;
        }

        const location = data.results[0];

        const name =
            `${location.name}, ${location.country}`;

        await loadWeather(
            location.latitude,
            location.longitude,
            name
        );

        cityInput.value = "";
        suggestionBox.innerHTML = "";

    } catch (error) {

        console.error(error);

        alert("Unable to find this city");
    }
}


// ==========================================
// WEATHER API
// ==========================================

async function loadWeather(
    latitude,
    longitude,
    name
) {

    try {

        const response = await fetch(
            `https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}&current=temperature_2m,relative_humidity_2m,apparent_temperature,wind_speed_10m,weather_code&daily=weather_code,temperature_2m_max,temperature_2m_min,precipitation_probability_max,sunrise,sunset,uv_index_max&timezone=auto`
        );

        if (!response.ok) {
            throw new Error("Weather request failed");
        }

        const data = await response.json();

        lastWeather = data;
        lastLocationName = name;

        updateCurrentWeather(data, name);
        updateForecast(data);
        updateSun(data);

    } catch (error) {

        console.error(error);

        alert("Unable to load weather");
    }
}


// ==========================================
// CURRENT WEATHER
// ==========================================

function updateCurrentWeather(data, name) {

    const current = data.current;

    document.getElementById("cityName").textContent =
        name;

    document.getElementById("condition").textContent =
        getWeatherCondition(
            current.weather_code
        );

    document.getElementById("temperature").textContent =
        convertTemperature(
            current.temperature_2m
        );

    document.getElementById("humidity").textContent =
        current.relative_humidity_2m + "%";

    document.getElementById("wind").textContent =
        Math.round(
            current.wind_speed_10m
        ) + " km/h";

    document.getElementById("feels").textContent =
        convertTemperature(
            current.apparent_temperature
        );

    document.getElementById("weatherIcon").textContent =
        getWeatherIcon(
            current.weather_code
        );

    document.getElementById("uv").textContent =
        data.daily.uv_index_max?.[0] ?? "--";

    document.getElementById("updatedTime").textContent =
        new Date().toLocaleTimeString(
            "en-IN",
            {
                hour: "2-digit",
                minute: "2-digit",
                hour12: false
            }
        );
}


// ==========================================
// FORECAST
// ==========================================

function updateForecast(data) {

    const container =
        document.getElementById(
            "forecastContainer"
        );

    container.innerHTML = "";

    for (
        let i = 0;
        i < Math.min(7, data.daily.time.length);
        i++
    ) {

        const date =
            new Date(
                data.daily.time[i] +
                "T12:00:00"
            );

        const day =
            i === 0
                ? "Today"
                : date.toLocaleDateString(
                    "en-US",
                    {
                        weekday: "short"
                    }
                );

        const high =
            convertTemperature(
                data.daily.temperature_2m_max[i]
            );

        const low =
            convertTemperature(
                data.daily.temperature_2m_min[i]
            );

        const rain =
            data.daily.precipitation_probability_max[i] ?? 0;

        const card =
            document.createElement("div");

        card.className =
            "forecast-card";

        card.innerHTML = `
            <p>${day}</p>

            <span class="forecast-icon">
                ${getWeatherIcon(
                    data.daily.weather_code[i]
                )}
            </span>

            <h3>${high}</h3>

            <small>${low}</small>

            <p class="rain-chance">
                Rain ${rain}%
            </p>
        `;

        container.appendChild(card);
    }
}


// ==========================================
// SUNRISE / SUNSET
// ==========================================

function updateSun(data) {

    const sunrise =
        data.daily.sunrise?.[0];

    const sunset =
        data.daily.sunset?.[0];

    if (!sunrise || !sunset) {
        return;
    }

    document.getElementById("sunrise").textContent =
        formatTime(sunrise);

    document.getElementById("sunset").textContent =
        formatTime(sunset);

    const sunriseDate =
        new Date(sunrise);

    const sunsetDate =
        new Date(sunset);

    const duration =
        (sunsetDate - sunriseDate)
        / (1000 * 60 * 60);

    document.getElementById(
        "daylightDuration"
    ).textContent =
        duration.toFixed(1) + "h daylight";
}


function formatTime(value) {

    return new Date(value).toLocaleTimeString(
        "en-IN",
        {
            hour: "2-digit",
            minute: "2-digit",
            hour12: false
        }
    );
}


// ==========================================
// TEMPERATURE
// ==========================================

function convertTemperature(temp) {

    if (currentUnit === "F") {

        return (
            Math.round(
                (temp * 9 / 5) + 32
            ) + "°F"
        );
    }

    return Math.round(temp) + "°C";
}


// ==========================================
// °C / °F
// ==========================================

function toggleUnit() {

    currentUnit =
        currentUnit === "C"
            ? "F"
            : "C";

    if (lastWeather) {

        updateCurrentWeather(
            lastWeather,
            lastLocationName
        );

        updateForecast(
            lastWeather
        );
    }

    document.getElementById(
        "unitButton"
    ).textContent =
        currentUnit === "C"
            ? "°F"
            : "°C";
}


// ==========================================
// WEATHER ICONS
// ==========================================

function getWeatherIcon(code) {

    if (code === 0) {
        return "☀️";
    }

    if (code <= 3) {
        return "🌤️";
    }

    if (code <= 48) {
        return "🌫️";
    }

    if (code <= 67) {
        return "🌧️";
    }

    if (code <= 77) {
        return "❄️";
    }

    if (code <= 82) {
        return "🌦️";
    }

    if (code <= 99) {
        return "⛈️";
    }

    return "🌡️";
}


// ==========================================
// CONDITIONS
// ==========================================

function getWeatherCondition(code) {

    if (code === 0) {
        return "Clear sky";
    }

    if (code <= 3) {
        return "Partly cloudy";
    }

    if (code <= 48) {
        return "Foggy";
    }

    if (code <= 67) {
        return "Rainy";
    }

    if (code <= 77) {
        return "Snowy";
    }

    if (code <= 82) {
        return "Rain showers";
    }

    if (code <= 99) {
        return "Thunderstorm";
    }

    return "Unknown";
}


// ==========================================
// MY LOCATION
// ==========================================

function getMyLocation() {

    if (!navigator.geolocation) {

        alert(
            "Geolocation is not supported"
        );

        return;
    }

    navigator.geolocation.getCurrentPosition(

        async function(position) {

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

        function() {

            alert(
                "Location permission was denied"
            );
        }
    );
}


// ==========================================
// INDIAN CITY AUTOCOMPLETE
// ==========================================

const popularCities = [

    "Delhi",
    "Mumbai",
    "Bangalore",
    "Hyderabad",
    "Chennai",
    "Kolkata",
    "Pune",
    "Ahmedabad",
    "Jaipur",
    "Lucknow",
    "Chandigarh",
    "Indore",
    "Bhopal",
    "Patna",
    "Agra",
    "Udaipur",
    "Jodhpur",
    "Surat",
    "Nagpur",
    "Kanpur",
    "Varanasi",
    "Amritsar",
    "Noida",
    "Gurgaon",
    "Ghaziabad",
    "Dehradun",
    "Ranchi",
    "Raipur",
    "Vadodara",
    "Nashik",
    "Kochi",
    "Coimbatore",
    "Mysore",
    "Visakhapatnam",
    "Thiruvananthapuram"
];


// ==========================================
// AUTOCOMPLETE
// ==========================================

cityInput.addEventListener(
    "input",
    function() {

        const query =
            this.value
                .trim()
                .toLowerCase();

        suggestionBox.innerHTML = "";

        if (query.length < 2) {
            return;
        }

        const matches =
            popularCities.filter(city =>
                city.toLowerCase()
                    .startsWith(query)
            );

        matches.forEach(city => {

            const item =
                document.createElement("div");

            item.className =
                "suggestion-item";

            item.textContent =
                city + ", India";

            item.addEventListener(
                "click",
                function() {

                    cityInput.value =
                        city;

                    suggestionBox.innerHTML =
                        "";

                    searchWeather();
                }
            );

            suggestionBox.appendChild(
                item
            );
        });
    }
);


// ==========================================
// ENTER SEARCH
// ==========================================

cityInput.addEventListener(
    "keydown",
    function(event) {

        if (event.key === "Enter") {

            event.preventDefault();

            suggestionBox.innerHTML =
                "";

            searchWeather();
        }
    }
);


// ==========================================
// CLOSE SUGGESTIONS
// ==========================================

document.addEventListener(
    "click",
    function(event) {

        if (
            !cityInput.parentElement
                .contains(event.target)
        ) {

            suggestionBox.innerHTML =
                "";
        }
    }
);
