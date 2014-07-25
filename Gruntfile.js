module.exports = function (grunt) {

  grunt.initConfig({

    pkg: grunt.file.readJSON('package.json'),

    mochaTest: {
      options: {
        reporter: 'spec'
      },
      src: [ 'test/*.js' ]
    },

    clean: {
      "modules": [ 'test/fake-titanium-app/modules' ],
      "app": [ 'test/fake-titanium-app/build' ]
    },

    titaniumifier: {
      "module": {}
    },

    titanium: {
      "ios": {
        options: {
          command: 'build',
          logLevel: 'info',
          projectDir: './test/fake-titanium-app',
          platform: 'ios',
          iosVersion: grunt.option('ios-version')
        }
      },
      "droid": {
        options: {
          command: 'build',
          logLevel: 'trace',
          projectDir: './test/fake-titanium-app',
          platform: 'android',
          deviceId: grunt.option('device-id')
        }
      }
    },

    unzip: {
      "module": {
        src: '<%= pkg.name %>-commonjs-<%= pkg.version %>.zip',
        dest: 'test/fake-titanium-app'
      }
    }

  });

  grunt.loadNpmTasks('grunt-contrib-clean');
  grunt.loadNpmTasks('grunt-mocha-test')
  grunt.loadNpmTasks('grunt-titanium')
  grunt.loadNpmTasks('grunt-titaniumifier')
  grunt.loadNpmTasks('grunt-zip');

  grunt.registerTask('test:node', [ 'mochaTest' ]);

  grunt.registerTask('setup-spec', function () {
    grunt.file.copy('./test/config.js', './test/fake-titanium-app/Resources/config.js', {
      process: banner
    });
    grunt.file.copy('./test/spec.js', './test/fake-titanium-app/Resources/spec.js', {
      process: banner
    });

    function banner(source) {
      return "\n\n/* DO NOT MODIFY THIS FILE! Work on test/spec.js instead! */\n\n" + source;
    }
  });

  grunt.registerTask('build:titanium', [ 'titaniumifier:module' ]);
  grunt.registerTask('test:ios', [ 'unzip:module', 'setup-spec', 'titanium:ios' ]);
  grunt.registerTask('test:droid', [ 'unzip:module', 'setup-spec', 'titanium:droid' ]);

  grunt.registerTask('ios', [ 'clean', 'build:titanium', 'test:ios' ]);
  grunt.registerTask('droid', [ 'clean', 'build:titanium', 'test:droid' ]);

  grunt.registerTask('default', [ 'test:node' ]);

};
