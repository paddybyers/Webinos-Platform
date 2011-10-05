var secstore = require("./securestore.js");
var fs = require('fs');

var storePass = "PZpassword"; 
var storeFile = "./auth.zip";
var storeDir  = "./authentication";



secstore.open(storePass, storeFile, storeDir, function(err) {	
	if (err === undefined || err === null) {
		console.log("Secure storage opened");
	} else {		
		console.log("Error: " + err);
	}
});


