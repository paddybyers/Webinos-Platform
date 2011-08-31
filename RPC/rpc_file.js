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
	
	if (tmp.readyState = tmp.DONE){
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
	var tmp = saver.saveAs(blob,name);
	
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
	
	if (tmp.readyState = tmp.DONE){
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
		errorCB(["NOT_READABLE_ERR"]);
		return;
	}
	
	console.log('Created File obj: ' + file.name + ' with size: ' + file.size);

	reader.onload = function (evt) {  
		var fileString = evt.target.result;
		successCB([fileString+""]);
		console.log('write result');
	};
	
	reader.onerror = function (evt) {  
		errorCB([error.target.error.name]);
	};

	reader.readAsText(file, "UTF-16");
}


fileReader = {};
fileReader.readFileAsString = getTextFile;
webinos.rpc.registerObject("FileReader", fileReader);

fileSaver = {};
fileSaver.saveAs = saveBlob;
webinos.rpc.registerObject("FileSaver", fileSaver);

fileWriter = {};
fileWriter.write = writeBlob;
fileWriter.truncate = truncate;
webinos.rpc.registerObject("FileWriter", fileWriter);