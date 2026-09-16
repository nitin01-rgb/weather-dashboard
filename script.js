/* =========================================================
   VGU WEATHER
   Weather Dashboard powered by Open-Meteo
========================================================= */


/* =========================================================
   CONFIG
========================================================= */

const API_BASE = "https://api.open-meteo.com/v1/forecast";
const GEO_API = "https://geocoding-api.open-meteo.com/v1/search";

const RECENT_KEY = "vguWeatherRecent";
const FAVORITES_KEY = "vguWeatherFavorites";


/* =========================================================
   STATE
========================================================= */

let currentLocation = {
    name: "VGU Campus, Jaipur",
    latitude: 26.9124,
    longitude: 75.7873,
    country: "India"
};

let currentWeatherData = null;

let unit = localStorage.getItem("vguWeatherUnit") || "C";


/* =========================================================
   DOM
========================================================= */

const cityInput = document.getElementById("cityInput");
const searchBtn = document.getElementById("searchBtn");
const suggestions = document.getElementById("suggestions");

const locationBtn = document.getElementById("locationBtn");
const unitToggle = document.getElementById("unitToggle");

const favoriteBtn = document.getElementById("favoriteBtn");

const locationName = document.getElementById("locationName");
const conditionText = document.getElementById("conditionText");
const currentIcon = document.getElementById("currentIcon");

const currentTemp = document.getElementById("currentTemp");
const currentUnit = document.getElementById("currentUnit");

const humidity = document.getElementById("humidity");
const windSpeed = document.getElementById("windSpeed");
const feelsLike = document.getElementById("feelsLike");
const feelsUnit = document.getElementById("feelsUnit");
const uvIndex = document.getElementById("uvIndex");

const sunrise = document.getElementById("sunrise");
const sunset = document.getElementById("sunset");
const sunPosition = document.getElementById("sunPosition");
const daylightDuration = document.getElementById("daylightDuration");

const updatedTime = document.getElementById("updatedTime");

const hourlyForecast = document.getElementById("hourlyForecast");
const dailyForecast = document.getElementById("dailyForecast");

const recentList = document.getElementById("recentList");
const favoritesList = document.getElementById("favoritesList");

const clearRecentBtn = document.getElementById("clearRecentBtn");

const toast = document.getElementById("toast");


/* =========================================================
   WEATHER CODE
========================================================= */

function getWeatherInfo(code) {

    const weather = {

        0: {
            text: "Clear sky",
            icon: "☀️",
            theme: "clear"
        },

        1: {
            text: "Mainly clear",
            icon: "🌤️",
            theme: "clear"
        },

        2: {
            text: "Partly cloudy",
            icon: "⛅",
            theme: "cloud"
        },

        3: {
            text: "Overcast",
            icon: "☁️",
            theme: "cloud"
        },

        45: {
            text: "Fog",
            icon: "🌫️",
            theme: "cloud"
        },

        48: {
            text: "Rime fog",
            icon: "🌫️",
            theme: "cloud"
        },

        51: {
            text: "Light drizzle",
            icon: "🌦️",
            theme: "rain"
        },

        53: {
            text: "Moderate drizzle",
            icon: "🌦️",
            theme: "rain"
        },

        55: {
            text: "Dense drizzle",
            icon: "🌧️",
            theme: "rain"
        },

        61: {
            text: "Light rain",
            icon: "🌦️",
            theme: "rain"
        },

        63: {
            text: "Moderate rain",
            icon: "🌧️",
            theme: "rain"
        },

        65: {
            text: "Heavy rain",
            icon: "🌧️",
            theme: "rain"
        },

        71: {
            text: "Light snow",
            icon: "🌨️",
            theme: "cloud"
        },

        73: {
            text: "Moderate snow",
            icon: "❄️",
            theme: "cloud"
        },

        75: {
            text: "Heavy snow",
            icon: "❄️",
            theme: "cloud"
        },

        80: {
            text: "Rain showers",
            icon: "🌦️",
            theme: "rain"
        },

        81: {
            text: "Moderate showers",
            icon: "🌧️",
            theme: "rain"
        },

        82: {
            text: "Heavy showers",
            icon: "⛈️",
            theme: "storm"
        },

        95: {
            text: "Thunderstorm",
            icon: "⛈️",
            theme: "storm"
        },

        96: {
            text: "Thunderstorm with hail",
            icon: "⛈️",
            theme: "storm"
        },

        99: {
            text: "Severe thunderstorm",
            icon: "⛈️",
            theme: "storm"
        }

    };

    return weather[code] || {
        text: "Unknown conditions",
        icon: "🌤️",
        theme: "cloud"
    };
}


