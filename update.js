var task = module.exports,
	path = require('path'),
	Q = null;
shelljs = null;

task.run = function run(cli, targetPath, projectData) {
	shelljs = cli.require('shelljs');
	Q = cli.require('q');

	if (shelljs.exec("ionic cordova platform update ios").code != 0) {
		throw new Error("Make sure cordova is installed (npm install -g cordova).");
	}

	return Q()
		.then(copyDependencies);
};

function copyDependencies() {
	var binPath = path.join(__dirname, "libs"),
		targetPath = path.join("platforms", "ios"),
		targetBinPath = targetPath;

	//Binario
	var fbin = shelljs.ls("-d", path.join(binPath, "/*"));
	for (var i = 0; i < fbin.length; i++) {
		shelljs.cp("-rf", fbin[i], targetBinPath);
	}
	//Unzip Binario
	var binLibFile = path.join(targetPath, "libappserver.a");
	var zipBinLibFile = path.join(targetPath, "libappserver.zip");
	if (shelljs.test('-e', zipBinLibFile)) {
		if (shelljs.test('-e', binLibFile)) {
			shelljs.rm("-rf", binLibFile);
		}
		if (shelljs.exec('unzip ' + zipBinLibFile + ' -d ' + targetPath).code !== 0) {
			shelljs.echo('Error: unzip failed');
		}
		else {
			shelljs.rm("-rf", zipBinLibFile);
		}
	}
}
