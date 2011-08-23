var w3cfile = require('./impl_file.js');

exports.getRPCHandler = getRPCHandler;


function getRPCHandler () {
	var handler = {};
	
	/**
	 * Handler for W3C File Reader API calls
	 */
	handler.FileReader = function (rpcObject, connectedClient) {
		if ( rpcObject.method == 'readFileAsString')getTextFile(rpcObject, connectedClient);
	}

	/**
	 * Handler for W3C File Saver API calls (as part of the W3C FileWriter API)
	 */
	handler.FileSaver = function (rpcObject, connectedClient) {
		if ( rpcObject.method == 'saveAs')saveBlob(rpcObject, connectedClient); 
	}

	/**
	 * Handler for W3C File Writer API calls (as part of the W3C FileWriter API)
	 */
	handler.FileWriter = function (rpcObject, connectedClient) {
		if ( rpcObject.method == 'write')writeBlob(rpcObject, connectedClient);
	}
	
	return handler;
}


function saveBlob (rpc, client) {
	var saver = new w3cfile.createFileSaver();
	var blob = rpc.params[0];
	var name = rpc.params[1];
	
	
	
	console.log("Should save: " + blob.__dataAsString + " to: " + name);
	var tmp = saver.saveAs(blob,name);
	
	tmp.onwritestart = function () {
		var res = {};
		res.method = "FileSaver.onwritestart";
		res.params = [];
		res.objectRef = rpc.objectRef;
		client.write(JSON.stringify(res));
	}
	
	tmp.onwriteend = function () {
		var res = {};
		res.method = "FileSaver.onwriteend";
		res.params = [];
		res.objectRef = rpc.objectRef;
		client.write(JSON.stringify(res));
	}
	
	tmp.onerror = function (e) {
		var res = {};
		res.method = "FileSaver.onerror";
		res.params = arguments;
		res.objectRef = rpc.objectRef;
		client.write(JSON.stringify(res));
	}
	
	if (tmp.readyState = tmp.DONE){
		var res = {};
		res.method = "FileSaver.onwriteend";
		res.params = [];
		res.objectRef = rpc.objectRef;
		client.write(JSON.stringify(res));
	}
}

function writeBlob (rpc, client) {
	var writer = new w3cfile.createFileWriter();
	var blob = rpc.params[0];
	var name = rpc.params[1];
	
	console.log("Should write: " + blob.__dataAsString + " to: " + name);
	var tmp = writer.writeAs(name);
	
	tmp.onwritestart = function () {
		var res = {};
		res.method = "FileWriter.onwritestart";
		res.params = [];
		res.objectRef = rpc.objectRef;
		client.write(JSON.stringify(res));
	}
	
	tmp.onwrite = function () {
		var res = {};
		res.method = "FileWriter.onwrite";
		res.params = [];
		res.objectRef = rpc.objectRef;
		client.write(JSON.stringify(res));
	}
	
	tmp.onwriteend = function () {
		writeSuccessWrite(client, rpc.objectRef);
	}
	
	tmp.onerror = function (e) {
		var res = {};
		res.method = "FileWriter.onerror";
		res.params = arguments;
		res.objectRef = rpc.objectRef;
		client.write(JSON.stringify(res));
	}
	
	tmp.write(blob);
	
}

function writeSuccessWrite(client, objectRef){
	var res = {};
	res.method = "FileWriter.onwriteend";
	res.params = [];
	res.objectRef = objectRef;
	client.write(JSON.stringify(res));
}


function getTextFile(fileName, client) {

	var reader = new w3cfile.createFileReader();
	var file;
	
	try{
		file = new w3cfile.createFile(fileName.params[0]);
	}
	catch (e) {
		var res = {};
		res.error = ["NOT_READABLE_ERR"];
		res.result = null;
		res.id = fileName.id;
		client.write(JSON.stringify(res));
		return;
	}
	
	console.log('Created File obj: ' + file.name + ' with size: ' + file.size);

	// Handle progress, success, and errors
	reader.onload = function (evt) {  
		// Obtain the read file data    
		var fileString = evt.target.result;
		// Handle UTF-16 file dump
		//console.log("File content: " + fileString);
		var res = {};
		res.result = [fileString+""];
		res.error = null;
		res.id = fileName.id;
		client.write(JSON.stringify(res));
		console.log('write result');
	};
	
	reader.onerror = function (evt) {  
		var res = {};
		res.id = fileName.id;
		res.error = [error.target.error.name];
		res.result = null;
		client.write(JSON.stringify(res));
	};

	reader.readAsText(file, "UTF-16");


}