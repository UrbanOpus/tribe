/* global app:true */

(function() {
  'use strict';

  var app = app || {};

  app.Tribe = Backbone.Model.extend({
    idAttribute: '_id',
    defaults: {
      _id: undefined,
      name: '',
      category:'',
      imgsrc: '',
      createdAt: '',
      summary: ''
    },
    parse: function (tribe) {
      tribe.createdAt = moment(tribe.createdAt).format('l');
      return tribe;
    },
    url: function() {
      return '/api/tribe/' + this.id;
    }
  });

  app.TribeCollection = Backbone.Collection.extend({
    model: app.Tribe,
    url: '/api/tribes'
  });

  app.TribeView = Backbone.View.extend({
    el: '#tribesBody',
    initialize: function() {
      this.collection = new app.TribeCollection();
      this.listenTo(this.collection, 'sync', this.render);
      this.collection.fetch();
      this.render();
    },
    render: function() {
      $('#tribesBody').html('');
      var frag = document.createDocumentFragment();
      _.each(this.collection.models, function(tribe) {
        var view = new app.TribesRowView({ model: tribe });
        frag.appendChild(view.render().el);
      });
      $('#tribesBody').append(frag);
    }
  });

  app.TribesRowView = Backbone.View.extend({
    tagName: 'tr',    
    template: _.template( $('#tmpl-tribe-row').html() ),
    render: function() {
      this.$el.html(this.template( this.model.attributes ));
      this.$el.find('.close-mood').attr("data-tribehash", this.model.attributes._id);
      this.$el.find('.close-mood').click(remove_tribe);
      this.$el.find('.tribe-name').attr("href", '/tribes/' + this.model.attributes._id);
      return this;
    }
  });

  app.MainView = Backbone.View.extend({
    el: '.page .container',
    initialize: function() {
      app.mainView = this;

      app.tribeView = new app.TribeView();
    }
  });

  app.Router = Backbone.Router.extend({
    initialize: function() {
      app.mainView = new app.MainView();
    }
  });

  var remove_tribe = function (event) {
    var tribeID = this.attributes['data-tribehash'].value;
    $.ajax({
        url: '/api/tribes/' + tribeID,
        type: 'DELETE',
        success: function () {
          app.tribeView.collection.fetch();
        }
    });
  }

  $(document).ready(function() {

    app.router = new app.Router();
    Backbone.history.start();

    $('#submit').on('click', function (event) {
      event.preventDefault();

      var data = {};

      data.name = $('#tribeName').val();
      data.category = $('select option:selected').text();
      data.imgsrc = $('#imagesrc').val();
      data.summary = $('#tribesummary').val();

      $.post('/api/tribes',data, function (tribe) {
        app.tribeView.collection.fetch();
      });

    });
  });

}());