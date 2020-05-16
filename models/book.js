'use strict'

var mongoose = require('mongoose');
var Schema = mongoose.Schema;

var BookSchema = Schema({
    numberOfCopies: Number,
    title: String,
    authors: [String],
    genres: [String],
    idiom: String,
    location: String,
    borrows:[ 
    	{ user: {type: Schema.ObjectId, ref: 'user'},
    	  startDate: Date,
    	  endDate: Date,
    	  returnDate: Date,
    	  activeBorrow: Boolean
        }
    ],
    schedule: [
        {
            user: {type: Schema.ObjectId, ref: 'user'},
            startDate: Date,
            activeSchedule: Boolean
        }
    ],
    image: String
 });

module.exports = mongoose.model('book',BookSchema);