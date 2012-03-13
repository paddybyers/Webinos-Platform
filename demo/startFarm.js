var fs = require('fs'),
	PzhFarm             = require('../webinos/pzh/lib/pzh_farm.js');

var host = null, name = null;

function help() {
    console.log('Usage: node startPzh.js [options]');
    console.log('Options:');
    console.log('--host=[host]            host of the pzh (default localhost)');
    console.log('--name=[identifier]      common name in the certificate (default PzhFarm)');
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


if ( host === null) {
	host = 'localhost';
}
if ( name === null) {
	name = 'PzhFarm';
}

var contents ="country=UK\nstate=MX\ncity=ST\norganization=Webinos\norganizationUnit=WP4\ncommon="+name+"\nemail=internal@webinos.org\ndays=180\n"
PzhFarm.startFarm(host, contents, function(result) {
	console.log('******* PZH FARM STARTED *******');	
});


