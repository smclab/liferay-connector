module.exports = function (grunt) {

	grunt.initConfig({

		mochaTest: {
			options: {
				reporter: 'spec'
			},
			src: [ 'test/*.js' ]
		}

	});

	grunt.loadNpmTasks('grunt-mocha-test')

	grunt.registerTask('test:node', [ 'mochaTest' ]);

	grunt.registerTask('default', [ 'test:node' ]);

};