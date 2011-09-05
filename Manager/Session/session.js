var log = console.log;
var tls = require('tls');
var events = require('events');
var fs = require('fs');
var generator= require('./build/default/generator.node');

var port = 443;
var servername = 'localhost';		

var client;
var server;
var config;

function Server()
{
	this.status = 'notconn';
}

Server.prototype = new process.EventEmitter();

Server.prototype.readConfig = function()
{
	config = new Object();
	var self = this;
	fs.readFile('config.txt', function(err,data)
	{
		if(err) throw err;
		var data1 = data.toString().split('\n');	

		for(var i=0; i<data1.length; i++)
			data1[i] = data1[i].split('=');	
				
		for(var i=0; i<data1.length; i++)
		{
			if(data1[i][0] == 'country')
				config.country = data1[i][1];
			else if(data1[i][0] == 'state')
				config.state = data1[i][1];
			else if(data1[i][0] == 'city')
				config.city = data1[i][1];
			else if(data1[i][0] == 'organization')
				config.orgname = data1[i][1];
			else if(data1[i][0] == 'organizationUnit')
				config.orgunit = data1[i][1];
			else if(data1[i][0] == 'common')
				config.common = data1[i][1];
			else if(data1[i][0] == 'email')
				config.email = data1[i][1];
			else if(data1[i][0] == 'days')
				config.days = data1[i][1];
			else if(data1[i][0] == 'keyName')
				config.keyname = data1[i][1];
			else if(data1[i][0] == 'certName')
				config.certname = data1[i][1];
		}
		self.emit('configread','config read');		
	});
};

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
			self.readConfig();
			self.on('configread',function()
			{		
				log('server: generating server key');
				// Bits for key to be generated | KeyName
				generator.genrsa(1024, config.keyname);
				log('server: generating server cert');			
				// Country, State, City, OrgName, OrgUnit, Common, Email, Days, DeviceId, CertificateName
				generator.gencert(config.country, 
						  config.state, 
						  config.city, 
						  config.orgname, 
                                                  config.orgunit, 
                                                  config.common,
                                                  config.email, 
                                                  config.days, 
                                                  'null', 
                                                  config.certname);
				self.emit('checked','file created');		
			});
		}
		else
		{
			self.emit('checked', 'file present');
		}
	});
};

Server.prototype.connect = function()
{
	var options = 
	{
		key: fs.readFileSync(config.keyname),
		cert: fs.readFileSync(config.certname),
		ca: fs.readFileSync(config.certname), // This is self signed certificate, so PZH is its own CA
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
				generator.genclientcert(parse.clientcert, config.days, 'client-cert.pem', function(err){log(err);});
				data={'status':'','clientcert':fs.readFileSync('client-cert.pem').toString(),
								'servercert':fs.readFileSync(config.certname).toString()};
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
	server = new Server();	
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

Client.prototype.readConfig = function()
{
	config = new Object();
	var self = this;
	fs.readFile('config.txt', function(err,data)
	{
		if(err) throw err;
		var data1 = data.toString().split('\n');	

		for(var i=0; i<data1.length; i++)
			data1[i] = data1[i].split('=');	
				
		for(var i=0; i<data1.length; i++)
		{
			if(data1[i][0] == 'country')
				config.country = data1[i][1];
			else if(data1[i][0] == 'state')
				config.state = data1[i][1];
			else if(data1[i][0] == 'city')
				config.city = data1[i][1];
			else if(data1[i][0] == 'organization')
				config.orgname = data1[i][1];
			else if(data1[i][0] == 'organizationUnit')
				config.orgunit = data1[i][1];
			else if(data1[i][0] == 'common')
				config.common = data1[i][1];
			else if(data1[i][0] == 'email')
				config.email = data1[i][1];
			else if(data1[i][0] == 'days')
				config.days = data1[i][1];
			else if(data1[i][0] == 'keyName')
				config.keyname = data1[i][1];
			else if(data1[i][0] == 'certName')
				config.certname = data1[i][1];
			else if(data1[i][0] == 'caName')
				config.caname = data1[i][1];
		}
		self.emit('configread','config read');		
	});
};

Client.prototype.checkfiles = function()
{
	var self = this;
	client.readConfig();			
	self.on('configread',function()
	{
		fs.readFile('client-key.pem', function(err)
		{	
			// Bits for key to be generated | KeyName
			if(err)
			{
				log('client: generating client key');
				generator.genrsa(1024, config.keyname);
			
				log('client: generating client cert');
				generator.gencert(config.country, 
				  config.state, 
				  config.city, 
				  config.orgname, 
                                  config.orgunit, 
                                  config.common,
                                  config.email, 
                                  config.days, 
                                  'null', 
                                  config.certname);

			
				var options1 = 
				{
					key: fs.readFileSync(config.keyname),		
					cert: fs.readFileSync(config.certname)				
				};
				self.emit('checked',options1);		
			}
			else
			{
				var options1 = 
				{
					key: fs.readFileSync(config.keyname),		
					cert: fs.readFileSync(config.certname),
					ca: fs.readFileSync(config.caname)			
				};
				self.emit('checked', options1);
			}
		});
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
			var send = {'clientcert': fs.readFileSync(config.certname).toString()};
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
			fs.writeFile(config.certname, data1.clientcert);
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
// This function performs function equivalent to below commands
// openssl genrsa -out client-key.pem
// openssl req -new -key client-key.pem -out client-csr.pem
// openssl x509 -req -days 30 -in client-csr.pem -CA ../PZH/server-cert.pem -CAkey ../PZH/server-key.pem -CAcreateserial -out client-cert.pem
// cp ../PZH/server-cert.pem .
// openssl verify -CAfile server-cert.pem client-cert.pem  
exports.startTLSClient = function()
{
	client = new Client();	
	client.on('checked',function(status)
	{
		sock = client.connect(status);		
	});
	
	client.on('connect_again',function(status)
	{
		log(status);
		client.checkfiles();
	});
	
	client.checkfiles();	
}	



