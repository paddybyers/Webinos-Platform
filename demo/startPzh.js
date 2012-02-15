var fs = require('fs'),
	path                = require('path'),
	Pzh                 = require('../webinos/pzh/lib/pzh_sessionHandling.js'),
	PzhFarm             = require('../webinos/pzh/lib/pzh_farm.js'),
	PzhWebInterface     = require('../webinos/pzh/web/pzh_web_interface.js'),
	PzhConnect          = require('../webinos/pzh/lib/pzh_connecting.js');

var host = null, name = null;

function help() {
    console.log('Usage: node startPzh.js [options]');
    console.log('Options:');
    console.log('--host=[host]            host of the pzh (default localhost/webinos)');
    console.log('--name=[identifier]      configuration name (default: PZH )');
    process.exit();
}

process.argv.forEach(function (arg) {
	  var parts;
	  if (arg.indexOf('--') > -1) {
	    parts = arg.split('=');
	    if (parts.length > 1) {
	      switch (parts[0]) {
	      case '--host':
	        host = parts[1];
	        break;
	      case '--name':
	        name = parts[1];
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

if(host === null){
	host = 'localhost/webinos';
} 
if (name === null) {
	name = 'PZH';
}

var contents ="country=UK\nstate=MX\ncity=ST\norganization=Webinos\norganizationUnit=WP4\ncommon="+name+"\nemail=internal@webinos.org\ndays=180\n"
Pzh.addPzh(host, contents, pzhModules, function(res,instance) {
	console.log('******* PZH STARTED ******* '+res);		
});


