/**
 * Created by faide on 2014-07-06.
 */

'use strict';

var Triber       = require('../../models/Triber'),
    Tribe        = require('../../models/Tribe'),
    schedule     = require('node-schedule'),
    gcm          = require('node-gcm'),
    question_api = require('./questions'),
    async        = require('async'),
    _            = require('underscore'),
    moment       = require('moment'),
    moods        = require('./moods');

// api key
var apiKey     = 'AIzaSyDKJoxjaycJeN_lP8v5x-jtgmOqkAHWDkU',
    gcm_sender = new gcm.Sender(apiKey);

var notification_timers = {};

function parseTime(timeString) {
    var t = timeString.split(':'),
        time_obj = {};

    t[1] = t[1].split(' ');

    if (t[1].length === 1) {
        time_obj.hour = parseInt(t[0]);
        time_obj.minute = parseInt(t[1][0]);
    } else {
        time_obj.hour = parseInt( (t[1][1] === 'PM') ? 12 + (parseInt(t[0]) % 12) : parseInt(t[0]) % 12 );
        time_obj.minute = parseInt(t[1][0]);
    }

    return time_obj;
}

function sendNotificationtoTriber (current_triber) {
    console.log('..found triber');
    var isAnswered;
    if (current_triber && current_triber.registrationID) {
        question_api.getQuestionOfTheDay(new moment(), function (err, question) {
            if (err) {
                console.log(err);
            }
            if (question) {
            console.log('..onNotificationGCMound question');

                //make sure the question hasn't been answered already
                console.log('..searching responses...');
                isAnswered = question.responses.some(function (response) {
                    return response.triberID === current_triber.uuid;
                });

                console.log('isAnswered:', isAnswered);

                if (!isAnswered) {
                    console.log('..sending new question to triber', current_triber._id, 'via GCM');
                    var message = new gcm.Message();

                    message.collapse_key = 'You have unanswered questions';
                    message.addData('title', 'New Question Available');
                    message.addData('message', 'Today\'s question of the day is available!');
                    message.addData('msgcnt', 1);


                    gcm_sender.send(message, [current_triber.registrationID], 4, function (err, result) {
                        if (err) {
                            console.log('..error: ', err);
                        } else {
                            console.log('..sent:', result);
                        }
                    });
                } else {
                    console.log('..triber has answered already - dont send notification');
                }

            }
        });
    }
}

function scheduleGCM(time, triber) {

    var rule_time = parseTime(time);
    console.log(time);
    console.log(parseTime(time));

    // enable a notification timer for a new triber
    var rule = new schedule.RecurrenceRule();
    rule.hour = rule_time.hour; // test this out
    rule.minute = rule_time.minute;

    console.log(rule);

    console.log('scheduling alert');

    notification_timers[triber.uuid] = schedule.scheduleJob(rule, function () {
        console.log('sending alert to triber ' + triber.uuid);
        // ensure we get the most current data
        Triber.findOne({_id: triber._id}, function (err, current_triber) {
            sendNotificationtoTriber(current_triber);
        });
    });

    console.log('notification scheduled for triber :', triber.uuid);
}

