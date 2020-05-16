// cargar libreria
// mongoose connection string  auth on admin and use another dbs
'use strict'
//	cargar archivo de configuracion para el proyecto
require('dotenv').config();
var mongoose = require('mongoose')
// cargar express -- fichero de carga central
var app = require('./app')
// puerto del servidor
// var port = process.env.PORT || 3977;
// utilizar variables del archivo de configuracion 
var port = process.env.APP_PORT;
// quitar aviso de promesa de mongoose
mongoose.Promise = global.Promise;
// crear conexion y callback
// 'mongodb://'+process.env.DB_USER+':'+process.env.DB_PASS+'@'+process.env.DB_HOST+':'+process.env.DB_PORT+'/'+process.env.DB_NAME+'?authSource=admin'
// 'mongodb+srv://node:node123@sharedbooks-hqedr.mongodb.net/shared_books?retryWrites=true&w=majority'
mongoose.connect('mongodb+srv://'+process.env.DB_USER+':'+process.env.DB_PASS+'@'+process.env.DB_HOST+'/'+process.env.DB_NAME+'?retryWrites=true&w=majority', {useNewUrlParser: true}, (err, res) => {
	if(err){
		throw err;
	    }
	else{
	// console.log("conectadoooooo");
	//levantar la escucha de express
	app.listen(port, function(){
		console.log("servidor corriendo y escuchando: "+port)
	})
}
});