// fichero de carga central de express para el enrutamiento de las peticiones
'use strict'

var express = require('express');
var bodyParser = require('body-parser');

//instanciar objeto de express
var app = express();

// cargar TODOS los ficheros de ruta
var user_routes = require('./routes/user');
var book_routes = require('./routes/book');
var quote_routes = require('./routes/quote');

// configuracion de body parser en express
// convierte el body la peticion http en JSON
app.use(bodyParser.urlencoded({extended:false}));
app.use(bodyParser.json());

// configurar cabeceras http
app.use((req, res, next) => {
    res.header('Access-Control-Allow-Origin', '*');
    res.header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS, PUT, DELETE');
    res.header('Access-Control-Allow-Headers', 'Authorization, X-API-KEY, Origin, X-Requested-With, Content-Type, Accept, Access-Control-Allow-Request-Method');
    res.header('Allow', 'GET, POST, OPTIONS, PUT, DELETE');
    next();
});

// rutas base
// antes de realizar cualquier peticion se antepone el segmento /api
// se utiliza como un middleware
app.use('/api', user_routes);
app.use('/api', book_routes);
app.use('/api', quote_routes);

// exportar el modulo para que se pueda usar en otros ficheros
module.exports = app;