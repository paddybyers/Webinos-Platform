var session = require('../../Manager/Session/session.js');

var servername = 'localhost';
var startserver = '';
process.argv.forEach(function(val, index, array){
	console.log(index + ' : ' + val);
	if (val === 'startserver')
		startserver = 'startserver';
});

if (startserver === 'startserver')
	session.startAsServer(servername);
else 
	session.startTLSClient(servername);


