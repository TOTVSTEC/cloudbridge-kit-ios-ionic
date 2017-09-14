var path = require('path'),
	fs = require('fs'),
	os = require('os'),
	Q = null,
	shelljs = null,
	utils = null,
	inquirer = null,
  child_process = require('child_process');

const OPTIONS_OVERWIRTE = 0,
	OPTIONS_RENAME = 1;

module.exports.run = function run(cli, targetPath, projectData) {
	var task = new InstallTask(cli, targetPath, projectData);

	return task.run();
};

class InstallTask {

	constructor(cli, targetPath, projectData) {
		this.cli = cli;
		this.projectDir = targetPath;
		this.projectData = projectData;

		Q = cli.require('q');
		shelljs = cli.require('shelljs');
		inquirer = cli.require('inquirer');
		utils = cli.utils;
	}

	run() {
		var self = this;

		return Q()
			.then(function() {
				return self.checkForExistingFiles();
			})
			.then(function(action) {
				var promise = null;

				if (action === OPTIONS_RENAME) {
					promise = self.renameSources();
				}
				else {
					promise = self.cleanSources();
				}
				if (promise !== null) {
					return promise;
				}
			})
			.then(function() {
				return self.runIonic();
			})
			.then(function() {
				return self.copySources();
			});
		// .then(function() {
		// 	var restoreTask = require('./restore');

		// 	return restoreTask.run(self.cli, self.projectDir, self.projectData);
		// });
	}

	cleanSources() {
		var srcPath = path.join(this.projectDir, 'platforms', 'ios');

		if (fs.existsSync(srcPath)) {
			shelljs.rm("-rf", srcPath);
		}

		return Q();
	}

	copySources() {
		var srcPath = path.join(__dirname, "src"),
			binPath = path.join(__dirname, "libs"),
			assetsPath = path.join(__dirname, "assets"),
			projPath = path.join(__dirname, "prj"),
			pkgData = {
				project: require(path.join(this.projectDir, 'package.json'))
			},
			projectDisplayName = pkgData.project.displayName || "MyApp",
			targetPath = path.join("platforms", "ios"),
			targetSrcPath = path.join(targetPath, projectDisplayName),
			targetBinPath = targetPath,
			targetAssetsPath = path.join(targetPath, projectDisplayName),
			targetProjPath = path.join(targetPath, projectDisplayName + ".xcodeproj");

		//Sources
		var fsources = shelljs.ls(path.join(srcPath, "/*"));
		for (var i = 0; i < fsources.length; i++) {
			var targetFile = path.join(targetSrcPath, path.basename(fsources[i]));
			shelljs.cp("-f", fsources[i], targetFile);
		}
		//Remove default main.m
		var srcMainStdFile = path.join(targetSrcPath, "main.m");
		if (shelljs.test('-e', srcMainStdFile)) {
			shelljs.rm("-f", srcMainStdFile);
		}

		//Binario
		var fbin = shelljs.ls("-d", path.join(binPath, "/*"));
		for (var i = 0; i < fbin.length; i++) {
			shelljs.cp("-rf", fbin[i], targetBinPath);
		}
		//Unzip Binario
		var zipBinLibFile = path.join(targetPath, "libappserver.zip");
		if (shelljs.test('-e', zipBinLibFile)) {
			if (shelljs.exec('unzip ' + zipBinLibFile + ' -d ' + targetPath).code !== 0) {
				shelljs.echo('Error: unzip failed');
			}
			else {
				shelljs.rm("-rf", zipBinLibFile);
			}
		}

		//Assets
		var fassets = shelljs.ls(path.join(assetsPath, "*"));
		for (var i = 0; i < fassets.length; i++) {
			shelljs.cp("-rf", fassets[i], targetAssetsPath);
		}

		//Project template
		utils.copyTemplate(projPath, targetProjPath, pkgData, /\.(pbxproj)/);
	}

	checkForExistingFiles() {
		var deferred = Q.defer(),
			targetPath = path.join(this.projectDir, 'platforms', 'ios');

		if (fs.existsSync(targetPath)) {
			inquirer.prompt([{
				type: 'list',
				name: 'action',
				message: ['The directory'.error.bold, targetPath, 'already exists.\n'.error.bold].join(' '),
				choices: [
					{
						name: 'Clean',
						value: OPTIONS_OVERWIRTE, //'overwrite',
						short: '\nCleaning folder and files...'
					},
					{
						name: 'Rename',
						value: OPTIONS_RENAME,// 'rename',
						short: '\nRenaming the existing directory and copying the new files...'
					},
					new inquirer.Separator(' ')
				],
				default: OPTIONS_RENAME	//'rename'
			}]).then(function(answers) {
				deferred.resolve(answers.action);
			});
		}
		else {
			deferred.resolve({});
		}

		return deferred.promise;
	}

	renameSources() {
		var srcPath = path.join(this.projectDir, 'platforms', 'ios'),
			targetPath = path.join(this.projectDir, 'platforms', 'ios.old');

		if (fs.existsSync(targetPath)) {
			var count = 1;
			while (fs.existsSync(targetPath + '.' + count)) {
				count++;
			}

			targetPath += '.' + count;
		}

		shelljs.mv(srcPath, targetPath);

		return Q();
	}

	runIonic() {
    try {
      child_process.execSync("ionic cordova platform add ios", { stdio: [0, 1 ,2] });
    }
    catch (e) {
			shelljs.rm('-rf', path.join(_this.projectDir, "platforms", "ios"));
			throw e;
		}

		return Q();
	}
}
