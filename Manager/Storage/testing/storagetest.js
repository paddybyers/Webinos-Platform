



var secstore = require("../securestore.js");

var storePass = "storepass"; 
var storeFile = "./test1-storefile.zip";
var storeDir  = "./test1store";

secstore.open(storePass, storeFile, storeDir, function(err) {	
	console.log("open ");
	if (err === undefined || err === null) {
		console.log("No error from open");		
		console.log("Storing a key value");
		secstore.storeKeyValue(storeDir, "Test", {foo: "bar?"}, function() { 
			console.log("Getting a key value");		
			secstore.getKeyValue(storeDir, "Test", function(error, data) {
				console.log(data);		
				var tty = require('tty');
				tty.setRawMode(true);
				process.stdin.resume();
				process.stdin.on('keypress', function(char, key) {
				  	console.log(char);
					secstore.close(storePass, storeFile, storeDir, function() {
						console.log("closed");
						console.log('graceful exit');
						process.exit();
					});    
				});						
			});
		});
	} else {		
		console.log("Error: " + err);
		process.exit();
	}
	
});

