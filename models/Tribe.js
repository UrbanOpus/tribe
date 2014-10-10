/**
 * Created by faide on 2014-06-11.
 */
'use strict';

var mongoose = require('mongoose'),
    Schema   = mongoose.Schema;

var TribeSchema = new Schema({
    name: {
      type: String,
      required: true
    },
    createdAt: {
      type: Date,
      default: Date.now
    },
    imgsrc: {
      type: String
    },
    summary: {
      type: String
    },
    category: {
      type: String
    }, 
    members: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Triber' }]
});

module.exports = mongoose.model('Tribe', TribeSchema);