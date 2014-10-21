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
    tribe: [{ type: String, unique: true }]
});

module.exports = mongoose.model('Triber', TriberSchema);