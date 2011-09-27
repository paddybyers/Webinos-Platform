if (typeof webinos === "undefined") webinos = {};
if (typeof exports !== "undefined") session = require('../../Manager/Session/session_pzh.js');
else session = webinos.session; 

var servername = 'localhost';

webinos.session.pzh.startPZH(servername);
