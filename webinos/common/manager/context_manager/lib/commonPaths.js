var path = require('path');
var os = require('os');

var moduleRoot = path.resolve(__dirname, '../') + '/';
var moduleDependencies = require(moduleRoot + '/dependencies.json');
var modulePackage = require(moduleRoot + '/package.json');
var webinosRoot = path.resolve(moduleRoot + moduleDependencies.root.location) + '/';

var modulePackageName = modulePackage.name;

function getUserFolder(){
	switch(os.type().toLowerCase()){
	case 'windows_nt':
		return path.resolve(process.env.appdata + '/webinos/');
		break;
	case 'linux':
	case 'darwin':
		return path.resolve(process.env.HOME + '/.webinos/');
		break;
	default:
		console.log('[WARNING] Unknown OS.\nPlease send an email to cbot [at] epu [dot] ntua [dot] gr with:\nYour OS type, which is "' + os.type() + '"\nand the full user data path.', 'white+red_bg');
		return null;
		break;
	}
}


commonPaths = function (){
	var userFolder = getUserFolder(); 
	this.storage = (userFolder!==null) ? (path.resolve(userFolder + '/' + modulePackageName) + '/') : null;
	this.local = moduleRoot;
	this.global = webinosRoot;
}
module.exports = new commonPaths();
