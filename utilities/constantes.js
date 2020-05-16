// Constantes generales de respuesta
const onlyAdminError = 'Solo un usuario con rol administrativo puede efectuar esta operacion';
const notAllFieldsError = 'Por favor ingrese todos los campos requeridos por la aplicacion';
const serverError = 'Error interno del servidor, por favor intentelo mas tarde';

// constantes modulo de libros
const sameBookError = 'Existe un libro con el mismo titulo y autor, por favor agregue un nuevo ejemplar al libro ya existente en la opcion Libros -> Modificar';

// constantes modulo de usuarios
const sameEmailError = 'Existe un usuario registrado con el mismo correo, por favor utilizar otro en su lugar.'
const sameDocumentError = 'Existe un usuario registrado con el mismo numero de documento, por favor utilizar otro en su lugar.'


const activeBorrowsQuery = [
  {
    '$match': {
      'borrows': {
        '$exists': true
      }
    }
  }, {
    '$project': {
      '_id': 0, 
      'title': 1, 
      'borrows': {
        '$filter': {
          'input': '$borrows', 
          'as': 'borrows', 
          'cond': {
            '$eq': [
              '$$borrows.activeBorrow', true
            ]
          }
        }
      }
    }
  }, {
    '$unwind': {
      'path': '$borrows', 
      'preserveNullAndEmptyArrays': false
    }
  }, {
    '$lookup': {
      'from': 'users', 
      'localField': 'borrows.user', 
      'foreignField': '_id', 
      'as': 'user'
    }
  }, {
    '$project': {
      'title': 1, 
      'user': {
        '$arrayElemAt': [
          '$user', 0
        ]
      }, 
      'startDate': {
        '$dateToString': {
          'format': '%d/%m/%Y', 
          'date': '$borrows.startDate'
        }
      }, 
      'endDate': {
        '$dateToString': {
          'format': '%d/%m/%Y', 
          'date': '$borrows.endDate'
        }
      }, 
      'dateDifference': {
        '$floor': [
          {
            '$divide': [
              {
                '$subtract': [
                  '$borrows.endDate', '$$NOW'
                ]
              }, {
                '$multiply': [
                  1000, 60, 60, 24
                ]
              }
            ]
          }
        ]
      }
    }
  }, {
    '$project': {
      'title': 1, 
      'userName': {
        '$concat': [
          '$user.name', ' ', '$user.surname'
        ]
      }, 
      'phoneNumber': '$user.phoneNumber', 
      'email': '$user.email', 
      'startDate': 1, 
      'endDate': 1, 
      'dateDifference': 1
    }
  }, {
    '$sort': {
      'dateDifference': 1, 
      'title': 1
    }
  }, {
    '$limit': 30
  }
]

const activeSchedule = [
  {
    '$match': {
      'schedule': {
        '$exists': true
      }
    }
  }, {
    '$project': {
      '_id': 0, 
      'title': 1, 
      'schedule': {
        '$filter': {
          'input': '$schedule', 
          'as': 'schedule', 
          'cond': {
            '$eq': [
              '$$schedule.activeSchedule', true
            ]
          }
        }
      }
    }
  }, {
    '$unwind': {
      'path': '$schedule', 
      'preserveNullAndEmptyArrays': false
    }
  }, {
    '$lookup': {
      'from': 'users', 
      'localField': 'schedule.user', 
      'foreignField': '_id', 
      'as': 'user'
    }
  }, {
    '$project': {
      'title': 1, 
      'user': {
        '$arrayElemAt': [
          '$user', 0
        ]
      }, 
      'startDate': {
        '$dateToString': {
          'format': '%d/%m/%Y', 
          'date': '$schedule.startDate'
        }
      }
    }
  }, {
    '$project': {
      'title': 1, 
      'userName': {
        '$concat': [
          '$user.name', ' ', '$user.surname'
        ]
      }, 
      'phoneNumber': '$user.phoneNumber', 
      'email': '$user.email', 
      'startDate': 1
    }
  }, {
    '$sort': {
      'startDate': 1, 
      'title': 1
    }
  }, {
    '$limit': 30
  }
]

module.exports = {
	onlyAdminError,
	notAllFieldsError,
	serverError,
	sameBookError,
	sameEmailError,
	sameDocumentError,
	activeBorrowsQuery,
  activeSchedule
}


