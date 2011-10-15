var secstore = require("../../../Manager/Storage/src/main/javascript/securestore.js");

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


