var log = console.log;
var net = require('net');
var tls = require('tls');
var crypto = require('crypto');
var fs = require('fs');
var generator= require('./build/default/generator.node');

var port = 8005;
var servername = 'localhost';	
var serverdata = '';
var clientdata = '';
	
exports.startTLSServer = function()
{
	generator.genrsa(1024, 'server-key.pem', function(err)
	{
		log(err);
	});
	
	generator.gencert(2, 0, 30, 'server-cert.pem', function(err)
	{
		log(err);
	});
	
	var server = net.createServer(function(socket) 
	{
		log('server: connection fd = ' + socket.fd);
		var sslcontext = crypto.createCredentials({key: fs.readFileSync('server-key.pem').toString(), 
												   cert: fs.readFileSync('server-cert.pem').toString()});
		
		sslcontext.context.setCiphers('AES128-SHA:AES256-SHA');

		var pair = tls.createSecurePair(sslcontext, true);
		pair.encrypted.pipe(socket);
		socket.pipe(pair.encrypted);

		pair.on('secure', function() 
		{
			log('server: connected secure : ' + socket.remoteAddress);
			pair.cleartext.write('hello\r\n');			
		});

		pair.cleartext.on('data', function(data) 
		{
			log('server: read bytes = ' + data.length);			
			pair.cleartext.write(data);
		});

		socket.on('end', function() 
		{
			log('server: socket end');
		});

		pair.cleartext.on('error', function(err) 
		{
			log('server: cleartext error: ' + err + '\n' + err.stack);
			socket.destroy();
		});

		pair.encrypted.on('error', function(err) 
		{
			log('server: encrypted error: ' + err + '\n' + err.stack);
			socket.destroy();
		});

		socket.on('error', function(err) 
		{
			log('server: socket error: ' + err + '\n' + err.stack);
			socket.destroy();
		});

		pair.on('error', function(err) 
		{
			log('server: secure error: ' + err + '\n' + err.stack);
			socket.destroy();
		});
		
		socket.on('close', function(err) 
		{
			log('socket closed');
		});
	});	
	server.listen(port,servername);
}


exports.startTLSClient = function()
{
	generator.genrsa(1024, 'client-key.pem', function(err)
	{
		log(err);
	});
		
	generator.gencert(2, 0, 30, 'client-cert.pem', function(err)
	{
		log(err);
	});
	
	var s = new net.Stream();
	var sslcontext = crypto.createCredentials({key: fs.readFileSync('client-key.pem').toString(), 
												cert: fs.readFileSync('client-cert.pem').toString()});
	
	sslcontext.context.setCiphers('AES128-SHA:AES256-SHA');

	var pair = tls.createSecurePair(sslcontext, false);
	pair.encrypted.pipe(s);
	s.pipe(pair.encrypted);

	s.connect(port);

	s.on('connect', function() 
	{
		log('client: connected');
	});

	pair.on('secure', function() 
	{
		log('client: connected secure');
		log('client: pair.cleartext.getPeerCertificate(): %j', pair.cleartext.getPeerCertificate());
		log('client: pair.cleartext.getCipher(): %j', pair.cleartext.getCipher());
		
		setTimeout(function() 
		{
			pair.cleartext.write('hello\r\n', function () 
			{
				gotWriteCallback = true;
			});
		}, 500);
	});

	pair.cleartext.on('data', function(d) 
	{
		log('client: cleartext: %s', d.toString());
	});

	s.on('close', function() 
	{
		log('client: close');
	});

	pair.encrypted.on('error', function(err) 
	{
		log('client: encrypted error: ' + err);
	});

	s.on('error', function(err) 
	{
		log('client: socket error: ' + err);
	});

	pair.on('error', function(err) 
	{
		log('client: secure error: ' + err);
	});	
}
