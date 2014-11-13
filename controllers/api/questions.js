'use strict';

var _ = require('underscore');
var async = require('async');
var moment = require('moment');

var Question = require('../../models/Question');
var Tribe = require('../../models/Tribe');

var DEFAULT_TIME_FRAME_HOURS = 2;

function sortResponses(questionObj) {
    var sortedResponses = {},
        responses = questionObj.responses,
        i, j,
        l = questionObj.possibleAnswers.length || (parseInt(questionObj.possibleAnswers.max) + 1) - questionObj.possibleAnswers.min;

    for (i = 0; i < l; i += 1) {
        if (questionObj.type === 'num') {
            sortedResponses[i] = [];
            for (j = 0; j < responses.length; j += 1) {
                if (responses[j].value == i) {
                    sortedResponses[i].push(responses[j]);
                }
            }
        } else {
            sortedResponses[questionObj.possibleAnswers[i]] = [];
            for (j = 0; j < responses.length; j += 1) {
                // we can't remove responses once we've counted them; we have to account for non-exclusive multiple choice answers
                if (((typeof responses[j].value === 'string') && questionObj.possibleAnswers[i] == responses[j].value) || // type-coerce the string into a number for the comparison
                    (typeof responses[j].value !== 'string' &&(responses[j].value.length && responses[j].value[i]))) {
                    sortedResponses[questionObj.possibleAnswers[i]].push(responses[j]);
                }
            }

        }
    }
    return sortedResponses;
}

exports.getQuestionOfTheDay = function(date, cb) {
    var params = {};

    date = date || new moment();
    if (parseInt(date)) {
        date = moment(parseInt(date));

    }
    
    var end = date.clone().endOf('day');
    var start = date.clone().startOf('day');

    Question.findOne({provideOn: {$gt: start.toDate(), $lt: end.toDate()}}, null, { sort: { createdAt: -1 } }, function (err, question) {
        if (err) {
            console.log(err);
            return cb(err, null);
        }

        // return null if a question was not found for `date`
        return cb(null, question);
    });
};

exports.questions = function (req, res) {
    var q,
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

    q = Question.find(params);

    if (req.query.orderBy && req.query.orderDir) {
        sortObject[req.query.orderBy] = (isNaN(req.query.orderDir)) ? ((req.query.orderDir === 'desc') ? -1 : 1) : req.query.orderDir;
        q.sort(sortObject);
    }

    if (req.query.limit) {
        q.limit(req.query.limit);
    }

    q.exec(function (err, questions) {
        if (err) {
            // Debug block; this should never be reached
            console.log(err);
            return res.status(500).send('Internal server error');
        }
        res.status(200).send(questions);
    });
};

exports.createQuestion = function (req, res) {
    // Create a new question using the POST data
    var q = new Question(req.body),
        date,
    // run validation on POST
        errors = req.validationErrors();
    if (errors) {
        console.log(errors);
        return res.status(400).send(errors);
    }
    
    q.provideOn = moment(req.body.provideDate);

    var timeframe = req.body.timeframe? req.body.timeframe : DEFAULT_TIME_FRAME_HOURS;

    q.expireOn = moment(req.body.provideDate).add(timeframe,'h');

    // Create private fields
    q.createdAt = Date.now();
    q.responses = [];

    q.save(function (err, question) {
        if (err) {
            console.log(err);
            switch (err.code) {
                // Duplicate key errors
                case 11000:
                case 11001:
                    res.status(400).send('Question already exists.');
                    break;
                // Generic error response
                default:
                    res.status(400).send('Invalid POST.  (Probably a missing field or header)');
            }
            return res.status(400);
        }
        // Respond with the created question object
        res.status(200).send(question);
    });
};

exports.question = function (req, res) {
    Question.findOne({_id: req.params.questionID}, function (err, question) {
        if (err) {
            console.log(err);
            return res.status(404).send('Question not found');
        }
        if (question) {
            var questionObj = question.toObject();
            if (req.query.sorted) {
                questionObj.responses = sortResponses(question);
            }

        }

        res.status(200).send(questionObj);
    });
};

