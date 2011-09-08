var session = require('../../Manager/Session/session.js');

var servername = 'localhost';
if (arguments.length > 0)
    servername = arguments[0];

session.startTLSClient(servername);
