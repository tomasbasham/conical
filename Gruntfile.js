module.exports = function(grunt) {
  'use strict';

  // Project configuration.
  grunt.initConfig({
    pkg: grunt.file.readJSON('package.json'),

    jshint: {
      options: {
        jshintrc: '.jshintrc'
      },
      all: [
        'spec/*.js',
        'src/*.js'
      ]
    },

    // Before generating any new files, remove any previously created files.
    clean: {
      dist: {
        src: ['dist']
      }
    },

    copy: {
      dist: {
        src: 'src/conical.js',
        dest: 'dist/conical.js'
      }
    },

    uglify: {
      dist: {
        options: {
          sourceMap: true
        },
        files: {
          'dist/conical.min.js': 'dist/conical.js'
        }
      }
    },

    mocha_phantomjs: {
      options: {
        timeout: 3000,
        ignoreLeaks: false,
        ui: 'bdd',
        reporter: 'spec'
      },
      all: ['conical.html']
    }
  });

  // Load this project's task(s).
  grunt.loadTasks('tasks');

  // Load third party task(s).
  grunt.loadNpmTasks('grunt-contrib-jshint');
  grunt.loadNpmTasks('grunt-contrib-clean');
  grunt.loadNpmTasks('grunt-contrib-copy');
  grunt.loadNpmTasks('grunt-contrib-uglify');
  grunt.loadNpmTasks('grunt-mocha-phantomjs');

  // Compile JavaScripts.
  grunt.registerTask('scripts', 'Compiles the JavaScripts.', ['uglify']);

  // Compile static assets.
  grunt.registerTask('build', 'Compiles all the assets and copies the files to the dist directory.',
    ['clean', 'copy', 'scripts']);

  // Run unit tests on the JavaScripts.
  grunt.registerTask('test', 'Run unit tests on the JavaScripts.', ['mocha_phantomjs']);

  // Default task.
  grunt.registerTask('default', ['jshint', 'build', 'test']);
};
