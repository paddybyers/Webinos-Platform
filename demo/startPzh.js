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

if (options.host === '' || options.port <= 0) {
	help();
} else {
	Pzh.startFarm(function() {
		fs.readFile(path.join(__dirname, 'config-pzh.json'), function(err, data) {
			var config;

			if (err) {
				console.warn("could not load config-pzh.json\n" + err.toString());
				config = {};
			}
			else {
				config = JSON.parse(data);
			}

			if (!config.host) {
				config.host = 'localhost';
			}
			if (!config.port) {
				config.port = 8000;
			}
			if (!config.pzhWebPort) {
				config.pzhWebPort = 8083;
			}
			if (options.host) {
				config.host = options.host;
			}
			if (options.port) {
				config.port = options.port;
			}
			if (options.pzhWebPort) {
				config.pzhWebPort = options.pzhWebPort;
			}

			var contents ="country=UK\nstate=MX\ncity=ST\norganization=Webinos\norganizationUnit=WP4\ncommon=WebinosPzh\nemail=internal@webinos.org\ndays=180\n" ;
s
			Pzh.startPzh(contents, 'localhost/john', pzhModules, function(res,instance) {
				console.log('******* PZH STARTED *******');
				var contents ="country=UK\nstate=MX\ncity=ST\norganization=Webinos\norganizationUnit=WP4\ncommon=WebinosPzh1\nemail=internal@webinos.org\ndays=180\n" ;

				Pzh.startPzh(contents, 'localhost/habib', pzhModules, function(res,instance) {
					console.log('******* PZH1 STARTED *******');
				});
				var requestClientCert = true;   // Are we requesting a client certificate?
				var httpOnly = false;           // Are we running HTTP or HTTPS?

				PzhWebInterface.startServer(config.pzhWebPort, requestClientCert, httpOnly, instance, function(status) {
					if (status) {
						console.log('=== PZH WEB INTERFACE STARTED ===');
					} else {
						console.log('*** PZH WEB INTERFACE FAILED TO START ***');
					}
					
				});


			});
		});
	});
}
