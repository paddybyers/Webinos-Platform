var fs = require('fs'),
	path                = require('path'),
	Pzh                 = require('../webinos/pzh/lib/pzh_sessionHandling.js'),
	PzhFarm             = require('../webinos/pzh/lib/pzh_farm.js'),
	PzhWebInterface     = require('../webinos/pzh/web/pzh_web_interface.js');

var options = {};

function help() {
    console.log('Usage: node startPzh.js [options]');
    console.log('Options:');
    console.log('--host=[host]            host of the pzh (default localhost)');
    console.log('--port=[port]            port to host the pzh (default 443)');
    console.log('--pzh-web-port=[port]    port to pzp web server (default 80)');
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

	      }
	    }
	    else if (parts[0] === '--help') {
	    	help();
	    }
	  }
});

var pzhModules = [
    {name: "get42", params: [99]},
    {name: "events", param: {}}
];

var contents ="country=UK\nstate=MX\ncity=ST\norganization=Webinos\norganizationUnit=WP4\ncommon=pzhFarm\nemail=internal@webinos.org\ndays=180\n"

PzhFarm.startFarm('localhost' , contents, function(result) {
	var contents ="country=UK\nstate=MX\ncity=ST\norganization=Webinos\norganizationUnit=WP4\ncommon=pzh1\nemail=internal@webinos.org\ndays=180\n"
	Pzh.addPzh('localhost/john', contents, pzhModules, function(res,instance) {
		console.log('******* PZH STARTED *******');
		var contents ="country=UK\nstate=MX\ncity=ST\norganization=Webinos\norganizationUnit=WP4\ncommon=pzh2\nemail=internal@webinos.org\ndays=180\n"
		Pzh.addPzh('localhost/janon',contents, pzhModules, function(res,instance) {
			console.log('******* PZH1 STARTED *******');
		});
	});
});

