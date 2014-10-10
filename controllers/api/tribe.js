'use strict';

var Tribe = require('../../models/Tribe');

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

exports.deleteTribe = function (req, res) {
    Tribe.remove({_id: req.params.tribeID}, function (err, tribe) {
      if (err) {
        console.log(err);
        return res.status(404).send('Tribe not found');
      }
      res.status(200).send('Deleted');
    });
};

var getTribeInformation = function (tribeID, callback) {
  Tribe.findOne({_id: tribeID}, function (err, tribe) {
    callback(err, tribe);
  })
}