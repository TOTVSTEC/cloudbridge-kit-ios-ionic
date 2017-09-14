var task = module.exports,
	path = require('path'),
	shelljs = null;

task.run = function run(cli, targetPath, projectData) {
	shelljs = cli.require('shelljs');
	Q = cli.require('q');

	if (shelljs.exec("ionic cordova platform remove ios").code != 0) {
		throw new Error("Make sure cordova is installed (npm install -g cordova).");
	}

	return Q();
};
