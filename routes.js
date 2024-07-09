const router = require('express').Router();
require('dotenv').config();
const fetch = require('node-fetch');

// Funzione per recuperare l'immagine da Unsplash
async function getImage(city, key) {
  const random = Math.floor(Math.random() * 10);
  const unsplashUrl = `https://api.unsplash.com/search/photos?query=${city}&client_id=${key}`;
  let backgroundLink;
  try {
    const response = await fetch(unsplashUrl);
    if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
    const data = await response.json();
    if (data.results.length > 0) {
      backgroundLink = data.results[random].urls.regular;
    } else {
      backgroundLink = "/img/landscape.webp";
    }
  } catch (err) {
    console.error("Errore con il caricamento dello sfondo:", err);
    backgroundLink = "/img/landscape.webp";
  }
  return backgroundLink;
}

// Funzione per recuperare l'indice di qualità dell'aria da OpenWeatherMap
async function getAQ(lat, lon, key) {
  const aqiUrl = `https://api.openweathermap.org/data/2.5/air_pollution?lat=${lat}&lon=${lon}&appid=${key}`;
  let aq;
  try {
    const response = await fetch(aqiUrl);
    console.log('AQI API response status:', response.status); // Log dello status della risposta
    if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
    const data = await response.json();
    console.log('AQI API response data:', data); // Log dei dati della risposta
    aq = data.list[0].main.aqi;
  } catch (err) {
    console.error("Errore nella chiamata fetch API per AIR QUALITY INDEX:", err);
    aq = 3; // Valore fittizio per la qualità dell'aria di fallback
  }
  return aq;
}


// Rotte
router.get('/', (req, res) => {
  res.render("index");
});

