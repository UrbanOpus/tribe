/**
 * Created by faide on 2014-06-11.
 */
/**
 * Created by faide on 2014-06-11.
 */
'use strict';

var Mood = require('../../models/Mood');

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