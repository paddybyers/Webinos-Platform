var log = console.log;
var tls = require('tls');
var events = require('events');
var fs = require('fs');
var generator= require('./build/default/generator.node');

var port = 443;
var servername = 'localhost';		

function Server()
{
	this.status = 'notconn';
}

Server.prototype = new process.EventEmitter();

Server.prototype.checkfiles = function()
{
// Create self signed certificate for PZH
// openssl genrsa -out server-key.pem
// openssl req -new -key server-key.pem -out server-csr.pem
// openssl x509 -req -days 30 -in server-csr.pem -signkey server-key.pem -out server-cert.pem	
	var self = this;
	fs.readFile('server-key.pem', function(err)
	{			
		if(err)
		{
			log('server: generating server key');
			// Bits for key to be generated | KeyName
			generator.genrsa(1024, 'server-key.pem');
			log('server: generating server cert');			
			// This is correct way of doing, encapsulate values in object. This is some work as we need to call set function 
			// separately to set all values see createCredentials which in turns calls SecureContext.  
			var certinfo = 
			{
				country: 'UK',
				state: 'Surrey',
				city: 'Staines',
				organization: 'Webinos',
				organizationUnit: 'WP4',
				common: 'pzh://dev.webinos.org',
				email: 'internal@webinos.org',
				days: 180
				
			};
			// TODO: Temp work around, input should come from a file or through user
			// Country, State, City, OrgName, OrgUnit, Common, Email, Days, DeviceId, CertificateName
			generator.gencert('UK', 'Surrey', 'Staines', 'Webinos', 'WP4', 'pzh://dev.webinos.org', 
							 'internal@webinos.org', 180, 'null', 'server-cert.pem' );
			self.emit('checked','file created');		
		}
		else
		{
			self.emit('checked', 'file present');
		}
	});
};

Server.prototype.connect = function()
{
	var self = this;
	
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
			data = {'status':'Auth','clientcert':'','servercert':''};
			conn.write(JSON.stringify(data));
		}
		else
		{
			log("Not Authenticated " + conn.authorizationError);			
			var data = {'status':'NotAuth','clientcert':'','servercert':''};
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
			var parse = JSON.parse(data);
			if(parse.clientcert)		
			{
				// If we could get this information from within key exchange in openssl, it would not require certificate
				generator.genclientcert(parse.clientcert, 120, 'client-cert.pem', function(err){log(err);});
				data={'status':'','clientcert':fs.readFileSync('client-cert.pem').toString(),
								'servercert':fs.readFileSync('server-cert.pem').toString()};
				conn.write(JSON.stringify(data));					
			}
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
	return server;
};

exports.startTLSServer = function()
{
	var server = new Server();	
	server.on('checked',function(status)
	{
		log(status);
		sock = server.connect();
		sock.listen(port,servername);
	});
	
	server.checkfiles();
}	

function Client()
{
	this.status = 'notconn';
}

Client.prototype = new process.EventEmitter();

Client.prototype.checkfiles = function()
{
	var self = this;
	fs.readFile('client-key.pem', function(err)
	{	
		// Bits for key to be generated | KeyName
		if(err)
		{
			log('client: generating client key');
			generator.genrsa(1024, 'client-key.pem');
			
			log('client: generating client cert');
			generator.gencert('UK', 'Surrey', 'Staines', 'Webinos', 'WP4', 'PC', 'internal@webinos.org', 180,
				'null', 'client-cert.pem' );		
			var options1 = 
			{
				key: fs.readFileSync('client-key.pem'),		
				cert: fs.readFileSync('client-cert.pem')				
			};
			self.emit('checked',options1);		
		}
		else
		{
			var options1 = 
			{
				key: fs.readFileSync('client-key.pem'),		
				cert: fs.readFileSync('client-cert.pem'),
				ca: fs.readFileSync('server-cert.pem')			
			};
			self.emit('checked', options1);
		}
	});
};

Client.prototype.connect = function(options)
{
	var self = this;

	var client = tls.connect(port, options, function(conn)
	{
		log('client: connect status: ' + client.authorized);	
	});
	
	client.on('data',function(data)
	{
		log('client: data received : ' + data);					
		data1 = JSON.parse(data);
		
		if (data1.status == 'NotAuth')
		{
			log('client: NotAuth');
			//mac = generator.getdeviceid();
			var send = {'clientcert': fs.readFileSync('client-cert.pem').toString()};
			log(send);
			client.write(JSON.stringify(send));	
		}
		else if (data1.status == 'Auth')
		{
			log('client: Auth : ');
			log(client.getPeerCertificate());
		}		
		
		if(data1.clientcert!="")
		{
			log('creating client cert');
			fs.writeFile('client-cert.pem', data1.clientcert);
		}
		
		if(data1.servercert!="")
		{
			log('creating server cert');
			fs.writeFile('server-cert.pem', data1.servercert);
			self.emit('connect_again','connect');
		}
				
	});		
		
	client.on('end',function()
	{
		log('client: Data End');		
	});
	
	client.on('close',function(data)
	{
		log('client: close ' + data);		
	});	
};
 
exports.startTLSClient = function()
{
// openssl genrsa -out client-key.pem
// openssl req -new -key client-key.pem -out client-csr.pem
// openssl x509 -req -days 30 -in client-csr.pem -CA ../PZH/server-cert.pem	-CAkey ../PZH/server-key.pem -CAcreateserial -out client-cert.pem
// cp ../PZH/server-cert.pem .
// openssl verify -CAfile server-cert.pem client-cert.pem 
	
	var client = new Client();	
	client.on('checked',function(status)
	{
		//log(status);
		sock = client.connect(status);		
	});
	
	client.on('connect_again',function(status)
	{
		log(status);
		client.checkfiles();
	});
	
	client.checkfiles();	
}	

