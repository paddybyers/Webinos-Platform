var secstore = require("./securestore.js");
var fs = require('fs');

var storePass = "PZpassword"; 
var storeFile = "./auth.zip";
var storeDir  = "./authentication";



secstore.close(storePass, storeFile, storeDir, function(err) {	
	if (err === undefined || err === null) {
		console.log("Secure storage closed");
	} else {		
		console.log("Error: " + err);
	}
});