router.get('/meteo', async (req, res) => {
  const ipAddr = req.headers["x-forwarded-for"] || req.connection.remoteAddress;
  const ipUrl = `http://ip-api.com/json/`;
  let city, lat, lon;
  try {
    const ipResponse = await fetch(ipUrl);
    console.log('IP API response status:', ipResponse.status); // Log dello status della risposta
    if (!ipResponse.ok) throw new Error(`HTTP error! status: ${ipResponse.status}`);
    const ipData = await ipResponse.json();
    console.log('IP API response data:', ipData); // Log dei dati della risposta
    city = ipData.city;
    lat = ipData.lat;
    lon = ipData.lon;
  } catch (err) {
    console.error("Errore chiamata GET e recupero location tramite IP:", err);
    res.render("meteo", {
      city: "Errore nel recupero dei dati della posizione",
      temp: null,
      description: null,
      humidity: null,
      wind: null,
      imgsrc: null,
      aq: null,
      min: null,
      max: null,
      imgtoday: null,
      imgtom: null,
      mintom: null,
      maxtom: null,
      imgdayafter: null,
      mindayafter: null,
      maxdayafter: null,
      unsplash: "/img/landscape.webp",
      day1: null,
      day2: null,
      day3: null,
      imgday3: null,
      min3: null,
      max3: null,
      feels: null,
      day4: null,
      imgday4: null,
      min4: null,
      max4: null,
      day5: null,
      imgday5: null,
      min5: null,
      max5: null,
      sunrise: null,
      sunset: null
    });
    return;
  }

  const aq = await getAQ(lat, lon, process.env.API_KEY);
  const backgroundLink = await getImage(city, process.env.UNSPLASH_KEY);

  if (lat && lon && aq !== "Errore!") {
    const weatherUrl = `https://api.openweathermap.org/data/3.0/onecall?lat=${lat}&lon=${lon}&units=metric&exclude=minutely,hourly&appid=${process.env.API_KEY}`;
    try {
      const weatherResponse = await fetch(weatherUrl);
      console.log('Weather API response status:', weatherResponse.status); // Log dello status della risposta
      if (!weatherResponse.ok) throw new Error(`HTTP error! status: ${weatherResponse.status}`);
      const weatherData = await weatherResponse.json();
      console.log('Weather API response data:', weatherData); // Log dei dati della risposta

      const index = ["Good", "Fair", "Moderate", "Poor", "Very poor"];
      const days = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
      const date = new Date();
      const sunrise = new Date(weatherData.current.sunrise * 1000);
      const sunset = new Date(weatherData.current.sunset * 1000);

      res.render('meteo', {
        city: city,
        temp: weatherData.current.temp,
        description: weatherData.current.weather[0].description,
        humidity: weatherData.current.humidity,
        wind: weatherData.current.wind_speed,
        imgsrc: `https://openweathermap.org/img/w/${weatherData.current.weather[0].icon}.png`,
        aq: index[aq - 1],
        min: weatherData.daily[0].temp.min,
        max: weatherData.daily[0].temp.max,
        imgtoday: `https://openweathermap.org/img/w/${weatherData.daily[0].weather[0].icon}.png`,
        imgtom: `https://openweathermap.org/img/w/${weatherData.daily[1].weather[0].icon}.png`,
        mintom: weatherData.daily[1].temp.min,
        maxtom: weatherData.daily[1].temp.max,
        imgdayafter: `https://openweathermap.org/img/w/${weatherData.daily[2].weather[0].icon}.png`,
        mindayafter: weatherData.daily[2].temp.min,
        maxdayafter: weatherData.daily[2].temp.max,
        unsplash: backgroundLink,
        day1: days[(date.getDay() + 1) % 7],
        day2: days[(date.getDay() + 2) % 7],
        day3: days[(date.getDay() + 3) % 7],
        imgday3: `https://openweathermap.org/img/w/${weatherData.daily[3].weather[0].icon}.png`,
        min3: weatherData.daily[3].temp.min,
        max3: weatherData.daily[3].temp.max,
        feels: weatherData.current.feels_like,
        day4: days[(date.getDay() + 4) % 7],
        imgday4: `https://openweathermap.org/img/w/${weatherData.daily[4].weather[0].icon}.png`,
        min4: weatherData.daily[4].temp.min,
        max4: weatherData.daily[4].temp.max,
        day5: days[(date.getDay() + 5) % 7],
        imgday5: `https://openweathermap.org/img/w/${weatherData.daily[5].weather[0].icon}.png`,
        min5: weatherData.daily[5].temp.min,
        max5: weatherData.daily[5].temp.max,
        sunrise: (sunrise.getHours() + 2) + ":" + (sunrise.getMinutes() < 10 ? '0' + sunrise.getMinutes() : sunrise.getMinutes()),
        sunset: (sunset.getHours() + 2) + ":" + (sunset.getMinutes() < 10 ? '0' + sunset.getMinutes() : sunset.getMinutes())
      });
    } catch (err) {
      console.error("Errore nel Weather API Call:", err);
      res.render('meteo', {
        city: "Something went wrong with weather!",
        temp: null,
        description: null,
        humidity: null,
        wind: null,
        imgsrc: null,
        aq: null,
        min: null,
        max: null,
        imgtoday: null,
        imgtom: null,
        mintom: null,
        maxtom: null,
        imgdayafter: null,
        mindayafter: null,
        maxdayafter: null,
        unsplash: "/img/landscape.webp",
        day1: null,
        day2: null,
        day3: null,
        imgday3: null,
        min3: null,
        max3: null,
        feels: null,
        day4: null,
        imgday4: null,
        min4: null,
        max4: null,
        day5: null,
        imgday5: null,
        min5: null,
        max5: null,
        sunrise: null,
        sunset: null
      });
    }
  } else {
    console.error("Errore nelle coordinate o nell'air quality index. CONTROLLARE API");
    res.render('meteo', {
      city: "Errore nel recupero dei dati meteo",
      temp: null,
      description: null,
      humidity: null,
      wind: null,
      imgsrc: null,
      aq: null,
      min: null,
      max: null,
      imgtoday: null,
      imgtom: null,
      mintom: null,
      maxtom: null,
      imgdayafter: null,
      mindayafter: null,
      maxdayafter: null,
      unsplash: "/img/landscape.webp",
      day1: null,
      day2: null,
      day3: null,
      imgday3: null,
      min3: null,
      max3: null,
      feels: null,
      day4: null,
      imgday4: null,
      min4: null,
      max4: null,
      day5: null,
      imgday5: null,
      min5: null,
      max5: null,
      sunrise: null,
      sunset: null
    });
  }
});


