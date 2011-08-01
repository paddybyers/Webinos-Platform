var log = console.log;
var net = require('net');
var tls = require('tls');
var crypto = require('crypto');
var fs = require('fs');
//var generator= require('./build/default/generator.node');

var port = 8005;
var servername = 'localhost';	
var serverdata = '';
var clientdata = '';
	
exports.startTLSServer = function()
{
	// This generates the rsa private key which can be used for signing certificate and is part of credential
	/*generator.genrsa(1024, 'server-key.pem', function(err)
	{
		log(err);
	});*/
	var connections = 0; 
	var server = net.createServer(function(socket) 
	{
		connections++;
		log('connection fd=' + socket.fd);
		var sslcontext = crypto.createCredentials({key: fs.readFileSync('server-key.pem').toString(), 
													cert: fs.readFileSync('server-cert.pem').toString()});
		sslcontext.context.setCiphers('AES128-SHA:AES256-SHA');

		var pair = tls.createSecurePair(sslcontext, true);
		pair.encrypted.pipe(socket);
		socket.pipe(pair.encrypted);

		pair.on('secure', function() 
		{
			log('connected+secure!');
			pair.cleartext.write('hello\r\n');
			log(pair.cleartext.getPeerCertificate());
			log(pair.cleartext.getCipher());
		});

		pair.cleartext.on('data', function(data) 
		{
			log('read bytes ' + data.length);
			pair.cleartext.write(data);
		});

		socket.on('end', function() 
		{
			log('socket end');
		});

		pair.cleartext.on('error', function(err) 
		{
			log('got error: ');
			log(err);
		    log(err.stack);
			socket.destroy();
		});

		pair.encrypted.on('error', function(err) 
		{
			log('encrypted error: ');
			log(err);
			log(err.stack);
			socket.destroy();
		});

		socket.on('error', function(err) 
		{
			log('socket error: ');
			log(err);
			log(err.stack);
			socket.destroy();
		});

		socket.on('close', function(err) 
		{
			log('socket closed');
		});

		pair.on('error', function(err) 
		{
			log('secure error: ');
			log(err);
			log(err.stack);
			socket.destroy();
		});
	});	
	server.listen(port,servername);
}


exports.startTLSClient = function()
{
	/*generator.genrsa(1024, 'client-key.pem', function(err)
	{
	  log(err);
	});	
	*/
	var s = new net.Stream();
	var sslcontext = crypto.createCredentials(
					{key: fs.readFileSync('client-key.pem'), 
					cert: fs.readFileSync('client-cert.pem')});
	sslcontext.context.setCiphers('AES128-SHA');

	var pair = tls.createSecurePair(sslcontext, false);
	pair.encrypted.pipe(s);
	s.pipe(pair.encrypted);

	s.connect(port);

	s.on('connect', function() 
	{
		log('client connected');
	});

	pair.on('secure', function() 
	{
		log('client: connected+secure!');
		log('client pair.cleartext.getPeerCertificate(): %j',
                pair.cleartext.getPeerCertificate());
		log('client pair.cleartext.getCipher(): %j',
                pair.cleartext.getCipher());
		setTimeout(function() {
			pair.cleartext.write('hello\r\n', function () {
			gotWriteCallback = true;
		});
		}, 500);
	});

	pair.cleartext.on('data', function(d) 
	{
		log('cleartext: %s', d.toString());
	});

	s.on('close', function() {
		log('client close');
	});

	pair.encrypted.on('error', function(err) {
		log('encrypted error: ' + err);
	});

	s.on('error', function(err) {
		log('socket error: ' + err);
	});

	pair.on('error', function(err) {
		log('secure error: ' + err);
	});	
}