/* =========================================================
   SEARCH CITY
========================================================= */

async function searchCity(query) {

    if (!query || query.trim().length < 2) {
        suggestions.style.display = "none";
        return;
    }

    try {

        const url =
            `${GEO_API}?name=${encodeURIComponent(query)}&count=6&language=en&format=json`;

        const response = await fetch(url);

        if (!response.ok) {
            throw new Error("City search failed");
        }

        const data = await response.json();

        renderSuggestions(data.results || []);

    } catch (error) {

        suggestions.style.display = "none";

        console.error(error);
    }
}


/* =========================================================
   SUGGESTIONS
========================================================= */

function renderSuggestions(results) {

    if (!results.length) {

        suggestions.innerHTML = `
            <div class="suggestion-item">
                <span class="suggestion-city">
                    No locations found
                </span>
            </div>
        `;

        suggestions.style.display = "block";

        return;
    }


    suggestions.innerHTML = results.map((place, index) => {

        const city =
            place.name || "Unknown";

        const country =
            place.country || "";

        const admin =
            place.admin1 || "";

        return `
            <div
                class="suggestion-item"
                data-index="${index}"
            >
                <div>
                    <div class="suggestion-city">
                        ${escapeHtml(city)}
                    </div>

                    <div class="suggestion-country">
                        ${escapeHtml(admin)}
                        ${admin && country ? ", " : ""}
                        ${escapeHtml(country)}
                    </div>
                </div>

                <span>→</span>
            </div>
        `;

    }).join("");


    suggestions
        .querySelectorAll(".suggestion-item")
        .forEach(item => {

            item.addEventListener("click", () => {

                const index =
                    Number(item.dataset.index);

                const place = results[index];

                if (place) {

                    const name =
                        place.name;

                    loadWeather(
                        place.latitude,
                        place.longitude,
                        name,
                        place.country || ""
                    );

                    cityInput.value = name;

                    suggestions.style.display = "none";
                }
            });

        });


    suggestions.style.display = "block";
}


/* =========================================================
   LOAD WEATHER
========================================================= */

async function loadWeather(
    latitude,
    longitude,
    name,
    country = ""
) {

    showLoading();

    try {

        const url =
            `${API_BASE}?latitude=${latitude}` +
            `&longitude=${longitude}` +
            `&current=temperature_2m,relative_humidity_2m,apparent_temperature,weather_code,wind_speed_10m` +
            `&hourly=temperature_2m,relative_humidity_2m,apparent_temperature,precipitation_probability,weather_code,wind_speed_10m` +
            `&daily=weather_code,temperature_2m_max,temperature_2m_min,precipitation_probability_max,sunrise,sunset,uv_index_max` +
            `&forecast_days=7` +
            `&timezone=auto`;

        const response =
            await fetch(url);

        if (!response.ok) {
            throw new Error("Weather request failed");
        }

        const data =
            await response.json();

        currentWeatherData = data;

        currentLocation = {
            name,
            latitude,
            longitude,
            country
        };


        updateCurrentWeather(data);

        updateHourly(data);

        updateDaily(data);

        updateSun(data);

        updateDynamicTheme(data);

        updateFavoriteButton();

        addRecentSearch(currentLocation);

        renderRecent();

        renderFavorites();

    } catch (error) {

        console.error(error);

        showError();

        showToast(
            "Unable to load weather. Please try again."
        );
    }
}


/* =========================================================
   CURRENT WEATHER
========================================================= */

function updateCurrentWeather(data) {

    const current =
        data.current;

    const info =
        getWeatherInfo(current.weather_code);


    locationName.textContent =
        currentLocation.name +
        (currentLocation.name.includes("VGU")
            ? ""
            : `, ${currentLocation.country || ""}`);


    conditionText.textContent =
        info.text;

    currentIcon.textContent =
        info.icon;


    const temp =
        convertTemperature(
            current.temperature_2m
        );

    const feels =
        convertTemperature(
            current.apparent_temperature
        );


    currentTemp.textContent =
        Math.round(temp);

    feelsLike.textContent =
        Math.round(feels);


    currentUnit.textContent =
        unit;

    feelsUnit.textContent =
        unit;


    humidity.textContent =
        `${Math.round(current.relative_humidity_2m)}%`;


    windSpeed.textContent =
        Math.round(current.wind_speed_10m);


    const uv =
        data.daily.uv_index_max[0];

    uvIndex.textContent =
        uv !== undefined
            ? Number(uv).toFixed(1)
            : "--";


    updatedTime.textContent =
        formatTime(
            current.time
        );
}


