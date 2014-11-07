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
    nickname: String,
    notificationTime: String,
    registrationID: String, // this is required by GCM
    birthyear: Number,
    gender:  {
       type: String,
       enum: ['Male', 'Female'],
       required: true
    },
    income:  {
       type: String,
       enum: ['Less than $20,000', '$20,000 to $34,999', '$35,000 to $49,999', '$50,000 to $74,999',
              '$75,000 to $99,999', '$100,000 to $149,999', '$150,000 to $199,999', '$200,000 or more'],
       required: true
    },
    tribe: [{ type: String, unique: true }],
    tribeEnabled: {
      type: Boolean,
      default: false
    }
});

module.exports = mongoose.model('Triber', TriberSchema);