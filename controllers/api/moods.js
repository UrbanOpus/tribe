'use strict';

var _ = require('underscore');
var Mood = require('../../models/Mood');
var Tribe = require('../../models/Tribe');
var async = require('async');
var moment = require('moment');

/**
 *  For future: Some authentication should be run on :userID before it's used as a query.
 *              1) the user must exist
 *              2) the request must come from the user's registered device
 */

exports.allMoods = function (req, res) {
    var m,
        params = {},
        sortObject = {};

    if (req.query.timeStart) {
        params.createdAt = params.createdAt || {};
        params.createdAt.$gt = req.query.timeStart;
    }
    if (req.query.timeEnd) {
        params.createdAt = params.createdAt || {};
        params.createdAt.$lt = req.query.timeEnd;
    }

    m = Mood.find(params);

    if (req.query.orderBy && req.query.orderDir) {
        sortObject[req.query.orderBy] = (isNaN(req.query.orderDir)) ? ((req.query.orderDir === 'desc') ? -1 : 1) : req.query.orderDir;
        m.sort(sortObject);
    }

    if (req.query.limit) {
        m.limit(req.query.limit);
    }

    m.exec(function (err, moods) {
        var anon_moods;
        if (err) {
            // Debug only: this should never be reached
            console.log(err);
            return res.status(400).send('Internal server error');
        }

        // strip confidential info from the data
        anon_moods = moods.map(function (mood) {
            mood.userID = 'Confidential';
            return mood;
        });
        res.status(200).send(anon_moods);
    });
};

exports.getMood = function (req, res) {
    Mood.findOne({_id: req.params.moodID}, function (err, mood) {
        if (err) {
            console.log(err);
            return res.status(404).send('Mood not found');
        }
        res.status(200).send(mood);
    });
};

exports.deleteMood = function (req, res) {
    Mood.remove({_id: req.params.moodID}, function (err, mood) {
        if (err) {
            console.log(err);
            return res.status(404).send('Mood not found');
        }
        res.status(200).send('Deleted');
    });
};

exports.moods = function (req, res) {
    var m,
        params = {},
        sortObject = {
            'createdAt': -1 // default to this
        };

    if (req.query.timeStart) {
        params.createdAt = params.createdAt || {};
        params.createdAt.$gt = req.query.timeStart;
    }
    if (req.query.timeEnd) {
        params.createdAt = params.createdAt || {};
        params.createdAt.$lt = req.query.timeEnd;
    }

    params.userID = req.params.userID;

    m = Mood.find(params);

    if (req.query.orderBy && req.query.orderDir) {
        sortObject[req.query.orderBy] = (isNaN(req.query.orderDir)) ? ((req.query.orderDir === 'desc') ? -1 : 1) : req.query.orderDir;
    }
    m.sort(sortObject);

    if (req.query.limit) {
        m.limit(req.query.limit);
    }

    m.exec(function (err, moods) {
        if (err) {
            return res.status(404).send('User not found.');
        }
        res.status(200).send(moods);
    });
};

exports.moodsByTribe = function (req, res) {
  averageTribeMood(req.params.tribeID, req.query.timeStart, req.query.timeEnd, function (err, data) {
    if (err) {
        console.log(err);
        return res.status(400).send(err);
    }
    return res.status(200).send(data);
  });
};

exports.createMood = function (req, res) {
    var mood = new Mood(req.body),
        errors = req.validationErrors();
    if (errors) {
        console.log(errors);
        return res.status(400).send(errors);
    }

    mood.userID    = req.params.userID;
    mood.createdAt = Date.now();

    mood.save(function  (err, mood) {
        if (err) {
            console.log(err);
            console.log(req.body);
            return res.status(400).send('Invalid POST. (Probably a missing field or header)');
        }
        res.status(200).send(mood);
    });
};

exports.tribeMood = function (tribeID, timeStart, timeEnd, done) {
  averageTribeMood(tribeID, timeStart, timeEnd, done);
}

var averageTribeMood = function (tribeID, timeStart, timeEnd, done) {
  async.waterfall([
    function(callback){
      var m,
          params = {},
          sortObject = {
              'createdAt': -1 // default to this
          };

      if (timeStart) {
          params.createdAt = params.createdAt || {};
          params.createdAt.$gt = timeStart;
      }
      if (timeEnd) {
          params.createdAt = params.createdAt || {};
          params.createdAt.$lt = timeEnd;
      }

      m = Mood.find(params);

      m.sort(sortObject);

      m.exec(function (err, moods) {
          if (err) {
              return callback(err);
          }
          callback(null, moods);
      });
    },
    function(moods, callback){
      Tribe.findOne({_id: tribeID}, function (err, tribe) {
        if (err) {
          callback(err);
        }

        callback(null, tribe.members, moods);
      })
    },
    function(members, moods, callback){

      if (moods.length) {
        var result = _.filter(moods, function (mood)  {
          return _.contains(members, mood.userID);
        });

        result = _.pluck(result, "value");

        var sum = _.reduce(result, function(memo, num){ return memo + num; }, 0);

        var res = sum/result.length;

        callback(null, res);
      } else {
        callback(null, 0);
      }



    }
  ], function (err, result) {
    if (err) {
        done(err)
    }

    done(null, {average: result});
  });
}