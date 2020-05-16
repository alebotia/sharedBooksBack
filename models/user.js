'use strict'

var mongoose = require('mongoose');
var Schema = mongoose.Schema;

var UserSchema = Schema({
	name: String,
	surname: String,
	email: String,
	password: String,
	phoneNumber: Number,		
	dob:{
	    type: Date,
	    min: '1930-01-01'
	  },
	documentNumber: Number,
	role: String,
	tyc: Boolean,
	image: String,
});

module.exports = mongoose.model('user',UserSchema);