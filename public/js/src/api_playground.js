/* global app:true */

(function() {
  'use strict';

  var app = app || {};
  var answer_count = 1;

  app.Mood = Backbone.Model.extend({
    idAttribute: '_id',
    defaults: {
      _id: undefined,
      userID: '',
      createdAt: '',
      value: ''
    },
    parse: function (mood) {
      mood.createdAt = moment(mood.createdAt).format('lll');
      return mood;
    },
    url: function() {
      return '/api/moods/' + this.id;
    }
  });

  app.MoodCollection = Backbone.Collection.extend({
    model: app.Mood,
    url: '/api/moods'
  });

  app.MoodView = Backbone.View.extend({
    el: '#moodsBody',
    initialize: function() {
      this.collection = new app.MoodCollection();
      this.listenTo(this.collection, 'sync', this.render);
      this.collection.fetch();
      this.render();
    },
    render: function() {
      $('#moodsBody').html('');
      var frag = document.createDocumentFragment();
      _.each(this.collection.models, function(mood) {
        var view = new app.MoodsRowView({ model: mood });
        frag.appendChild(view.render().el);
      });
      $('#moodsBody').append(frag);

      if (this.collection.length === 0) {
        $('#results-rows').append( $('#tmpl-results-empty-row').html() );
      }
    }
  });

  app.MoodsRowView = Backbone.View.extend({
    tagName: 'tr',    
    template: _.template( $('#tmpl-mood-row').html() ),
    render: function() {
      this.$el.html(this.template( this.model.attributes ));
      this.$el.find('.close-mood').attr("data-moodhash", this.model.attributes._id);
      this.$el.find('.close-mood').click(remove_mood);
      return this;
    }
  });


  app.Question = Backbone.Model.extend({
    idAttribute: '_id',
    defaults: {
      content: undefined,
      type: '',
      possibleAnswers: '',
      createdAt: '',
      provideOn: '',
      responses: []
    },
    parse: function (question) {
      question.provideOn = moment(question.provideOn).format('l');

      return question;
    },
    url: function() {
      return '/api/questions/' + this.id;
    }
  });

  app.MCAnswer = Backbone.Model.extend({
    defaults: {
      text: '',
      count: ''
    }
  });

  app.MCCollection = Backbone.Collection.extend({
    model: app.MCAnswer,
    url: '/api/questions'
  });

  app.QuestionCollection = Backbone.Collection.extend({
    model: app.Question,
    url: '/api/questions'
  });

  app.QuestionView = Backbone.View.extend({
    el: '#questionsBody',
    initialize: function() {
      this.collection = new app.QuestionCollection();
      this.listenTo(this.collection, 'sync', this.render);
      this.collection.fetch();
      this.render();
    },
    render: function() {
      $('#questionsList').html('');

      var answer_data = [],
              response_counts = [],
              answer_id;

      _.each(this.collection.models, function(question) {
        var frag = document.createDocumentFragment();

        question.attributes.provideDate = moment(question.attributes.provideDate).format('l');

        if (question.attributes.type === 'mc' || question.attributes.type === 'emc') {
          // count responses

          _.each(question.attributes.responses, function (response) {
            if (question.attributes.type === 'mc') {
              _.each(response.value, function (val, index) {
                if (val) {
                  response_counts[index] = (response_counts[index] + 1) || 1
                }
              })
            } else {
              answer_id = (response.value);
              response_counts[answer_id] = (response_counts[answer_id] + 1) || 1;
            }
          })

          question.attributes.possibleAnswers = _.map(question.attributes.possibleAnswers, function (answer, index) {
              return {
                  text: answer,
                  count: response_counts[index] || 0
              };
          });

          var view = new app.MCRowView({ model: question });

          frag.appendChild(view.render().el);

          var answers = new app.MCCollection(question.attributes.possibleAnswers);

          _.each(answers.models, function(answer) {
            var view = new app.answerRowView({ model: answer });

            frag.appendChild(view.render().el);
          })

        } else {
          question.attributes.possibleAnswers.count = question.attributes.responses.length;
          var view = new app.MCRowView({ model: question });

          frag.appendChild(view.render().el);

          view = new app.numView({ model: question.attributes.possibleAnswers });

          frag.appendChild(view.render().el);
        }

        $('#questionsList').append(frag);

      });

    }
  });

  app.MCRowView = Backbone.View.extend({ 
    template: _.template( $('#tmpl-question-list').html() ),
    render: function() {
      this.$el.html(this.template( this.model.attributes ));
      this.$el.find('.close-question').attr("data-questionhash", this.model.attributes._id);
      this.$el.find('.question-link').attr("href", "api/questions/" + this.model.attributes._id);
      this.$el.find('.close-question').click(remove_question);
      return this;
    }
  });


  app.answerRowView = Backbone.View.extend({ 
    template: _.template( $('#tmpl-mc-answer').html() ),
    render: function() {
      this.$el.html(this.template( this.model.attributes ));
      return this;
    }
  });

  app.numView = Backbone.View.extend({ 
    template: _.template( $('#tmpl-num-answer').html() ),
    render: function() {
      this.$el.html(this.template( this.model ));
      return this;
    }
  });

  app.MainView = Backbone.View.extend({
    el: '.page .container',
    initialize: function() {
      app.mainView = this;

      app.moodView = new app.MoodView();
      app.questionView = new app.QuestionView();
    }
  });

  app.Router = Backbone.Router.extend({
    initialize: function() {
      app.mainView = new app.MainView();
    }
  });

  $(document).ready(function() {

    app.router = new app.Router();
    Backbone.history.start();

    
    $('button.add').click(createAnswer);
    $('button#submit').click(submitQuestion);
    $('select#questionType').change(selectQuestionType);


    resetQuestionForm();


    $('#provideDate').datetimepicker({
      icons: {
          time: "fa fa-clock-o",
          date: "fa fa-calendar",
          up: "fa fa-arrow-up",
          down: "fa fa-arrow-down"
      }
    });
  });

  var remove_mood = function (event) {
    var moodID = event.currentTarget.attributes['data-moodhash'].value;
    $.ajax({
        url: '/api/moods/' + moodID,
        type: 'DELETE',
        success: function () {
          app.moodView.collection.fetch();
        }
    });
  }

  var remove_question = function (event) {
    var questionID = event.currentTarget.attributes['data-questionhash'].value;
    $.ajax({
        url: '/api/questions/' + questionID,
        type: 'DELETE',
        success: function () {
           app.questionView.collection.fetch();
        }
    })
  }

  var resetQuestionForm = function (type) {
    var mc, num, addAnswer;
    mc = $('div#mcAnswers');
    num = $('div#numAnswers');
    addAnswer = $('button.add');

    type = type || '';

    mc.empty();

    answer_count = 0;

    createAnswer();

    switch (type) {
        case 'mc':          
        case 'emc':
          num.hide();
          mc.show();
          addAnswer.show();
          break;
        case 'num':
          num.show();
          mc.hide();
          addAnswer.hide();
          break;
        default:

          // hide non-default question type(s)
          num.hide();
          break;
    }
  }

  var createAnswer = function (event) {
    if (event) {      
      event.preventDefault();
    }

    // add a new answer input, and increment the answer count
    answer_count++;
    var answer_html = '' +
            '<div class="form-group">' +
            '<label for="answer' + answer_count + '">Answer ' + answer_count + '</label> ' +
            '<input id="answer' + answer_count + '" class="form-control answer" type="text" />' +
            '</div>';
    $('div#mcAnswers').append(answer_html);
  }

  var submitQuestion = function () {
     event.preventDefault();
    /**
     * The question form cannot be submitted as is - the API accepts an array of answers,
     *  and the answer data is formatted as individual fields.
     *
     */
    var question = $('input#question'),
        answers_value = $('input.answer'),
        answers,
        content = question[0].value,
        type    = $('select#questionType').val(),
        provideDate = $('#provideDate').data("DateTimePicker").getDate().format(),
        timeframe =$('#timeframe').val();

    // type-specific grooming
    switch (type) {
        case 'mc':
        case 'emc':
            var answers = [];
            // pull answer values out of the fields
            _.each(answers_value, function (answer_el) {
                answers.push(answer_el.value);
            });
            answers = _.reject(answers, function(ans) {
              return ans === '';
            })
            break;
        case 'num':
            answers = {
                min: $('input#rangeMin').val(),
                max: $('input#rangeMax').val()
            };
            break;
        default:
            answers = [];
            break;
    }


    $.ajax({
      data: {
        type: type,
        content: content,
        provideDate: provideDate,
        possibleAnswers: answers,
        timeframe: timeframe
      },
      type: 'POST',
      dataType: 'json',
      url: '/api/questions',
      success: function () {
        var status =  $('div#questionStatus');

        // display success message
        status.empty();
        status.append($('<div/>', {
            class: 'alert alert-success',
            text: 'Creation successful'
        }));

        app.questionView.collection.fetch();
        resetQuestionForm();
      },
      error: function (error) {
        var status =  $('div#questionStatus');

        // display error message
        status.empty();
        status.append($('<div/>', {
          class: 'alert alert-danger',
          html: '<strong>ERROR: ' + error.status + ' ' + error.statusText + '</strong> ' + error.responseText
        }));
      }
    });
  }

  var selectQuestionType = function () {
      var type = $(this).val();

      resetQuestionForm(type);
  }

}());