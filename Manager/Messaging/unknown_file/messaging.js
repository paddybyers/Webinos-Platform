var net = require('net');
var EventEmitter = require('events').EventEmitter;

var sockets= [];

exports.storeNode = function(socket)
{
	console.log('storeNode');
	sockets.push(socket);	
	for(var i=0; i<sockets.length ;i++)
	{
		sockets[i].write("Connected node","utf8");
	}
}

exports.sendInfo = function(d)
{
	console.log('Node data');
	for(var i=0; i<sockets.length ;i++)
	{
		sockets[i].write(d);
	}	
}

exports.clearNode = function(socket)
{
	console.log('clearNode');
	var i = sockets.indexof(socket);
	socket.splice(i, 1);
}