/* =========================================================
   HOURLY FORECAST
========================================================= */

function updateHourly(data) {

    const times =
        data.hourly.time;

    const temperatures =
        data.hourly.temperature_2m;

    const rain =
        data.hourly.precipitation_probability;

    const codes =
        data.hourly.weather_code;


    let startIndex =
        findCurrentHourIndex(
            times,
            data.current.time
        );


    if (startIndex < 0) {
        startIndex = 0;
    }


    const endIndex =
        Math.min(
            startIndex + 24,
            times.length
        );


    let html = "";


    for (
        let i = startIndex;
        i < endIndex;
        i++
    ) {

        const info =
            getWeatherInfo(
                codes[i]
            );

        const isNow =
            i === startIndex;


        html += `
            <div class="hourly-card ${isNow ? "active" : ""}">

                <div class="hourly-time">
                    ${isNow ? "Now" : formatHour(times[i])}
                </div>

                <div class="hourly-icon">
                    ${info.icon}
                </div>

                <div class="hourly-temp">
                    ${Math.round(
                        convertTemperature(
                            temperatures[i]
                        )
                    )}°
                </div>

                <div class="hourly-rain">
                    ${rain[i] ?? 0}% rain
                </div>

            </div>
        `;
    }


    hourlyForecast.innerHTML =
        html;
}


/* =========================================================
   DAILY FORECAST
========================================================= */

function updateDaily(data) {

    const days =
        data.daily.time;

    const max =
        data.daily.temperature_2m_max;

    const min =
        data.daily.temperature_2m_min;

    const rain =
        data.daily.precipitation_probability_max;

    const codes =
        data.daily.weather_code;


    let html = "";


    for (
        let i = 0;
        i < days.length;
        i++
    ) {

        const info =
            getWeatherInfo(
                codes[i]
            );


        const dayName =
            i === 0
                ? "Today"
                : formatDay(days[i]);


        const high =
            Math.round(
                convertTemperature(
                    max[i]
                )
            );

        const low =
            Math.round(
                convertTemperature(
                    min[i]
                )
            );


        html += `
            <div class="daily-card">

                <div class="daily-day">
                    ${dayName}
                </div>

                <div class="daily-icon">
                    ${info.icon}
                </div>

                <div class="daily-high">
                    ${high}°
                </div>

                <div class="daily-low">
                    ${low}°
                </div>

                <div class="daily-rain">
                    Rain ${rain[i] ?? 0}%
                </div>

            </div>
        `;
    }


    dailyForecast.innerHTML =
        html;
}


/* =========================================================
   SUNRISE / SUNSET
========================================================= */

function updateSun(data) {

    const sunriseTime =
        data.daily.sunrise[0];

    const sunsetTime =
        data.daily.sunset[0];


    sunrise.textContent =
        formatTime(
            sunriseTime
        );

    sunset.textContent =
        formatTime(
            sunsetTime
        );


    const duration =
        calculateDaylight(
            sunriseTime,
            sunsetTime
        );

    daylightDuration.textContent =
        `${duration} daylight`;


    updateSunPosition(
        data.current.time,
        sunriseTime,
        sunsetTime
    );
}


/* =========================================================
   SUN POSITION
========================================================= */

function updateSunPosition(
    current,
    sunriseTime,
    sunsetTime
) {

    const currentMinutes =
        timeToMinutes(current);

    const sunriseMinutes =
        timeToMinutes(sunriseTime);

    const sunsetMinutes =
        timeToMinutes(sunsetTime);


    let percentage =
        (
            (currentMinutes - sunriseMinutes) /
            (sunsetMinutes - sunriseMinutes)
        ) * 100;


    percentage =
        Math.max(
            0,
            Math.min(
                100,
                percentage
            )
        );


    sunPosition.style.left =
        `${percentage}%`;
}


/* =========================================================
   DAY / NIGHT + WEATHER BACKGROUND
========================================================= */

