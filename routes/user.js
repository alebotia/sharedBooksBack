'use strict'

var express = require('express');
// se carga el controlador como si fuera un modulo
var UserController = require('../controllers/user');
// cargar router de express. Permite la creacion de las rutas
var api = express.Router();
//	cargar el modulo de midddlewares
var md_auth = require('../middlewares/authenticated');

//	subir ficheros por medio del protocolo HTTP

var multipart = require('connect-multiparty');
//	especificar el directorio donde se van a guardar los ficheros
//  middleware que recoge las variables globales FILES
var md_upload = multipart({ uploadDir: process.env.USER_IMAGE_FOLDER});
//	crear ruta 
//	verbo('ruta http de la peticion', metodo que la va a resolver)
//	para utilizar un middleware se pasa como segundo parametro
//	how to DECALRE routes on express
api.get('/isTokenValid', md_auth.ensureAuth, UserController.isTokenValid);
api.post('/register', UserController.saveUser);
api.post('/login', UserController.loginUser);
//parameters are specify by /after route. if ? means the parameter is optional
//not use the parameters option of postman
//send the parameter on this way => http://localhost:3977/api/update-user/5cabf5d319d2fa18f41c00e4
api.post('/update-user', md_auth.ensureAuth, UserController.updateUserById);
api.post('/update-image-user/:id', [md_auth.ensureAuth, md_upload], UserController.uploadImage);
api.get('/get-image-user/:imageFile', UserController.getImageFile);

api.get('/validateUser/:documentNumber/:bookId', md_auth.ensureAuth, UserController.validateUser);
api.get('/get-user/:id', md_auth.ensureAuth, UserController.getUserById);
api.get('/users', md_auth.ensureAuth, UserController.getUsers);
api.get('/pruebas', UserController.isTokenValid);
//se exporta para que pueda ser utilizado por fuera
module.exports = api;