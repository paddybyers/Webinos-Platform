
var helper = exports;

var crashMsg;


helper.setDebugStream = function(stream) {
	crashMsg = stream;
}

helper.debug = function(num, msg) {
	"use strict";
	var info = true; // Change this if you want no prints from session manager
	var debug = true;
	
	if(num === 1 || num === 'ERROR') {
		console.log('ERROR: ' + msg);
// 		if(crashMsg != null) {
// 			crashMsg.write(msg);
// 			crashMsg.write('\n');
// 		}
	} else if((num === 2  || num === 'INFO')&& info) {
		console.log('INFO: ' + msg);		
	} else if((num === 3 || num === 'DEBUG')&& debug) {
		console.log('DEBUG: ' + msg);
	}	
};
