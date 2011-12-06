var secstore = require("../../../Manager/Storage/src/main/javascript/securestore.js");

var storePass = "PZpassword"; 
var storeFile = "./auth.zip";
var storeDir  = "./authentication";


secstore.open(storePass, storeFile, storeDir, function(err) {	
	"use strict";
	if (err === undefined || err === null) {
		console.log("Secure storage opened");
	} else {		
		console.log("Error: " + err);
	}
});


