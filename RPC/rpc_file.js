var w3cfile = require('./impl_file.js');
if (typeof webinos === 'undefined') var webinos = {};
webinos.rpc = require('./rpc.js');

function truncate (params, successCB, errorCB, objectRef){
	var writer = new w3cfile.createFileWriter();
	var length = params[0];
	var name = params[1];
	
	var tmp = writer.writeAs(name);
	
	tmp.onwritestart = function () {
		var json = webinos.rpc.createRPC(objectRef, "onwritestart");
		webinos.rpc.executeRPC(json);
	}
	
	tmp.onwriteend = function () {
		var json = webinos.rpc.createRPC(objectRef, "onwriteend");
		webinos.rpc.executeRPC(json);
	}
	
	tmp.onwrite = function () {
		var json = webinos.rpc.createRPC(objectRef, "onwrite");
		webinos.rpc.executeRPC(json);
	}
	
	tmp.onerror = function (e) {
		var json = webinos.rpc.createRPC(objectRef, "onerror", arguments);
		webinos.rpc.executeRPC(json);
	}
	
	if (tmp.readyState == tmp.DONE){
		var json = webinos.rpc.createRPC(objectRef, "onwriteend");
		webinos.rpc.executeRPC(json);
		
	}
	
	tmp.truncate(length);

}

function saveBlob (params, successCB, errorCB, objectRef){
	var saver = new w3cfile.createFileSaver();
	var blob = params[0];
	var name = params[1];
	
	console.log("Should save: " + blob.__dataAsString + " to: " + name);
	
	var json = webinos.rpc.createRPC(objectRef, "onwritestart");
	webinos.rpc.executeRPC(json);
	
	tmp = saver.saveAs(blob,name);
	
	tmp.onwritestart = function () {
		var json = webinos.rpc.createRPC(objectRef, "onwritestart");
		webinos.rpc.executeRPC(json);
	}
	
	tmp.onwriteend = function () {
		console.log("saveBlob onwriteend");
		
		var json = webinos.rpc.createRPC(objectRef, "onwriteend");
		webinos.rpc.executeRPC(json);
	}
	
	tmp.onwrite = function () {
		var json = webinos.rpc.createRPC(objectRef, "onwrite");
		webinos.rpc.executeRPC(json);
	}
	
	tmp.onerror = function (e) {
		var json = webinos.rpc.createRPC(objectRef, "onerror", arguments);
		webinos.rpc.executeRPC(json);
	}
	
	if (tmp.readyState == tmp.WRITING){
		var json = webinos.rpc.createRPC(objectRef, "onwrite");
		webinos.rpc.executeRPC(json);
	}
	if (tmp.readyState == tmp.DONE){
		var json = webinos.rpc.createRPC(objectRef, "onwriteend");
		webinos.rpc.executeRPC(json);
	}
}


function writeBlob(params, successCB, errorCB, objectRef) {
	var writer = new w3cfile.createFileWriter();
	var blob = params[0];
	var name = params[1];
	
	console.log("Should write: " + blob.__dataAsString + " to: " + name);
	var tmp = writer.writeAs(name);
	
	tmp.onwritestart = function () {
		var json = webinos.rpc.createRPC(objectRef, "onwritestart");
		webinos.rpc.executeRPC(json);
	}
	
	tmp.onwrite = function () {
		var json = webinos.rpc.createRPC(objectRef, "onwrite");
		webinos.rpc.executeRPC(json);
	}
	
	tmp.onwriteend = function () {
		var json = webinos.rpc.createRPC(objectRef, "onwriteend");
		webinos.rpc.executeRPC(json);
	}
	
	tmp.onerror = function (e) {
		var json = webinos.rpc.createRPC(objectRef, "onerror", arguments);
		webinos.rpc.executeRPC(json);
	}
	tmp.write(blob);
	
}

function getTextFile(params, successCB, errorCB) {

	var reader = new w3cfile.createFileReader();
	var file;
	
	try{
		file = new w3cfile.createFile(params[0]);
	}
	catch (e) {
		console.log('file error');
		errorCB(["NOT_READABLE_ERR"]);
		return;
	}
	
	console.log('Created File obj: ' + file.name + ' with size: ' + file.size);

	reader.onload = function (evt) {  
		var fileString = evt.target.result;
		successCB([fileString+""]);
		console.log('file loaded');
	};
	
	reader.onerror = function (evt) {  
		console.log('file error');
		errorCB([error.target.error.name]);
	};

	reader.readAsText(file, "UTF-16");
}

var fileReader = new RPCWebinosService({
	api:'http://www.w3.org/ns/api-perms/file.read',
	displayName:'FileReader',
	description:'The W3C FileReader API'
});
fileReader.readFileAsString = getTextFile;
webinos.rpc.registerObject(fileReader);

// TODO non standard feature uri
var fileSaver = new RPCWebinosService({
	api:'http://www.w3.org/ns/api-perms/file.save',
	displayName:'FileSaver',
	description:'The W3C FileSaver API'
});
fileSaver.saveAs = saveBlob;
webinos.rpc.registerObject(fileSaver);

var fileWriter = new RPCWebinosService({
	api:'http://www.w3.org/ns/api-perms/file.write',
	displayName:'FileWriter',
	description:'The W3C FileWriter API'
});
fileWriter.write = writeBlob;
fileWriter.truncate = truncate;
webinos.rpc.registerObject(fileWriter);