module.exports = {
    createTriber: function (req, res) {
        console.log('creating triber');
        var u = new Triber(req.body);
        u.save(function (err, triber) {
            if (err) {
                console.log(err);
                return res.status(400).send(err);
            }

            scheduleGCM("10:15", triber);

            console.log('triber created with id', triber._id);

            return res.status(200).send(triber);

        });
    },
    deleteTriber: function (req, res) {
        // cancel the scheduled GCM send
        Triber.findOne({uuid: req.params.triberID}, function (err, triber) {
            if (triber) {
              async.map(triber.tribe, function (tribeID, callback) {
                Tribe.findOne({_id: tribeID}, function (err, tribe) {
                  tribe.members = _.without(tribe.members, _.findWhere(tribe.members, triber.uuid));
                  tribe.save();
                  callback(err, tribe);
                });
              }, function(err, results) {
                if (err) {
                  return res.status(404).send(err);
                }
                triber.remove(function (err) {
                    if (err) {
                        console.log(err);
                        return res.status(404).send(err);
                    }
                    return res.status(200).send('Triber removed');
                });
              })
            }
        });

    },
    getTriber: function (req, res) {
        Triber.findOne({uuid: req.params.triberID}, function (err, triber) {
            if (err) {
                console.log(err);
                return res.status(404).send(err);
            }
            if (triber) {
                return res.status(200).send(triber);
            }
            return res.status(404).send('Triber not found');
        });
    },    
    getTribes: function (req, res) {
        Triber.findOne({uuid: req.params.triberID}, function (err, triber) {
            if (err) {
                console.log(err);
                return res.status(404).send(err);
            }
            if (triber) {
              async.map(triber.tribe, function (tribeID, callback) {
                Tribe.findOne({_id: tribeID}, function (err, tribe) {
                  moods.tribeMood(tribeID, moment().subtract(1, 'd').toDate(), moment().toDate(), function (err, averageMood) {       
                    var t = JSON.parse(JSON.stringify(tribe));
                    t.averageMood = averageMood.average;
                    delete tribe.member
                    callback(err, t);
                  });
                });
              }, function(err, results) {
                if (err) {
                  return res.status(404).send(err);
                }
                res.status(200).send(results);
              })
            }
        });
    },
    changeNotificationTime: function (req, res) {
        Triber.findOne({uuid: req.params.triberID}, function (err, triber) {
            if (err) {
                console.log(err);
                return res.status(404).send(err);
            }
            if (triber) {
                if (notification_timers[triber.uuid]) {
                    notification_timers[triber.uuid].cancel();
                }
                triber.notificationTime = req.body.notificationTime;
                scheduleGCM(triber.notificationTime, triber);
                triber.save();
                return res.status(200).send(triber);

            }
        });
    },
    changeTriberNickname: function (req, res) {
        Triber.findOne({uuid: req.body.uuid}, function (err, triber) {
            if (err) {
                console.log(err);
                return res.status(404).send(err);
            }
            if (triber) {
              triber.nickname = req.body.nickname;
              triber.save(function (err, triber) {
                  if (err) {
                      console.log(err);
                      return res.status(400).send(err);
                  }
                  return res.status(200).send(triber);
              });
            }
        });
    },
    toggleTribe: function (req, res) {
        Triber.findOne({uuid: req.params.triberID}, function (err, triber) {
            if (err) {
                console.log(err);
                return res.status(404).send(err);
            }
            if (triber) {
                triber.tribeEnabled = !triber.tribeEnabled;
                triber.save(function (err, triber) {
                    if (err) {
                        console.log(err);
                        return res.status(400).send(err);
                    }
                    return res.status(200).send(triber);
                });
            }
        });
    },
    registerDevice: function (req, res) {
        Triber.findOne({uuid: req.params.triberID}, function (err, triber) {
            if (err) {
                console.log(err);
                return res.status(404).send(err);
            } 

            if (triber) {
              triber.registrationID = req.body.registrationID;
              triber.refreshed = true;
              scheduleGCM("10:15", triber);
              triber.save(function (err, triber) {
                  if (err) {
                      console.log(err);
                      return res.status(400).send(err);
                  }
                  return res.status(200).send(triber);
              });
            } else {
              return res.status(200).end();
            }

        });
    },
    unregisterDevice: function (req, res) {
        Triber.findOne({uuid: req.params.triberID}, function (err, triber) {
            if (err) {
                console.log(err);
                return res.status(404).send(err);
            }
            triber.registrationID = undefined;
            triber.save(function (err, triber) {
                if (err) {
                    console.log(err);
                    return res.status(500).send('Internal server error');
                }
                return res.status(200).send(triber);
            });
        });
    },
    unsubscribeTriber: function (req, res) {
        Triber.findOne({uuid: req.params.triberID}, function (err, triber) {
            if (err) {
                console.log(err);
                return res.status(404).send(err);
            }

            if (notification_timers[req.params.triberID]) {
                notification_timers[req.params.triberID].cancel();
                notification_timers[req.params.triberID] = undefined;
            }

            if (triber) {
                triber.notificationTime = undefined;
                triber.save(function (err, triber) {
                    if (err) {
                        console.log(err);
                        return res.status(500).send(err);
                    }
                    return res.status(200).send(triber);
                });
            }
        });
    },
    getAllTribers: function (req, res) {
        Triber.find({}, function (err, tribers) {
            if (err) {
                console.log(err);
                return res.status(500).send(err);
            }
            return res.status(200).send(tribers);
        });
    },
    wipeTribers: function (req, res) {
        Triber.remove({}, function (err) {
            if (err) {
                console.log(err);
                return res.status(400).send(err);
            }
            return res.status(200).send('done');
        });
    },
    //bootstrap startup
    onStart: function () {
        // re-schedule notifications
        Triber.find({}, function (err, tribers) {
            var i, l = tribers.length;
            if (err) {
                console.log(err);
                return;
            }

            console.log('Rescheduling triber notifications after restart');

            _.each(tribers, function(triber) {
              scheduleGCM("14:06", triber);
            });
            
            console.log('Done rescheduling');

        });
    }
};

module.exports.onStart();