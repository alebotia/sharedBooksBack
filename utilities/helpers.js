// normaliza arreglo que entra como parmetro
// quita espacion al comienzo y fin
// lo baja a mayuscula
// retorna arreglo normalizado
function normalizeArray(param) {
	let tmpArray = [];
	let i;
	for (i = 0; i < param.length; i++){
		tmpArray.push(param[i].trim().toLowerCase());
	}

	return tmpArray;
}

// Retorna true si el usuario que envia la peticion es ROLE_ADMIN
// de lo contrario false
function isAdminUser(userRole){
	// console.log('Current log is: ', userRole)
	if(userRole === 'ROLE_ADMIN'){
		return true
	}else {
		return false
	}
	
}

module.exports = {
	normalizeArray,
	isAdminUser
};