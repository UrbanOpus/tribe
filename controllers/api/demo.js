'use strict';

var moods = require('./moods');

exports.playground = function (req, res) {
    res.render('api_playground', {
      title: 'playground'
    });
};