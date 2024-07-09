require('dotenv').config();
const express = require('express');
const Ddos = require('ddos');
const app = express();
var ddos = new Ddos({ burst: 10, limit: 10 });

// Log delle chiavi API per debug
console.log('OpenWeatherMap API Key:', process.env.API_KEY);
console.log('Unsplash API Key:', process.env.UNSPLASH_KEY);

// Import routes
const routes = require('./routes.js');

app.use(express.urlencoded({ extended: true }));
app.use(ddos.express);

// Use view engine
app.set('view engine', 'ejs');

// Middleware route
app.use('/', routes);
app.use(express.static('assets'));

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`Server starting at ${PORT}`);
});
