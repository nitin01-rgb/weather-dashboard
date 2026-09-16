function searchWeather() {
    const cityInput = document.getElementById("cityInput");
    const cityName = document.getElementById("cityName");

    const city = cityInput.value.trim();

    if (city === "") {
        alert("Please enter a city name");
        return;
    }

    cityName.textContent = city;
    cityInput.value = "";
}