function updateDynamicTheme(data) {

    const current =
        data.current;

    const sunriseTime =
        data.daily.sunrise[0];

    const sunsetTime =
        data.daily.sunset[0];


    const isDay =
        current.time >= sunriseTime &&
        current.time <= sunsetTime;


    const info =
        getWeatherInfo(
            current.weather_code
        );


    document.body.classList.remove(
        "day-theme",
        "night-theme",
        "rain-theme",
        "clear-theme",
        "storm-theme"
    );


    if (
        info.theme === "rain"
    ) {

        document.body.classList.add(
            "rain-theme"
        );

    } else if (
        info.theme === "storm"
    ) {

        document.body.classList.add(
            "storm-theme"
        );

    } else if (
        info.theme === "clear"
    ) {

        document.body.classList.add(
            "clear-theme"
        );

    } else {

        document.body.classList.add(
            isDay
                ? "day-theme"
                : "night-theme"
        );
    }
}


/* =========================================================
   RECENT SEARCHES
========================================================= */

function getRecent() {

    try {

        return JSON.parse(
            localStorage.getItem(
                RECENT_KEY
            )
        ) || [];

    } catch {

        return [];
    }
}


function addRecentSearch(location) {

    if (
        !location ||
        !location.name
    ) {
        return;
    }


    let recent =
        getRecent();


    recent =
        recent.filter(
            item =>
                !(
                    item.name.toLowerCase() ===
                    location.name.toLowerCase()
                )
        );


    recent.unshift({
        name: location.name,
        latitude: location.latitude,
        longitude: location.longitude,
        country: location.country
    });


    recent =
        recent.slice(0, 6);


    localStorage.setItem(
        RECENT_KEY,
        JSON.stringify(recent)
    );
}


function renderRecent() {

    const recent =
        getRecent();


    if (!recent.length) {

        recentList.innerHTML = `
            <span class="empty-text">
                Your recent searches will appear here.
            </span>
        `;

        return;
    }


    recentList.innerHTML =
        recent.map(
            item => `
                <button
                    class="quick-chip"
                    data-lat="${item.latitude}"
                    data-lon="${item.longitude}"
                    data-name="${escapeAttribute(item.name)}"
                    data-country="${escapeAttribute(item.country || "")}"
                >
                    ${escapeHtml(item.name)}
                </button>
            `
        ).join("");


    recentList
        .querySelectorAll(".quick-chip")
        .forEach(button => {

            button.addEventListener(
                "click",
                () => {

                    loadWeather(
                        Number(button.dataset.lat),
                        Number(button.dataset.lon),
                        button.dataset.name,
                        button.dataset.country
                    );

                }
            );

        });
}


/* =========================================================
   FAVORITES
========================================================= */

function getFavorites() {

    try {

        return JSON.parse(
            localStorage.getItem(
                FAVORITES_KEY
            )
        ) || [];

    } catch {

        return [];
    }
}


function toggleFavorite() {

    if (!currentLocation) {
        return;
    }


    let favorites =
        getFavorites();


    const exists =
        favorites.some(
            item =>
                item.latitude ===
                    currentLocation.latitude &&
                item.longitude ===
                    currentLocation.longitude
        );


    if (exists) {

        favorites =
            favorites.filter(
                item =>
                    !(
                        item.latitude ===
                            currentLocation.latitude &&
                        item.longitude ===
                            currentLocation.longitude
                    )
            );

        showToast(
            "Removed from favorites"
        );

    } else {

        favorites.push({
            name: currentLocation.name,
            latitude: currentLocation.latitude,
            longitude: currentLocation.longitude,
            country: currentLocation.country
        });

        showToast(
            "Added to favorites"
        );
    }


    localStorage.setItem(
        FAVORITES_KEY,
        JSON.stringify(favorites)
    );


    updateFavoriteButton();

    renderFavorites();
}


function updateFavoriteButton() {

    const favorites =
        getFavorites();


    const exists =
        favorites.some(
            item =>
                item.latitude ===
                    currentLocation.latitude &&
                item.longitude ===
                    currentLocation.longitude
        );


    favoriteBtn.textContent =
        exists
            ? "★"
            : "☆";


    favoriteBtn.title =
        exists
            ? "Remove from favorites"
            : "Add to favorites";
}


