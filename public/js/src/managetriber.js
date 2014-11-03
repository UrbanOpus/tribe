/* global app:true */

(function() {
  'use strict';

  var app = app || {};

  app.Triber = Backbone.Model.extend({
    idAttribute: '_id',
    defaults: {
      _id: undefined,
      uuid: '',
      income:'',
      tribeEnabled: '',
      gender: ''
    },
    url: function() {
      return '/api/users/' + this.id;
    }
  });

  app.TriberCollection = Backbone.Collection.extend({
    model: app.Triber,
    url: '/api/users'
  });

  app.TriberView = Backbone.View.extend({
    el: '#triberBody',
    initialize: function() {
      this.collection = new app.TriberCollection();
      this.listenTo(this.collection, 'sync', this.render);
      this.collection.fetch();
      this.render();
    },
    render: function() {
      $(this.el).html('');
      var frag = document.createDocumentFragment();
      _.each(this.collection.models, function(triber) {
        var view = new app.TriberRowView({ model: triber });
        frag.appendChild(view.render().el);
      });
      $(this.el).append(frag);
    }
  });

  app.TriberRowView = Backbone.View.extend({
    tagName: 'tr',    
    template: _.template( $('#tmpl-tribe-row').html() ),
    render: function() {
      this.$el.html(this.template( this.model.attributes ));
      this.$el.find('.close-triber').attr("data-uuid", this.model.attributes.uuid);
      this.$el.find('.close-triber').click(remove_triber);
      this.$el.find('.toggle-tribe').attr("data-uuid", this.model.attributes.uuid);
      this.$el.find('.toggle-tribe').click(toggleTribe);
      return this;
    }
  });

  app.MainView = Backbone.View.extend({
    el: '.page .container',
    initialize: function() {
      app.mainView = this;

      app.triberView = new app.TriberView();
    }
  });

  app.Router = Backbone.Router.extend({
    initialize: function() {
      app.mainView = new app.MainView();
    }
  });

  var remove_triber = function (event) {
    var triberID = this.attributes['data-uuid'].value;
    $.ajax({
        url: '/api/users/' + triberID,
        type: 'DELETE',
        success: function () {
          app.triberView.collection.fetch();
        }
    });
  }

  var toggleTribe = function (event) {
    var triberID = this.attributes['data-uuid'].value;
    $.ajax({
        url: '/api/toggletribe/' + triberID,
        type: 'PUT',
        success: function () {
          app.triberView.collection.fetch();
        }
    });
  }

  $(document).ready(function() {

    app.router = new app.Router();
    Backbone.history.start();

  });

}());