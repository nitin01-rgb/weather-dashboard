let currentUnit = "C";
let lastWeather = null;


// ======================================
// SEARCH
// ======================================

async function searchWeather() {

    const input = document.getElementById("cityInput");

    if (!input) return;

    const city = input.value.trim();

    if (!city) {
        alert("Please enter a city name.");
        return;
    }

    hideSuggestions();

    await loadWeatherByCity(city);
}


// ======================================
// CITY SEARCH
// ======================================

async function loadWeatherByCity(city) {

    try {

        setLoading(true);

        const response = await fetch(
            `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(city)}&count=1&language=en&format=json`
        );

        if (!response.ok) {
            throw new Error("Geocoding request failed");
        }

        const data = await response.json();

        if (!data.results || data.results.length === 0) {

            alert("City not found.");

            setLoading(false);

            return;
        }

        const location = data.results[0];

        const country =
            location.country
                ? `, ${location.country}`
                : "";

        const name =
            `${location.name}${country}`;

        await loadWeather(
            location.latitude,
            location.longitude,
            name
        );

        document.getElementById("cityInput").value = "";

    } catch (error) {

        console.error(error);

        alert("Unable to load weather.");

    } finally {

        setLoading(false);
    }
}


// ======================================
// WEATHER API
// ======================================

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
            throw new Error("Weather API request failed");
        }

        const data = await response.json();

        lastWeather = data;

        updateCurrentWeather(data, name);

        updateForecast(data);

        updateSun(data);

    } catch (error) {

        console.error(error);

        alert("Unable to load weather data.");
    }
}


// ======================================
// CURRENT WEATHER
// ======================================

function updateCurrentWeather(data, name) {

    const current = data.current;

    const cityName =
        document.getElementById("cityName");

    const condition =
        document.getElementById("condition");

    const temperature =
        document.getElementById("temperature");

    const humidity =
        document.getElementById("humidity");

    const wind =
        document.getElementById("wind");

    const feels =
        document.getElementById("feels");

    const uv =
        document.getElementById("uv");

    const icon =
        document.getElementById("weatherIcon");

    const time =
        document.getElementById("weatherTime");


    if (cityName) {
        cityName.textContent = name;
    }


    if (condition) {

        condition.textContent =
            getWeatherCondition(
                current.weather_code
            );
    }


    if (temperature) {

        temperature.textContent =
            convertTemperature(
                current.temperature_2m
            );
    }


    if (humidity) {

        humidity.textContent =
            current.relative_humidity_2m + "%";
    }


    if (wind) {

        wind.textContent =
            Math.round(
                current.wind_speed_10m
            ) + " km/h";
    }


    if (feels) {

        feels.textContent =
            convertTemperature(
                current.apparent_temperature
            );
    }


    if (uv && data.daily.uv_index_max) {

        uv.textContent =
            Math.round(
                data.daily.uv_index_max[0]
            );
    }


    if (icon) {

        icon.textContent =
            getWeatherIcon(
                current.weather_code
            );
    }


    if (time && current.time) {

        const date =
            new Date(current.time);

        time.textContent =
            "Updated " +
            date.toLocaleTimeString(
                [],
                {
                    hour: "2-digit",
                    minute: "2-digit"
                }
            );
    }
}


// ======================================
// FORECAST
// ======================================

