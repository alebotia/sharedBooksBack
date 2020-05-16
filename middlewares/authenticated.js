'use strict'
//	este modulo funciona como un middleware para verificar el token del usuario
// importar el servicio de jwt para la decodificion
var jwt = require('../services/jwt');

//comprobar datos del token
function ensureAuth (req, res, next){
	//	recoger la cabezera de auth
	if(!req.headers.authorization){
	return res.status(403).send({message: 'la peticion no tiene cabezera de auth ... '});
	}

	//	el token llega dentro de la cabezera de auth
	//  con el replace eliminar todas las  comillas que hayan dentro del string del token
	var token = req.headers.authorization.replace(/['"]+/g, '');

	//	decodificar el token	
	try{
		var payload = jwt.decodeToken(token);	
		if(payload == null){
		res.status(401).send({message: 'el token ha expirado ... '});	
		}
	}
	//	si ocurre cualquier ex el token no es valido
	catch(ex){
		console.log('token no valido',ex);
		return res.status(404).send({message: 'token no valido ... '});
	}

	//	asignar el usuario decodificado a la peticion
	//	para que los siguientes metodos puedan utlizarlo
	req.user = payload;

	// que hace el next
	// como es el segundo parametro dentro de la ruta, cuando le de next pasa a buscar el siguiente metodo
	next();
};

module.exports = {
	ensureAuth
};