if (typeof webinos === "undefined") webinos = {};
if (typeof exports !== "undefined") session = require('../../Manager/Session/session_pzp.js');
else session = webinos.session; 

var servername = 'localhost';

webinos.session.pzp.startPZP(servername);

