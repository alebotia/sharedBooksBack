'use strict'
// todas las peticiones deben devolver una key llamada message

//	primero importar modulos de node y luego los servicios que se crean 

//librerias para poder acceder a rutas dentro del fs
var fs = require('fs');
var path = require('path');

// constantes generales
const { onlyAdminError, notAllFieldsError, serverError } = require('../utilities/constantes')

// constantes de agregaciones de mongo 

const { activeSchedule, activeBorrowsQuery} = require('../utilities/constantes')

// constantes utilizadas en libros
const { sameBookError }  = require('../utilities/constantes')

// utilidades generales 
const { isAdminUser, normalizeArray } = require('../utilities/helpers')

//	libreria para paginacion de mongoose
var mongoosePaginate = require('mongoose-pagination');

//  guardar contraseñas encriptadas en la BD
var bcrypt = require('bcrypt-nodejs');

//  cargar modulo del modelo books
var Book = require ('../models/book');

//  habilitar de forma global este objeto para crear objectId en las consultas
var ObjectId = require('mongoose').Types.ObjectId; 

//	accion del controlador
//	peticion, respuesta
function pruebaBook(req, res){
	res.status(200).send({
		message: 'probando accion de controlador de usuarios'
	});
}

// se esperan que por la URL lleguen tres parametros
// /page/itemPerPage/word
function getBooks(req, res){
	let page = parseInt(req.params.page);
	//validar si el parametro itemsPerPage viene
	let itemsPerPage = parseInt(process.env.BOOKS_PER_PAGE);
	if(req.params.itemsPerPage){
		itemsPerPage = parseInt(req.params.itemsPerPage);
	}
	//	mongodb sort limit and skip => sort title, skipe page , limit itemsPerPage 
	//hacer paginacion
	//La funcion de callback especifica tres parametros
	//error, array de documentos retornados, numero de items total que retorna la consulta
	let projectionFields = '_id numberOfCopies title authors genres idiom numberOfBorrows borrows location schedule'
	let query = { };
	if (req.params.word != undefined ){
		query = { $or: [ { title :  {$regex: `.*${req.params.word}.*`, $options: 'i'}},
					   { authors: {$regex: `.*${req.params.word}.*`, $options: 'i'}},
					   { genres:  {$regex: `.*${req.params.word}.*`, $options: 'i'}} ] }
	}

	Book.find( query, projectionFields ).sort('title').paginate(page, itemsPerPage,(err, books, total) => {
		if(err){
			console.warn(err);
			res.status(500).send({message: 'Error interno ... '});
		}else {
			if(!books){
				res.status(404).send({message: 'no hay books '});
			}else{
				return res.status(200).send({
					totalItems: total,
					pageCount: Math.ceil(total/itemsPerPage),
					currentPage: page,
					perPage: itemsPerPage,
					result: books.map((book) => {
						
						// console.log('libros encontrado ', book)
						const _id = book._id;
						const numberOfCopies = book.numberOfCopies;
						const title = book.title;
						const authors = book.authors;
						const genres = book.genres;
						const idiom = book.idiom;
						const numberOfBorrows = book.numberOfBorrows;
						const location = book.location;
						const schedule = book.schedule;

						const currentBorrows = book.borrows.filter((borrow, index) => {
													// console.log('current borrow is ' + index+ ' values '+ borrow)
												    if(borrow.activeBorrow != undefined && borrow.activeBorrow === true){
												    	// console.log('borrow inactivo')
														return borrow;
													}
												})
						const activeBorrowCount= currentBorrows.length
						
						return {_id,
								numberOfCopies,
							  	title,
							  	authors,
							  	genres,
							  	idiom,
							  	numberOfBorrows,
							    location,
							    activeBorrowCount,
							    schedule
							  }

					})
				});
			}
		}

	});
};

