'use strict'
// constantes generales
const { onlyAdminError, notAllFieldsError, serverError } = require('../utilities/constantes')

// constantes modulo Users
const { sameEmailError, sameDocumentError } = require('../utilities/constantes')

// utilidades generales 
const { isAdminUser, normalizeArray } = require('../utilities/helpers')

//	primero importar modulos de node y luego los servicios que se crean 
//librerias para poder acceder a rutas dentro del fs
var fs = require('fs');
var path = require('path');

//  guardar contraseñas encriptadas en la BD
var bcrypt = require('bcrypt-nodejs');

//  cargar modulo del modelo de usuario y libros
var User = require ('../models/user');

//  cargar modulo de Libros
var Book = require ('../models/book');

//	cargar modulo de servicios de JWT
var jwt = require('../services/jwt');

// constante con el maximo numero de libros que se pueden prestar
const maxBooksPerUser = process.env.MAX_AVAILABLE_BORROWS || 1

//	accion del controlador
//	peticion, respuesta
function isTokenValid(req, res){
	// console.log('req user', req.user)
	res.status(200).send({
		message: 'token es valido'
	});
}

// verificar que no exista un usuario con el mismo correo 
async function checkNoEmailUsed(email){
	let isNewEmail = true;		
    const numberOfEmails = await User.find( { email :  {$regex: `^${email}`, $options: 'i'  } } ).countDocuments()

    // console.log('number of items: ', numberOfBooks)
    if (numberOfEmails !== 0){
    	// console.log('ya existe un libro como este')
    	isNewEmail = false
    }	
	return isNewEmail;
}

// verificar que no exista un usuario con el mismo numero de documento 
async function checkNoDocumentUser(documentNumberParam){
	// console.log('docuement number param', documentNumberParam)
	let isNewDocument = true;		
    const numberOfDocuments = await User.find( { documentNumber :  {$eq: parseInt(documentNumberParam)} } ).countDocuments()

    if (numberOfDocuments !== 0){
    	// console.log('ya existe un un usuario con este documento')
    	isNewDocument = false
    }	
	return isNewDocument;
}

// dos tipos de roles ROLE_ADMIN y ROLE_USER
// el admin es el unico que puede borrar modificar y crear libros o usuarios
async function saveUser(req, res){
	// instanciar entidad usuario para acceder a propiedades.
	var user = new User();

	// recoger valores de la peticion POST que se encuentran en el BODY
	var params = req.body;

	//	para hacer debug
	// console.log(params);

	// valida que todos los campos tengan valor
	if (params.name === '' || params.name == undefined ||
	    params.surname === '' || params.surname == undefined ||
	    params.email === '' || params.email == undefined ||
	    params.password === '' || params.password == undefined ||
	    params.dob === '' || params.dob == undefined ||
	    params.documentNumber === '' || params.documentNumber == undefined ||
	    params.phoneNumber === '' || params.phoneNumber == undefined ||
	    params.termsConditions === '' || params.termsConditions == undefined){
		return res.status(403).send({message: notAllFieldsError });
	}

	// verificar que no exista un usario con el mismo correo
	const isNewEmail = await checkNoEmailUsed(params.email);

	if(!isNewEmail){
		return res.status(403).send({message: sameEmailError})
	}

	const isNewDocument = await checkNoDocumentUser(params.documentNumber)

	if(!isNewDocument){
		return res.status(403).send({message: sameDocumentError})
	}
	else {
	// console.log('entra a guardar')
		// asigna lo que llega a los atributos de un objeto del tipo user
		// moongose hace el cast automatico de la fecha si viene con el formato correcto
		user.name = params.name.trim();
		user.surname = params.surname.trim();
		user.email = params.email.trim().toLowerCase();
		user.dob = params.dob.trim();
		user.documentNumber = params.documentNumber.trim();
		user.phoneNumber = params.phoneNumber.trim();
		user.tyc= params.termsConditions;
		user.role = 'ROLE_USER';
		user.image = 'null';
		//	console.log(user);

		//	encriptar la contraseña
		//	callback con la contraseña encriptada 
		bcrypt.hash(params.password, null, null, function(err, hash){
			user.password = hash;
			//	guardar el usuario con el metodo save de mongoose, genera callback // utilizar promises
			user.save((err, userStored) => {
				if(err){
					res.status(500).send({message: serverError});
				}else{
					if(!userStored){
						res.status(404).send({message: 'No se registro el usuario ... '});		
					}else{
						res.status(200).send({message: 'Usuario ' + userStored.email + ' creado exitosamente' });
					}
				}
			});

		});
	}
};

