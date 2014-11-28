'use strict';

var _ = require('underscore');

var Triber = require('../../models/Triber');
var Question = require('../../models/Question');
var Mood = require('../../models/Mood');

exports.playground = function (req, res) {
    res.render('api_playground', {
      title: 'playground'
    });
};


exports.allTribers = function (req, res) {
    res.render('triber_management', {
      title: 'Manage Triber'
    })
};

exports.tribers = function (req, res) {
  Triber.findOne({uuid: req.params.triberID}, function (err, triber) {
    if (err) {
        console.log(err);
        return res.status(404).send(err);
    }
    if (triber) {
      Question.find({}, function (err, questions) {
        var filter;

        filter = _.filter(questions, function(question) {
          return _.contains(_.pluck(question.responses, "userID"), triber.uuid);
        });

        Mood.find({}, function (err, moods) {
          var mood_filters;

          mood_filters = _.filter(moods, function(mood) {
            return mood.userID === triber.uuid;
          });

          res.render('triber', {
            title: 'Manage Triber',
            data: triber,
            questions: filter,
            moods: mood_filters
          });
        });

      });
    }
  });
};

exports.getResponseByTriber = function (uuid) {

};
