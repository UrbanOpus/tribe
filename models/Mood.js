/**
 * Created by faide on 2014-06-11.
 */
'use strict';

var mongoose = require('mongoose'),
    Schema   = mongoose.Schema;

var MoodSchema = new Schema({
    userID: {
        type: String,
        required: true
    },
    createdAt: {
        type: Date,
        required: true
    },
    value: {
        type: Number,
        required: true
    },
    location: {
        latitude: Number,
        longitude: Number
    }
});

module.exports = mongoose.model('Mood', MoodSchema);