router.post('/meteo', async (req, res) => {
  const city = req.body.city;
  const backgroundLink = await getImage(city, process.env.UNSPLASH_KEY);
  let lat, lon;
  const geocodingUrl = `https://api.openweathermap.org/geo/1.0/direct?q=${city}&limit=5&appid=${process.env.API_KEY}`;
  try {
    const geocodingResponse = await fetch(geocodingUrl);
    if (!geocodingResponse.ok) throw new Error(`HTTP error! status: ${geocodingResponse.status}`);
    const geocodingData = await geocodingResponse.json();
    lat = geocodingData[0].lat;
    lon = geocodingData[0].lon;
  } catch (err) {
    console.error("Errore nel Geocoding API Call:", err);
    res.render('meteo', {
      city: "Something went wrong with coordinates!",
      temp: null,
      description: null,
      humidity: null,
      wind: null,
      imgsrc: null,
      aq: null,
      min: null,
      max: null,
      imgtoday: null,
      imgtom: null,
      mintom: null,
      maxtom: null,
      imgdayafter: null,
      mindayafter: null,
      maxdayafter: null,
      unsplash: "/img/landscape.webp",
      day1: null,
      day2: null,
      day3: null,
      imgday3: null,
      min3: null,
      max3: null,
      feels: null,
      day4: null,
      imgday4: null,
      min4: null,
      max4: null,
      day5: null,
      imgday5: null,
      min5: null,
      max5: null,
      sunrise: null,
      sunset: null
    });
    return;
  }

  const aq = await getAQ(lat, lon, process.env.API_KEY);
  if (lat && lon && aq !== "Errore!") {
    const weatherUrl = `https://api.openweathermap.org/data/3.0/onecall?lat=${lat}&lon=${lon}&units=metric&exclude=minutely,hourly&appid=${process.env.API_KEY}`;
    try {
      const weatherResponse = await fetch(weatherUrl);
      if (!weatherResponse.ok) throw new Error(`HTTP error! status: ${weatherResponse.status}`);
      const weatherData = await weatherResponse.json();

      const index = ["Good", "Fair", "Moderate", "Poor", "Very poor"];
      const days = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
      const date = new Date();
      const sunrise = new Date(weatherData.current.sunrise * 1000);
      const sunset = new Date(weatherData.current.sunset * 1000);

      res.render('meteo', {
        city: city,
        temp: weatherData.current.temp,
        description: weatherData.current.weather[0].description,
        humidity: weatherData.current.humidity,
        wind: weatherData.current.wind_speed,
        imgsrc: `https://openweathermap.org/img/w/${weatherData.current.weather[0].icon}.png`,
        aq: index[aq - 1],
        min: weatherData.daily[0].temp.min,
        max: weatherData.daily[0].temp.max,
        imgtoday: `https://openweathermap.org/img/w/${weatherData.daily[0].weather[0].icon}.png`,
        imgtom: `https://openweathermap.org/img/w/${weatherData.daily[1].weather[0].icon}.png`,
        mintom: weatherData.daily[1].temp.min,
        maxtom: weatherData.daily[1].temp.max,
        imgdayafter: `https://openweathermap.org/img/w/${weatherData.daily[2].weather[0].icon}.png`,
        mindayafter: weatherData.daily[2].temp.min,
        maxdayafter: weatherData.daily[2].temp.max,
        unsplash: backgroundLink,
        day1: days[(date.getDay() + 1) % 7],
        day2: days[(date.getDay() + 2) % 7],
        day3: days[(date.getDay() + 3) % 7],
        imgday3: `https://openweathermap.org/img/w/${weatherData.daily[3].weather[0].icon}.png`,
        min3: weatherData.daily[3].temp.min,
        max3: weatherData.daily[3].temp.max,
        feels: weatherData.current.feels_like,
        day4: days[(date.getDay() + 4) % 7],
        imgday4: `https://openweathermap.org/img/w/${weatherData.daily[4].weather[0].icon}.png`,
        min4: weatherData.daily[4].temp.min,
        max4: weatherData.daily[4].temp.max,
        day5: days[(date.getDay() + 5) % 7],
        imgday5: `https://openweathermap.org/img/w/${weatherData.daily[5].weather[0].icon}.png`,
        min5: weatherData.daily[5].temp.min,
        max5: weatherData.daily[5].temp.max,
        sunrise: (sunrise.getHours() + 2) + ":" + (sunrise.getMinutes() < 10 ? '0' + sunrise.getMinutes() : sunrise.getMinutes()),
        sunset: (sunset.getHours() + 2) + ":" + (sunset.getMinutes() < 10 ? '0' + sunset.getMinutes() : sunset.getMinutes())
      });
    } catch (err) {
      console.error("Errore nel Weather API Call:", err);
      res.render('meteo', {
        city: "Something went wrong with weather!",
        temp: null,
        description: null,
        humidity: null,
        wind: null,
        imgsrc: null,
        aq: null,
        min: null,
        max: null,
        imgtoday: null,
        imgtom: null,
        mintom: null,
        maxtom: null,
        imgdayafter: null,
        mindayafter: null,
        maxdayafter: null,
        unsplash: "/img/landscape.webp",
        day1: null,
        day2: null,
        day3: null,
        imgday3: null,
        min3: null,
        max3: null,
        feels: null,
        day4: null,
        imgday4: null,
        min4: null,
        max4: null,
        day5: null,
        imgday5: null,
        min5: null,
        max5: null,
        sunrise: null,
        sunset: null
      });
    }
  } else {
    console.error("Errore nelle coordinate o nell'air quality index. CONTROLLARE API");
    res.render('meteo', {
      city: "Errore nel recupero dei dati meteo",
      temp: null,
      description: null,
      humidity: null,
      wind: null,
      imgsrc: null,
      aq: null,
      min: null,
      max: null,
      imgtoday: null,
      imgtom: null,
      mintom: null,
      maxtom: null,
      imgdayafter: null,
      mindayafter: null,
      maxdayafter: null,
      unsplash: "/img/landscape.webp",
      day1: null,
      day2: null,
      day3: null,
      imgday3: null,
      min3: null,
      max3: null,
      feels: null,
      day4: null,
      imgday4: null,
      min4: null,
      max4: null,
      day5: null,
      imgday5: null,
      min5: null,
      max5: null,
      sunrise: null,
      sunset: null
    });
  }
});

module.exports = router;
