'use strict'

//  guardar contraseñas encriptadas en la BD
var bcrypt = require('bcrypt-nodejs');

//  cargar modulo del modelo de usuario y libros
var Quote = require ('../models/quote');

// every time the page is load the header will get a random quote
async function getQuote(req, res){
	console.log('llega a quote')
	let quote = await Quote.aggregate([
					  {
					    '$sample': {
					      'size': 1
					    }
					  }
					])

	console.log(quote)

	res.status(200).send({
		message: 'exito',
		quote
	});
}

module.exports = {
	getQuote
}