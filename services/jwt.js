'use strict'

var jwt = require('jwt-simple');
var moment = require('moment');
//caracter que se utiliza para la codificacion de la informacion
var secret = process.env.JWT_SECRET;

//	funcion para crear token del usuario que realiza el login
function createToken (user){
	//	codifica el usuario
	//	se transporta en cada peticion http
	//	crear un objeto con las propiedades del usuario
	var payload = {
		//  propiedad para guardar el id del usuario
		sub: user._id,
		//	empaquetar la informacion que se necesite
		name: user.name,
		surname: user.surname,
		email: user.email,
		role: user.role,
		image: user.image,
		//	fecha de creacion del toquen
		iat: moment().unix,
		// 	fecha de expiracion
		exp: moment().add(parseInt(process.env.TOKEN_DURATION_IN_DAYS), 'days').unix
	};

	//	codificacion de los datos
	return jwt.encode(payload, secret);
};

//	funcion para decodificacion del token 
function decodeToken (token){
	var payload = jwt.decode(token, secret);
	//console.log(payload)
	if(payload.exp <= moment().unix()){
			return null;
		}else{
			return payload;		
		}	
};

// exportart los servicios
module.exports = {
	createToken,
	decodeToken
};