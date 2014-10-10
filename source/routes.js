/**
 * Controllers (route handlers).
 */

var homeController = require('./../controllers/home');
var userController = require('./../controllers/user');
var apiController = require('./../controllers/api');
var contactController = require('./../controllers/contact');
var api_demo = require('./../controllers/api/demo');
var moodsAPI = require('./../controllers/api/moods.js');
var questionsAPI = require('./../controllers/api/questions.js');
var usersAPI = require('./../controllers/api/tribers.js');
var tribeController = require('./../controllers/api/tribe.js');

var passportConf = require('./../config/passport');

exports = module.exports = function(app, passport) {
  /**
   * Main routes.
   */

  app.get('/', homeController.index);
  app.get('/login', userController.getLogin);
  app.post('/login', userController.postLogin);
  app.get('/logout', userController.logout);
  app.get('/forgot', userController.getForgot);
  app.post('/forgot', userController.postForgot);
  app.get('/reset/:token', userController.getReset);
  app.post('/reset/:token', userController.postReset);
  app.get('/signup', userController.getSignup);
  app.post('/signup', userController.postSignup);
  app.get('/contact', contactController.getContact);
  app.post('/contact', contactController.postContact);
  app.get('/account', passportConf.isAuthenticated, userController.getAccount);
  app.post('/account/profile', passportConf.isAuthenticated, userController.postUpdateProfile);
  app.post('/account/password', passportConf.isAuthenticated, userController.postUpdatePassword);
  app.post('/account/delete', passportConf.isAuthenticated, userController.postDeleteAccount);
  app.get('/account/unlink/:provider', passportConf.isAuthenticated, userController.getOauthUnlink);

  /**
   * API examples routes.
   */

  app.get('/api', apiController.getApi);
  app.get('/api/lastfm', apiController.getLastfm);
  app.get('/api/nyt', apiController.getNewYorkTimes);
  app.get('/api/aviary', apiController.getAviary);
  app.get('/api/steam', apiController.getSteam);
  app.get('/api/stripe', apiController.getStripe);
  app.post('/api/stripe', apiController.postStripe);
  app.get('/api/scraping', apiController.getScraping);
  app.get('/api/twilio', apiController.getTwilio);
  app.post('/api/twilio', apiController.postTwilio);
  app.get('/api/clockwork', apiController.getClockwork);
  app.post('/api/clockwork', apiController.postClockwork);
  app.get('/api/foursquare', passportConf.isAuthenticated, passportConf.isAuthorized, apiController.getFoursquare);
  app.get('/api/tumblr', passportConf.isAuthenticated, passportConf.isAuthorized, apiController.getTumblr);
  app.get('/api/facebook', passportConf.isAuthenticated, passportConf.isAuthorized, apiController.getFacebook);
  app.get('/api/github', passportConf.isAuthenticated, passportConf.isAuthorized, apiController.getGithub);
  app.get('/api/twitter', passportConf.isAuthenticated, passportConf.isAuthorized, apiController.getTwitter);
  app.post('/api/twitter', passportConf.isAuthenticated, passportConf.isAuthorized, apiController.postTwitter);
  app.get('/api/venmo', passportConf.isAuthenticated, passportConf.isAuthorized, apiController.getVenmo);
  app.post('/api/venmo', passportConf.isAuthenticated, passportConf.isAuthorized, apiController.postVenmo);
  app.get('/api/linkedin', passportConf.isAuthenticated, passportConf.isAuthorized, apiController.getLinkedin);
  app.get('/api/instagram', passportConf.isAuthenticated, passportConf.isAuthorized, apiController.getInstagram);
  app.get('/api/yahoo', apiController.getYahoo);

  /**
   * OAuth sign-in routes.
   */

  app.get('/auth/instagram', passport.authenticate('instagram'));
  app.get('/auth/instagram/callback', passport.authenticate('instagram', { failureRedirect: '/login' }), function(req, res) {
    res.redirect(req.session.returnTo || '/');
  });
  app.get('/auth/facebook', passport.authenticate('facebook', { scope: ['email', 'user_location'] }));
  app.get('/auth/facebook/callback', passport.authenticate('facebook', { failureRedirect: '/login' }), function(req, res) {
    res.redirect(req.session.returnTo || '/');
  });
  app.get('/auth/github', passport.authenticate('github'));
  app.get('/auth/github/callback', passport.authenticate('github', { failureRedirect: '/login' }), function(req, res) {
    res.redirect(req.session.returnTo || '/');
  });
  app.get('/auth/google', passport.authenticate('google', { scope: 'profile email' }));
  app.get('/auth/google/callback', passport.authenticate('google', { failureRedirect: '/login' }), function(req, res) {
    res.redirect(req.session.returnTo || '/');
  });
  app.get('/auth/twitter', passport.authenticate('twitter'));
  app.get('/auth/twitter/callback', passport.authenticate('twitter', { failureRedirect: '/login' }), function(req, res) {
    res.redirect(req.session.returnTo || '/');
  });
  app.get('/auth/linkedin', passport.authenticate('linkedin', { state: 'SOME STATE' }));
  app.get('/auth/linkedin/callback', passport.authenticate('linkedin', { failureRedirect: '/login' }), function(req, res) {
    res.redirect(req.session.returnTo || '/');
  });

  /**
   * OAuth authorization routes for API examples.
   */

  app.get('/auth/foursquare', passport.authorize('foursquare'));
  app.get('/auth/foursquare/callback', passport.authorize('foursquare', { failureRedirect: '/api' }), function(req, res) {
    res.redirect('/api/foursquare');
  });
  app.get('/auth/tumblr', passport.authorize('tumblr'));
  app.get('/auth/tumblr/callback', passport.authorize('tumblr', { failureRedirect: '/api' }), function(req, res) {
    res.redirect('/api/tumblr');
  });
  app.get('/auth/venmo', passport.authorize('venmo', { scope: 'make_payments access_profile access_balance access_email access_phone' }));
  app.get('/auth/venmo/callback', passport.authorize('venmo', { failureRedirect: '/api' }), function(req, res) {
    res.redirect('/api/venmo');
  });


/**
 * Tribes APIs
 */

  app.route('/tribes')
     .get(tribeController.tribeHomepage);

  app.route('/tribes/:tribeID')
     .get(tribeController.tribePage);
     

  app.route('/api/tribes')
     .get(tribeController.allTribes)
     .post(tribeController.createTribe);

   app.route('/api/tribes/:tribeID')
       .get(tribeController.getTribe)
       .delete(tribeController.deleteTribe);


  app.route('/api_playground')
      .get(api_demo.playground);

  // server handshake
  app.route('/api/')
      .get(function (req, res) {
          return res.send(204);
      });

  app.route('/api/moods')
      .get(moodsAPI.allMoods);

  app.route('/api/moods/:moodID')
      .get(moodsAPI.getMood)
      .delete(moodsAPI.deleteMood);

  app.route('/api/moods/users/:userID')
      .post(moodsAPI.createMood)
      .get(moodsAPI.moods);

  app.param(function(name, fn){
      if (fn instanceof RegExp) {
          return function(req, res, next, val){
              var captures = fn.exec(String(val));
              if (captures) {
                  req.params[name] = captures;
                  next();
              } else {
                  next('route');
              }
          };
      }
  });

  app.route('/api/questions')
      .post(questionsAPI.createQuestion)
      .get(questionsAPI.questions);

  app.route('/api/questions/date')
      .get(questionsAPI.questionOfTheDay);

  app.route('/api/questions/:questionID')
      .get(questionsAPI.question)
      .delete(questionsAPI.deleteQuestion);

  app.route('/api/questions/:questionID/responses')
      .get(questionsAPI.responses)
      .post(questionsAPI.createResponse);

  app.route('/api/questions/:questionID/responses/sorted')
      .get(questionsAPI.sortResponses);

  app.route('/api/questions/:questionID/responses/:responseID')
      .get(questionsAPI.response);


  app.route('/api/users/:userID')
      .get(usersAPI.getTriber)
      .put(usersAPI.changeNotificationTime)
      .delete(usersAPI.deleteTriber);

  app.route('/api/users/:userID/gcm')
      .post(usersAPI.registerDevice)
      .delete(usersAPI.unregisterDevice);

  app.route('/api/users/:userID/notify')
      .delete(usersAPI.unsubscribeTriber);

  app.route('/api/users')
      .get(usersAPI.getAllTribers)
      .post(usersAPI.createTriber)
      .delete(usersAPI.wipeTribers);

}