// consulta libro por identificado pasado como parametro
function getBookById(req, res){
	var bookId = req.params.id;
	Book.findById(bookId, (err, book)=>{
		if(err){
			res.status(500).send({message: 'error al consultar el libro ... '});
		}else{
			if(!book){
				res.status(404).send({message: 'libro no encontrado '});
			}else{
				res.status(200).send({book});	
			}
		}

	});
};


// los autores y generos deben venir separados por coma,
// antes de guardar los elementos no deben tener espacios
async function saveBook(req, res){
	// el valor req.user es adicionado por el middleware de auth
	// desencripta el token del usuario
	// console.log(typeof(isAdminUser))
	// validar si el usuario puede hacer la accion
	if(!isAdminUser(req.user.role)){
		return res.status(500).send({ message: onlyAdminError });
	}

	let book = new Book();
	let params = req.body;

	// console.log(params.numberOfCopies, params.title, params.authors, params.genres, params.idiom)

	// valida que todos los campos tengan valor
	if (params.numberOfCopies === '' || params.numberOfCopies == undefined ||
	    params.title === '' || params.title == undefined ||
	    params.authors === '' || params.authors == undefined ||
	    params.genres === '' || params.genres == undefined ||
	    params.idiom === '' || params.idiom	 == undefined ||
	    params.location === '' || params.location	 == undefined ){
		return res.status(500).send({message: notAllFieldsError });
	}

	// se quitan los espacios y se baja a minusculas
	let authorTrimedArray=  normalizeArray(params.authors.split(','))
	
	// funcion asyncrona que valida si existe el libro en la base de datos
	const isNewBook = await checkBookByAuthorOrTitle(authorTrimedArray, params.title)

	if(!isNewBook){
		return res.status(403).send({ message: sameBookError});
	}else {
		// recupera informacion del BODY
		book.numberOfCopies = parseInt(params.numberOfCopies); 
		book.title = params.title.toLowerCase().trim();
		book.authors = authorTrimedArray;
		book.genres = normalizeArray(params.genres.split(','));
		book.idiom = params.idiom.toLowerCase().trim();
		book.location = params.location.toLowerCase().trim();

		book.save((err, bookStored) => {
			if(err){
				// console.log("error at the moment of save book", err)
				return res.status(500).send({message: serverError });
			}else{
				if(!bookStored){
					return res.status(404).send({message: 'El libro no ha sido guardado ...'});
				}else{
					return res.status(200).send({book: bookStored, message: 'Libro Almacenado exitosamente !!'});
				}
			}
		});
	}
};

// valida al moemento de ingresar un nuevo libro al sistema 
// que no exista uno igual

// SE DEBE VALIDAR UNA BANDERA QUE INDIQUE CUALES LIBROS ESTAN ACTIVOS
async function checkBookByAuthorOrTitle(authorPa, titlePa){		

	let isNewBook = true;
	let index;
	for (index = 0; index < authorPa.length; index++) {
		// console.log('consultando autor: ', `^${authorPa[index]}`)
	    const numberOfBooks	= await Book.find({ $and: [ { title :  {$regex: `^${titlePa}`, $options: 'i'  } },
	   			                                        { authors: {$regex: `^${authorPa[index]}`, $options: 'i' } } ] } ).countDocuments()

	    // console.log('number of items: ', numberOfBooks)
	    if (numberOfBooks !== 0){
	    	// console.log('ya existe un libro como este')
	    	isNewBook = false
	    	break;
	    }		
	}
	return isNewBook;
};

// recibe parametro en la URL y lo compara contra campos
function getBookByParameter(req, res){
	let param = req.params.word;	
	Book.find({ $or: [ { title :  {$regex: `.*${param}.*`, $options: 'i'}},
					   { authors: {$regex: `.*${param}.*`, $options: 'i'}},
					   { genres:  {$regex: `.*${param}.*`, $options: 'i'}} ] },
			 (err, items) => {
			 	// console.log('elementos retornado ', items)
			 	// console.log('elementos tamaño ', items.length)	
				if(err){
					res.status(500).send({message: 'Error interno al retornar libros ... '});
				}else{
					if(!items){
						res.status(404).send({message: 'No se han encontrado libros que cumplan esta caracteristicas ... '});
					}else{
						res.status(200).send({totalItems: items.length, book: items});
					}
				}
			 });
};

