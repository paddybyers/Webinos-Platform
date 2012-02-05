var fs = require('fs'),
	path                = require('path'),
	Pzh                 = require('../webinos/pzh/lib/pzh_sessionHandling.js'),
	PzhWebInterface     = require('../webinos/pzh/web/pzh_web_interface.js');

var options = {};

function help() {
    console.log('Usage: node startPzh.js [options]');
    console.log('Options:');
    console.log('--host=[host]            host of the pzh (default localhost)');
    console.log('--port=[port]            port to host the pzh (default 8000)');
    console.log('--pzh-web-port=[port]    port to pzp web server (default 8083)');
    process.exit();
}

process.argv.forEach(function (arg) {
	  var parts;
	  if (arg.indexOf('--') > -1) {
	    parts = arg.split('=');
	    if (parts.length > 1) {
	      switch (parts[0]) {
	      case '--host':
	        options.host = parts[1];
	        break;
	      case '--port':
	    	  options.port = parseInt(parts[1], 10);
	    	  break;
	      case '--pzh-web-port':
	    	  options.pzhWebPort = parseInt(parts[1], 10);
	    	  break;
	      default:
	        console.log('unknown option: ' + parts[0]);
	        break;
	      }
	    }
	    else if (parts[0] === '--help') {
	    	help();
	    }
	  }
});

var pzhModules = [
    {name: "get42", params: [99]}//,
 //   {name: "events", param: {}}
];


Pzh.startFarm(function() {
	
	Pzh.startPzh(config, pzhModules, function(res,instance) {
		console.log('******* PZH STARTED *******');
		Pzh.startPzh(config, pzhModules, function(res,instance) {
			console.log('******* PZH1 STARTED *******');
		});			
	});
});

