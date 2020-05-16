'use strict'

var mongoose = require('mongoose');
var Schema = mongoose.Schema;

var QuoteSchema = Schema({
	quote: String,
	author: String,
	authorAditionalInfo: String
});

module.exports = mongoose.model('quote',QuoteSchema);