function loginUser(req, res){
	var params = req.body;

	var email = params.email;
	var password = params.password;
	
	// console.log('login user', email, password)

	if(email != null && password != null){


	User.findOne({email: email.toLowerCase()}, (err, user) => {
		if(err){
			res.status(500).send({message: 'Error en la peticion ... '});
		}
		else {
			if(!user){
				res.status(404).send({message: 'El usuario ingresado no existe ... '});
			}else{
				bcrypt.compare(password, user.password, (err, chk) => {
					if(chk){
						//	devolver usuario
						if(params.gethash){
						//	devolver JWT
							res.status(200).send({
								token: jwt.createToken(user),
								message: 'autenticado correctamente',
								role: user.role
							});
						}else{
							res.status(200).send({user, message: 'autenticado correctamente'});
						}
					}else{
						res.status(404).send({message: 'No se ha podido autenticar el usuario. Intente nuevamente.'});		
					}

				});
			}
		}

	});
	}else{
		res.status(404).send({message: 'ingrese usuario y contraseña ... '});		
	}
};

function updateUser(req, res){	
	//	identificador del usuario como PARAMETRO (llega en la URL)
	var userId = req.params.id;
	//	sacar del BODY de la peticion los nuevos datos a actualizar
	//	objeto JSON con las llaves que se van a actualizar del documento correspondiente
	var update = req.body;

	//use findByIdAndUpdate method of mongoose
	User.findByIdAndUpdate(userId, update, (err, userUdated) => {
		if(err){
			res.status(500).send({message: 'Error al actualizar el usuario ... '});		
		}else{
			if(!userUdated){
			res.status(404).send({message: 'No se ha podido actualiza el usuario ... '});				
			}else{
				// se retorna el usuario con los datos ANTERIORES a la actualizacion
			res.status(404).send({user: userUdated});			
			}
		}
	});
};

//	como hacer para subir el archivo y borrar el que se encuentra en el FS asociado
function uploadImage(req, res){
	//user _id como PARAMETRO de la peticion
	var userId = req.params.id;
	var file_name = 'No subido...';
	//connect-multiparty variales super globales FILES

	if(req.files){
		// req.file es porque esta envia la informacion con el content-type: form-data
		// file_path:coge el parametro uploadDir y adiciona el nombre de la imagen como va a quedar en el server.
		var file_path = req.files.image.path;
		//  uso de scape delimiter
		var file_split = file_path.split('\\');
		//console.log(file_path);
		//console.log(file_split); //array con 3 elementos
		var file_name = file_split[2];
		//	obtener extension para validar
		var ext_split = file_name.split('\.');
		var file_ext = ext_split[1];

		if(file_ext == 'png' || file_ext == 'jpg' || file_ext == 'jpge' || file_ext == 'gif'){

			User.findByIdAndUpdate(userId, {image: file_name}, (err, userUpdate) => {
				if(!userUpdate){
					res.status(404).send({message: 'No se ha podido actualiza el usuario ... '});				
				}else{
					// se retorna el usuario con los datos ANTERIORES a la actualizacion
					res.status(404).send({user: userUpdate});			
				}
			});
		}
	}else{
		res.status(404).send({message: 'No se ha subido imagen ... '});		
	}

}

function getImageFile(req, res){
	// recoger parametro. Nombre del archivo
	var imageFile = req.params.imageFile;
	var pathFile = process.env.USER_IMAGE_FOLDER+'/'+imageFile;
	//comprobar si existe un archivo	
	//console.log('la ruta del archivo es: '+pathFile);
	fs.exists(pathFile, (exists) => {

		if(exists){
			res.sendFile(path.resolve(pathFile));		
		}else{
			res.status(404).send({message: 'No se ha subido imagen ... '});		
		}
	});
}

function getUserById(req, res){
		var userId = req.params.id;
		//console.log(email)

		User.findById(userId, (err, user) => {
			if(err){
				res.status(500).send({message: 'Error en la peticion ... '});
			}
			else {
				if(!user){
					res.status(404).send({message: 'El usuario no existe ... '});
				}else{
					res.status(200).send({user});
				}
			}

		});	
};

