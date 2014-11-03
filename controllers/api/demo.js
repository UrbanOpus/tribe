'use strict';

var moods = require('./moods');

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