// para esta utilidad se adiciona un documento al arreglo 
// cuando se vaya a retornar el prestamo solo se modifica el documento en cuestion 
// para la actualizacion referirse a mongodb add new document to array -- https://docs.mongodb.com/manual/reference/operator/update/positional/

// cuando un libro se presta, se un nuevo documento dentro del arreglo borrows
// BORROWNUMBER: es el numero de prestamo de ese libro, en la llave numberOfBorrows del libro se lleva el conteo de cual a sido el ultimo prestamo
// USER: objectId del usuario al que se le presto el libro
// STARTDATE: fecha del dia en el que se  presto el libro
// ENDDATE: fecha que se selecciono para que el libro sea retornado
// ACTIVEBORROW: bandera que indica si el prestamo es o no activo 
async function borrowBook(req, res){
	let params = req.body;
	// verificar que todos los parametros vengan
	// console.log('params in borrow book', params)
	if( params.bookId === '' || params.bookId == undefined ||
		params.userId === '' || params.userId == undefined ||
		params.endDate === '' || params.endDate == undefined ){
		return res.status(403).send({ message: 'Por favor ingresar los campos requeridos para prestar libro'  })
	}
	let startDate = new Date();
	let endDate = new Date(params.endDate);

	// verificar que la fecha de entrega sea mayor a la fecha actual
	if (startDate >= endDate){
		return res.status(403).send({ message: 'la fecha de entrega del libro debe ser mayor a la fecha actual'  })
	}

	// el valor de NUMBEROFBORROWS aumenta en 1
	// se adiciona un nuevo elemento al array BORROWS
	// el valor BORROWNUMBER del nuevo doc es igual a numberOfBorrows
	let bookToUpdate = await Book.findById(params.bookId);
	// console.log('the book to update is ', bookToUpdate)
	
	// consulta por medio de mongoose
	let userObjectId = new ObjectId(params.userId); 
	
	let newBorrow = {
		user: userObjectId,
		startDate,
		endDate,
		activeBorrow: true 
	}

	bookToUpdate.borrows.push(newBorrow);
	let answer = await bookToUpdate.save();

	// console.log('answer is ', answer)
	// adicionar nuevo documento dentro de arreglo 
	// https://stackoverflow.com/questions/33049707/push-items-into-mongo-array-via-mongoose

	return res.status(200).send({message: 'Libro prestado exitosamente'})
}

// retorna un arreglo con los prestamos activos para un libro
async function getBorrowsByBookId(req, res){
	let bookId = req.params.bookId;
	if(bookId == undefined || bookId === ''){
		return res.status(403).send( { message: 'no se ha enviado el parametro del libro a buscar' } )
	}

	let book = await Book.findById(bookId);
	// console.log('book is ', book )

	if(book.borrows == undefined ){
		return res.status(403).send( { message: 'Este libro no tiene prestamos activos' } )
	}

	// filtra los prestamos que estan activos
	book.borrows = book.borrows.filter((borrow) => {
							if(borrow.activeBorrow === true){
								return borrow;
							}

						})
	// console.log('filter borrows are ', book.borrows)
	if(book.borrows.length === 0){
		return res.status(403).send( { message: 'Este libro no tiene prestamos activos' } )
	}	

	let populate = await book.populate('borrows.user', '_id name surname documentNumber').execPopulate();

	// console.log('populate borrows are ', populate)	
	return res.status(200).send( { message: 'satisfactorio', activeBorrows: populate.borrows } )
}

