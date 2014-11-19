'use strict';

var Tribe = require('../../models/Tribe');
var Triber = require('../../models/Triber');
var _ = require('underscore');
var async = require('async');
var moment = require('moment');
var moods = require('./moods');

var MAX_TRIBE_PER_USER = 5;
var MIN_TRIBE_PER_USER = 1;

exports.tribeHomepage = function(req, res) {
  res.render('tribe_home');
};

exports.tribePage = function(req, res) {
  getTribeInformation(req.params.tribeID, function(err, tribe) {
    if (err) {
      console.log(err);
      return res.status(404).send('Tribe not found');
    }  
    res.render('tribe', tribe);
  })

};

exports.createTribe = function (req, res) {
  var tribe = new Tribe(req.body);

  tribe.save(function (err, tribe) {
    if (err) {
      console.log(err);
      return res.status(404).send('Tribe not created');
    }


    res.status(200).send(tribe);
  });
}

exports.allTribes = function (req, res) {
  Tribe.find({}, function (err, tribes) {
    if (err) {
      console.log(err);
      return res.status(404).send('Tribe not found');
    }

    res.json(tribes);
  })
}

exports.getTribe = function (req, res) {
  getTribeInformation(req.params.tribeID, function (err, tribe) {
    if (err) {
      console.log(err);
      return res.status(404).send('Tribe not found');
    }

    res.json(tribe);
  })
}

exports.getTribers = function (req, res) {
  getTribeInformation(req.params.tribeID, function (err, tribe) {
    getTriberInfo(tribe, function (err, results) {
      if (err) {
        return res.status(404).send(err);
      }

      res.json(results);
    });
  });
}

exports.deleteTribe = function (req, res) {
  Tribe.remove({_id: req.params.tribeID}, function (err, tribe) {
    if (err) {
      console.log(err);
      return res.status(404).send('Tribe not found');
    }
    res.status(200).send('Deleted');
  });
};

exports.joinTribe = function (req, res) {
  if (!req.body.uuid) {
    return res.status(404).send('No User ID'); 
  } else {
    async.waterfall([
      function(callback){
        Tribe.findOne({_id: req.params.tribeID}, function (err, tribe) {
          if (err) {
            callback(err);
          }

          tribe.members.push(req.body.uuid);

          callback(null, tribe);
        });
      },
      function(tribe, callback){
        tribe.save(function (err, tribe) {
          if (err) {
            callback(err);
          }

          callback(null, tribe);
        });
      },
      function(tribe, callback){
        Triber.findOne({uuid: req.body.uuid}, function (err, triber) {
          if (err) {
            callback(err);
          }

          if (triber.tribe.length < MAX_TRIBE_PER_USER){            
            triber.tribe.push(tribe._id);
          } else {
            callback('Exceed Number of Tribes Per User')
          }

          callback(null, tribe, triber);
        });
      },     
      function(tribe, triber, callback){
        triber.save(function (err, triber) {
          if (err) {
            callback(err);
          }

          callback(null, 'done');
        });
      }
    ], function(err, result){
      if (err) {
        console.log(err);
        return res.status(404).send(err);
      }

      res.status(200).send('Success');
    });
  }
}

exports.leaveTribe = function (req, res) {
  if (!req.body.uuid) {
    return res.status(404).send('No User ID'); 
  } else {
    async.waterfall([
      function(callback){
        Tribe.findOne({_id: req.params.tribeID}, function (err, tribe) {
          if (err) {
            callback(err);
          }

          var index = _.indexOf(tribe.members, req.body.uuid);

          if (index !== -1) {
            tribe.members.splice(index,1);
          }

          callback(null, tribe);
        });
      },
      function(tribe, callback){
        tribe.save(function (err, tribe) {
          if (err) {
            callback(err);
          }

          callback(null, tribe);
        });
      },
      function(tribe, callback){
        Triber.findOne({uuid: req.body.uuid}, function (err, triber) {
          if (err) {
            callback(err);
          }

          if (triber.tribe.length > MIN_TRIBE_PER_USER) {            
            var index = _.indexOf(triber.tribe, req.params.tribeID.toString());

            if (index !== -1) {
              triber.tribe.splice(index,1);
            }
          } else {
            callback('User Must Be In At Least One Tribe');
          }


          callback(null, tribe, triber);
        });
      },     
      function(tribe, triber, callback){
        triber.save(function (err, triber) {
          if (err) {
            callback(err);
          }
          callback(null, 'done');
        });
      }
    ], function(err, result){
      if (err) {
        console.log(err);
        return res.status(404).send(err);
      }

      res.status(200).send('Success');
    });
  }
}

var getTribeInformation = function (tribeID, callback) {
  Tribe.findOne({_id: tribeID}, function (err, tribe) {
    moods.tribeMood(tribeID, moment().subtract(1, 'd').toDate(), moment().toDate(), function (err, averageMood) {       
      tribe.averageMood = averageMood.average;
      console.log(tribe);

      callback(err, tribe);
    })

  })
}

var getTriberInfo = function (tribe, done) {
  async.map(tribe.members, function (member, callback) {
    Triber.findOne({uuid: member}, function (err, triber) {
      callback(err, triber);
    });
  }, function(err, results) {
    done(err, results);
  })
}