function renderFavorites() {

    const favorites =
        getFavorites();


    if (!favorites.length) {

        favoritesList.innerHTML = `
            <span class="empty-text">
                Add locations using the ☆ button.
            </span>
        `;

        return;
    }


    favoritesList.innerHTML =
        favorites.map(
            item => `
                <button
                    class="quick-chip favorite-chip"
                    data-lat="${item.latitude}"
                    data-lon="${item.longitude}"
                    data-name="${escapeAttribute(item.name)}"
                    data-country="${escapeAttribute(item.country || "")}"
                >
                    ★ ${escapeHtml(item.name)}
                </button>
            `
        ).join("");


    favoritesList
        .querySelectorAll(".quick-chip")
        .forEach(button => {

            button.addEventListener(
                "click",
                () => {

                    loadWeather(
                        Number(button.dataset.lat),
                        Number(button.dataset.lon),
                        button.dataset.name,
                        button.dataset.country
                    );

                }
            );

        });
}


/* =========================================================
   CLEAR RECENT
========================================================= */

clearRecentBtn.addEventListener(
    "click",
    () => {

        localStorage.removeItem(
            RECENT_KEY
        );

        renderRecent();

        showToast(
            "Recent searches cleared"
        );
    }
);


/* =========================================================
   UNIT CONVERSION
========================================================= */

function convertTemperature(
    celsius
) {

    if (unit === "F") {

        return (
            celsius * 9 / 5
        ) + 32;
    }

    return celsius;
}


function updateUnitButton() {

    unitToggle.textContent =
        unit === "C"
            ? "°C"
            : "°F";
}


unitToggle.addEventListener(
    "click",
    () => {

        unit =
            unit === "C"
                ? "F"
                : "C";


        localStorage.setItem(
            "vguWeatherUnit",
            unit
        );


        updateUnitButton();


        if (currentWeatherData) {

            updateCurrentWeather(
                currentWeatherData
            );

            updateHourly(
                currentWeatherData
            );

            updateDaily(
                currentWeatherData
            );
        }
    }
);


/* =========================================================
   MY LOCATION
========================================================= */

locationBtn.addEventListener(
    "click",
    () => {

        if (!navigator.geolocation) {

            showToast(
                "Geolocation is not supported."
            );

            return;
        }


        showToast(
            "Getting your location..."
        );


        navigator.geolocation.getCurrentPosition(

            position => {

                const lat =
                    position.coords.latitude;

                const lon =
                    position.coords.longitude;


                loadWeather(
                    lat,
                    lon,
                    "My Location",
                    ""
                );
            },

            error => {

                console.error(error);

                showToast(
                    "Location permission was denied."
                );
            },

            {
                enableHighAccuracy: true,
                timeout: 10000,
                maximumAge: 300000
            }
        );
    }
);


/* =========================================================
   SEARCH BUTTON
========================================================= */

searchBtn.addEventListener(
    "click",
    async () => {

        const query =
            cityInput.value.trim();

        if (!query) {

            showToast(
                "Enter a city name."
            );

            return;
        }


        try {

            const url =
                `${GEO_API}?name=${encodeURIComponent(query)}&count=1&language=en&format=json`;

            const response =
                await fetch(url);

            const data =
                await response.json();


            if (
                !data.results ||
                !data.results.length
            ) {

                showToast(
                    "City not found."
                );

                return;
            }


            const place =
                data.results[0];


            loadWeather(
                place.latitude,
                place.longitude,
                place.name,
                place.country || ""
            );


            suggestions.style.display =
                "none";

        } catch (error) {

            console.error(error);

            showToast(
                "Search failed. Try again."
            );
        }
    }
);


/* =========================================================
   ENTER KEY
========================================================= */

cityInput.addEventListener(
    "keydown",
    event => {

        if (
            event.key === "Enter"
        ) {

            event.preventDefault();

            searchBtn.click();
        }
    }
);


/* =========================================================
   LIVE SUGGESTIONS
========================================================= */

let searchTimer;

cityInput.addEventListener(
    "input",
    () => {

        clearTimeout(
            searchTimer
        );


        searchTimer =
            setTimeout(
                () => {

                    searchCity(
                        cityInput.value
                    );

                },
                300
            );
    }
);


/* =========================================================
   CLOSE SUGGESTIONS
========================================================= */

document.addEventListener(
    "click",
    event => {

        if (
            !event.target.closest(
                ".search-box"
            )
        ) {

            suggestions.style.display =
                "none";
        }
    }
);


/* =========================================================
   HELPERS
========================================================= */