async function validateUser(req, res){
	if (req.params.documentNumber === '' || req.params.documentNumber == undefined ||
		req.params.bookId === '' || req.params.bookId == undefined ){
		return res.status(500).send({ message: 'Se requiere el documento del usuario y el identificador del libro para verificar el prestamo'  })
	}

	let bookId = req.params.bookId;
	let documentNumber = req.params.documentNumber;
	// console.log('document to validate ', documentNumber)
	let user = await User.find({ documentNumber: { $eq: documentNumber} });
	// console.log('usuario encontrado ', user)

	// VALIDAR que el numero de documento exista
	let numberOfRows = user.length;
	if (numberOfRows === 0){
		return res.status(403).send({message: 'No se encuentran usuarios con el numero de documento '+ documentNumber +' por favor validar el numero ingresado' });
	}else if (numberOfRows > 1){
		return res.status(403).send({message: 'Se encontraron mas de un usuario con el numero de documento '+ documentNumber +' por favor validar el numero ingresado' });
	}

	let currentUser = user[0]
	let ObjectId = require('mongoose').Types.ObjectId; 
	let userId = new ObjectId(currentUser._id);

	// VALIDAR QUE NO VAYA A SACAR EL MISMO LIBRO DOS VECES CUANDO TIENE UNO DE ESOS LIBROS PRESTADOS
	// console.log('book id ', bookId)
	// console.log('user id ', userId)

	let query = { $and: [ 
						   { _id: {$eq: new ObjectId(bookId) } },
						   { borrows: { $elemMatch: { user: { $eq: userId },
					   							      activeBorrow: true } } } 
					   	] } 
	let bookToBorrow = await Book.find( query )
	// console.log('current borrow', bookToBorrow)

	if (bookToBorrow.length !== 0 ){
		return res.status(403).send({message: 'El usuario tiene prestado este libro, no se pueden prestar dos ejemplares al tiempo'})
	}

	// VALIDAR QUE NO TENGA MAS LIBROS PRESTADOS QUE EL VALOR INDICADO EN MAX_AVAILABLE_BORROWS
	query = { borrows: { $elemMatch: { 'user': { $eq: userId } ,  'activeBorrow': true } } }; 
	let booksBorrows = await Book.find(query)
	// console.log('books borrow ', booksBorrows)
	
	let numberOfBorrows = booksBorrows.length
	// console.log('numberOfRows', numberOfRows)
	// console.log('maxBooksPerUser', maxBooksPerUser)
	if (numberOfBorrows >= maxBooksPerUser ){
		return res.status(403).send({message: 'el usuario: ' + currentUser.name + ' ' + currentUser.surname + ' tiene ' + numberOfBorrows + ' libros prestados. Para prestar un nuevo libro debe cerrar al menos un prestamo.' });
	}else {
		return res.status(200).send({message: 'usuario: ' + currentUser.name + ' ' + currentUser.surname + ' es valido', userId: currentUser._id});
	}
}

async function getUsers(req, res){

	let projectionFields = '_id name surname email dob phoneNumber documentNumber'
	try{
		let users = await User.find({}, projectionFields)
		users = users.map((user, index) => {			
			let date = new Date(user.dob)
			let dobDate = date.toLocaleDateString('en-GB')
			return {
				_id: user._id,
				name: user.name,
				surname: user.surname,
				email: user.email,
				phoneNumber: user.phoneNumber,
				documentNumber: user.documentNumber,
				dob: dobDate }
		})
		res.status(200).send({message: 'okay', users})
	}catch(error){
		// console.log('error returning Users', error)
		return res.status(403).send({message: 'Error al momento de consultar ' });
	}	
}

// este metodo recibe
// _id
// name
// surname
// dob
// documentNumber
// phoneNumber
async function updateUserById(req, res){
	// recoger valores de la peticion POST que se encuentran en el BODY
	var params = req.body;

	//	para hacer debug
	// console.log(params);

	// valida que todos los campos tengan valor
	if (params._id === '' || params._id == undefined ||
		params.name === '' || params.name == undefined ||
	    params.surname === '' || params.surname == undefined ||
	    params.phoneNumber === '' || params.phoneNumber == undefined ||
	    params.dob === '' || params.dob == undefined 
	     ){
		return res.status(403).send({message: notAllFieldsError });
	}
	try{
		let user = await User.findById(params._id)

		user.name = params.name.trim();
		user.surname = params.surname.trim();
		user.phoneNumber = params.phoneNumber.trim();
		user.dob = params.dob.trim();
		// user.documentNumber = params.documentNumber.trim();

		let userUpdate = await user.save();

		// console.log('answer is ', userUpdate)
		// adicionar nuevo documento dentro de arreglo 
		// https://stackoverflow.com/questions/33049707/push-items-into-mongo-array-via-mongoose
		res.status(200).send({message: 'Usuario ' + userUpdate.email + ' Actualizado exitosamente' });	
	}catch(error){
		console.warn('erro at the moment of update user', error)
		res.status(404).send({message: 'No se ha podido guardar el usuario ... '});		
	}



}

//sacar un fichero del servidor

// utilizar accion por fuera del fichero desde una ruta
// exportar cada metodo del controlador dentro del modulo creado
module.exports = {
	isTokenValid,
	saveUser,
	loginUser,
	updateUser,
	uploadImage,
	getImageFile,
	getUserById,
	validateUser,
	getUsers,
	updateUserById
}