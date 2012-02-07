var pzp = require('../webinos/pzp/lib/pzp_sessionHandling.js'),
	websocket = require('../webinos/pzp/lib/pzp_websocket.js'),
	fs = require('fs'),
	path = require('path');

var options = {};

function help() {
    console.log('Usage: node startPzp.js [options]');
    console.log('Options:');
    console.log('--pzh-host=[host]        host of the pzh (default localhost)');
    console.log('--pzh-port=[port]        port to host the pzh (default 8000)');
    console.log('--pzp-name=[name]        name of the pzp (default WebinosPzp)');
    console.log('--pzp-host=[name]        host of the pzp (default localhost)');
    console.log('--pzp-http-port=[port]   port to pzp web server (default 8080)');
    console.log('--pzp-ws-port=[port]     port to pzp websocket server (default 8081)');
    console.log('--context-code=[code]    context debug flag (default DEBUG)');
    process.exit();
}

process.argv.forEach(function (arg) {
	  var parts;
	  if (arg.indexOf('--') > -1) {
	    parts = arg.split('=');
	    if (parts.length > 1) {
	      switch (parts[0]) {
	      case '--pzh-host':
	        options.pzhHost = parts[1];
	        break;
	      case '--pzh-port':
	    	  options.pzhPort = parseInt(parts[1], 10);
	    	  break;
	      case '--pzp-name':
	    	  options.pzpName = parts[1];
	    	  break;
	      case '--pzp-host':
	    	  options.pzpHost = parts[1];
	    	  break;
	      case '--pzp-http-port':
	    	  options.pzpHttpPort = parseInt(parts[1], 10);
	    	  break;
	      case '--pzp-ws-port':
	    	  options.pzpWebsocketPort = parseInt(parts[1], 10);
	    	  break;
	      case '--context-code':
	    	  options.code = parts[1];
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

var pzpModules = [
    {name: "get42", param: {}},
    {name: "file", param: {}},
    {name: "geolocation", param: {}},
    {name: "applauncher", param: {}},
//    {name: "events", param: {}},
    {name: "sensors", param: {}},
    {name: "payment", param: {}},
    {name: "tv", param: {}},
    {name: "deviceorientation", param: {}},
    {name: "vehicle", param: {}},
    {name: "context", param: {}},
    {name: "authentication", param: {}},
    {name: "contacts", param: {}},
    {name: "devicestatus", param: {}}
];

if (options.pzhHost === '' || options.pzhPort <= 0) {
	help();
} else {
	fs.readFile(path.join(__dirname, 'config-pzp.json'), function(err, data) {
		var config;
		
		if (err) {
			console.warn("could not load config-pzp.json\n" + err.toString());
			config = {};
		}
		else {
			config = JSON.parse(data);
		}
		
		if (!config.pzhHost) {
			config.pzhHost = 'localhost';
		}
		if (!config.pzhPort) {
			config.pzhPort = 8000;
		}
		if (!config.pzpHost) {
			config.pzpHost='localhost';
		}
		if (!config.pzpHttpPort) {
			config.pzpHttpPort = 8081;
		}
		if (!config.pzpWebsocketPort) {
			config.pzpWebsocketPort = 8082;
		}
		if (!config.pzpName) {
			config.pzpName = 'WebinosPzp';
		}
		if (!config.code) {
			config.code = 'DEBUG';
		}
		if (options.pzhHost) {
			config.pzhHost = options.pzhHost;
		}
		if (options.pzhPort) {
			config.pzhPort = options.pzhPort;
		}
		if (options.pzpHttpPort) {
			config.pzpHttpPort = options.pzpHttpPort;
		}
		if (options.pzpWebsocketPort) {
			config.pzpWebsocketPort = options.pzpWebsocketPort;
		}
		if (options.pzpHost) {
			config.pzpHost = options.pzpHost;
		}
		if (options.pzpName) {
			config.pzpName = options.pzpName;
		}
		if (options.code) {
			config.code = options.code;
		}

		var contents ="pzh_name=localhost\ncountry=UK\nstate=MX\ncity=ST\norganization=Webinos\norganizationUnit=WP4\ncommon="+config.pzpName+"\nemail=internal@webinos.org\ndays=180\n"
		websocket.startPzpWebSocketServer(config.pzpHost, config.pzpWebsocketPort, config.pzpHttpPort, function() {
			pzp.startPzp(contents, config.pzhHost, config.pzhPort, config.code, pzpModules, function() {
				console.log("=== PZP started ===");
			});
		});
	});
}