function findCurrentHourIndex(
    times,
    currentTime
) {

    if (!currentTime) {
        return 0;
    }


    const currentHour =
        currentTime.slice(0, 13);


    const exact =
        times.findIndex(
            time =>
                time.slice(0, 13) ===
                currentHour
        );


    if (exact >= 0) {
        return exact;
    }


    let closest = 0;

    let smallest =
        Infinity;


    times.forEach(
        (time, index) => {

            const difference =
                Math.abs(
                    new Date(time) -
                    new Date(currentTime)
                );


            if (
                difference <
                smallest
            ) {

                smallest =
                    difference;

                closest =
                    index;
            }
        }
    );


    return closest;
}


function formatHour(
    iso
) {

    const time =
        iso.slice(11, 16);

    let hour =
        Number(
            time.slice(0, 2)
        );

    const minute =
        time.slice(3, 5);


    const suffix =
        hour >= 12
            ? "PM"
            : "AM";


    hour =
        hour % 12 || 12;


    return `${hour}:${minute} ${suffix}`;
}


function formatTime(
    iso
) {

    if (!iso) {
        return "--:--";
    }


    const time =
        iso.slice(11, 16);

    let hour =
        Number(
            time.slice(0, 2)
        );

    const minute =
        time.slice(3, 5);


    const suffix =
        hour >= 12
            ? "PM"
            : "AM";


    hour =
        hour % 12 || 12;


    return `${hour}:${minute} ${suffix}`;
}


function formatDay(
    dateString
) {

    const date =
        new Date(
            `${dateString}T12:00:00`
        );


    return date.toLocaleDateString(
        "en-US",
        {
            weekday: "short"
        }
    );
}


function timeToMinutes(
    iso
) {

    if (!iso) {
        return 0;
    }


    const time =
        iso.slice(11, 16);


    const hour =
        Number(
            time.slice(0, 2)
        );

    const minute =
        Number(
            time.slice(3, 5)
        );


    return (
        hour * 60 +
        minute
    );
}


function calculateDaylight(
    start,
    end
) {

    const startMinutes =
        timeToMinutes(start);

    const endMinutes =
        timeToMinutes(end);


    let difference =
        endMinutes -
        startMinutes;


    if (difference < 0) {
        difference += 1440;
    }


    const hours =
        Math.floor(
            difference / 60
        );

    const minutes =
        difference % 60;


    return `${hours}h ${minutes}m`;
}


/* =========================================================
   LOADING / ERROR
========================================================= */

function showLoading() {

    locationName.textContent =
        "Loading location...";

    conditionText.textContent =
        "Fetching latest weather";

    currentTemp.textContent =
        "--";

    humidity.textContent =
        "--%";

    windSpeed.textContent =
        "--";

    feelsLike.textContent =
        "--";

    uvIndex.textContent =
        "--";

    hourlyForecast.innerHTML = `
        <div class="loading">
            Loading hourly forecast...
        </div>
    `;

    dailyForecast.innerHTML = `
        <div class="loading">
            Loading 7-day forecast...
        </div>
    `;
}


function showError() {

    conditionText.textContent =
        "Unable to load weather";

    hourlyForecast.innerHTML = `
        <div class="loading">
            Weather data could not be loaded.
        </div>
    `;

    dailyForecast.innerHTML = `
        <div class="loading">
            Please search again.
        </div>
    `;
}


/* =========================================================
   TOAST
========================================================= */

let toastTimer;

function showToast(
    message
) {

    toast.textContent =
        message;

    toast.classList.add(
        "show"
    );


    clearTimeout(
        toastTimer
    );


    toastTimer =
        setTimeout(
            () => {

                toast.classList.remove(
                    "show"
                );

            },
            2200
        );
}


/* =========================================================
   SECURITY / HTML ESCAPING
========================================================= */

function escapeHtml(
    value
) {

    return String(value)
        .replaceAll("&", "&amp;")
        .replaceAll("<", "&lt;")
        .replaceAll(">", "&gt;")
        .replaceAll('"', "&quot;")
        .replaceAll("'", "&#039;");
}


function escapeAttribute(
    value
) {

    return escapeHtml(
        value
    );
}


/* =========================================================
   INITIALIZE
========================================================= */

document.addEventListener(
    "DOMContentLoaded",
    () => {

        updateUnitButton();

        renderRecent();

        renderFavorites();

        loadWeather(
            26.9124,
            75.7873,
            "VGU Campus, Jaipur",
            "India"
        );

    }
);


/* =========================================================
   FAVORITE BUTTON
========================================================= */

favoriteBtn.addEventListener(
    "click",
    toggleFavorite
);