exports.deleteQuestion = function (req, res) {
    Question.remove({_id: req.params.questionID}, function (err, question) {
        if (err) {
            console.log(err);
            return res.status(404).send('Question not found');
        }
        res.status(200).send('Deleted');
    });
};

exports.questionOfTheDay = function (req, res) {
    exports.getQuestionOfTheDay(req.query.date, function (err, question) {
        if (err) {
            console.log(err);
            return res.status(500).send(err);
        }
        if (question) {
            var questionObj = question.toObject();

            // sort questions
            if (req.query.sorted) {
                questionObj.responses = sortResponses(questionObj);
            }

        }


        return res.status(200).send(questionObj);
    });
};

exports.responses = function (req, res) {
  findResponse(req, function (err, question) {
    if (err) {
        console.log(err);
        return res.status(404).send('Question not found');
    }

    var responses = question.responses;

    res.status(200).send(responses);
  });
};

exports.sortResponses = function (req, res) {
  findResponse(req, function (err, question) {
    if (err) {
        console.log(err);
        return res.status(404).send('Question not found');
    }

    res.status(200).send(sortResponses(question));
  });
};

exports.getResponsesByTribe = function (req, res) {
  async.waterfall([
    function(callback){
      findResponse(req, function (err, question) {
        if (err) {
          callback(err);
        }

        callback(null, sortResponses(question));
      });
    },
    function(responses, callback){
      Tribe.findOne({_id: req.params.tribeID}, function (err, tribe) {
        if (err) {
          callback(err);
        }

        callback(null, tribe.members, responses);
      })
    },
    function(members, responses, callback){
      var tribeResponse = _.map(responses, function (response, key) {
        return [key, _.filter(response, function (resp) { return _.contains(members, resp.userID);})];
      });

      tribeResponse =_.object(tribeResponse);

      callback(null, tribeResponse);
    }
  ], function (err, result) {
    if (err) {
        console.log(err);
        return res.status(404).send(err);
    }

    res.status(200).send(result);        
  });
};

exports.createResponse = function (req, res) {
  Question.findOne({_id: req.params.questionID}, function (err, question) {
    var response,
        responseIndex;
    if (err) {
      console.log(err);
      return res.status(404).send('Question not found');
    }
    response = req.body;
    response.createdAt = Date.now();
    responseIndex = question.responses.push(response) - 1;
    question.save(function (err, question) {
    if (err) {
        console.log(err);
        return res.status(400).send('Error');
      }
      res.status(200).send(question.responses[responseIndex]);
    });
  });
};

exports.response = function (req, res) {
    Question.findOne({_id: req.params.questionID}, function (err, question) {
        var responses, i, numResponses;
        if (err) {
            console.log(err);
            return res.status(404).send('Question not found');
        }
        responses = question.responses;
        numResponses = responses.length;
        for (i = 0; i < numResponses; i += 1) {
            if (responses[i]._id.toString() === req.params.responseID) {
                return res.status(200).send(responses[i]);
            }
        }
        return res.status(404).send('Response not found');
    });
};

var findResponse = function (req, callback) {
  Question.findOne({_id: req.params.questionID}, function (err, question) {
      var responses = question.responses;
      if (err) {
        callback(err);
      }


      if (req.query.timeStart) {
          responses = responses.filter(function (response) {
              var timeMin = new Date(req.query.timeStart).getTime(),
                  time = new Date(response.createdAt).getTime();

              return time > timeMin;
          });
      }

      if (req.query.timeEnd) {
          responses = responses.filter(function (response) {
              var timeMax = new Date(req.query.timeEnd).getTime(),
                  time = new Date(response.createdAt).getTime();

              return time < timeMax;
          });
      }

      callback(null, question);
  });
}