// dado un arreglo de prestamos, retorna la posicion en la que se encuentra el documento que se debe actualizar 
function getPositionToUpdate(borrowArray, borrowId){
	let index = 0;
	for(index; index < borrowArray.length ; index ++){
		if(borrowArray[index]._id == borrowId ){	
			break;
		}
	}
	if(index < borrowArray.length){
		// console.log('index where id is ', index)
		return index
	}else{
		return -1
	}
}

async function returnBook(req, res){
	let bookId = req.params.bookId;
	let borrowId = req.params.borrowId;

	// console.log('bookid ', bookId)
	// console.log('borrowId ', borrowId)

	if(bookId == undefined || bookId === '' ||
	   borrowId == undefined || borrowId === ''){
		return res.status(403).send({ message: 'Por favor ingresar los campos requeridos para prestar libro'} )
	}

	// update borrow 
	bookId  = new ObjectId(bookId); 
	borrowId  = new ObjectId(borrowId); 
	const returnDate = new Date();

	let bookToUpdate = await Book.findById(bookId);
	// console.log (bookToUpdate)

	// en que indice del arreglo se encuentra el documento a actualizar ??
	// cuando se van a comparar identificadores en javascript hacerlo como viene, como si fuera string 
	// cuando se opera en moongose hacerlo con objetos del tipo id
	const borrowIndex = getPositionToUpdate(bookToUpdate.borrows, req.params.borrowId)
	if( borrowIndex !== -1 ){
		bookToUpdate.borrows[borrowIndex].returnDate = returnDate;
		bookToUpdate.borrows[borrowIndex].activeBorrow = false;
		bookToUpdate.save()
		return res.status(200).send({ message: 'Se ha recibido el libro satisfactoriamente.'} )
	}else{
		return res.status(403).send({ message: 'No se encontro el prestamo en la base de datos.'} )
	}
}

// ejecuta la agregacion definida en las constantes con nombre ACTIVEBORROWSQUERY

async function getCurrentBorrows(req, res){
	try{
		let activeBorrows = await Book.aggregate(activeBorrowsQuery)
		// console.log(activeBorrows)
		return res.status(200).send({message: 'Exito al consultar prestamos activos: ', activeBorrows})
	}catch(error){
		// console.log('error returning current borrows', error)
		return res.status(403).send({message: 'Error al momento de consultar ' });
	}
}

async function scheduleBook(req, res){

	const userId = req.user.sub;
	const bookId = req.params.bookId;

	// console.log('user id ', userId)
	// console.log('bookid ', bookId)
	try {
		let bookToSchedule = await Book.findById(bookId);
	
		const currentDate = new Date();
		bookToSchedule.schedule.push({
			user: userId,
			startDate: currentDate,
			activeSchedule: true
		 })
	
		let answer = await bookToSchedule.save();
	
		// console.log('schedule answer is ', answer)
	
		return res.status(200).send({message: 'Libro agendado exitosamente por el usuario ' + req.user.name + ' ' + req.user.surname })
	}catch(error){
		console.warn('error schedule Book ', error)
		return res.status(403).send({message: 'Error al momento de agendar ' });
	}
}

async function getCurrentSchedules(req, res){
	try{
		let activeSchedules = await Book.aggregate(activeSchedule)
		// console.log(activeSchedules)
		return res.status(200).send({message: 'Exito al consultar agendamientos activos: ', activeSchedules})
	}catch(error){
		// console.log('error getting active schedules', error)
		return res.status(403).send({message: 'Error al momento de consultar ' });
	}
}


//sacar un fichero del servidor

// utilizar accion por fuera del fichero desde una ruta
// exportar cada metodo del controlador dentro del modulo creado
module.exports = {
	pruebaBook,
	getBooks,
	getBookById,
	saveBook,
	getBookByParameter,
	borrowBook,
	getBorrowsByBookId,
	returnBook,
	getCurrentBorrows,
	scheduleBook,
	getCurrentSchedules
}