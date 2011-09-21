//node test for zipHelper

var zipHelper = require('../zipHelper');
var path = require('path');
var fs = require('fs');


function rimrafSync(p) {
    "use strict";
    var s = fs.lstatSync(p);
    if (!s.isDirectory()) {
        return fs.unlinkSync(p);
    }
    fs.readdirSync(p).forEach(function (f) {
        rimrafSync(path.join(p, f));
    });
    fs.rmdirSync(p);
}

if (path.existsSync("outzip.zip")) {
    fs.unlinkSync("outzip.zip");
}

zipHelper.makeZipFile("test2", "outzip.zip", function() { 
	//now delete it.
	rimrafSync("test2");
	console.log("Press any key...");
	//now pause
	var tty = require('tty');
	tty.setRawMode(true);
	process.stdin.resume();
	process.stdin.on('keypress', function(char, key) {
	  	console.log(char);
		zipHelper.unzipFile("outzip.zip", function() {
			console.log('graceful exit');
			console.log("Tests passed!");
			process.exit();
		});    
	});

});



