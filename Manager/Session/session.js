var log = console.log;
var net = require('net');
var tls = require('tls');
var crypto = require('crypto');
var fs = require('fs');
//var generator= require('./build/default/generator.node');

var port = 443;
var servername = 'localhost';	
var serverdata = '';
var clientdata = '';
	
exports.startTLSServer = function()
{
// Create self signed certificate for PZH
// openssl genrsa -out server-key.pem
// openssl req -new -key server-key.pem -out server-csr.pem
// openssl x509 -req -days 30 -in server-csr.pem -signkey server-key.pem -out server-cert.pem
	
	// Bits for key to be generated | KeyName
	// generator.genrsa(1024, 'server-key.pem');
	// Days|CertificateName|devicename|interface
	// generator.gencert(30, 'server-cert.pem' );
	
	var options = 
	{
		key: fs.readFileSync('server-key.pem'),
		cert: fs.readFileSync('server-cert.pem'),
		ca: fs.readFileSync('server-cert.pem'), // This is self signed certificate, so PZH is its own CA
		requestCert:true, // This field controls whether client certificate will be fetched
		requestUnauthorized:false
	};
	
	var server = tls.createServer(options, function(conn)
	{ 
		if(conn.authorized)
		{
			log("Authenticated " + conn.getPeerCertificate());
			data = {'status':'Auth'};
			conn.write(JSON.stringify(data));
		}
		else
		{
			log("Not Authenticated " + conn.authorizationError);			
			var data = {'status':'NotAuth'};
			conn.write(JSON.stringify(data));			
		}	
		
		conn.on('secure', function() 
		{
			log('server: connected secure : ' + conn.remoteAddress);
		});
		
		conn.on('data', function(data) 
		{
			// Generate client certificate
			log('server: read bytes = ' + data.length);						
		});
			
		conn.on('end', function() 
		{
			log('server: end');
		});
	
		conn.on('close', function(err) 
		{
			log('server: socket closed');
		});	
		
		conn.on('error', function(err)
		{
			log('server:' + err + ' error stack : ' + err.stack);
		});
		
	});		
	server.listen(port,servername);
}

exports.startTLSClient = function()
{
// openssl genrsa -out client-key.pem
// openssl req -new -key client-key.pem -out client-csr.pem
// openssl x509 -req -days 30 -in client-csr.pem -CA ../PZH/server-cert.pem	-CAkey ../PZH/server-key.pem -CAcreateserial -out client-cert.pem
// cp ../PZH/server-cert.pem .
// openssl verify -CAfile server-cert.pem client-cert.pem 

	// Bits for key to be generated | KeyName
	// generator.genrsa(1024, 'client-key.pem')
	// Days|CertificateName|devicename|interface
	//generator.gencert(30, 'client-cert.pem' );
	
	var options = 
	{
		key: fs.readFileSync('client-key.pem'),
		cert: fs.readFileSync('client-cert.pem'),		
		ca: fs.readFileSync('server-cert.pem'),	
		requestCert:true
	};

	var client = tls.connect(port, options, function(conn1)
	{
		log('client: connect status: ' + client.authorized);
		var conn = conn1;
				
		client.addListener('data',function(data)
		{
			parse = JSON.parse(data);
			log('client: data received : ' + data);					
			if (parse.status == 'NotAuth')
			{
				log('client: NotAuth');
			}
			else if (parse.status == 'Auth')
			{
				log('client: Auth : ');
				log(client.getPeerCertificate());
			}				
		});		
	});
	
	client.on('end',function()
	{
		log('client: Data End');		
	});
	
	client.on('close',function(data)
	{
		log('client:' + data);		
	});
}
