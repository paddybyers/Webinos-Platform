/*******************************************************************************
*  Code contributed to the webinos project
*
* Licensed under the Apache License, Version 2.0 (the "License");
* you may not use this file except in compliance with the License.
* You may obtain a copy of the License at
*
*     http://www.apache.org/licenses/LICENSE-2.0
*
* Unless required by applicable law or agreed to in writing, software
* distributed under the License is distributed on an "AS IS" BASIS,
* WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
* See the License for the specific language governing permissions and
* limitations under the License.
*
*******************************************************************************/

var fs = require('fs'),
	path                = require('path'),
	Pzh                 = require('../webinos/pzh/lib/pzh_sessionHandling.js'),
	PzhFarm             = require('../webinos/pzh/lib/pzh_farm.js'),
	PzhWebInterface     = require('../webinos/pzh/web/pzh_web_interface.js'),
	PzhConnect          = require('../webinos/pzh/lib/pzh_connecting.js');

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
//    {name: "events", param: {}},
    {name: "context", param: {}}
];

if (options.host === '' || options.port <= 0) {
	help();
} else {
		if (!config.host) {
			config.host = 'localhost';
		}
}

PzhFarm.startFarm('localhost' , contents, function(result) {
	var contents ="country=UK\nstate=MX\ncity=ST\norganization=Webinos\norganizationUnit=WP4\ncommon=pzh1\nemail=internal@webinos.org\ndays=180\n"
	Pzh.addPzh('localhost/john', contents, pzhModules, function(res,instance) {
		console.log('******* PZH STARTED *******');
		var contents ="country=UK\nstate=MX\ncity=ST\norganization=Webinos\norganizationUnit=WP4\ncommon=pzh2\nemail=internal@webinos.org\ndays=180\n"
		Pzh.addPzh('localhost/Habib',contents, pzhModules, function(res,instance) {
			console.log('******* PZH1 STARTED *******');			
		});
	});
});