function updateForecast(data) {

    const container =
        document.getElementById(
            "forecastContainer"
        );

    if (!container || !data.daily) {
        return;
    }

    container.innerHTML = "";


    for (let i = 0; i < 7; i++) {

        const date =
            new Date(
                data.daily.time[i] + "T12:00:00"
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


        const icon =
            getWeatherIcon(
                data.daily.weather_code[i]
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
            data.daily
                .precipitation_probability_max[i]
            ?? 0;


        const card =
            document.createElement("article");

        card.className =
            "forecast-card";


        card.innerHTML = `
            <div class="forecast-day">
                ${day}
            </div>

            <span class="forecast-icon">
                ${icon}
            </span>

            <h3>${high}</h3>

            <small>${low}</small>

            <div class="rain-chance">
                ${rain}% rain
            </div>
        `;


        container.appendChild(card);
    }
}


// ======================================
// SUNRISE / SUNSET
// ======================================

function updateSun(data) {

    if (!data.daily) return;


    const sunrise =
        document.getElementById("sunrise");

    const sunset =
        document.getElementById("sunset");


    if (sunrise && data.daily.sunrise) {

        sunrise.textContent =
            formatTime(
                data.daily.sunrise[0]
            );
    }


    if (sunset && data.daily.sunset) {

        sunset.textContent =
            formatTime(
                data.daily.sunset[0]
            );
    }


    const daylight =
        document.getElementById(
            "daylightStatus"
        );


    if (
        daylight &&
        data.daily.sunrise &&
        data.daily.sunset
    ) {

        const start =
            new Date(
                data.daily.sunrise[0]
            );

        const end =
            new Date(
                data.daily.sunset[0]
            );

        const hours =
            (
                (end - start)
                / 1000
                / 60
                / 60
            ).toFixed(1);

        daylight.textContent =
            `${hours}h daylight`;
    }
}


function formatTime(value) {

    const date =
        new Date(value);

    return date.toLocaleTimeString(
        [],
        {
            hour: "2-digit",
            minute: "2-digit"
        }
    );
}


// ======================================
// TEMPERATURE
// ======================================

function convertTemperature(temp) {

    if (
        temp === null ||
        temp === undefined
    ) {
        return "—";
    }


    if (currentUnit === "F") {

        return (
            Math.round(
                temp * 9 / 5 + 32
            ) + "°F"
        );
    }


    return (
        Math.round(temp) + "°C"
    );
}


// ======================================
// C / F TOGGLE
// ======================================

function toggleUnit() {

    currentUnit =
        currentUnit === "C"
            ? "F"
            : "C";


    if (lastWeather) {

        updateCurrentWeather(
            lastWeather,
            document
                .getElementById("cityName")
                .textContent
        );

        updateForecast(
            lastWeather
        );
    }


    const button =
        document.getElementById(
            "unitButton"
        );


    if (button) {

        button.textContent =
            currentUnit === "C"
                ? "°F"
                : "°C";
    }
}


// ======================================
// WEATHER ICON
// ======================================

function getWeatherIcon(code) {

    if (code === 0)
        return "☀️";

    if (code <= 3)
        return "🌤️";

    if (code <= 48)
        return "🌫️";

    if (code <= 67)
        return "🌧️";

    if (code <= 77)
        return "❄️";

    if (code <= 82)
        return "🌦️";

    if (code <= 99)
        return "⛈️";

    return "🌡️";
}


// ======================================
// WEATHER CONDITION
// ======================================

function getWeatherCondition(code) {

    if (code === 0)
        return "Clear sky";

    if (code === 1)
        return "Mainly clear";

    if (code === 2)
        return "Partly cloudy";

    if (code === 3)
        return "Overcast";

    if (code <= 48)
        return "Foggy";

    if (code <= 55)
        return "Drizzle";

    if (code <= 67)
        return "Rain";

    if (code <= 77)
        return "Snow";

    if (code <= 82)
        return "Rain showers";

    if (code <= 99)
        return "Thunderstorm";

    return "Unknown";
}


// ======================================
// MY LOCATION
// ======================================

function getMyLocation() {

    if (!navigator.geolocation) {

        alert(
            "Location is not supported by your browser."
        );

        return;
    }


    const button =
        document.getElementById(
            "locationButton"
        );


    if (button) {

        button.classList.add(
            "loading"
        );
    }


    navigator.geolocation.getCurrentPosition(

        async function(position) {

            const {
                latitude,
                longitude
            } = position.coords;


            await loadWeather(
                latitude,
                longitude,
                "My Location"
            );


            if (button) {

                button.classList.remove(
                    "loading"
                );
            }
        },


        function(error) {

            console.error(error);

            alert(
                "Location permission was denied."
            );


            if (button) {

                button.classList.remove(
                    "loading"
                );
            }
        }
    );
}


// ======================================
// AUTOCOMPLETE
// ======================================

const cityInput =
    document.getElementById(
        "cityInput"
    );


let suggestionBox = null;


if (cityInput) {

    suggestionBox =
        document.createElement("div");

    suggestionBox.id =
        "suggestionBox";


    cityInput.parentElement.appendChild(
        suggestionBox
    );


    cityInput.addEventListener(
        "input",
        async function() {

            const query =
                this.value.trim();


            suggestionBox.innerHTML =
                "";


            if (query.length < 2) {
                return;
            }


            try {

                const response =
                    await fetch(
                        `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(query)}&count=7&language=en&format=json&countryCode=IN`
                    );


                const data =
                    await response.json();


                if (
                    !data.results ||
                    !data.results.length
                ) {
                    return;
                }


                data.results.forEach(
                    city => {

                        const item =
                            document.createElement(
                                "div"
                            );


                        item.className =
                            "suggestion-item";


                        const state =
                            city.admin1
                                ? `, ${city.admin1}`
                                : "";


                        item.textContent =
                            `${city.name}${state}`;


                        item.addEventListener(
                            "click",
                            function() {

                                cityInput.value =
                                    city.name;

                                hideSuggestions();

                                searchWeather();
                            }
                        );


                        suggestionBox.appendChild(
                            item
                        );
                    }
                );


            } catch (error) {

                console.error(
                    "Autocomplete error:",
                    error
                );
            }
        }
    );


    cityInput.addEventListener(
        "keydown",
        function(event) {

            if (
                event.key === "Enter"
            ) {

                event.preventDefault();

                searchWeather();
            }
        }
    );
}


// ======================================
// HIDE SUGGESTIONS
// ======================================

function hideSuggestions() {

    if (suggestionBox) {

        suggestionBox.innerHTML =
            "";
    }
}


document.addEventListener(
    "click",
    function(event) {

        if (
            cityInput &&
            suggestionBox &&
            !cityInput.parentElement.contains(
                event.target
            )
        ) {

            hideSuggestions();
        }
    }
);


// ======================================
// LOADING STATE
// ======================================

function setLoading(isLoading) {

    const searchButton =
        document.querySelector(
            ".search-box button"
        );


    if (!searchButton) return;


    if (isLoading) {

        searchButton.textContent =
            "Loading...";

        searchButton.disabled =
            true;

    } else {

        searchButton.textContent =
            "Search";

        searchButton.disabled =
            false;
    }
}


// ======================================
// INITIAL WEATHER
// ======================================

loadWeather(
    26.9124,
    75.7873,
    "Jaipur, India"
);
