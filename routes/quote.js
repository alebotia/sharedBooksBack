'use strict'

var express = require('express');
// se carga el controlador como si fuera un modulo
var QuoteController = require('../controllers/quote');
// cargar router de express. Permite la creacion de las rutas
var api = express.Router();

api.get('/quote', QuoteController.getQuote);

module.exports = api;