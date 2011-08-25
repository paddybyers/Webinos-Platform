var webs = require('./websocketserver.js');
var w3cfile = require('./impl_file.js');
var fs = require( 'fs' ), findit = require('findit');


var readTextTestDone = false;
var listFiles = false;

var files = new Array();
findit.find('.', function (file) {
	//console.log(file);
	fs.stat(file,  function (error, stats) {
		if (error) throw error;
		files.push(file);
		if (listFiles) console.log('A File: ' + file + ' and is Dir: ' + stats.isDirectory());

		if (!readTextTestDone && stats.isFile()){
			readTextTestDone = true;
			getAsText(file);
		}
	});
})



function getAsText(readFile) {

	var reader = new w3cfile.createFileReader();

	// Read file into memory as UTF-16      

	var file = new w3cfile.createFile(readFile);
	console.log('Created File obj: ' + file.name + ' with size: ' + file.size);

	// Handle progress, success, and errors
	reader.onprogress = updateProgress;
	reader.onload = function (evt) {  
		// Obtain the read file data    
		var fileString = evt.target.result;
		// Handle UTF-16 file dump
		//console.log("File content: " + fileString);
	};
	reader.onerror = errorHandler;

	reader.readAsText(file, "UTF-16");
}

function updateProgress(evt) {
	if (evt.lengthComputable) {
		// evt.loaded and evt.total are ProgressEvent properties
		var loaded = (evt.loaded / evt.total);
		if (loaded < 1) {
			// Increase the prog bar length
			// style.width = (loaded * 200) + "px";
		}
	}
}



function errorHandler(evt) {
	if(evt.target.error.name == "NOT_READABLE_ERR") {
		console.log("The file could not be read");
	}
	console.log(evt);
}