/**
 * Created by faide on 2014-05-30.
 */
'use strict';

var mongoose = require('mongoose'),
    Schema   = mongoose.Schema;

var QuestionSchema = new Schema({
   content: {
       type: String,
       required: true,
       unique: true,
       validate: [function (value) { return value && value.length; }, 'Question cannot be blank']
   },
    /*
    * Supported question types:
    *  mc  - multiple choice (non-exclusive)
    *  emc - multiple choice (exclusive)
    *  num - numerical response
    *
    */
   type: {
       type: String,
       enum: ['mc', 'emc', 'num'],
       required: true
   },
    /*
    * possibleAnswers should either be a [String] or a range object
    */
   possibleAnswers: {
       type: {},
       validate: [function (value) {
            return value.length || (value.min !== undefined && value.max !== undefined);
       }]
   },
   createdAt: {
       type: Date,
       required: true
   },
   provideDate: {
       year:  {
           type: Number,
           default: 2014
       },
       month: Number,
       day:   Number
   },
   responses: [
       {
           userID: {
               type: String,
               required: true
           },
           createdAt: {
               type: Date,
               required: true
           },
           value: {
               type: {}, // this varies with the type of question
               required: true
           },
           location: {
               latitude: Number,
               longitude: Number
           }
       }
   ]
});

module.exports = mongoose.model('Question', QuestionSchema);