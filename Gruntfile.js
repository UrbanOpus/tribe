var path = require('path');

module.exports = function(grunt) {
  grunt.initConfig({
    pkg: grunt.file.readJSON('package.json'),
    copy: {
      vendor: {
        files: [
          {
            expand: true, cwd: 'bower_components/bootstrap/',
            src: ['dist/js/**'], dest: 'public/js/vendor/bootstrap/'
          },
          {
            expand: true, cwd: 'bower_components/bootstrap/',
            src: ['less/**'], dest: 'public/css/vendor/bootstrap/'
          },
          {
            expand: true, cwd: 'bower_components/backbone/',
            src: ['backbone.js'], dest: 'public/js/vendor/backbone/'
          },
          {
            expand: true, cwd: 'bower_components/eonasdan-bootstrap-datetimepicker/build/js/',
            src: ['bootstrap-datetimepicker.min.js'], dest: 'public/js/vendor/bootstrap-datetimepicker/'
          },
          {
            expand: true, cwd: 'bower_components/font-awesome/',
            src: ['fonts/**', 'less/**'], dest: 'public/css/vendor/font-awesome/'
          },          
          {
            expand: true, cwd: 'bower_components/bootstrap-social/',
            src: ['bootstrap-social.less'], dest: 'public/css/vendor/bootstrap-social/'
          },          
          {
            expand: true, cwd: 'bower_components/ionicons/',
            src: ['less/**'], dest: 'public/css/vendor/ionicons/'
          },
          {
            expand: true, cwd: 'bower_components/eonasdan-bootstrap-datetimepicker/src/less/',
            src: ['bootstrap-datetimepicker.less'], dest: 'public/css/vendor/bootstrap-datetimepicker/'
          },
          {
            expand: true, cwd: 'bower_components/jquery/dist/',
            src: ['jquery.js','jquery.min.js', 'jquery.min.map'], dest: 'public/js/vendor/jquery/'
          },          
          {
            expand: true, cwd: 'bower_components/jquery-ui/',
            src: ['jquery-ui.min.js'], dest: 'public/js/vendor/jquery-ui/'
          },
          {
            expand: true, cwd: 'bower_components/momentjs/',
            src: ['moment.js'], dest: 'public/js/vendor/momentjs/'
          },
          {
            expand: true, cwd: 'bower_components/underscore/',
            src: ['underscore.js'], dest: 'public/js/vendor/underscore/'
          },
          {
            expand: true, cwd: 'bower_components/jquery-ui/ui/',
            src: ['jquery-ui.js'], dest: 'public/js/vendor/jquery-ui/'
          }
        ]
      }
    },    
    clean: {
      vendor: {
        src: ['public/js/vendor/**', 'public/css/vendor']
      }
    }
  });

  grunt.loadNpmTasks('grunt-contrib-copy');
  grunt.loadNpmTasks('grunt-contrib-clean');

  grunt.registerTask('default', ['copy:vendor']);
};
