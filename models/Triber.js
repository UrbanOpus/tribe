'use strict';

/**
 * Module dependencies.
 */
var mongoose = require('mongoose'),
    Schema = mongoose.Schema;
/**
 * User Schema
 */
var TriberSchema = new Schema({
    uuid: String,
    notificationTime: String,
    registrationID: String, // this is required by GCM
    tribe: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Tribe' }]
});

module.exports = mongoose.model('Triber', TriberSchema);