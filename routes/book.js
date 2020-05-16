'use strict'

var express = require('express');
// se carga el controlador como si fuera un modulo
var BookController = require('../controllers/book');
// cargar router de express. Permite la creacion de las rutas
var api = express.Router();
//	cargar el modulo de midddlewares
var md_auth = require('../middlewares/authenticated');

//	subir ficheros por medio del protocolo HTTP

var multipart = require('connect-multiparty');
//	especificar el directorio donde se van a guardar los ficheros
//  middleware que recoge las variables globales FILES
var md_upload = multipart({ uploadDir: process.env.BOOK_IMAGE_FOLDER});
//	crear ruta 
//	verbo('ruta http de la peticion', metodo que la va a resolver)
//	para utilizar un middleware se pasa como segundo parametro
//  el signo ? indica que el parametro es opcional
//  parameters are specify by /after route. if ? means the parameter is optional
//  do not use the parameters option of postman
//  send the parameter on this way => http://localhost:3977/api/update-user/5cabf5d319d2fa18f41c00e4
api.get('/books/:page/:itemsPerPage?/:word?', md_auth.ensureAuth, BookController.getBooks);
api.get('/book/:id', md_auth.ensureAuth, BookController.getBookById);
// api.get('/booksParameter/:word/:page/:itemsPerPage?', md_auth.ensureAuth, BookController.getBookByParameter);
api.get('/prueba-books', BookController.pruebaBook);
api.get('/borrows/:bookId', md_auth.ensureAuth, BookController.getBorrowsByBookId);
api.get('/active-borrows', md_auth.ensureAuth, BookController.getCurrentBorrows);
api.get('/schedule/:bookId', md_auth.ensureAuth, BookController.scheduleBook);
api.get('/active-schedule', md_auth.ensureAuth, BookController.getCurrentSchedules);

api.post('/book', md_auth.ensureAuth, BookController.saveBook);
api.post('/borrow-book', md_auth.ensureAuth, BookController.borrowBook);

api.get('/return-book/:bookId/:borrowId', md_auth.ensureAuth, BookController.returnBook)
//api.put('/update-user/:id', md_auth.ensureAuth, UserController.updateUser);

//se exporta para que pueda ser utilizado por fuera
module.exports = api;