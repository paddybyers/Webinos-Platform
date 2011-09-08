var log = console.log;
var tls = require('tls');
var events = require('events');
var fs = require('fs');
var dns = require('dns');

// This requires Manager/Session to be compiled before this file is available
var generator= require('./build/default/generator.node');

// Default port to be used
var port = 443;


function Server()
{
    this.config = new Object();
    this.connected_client = new Array();
}

Server.prototype = new process.EventEmitter();

Server.prototype.readConfig = function()
{
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
				self.config.country = data1[i][1];
			else if(data1[i][0] == 'state')
				self.config.state = data1[i][1];
			else if(data1[i][0] == 'city')
				self.config.city = data1[i][1];
			else if(data1[i][0] == 'organization')
				self.config.orgname = data1[i][1];
			else if(data1[i][0] == 'organizationUnit')
				self.config.orgunit = data1[i][1];
			else if(data1[i][0] == 'common')
				self.config.common = data1[i][1];
			else if(data1[i][0] == 'email')
				self.config.email = data1[i][1];
			else if(data1[i][0] == 'days')
				self.config.days = data1[i][1];
			else if(data1[i][0] == 'keyName')
				self.config.keyname = data1[i][1];
            else if(data1[i][0] == 'keySize')
				self.config.keysize = data1[i][1];
			else if(data1[i][0] == 'certName')
				self.config.certname = data1[i][1];
			else if(data1[i][0] == 'clientCertName')
				self.config.clientcertname = data1[i][1];
				
		}
		self.emit('configread','config read');		
	});
};
// Create self signed certificate for PZH
// openssl genrsa -out server-key.pem
// openssl req -new -key server-key.pem -out server-csr.pem
// openssl x509 -req -days 30 -in server-csr.pem -signkey server-key.pem -out server-cert.pem	
Server.prototype.checkfiles = function()
{
	var self = this;	
	self.readConfig();
	self.on('configread',function()
	{		
		fs.readFile(self.config.keyname, function(err)
		{			
			if(err)
			{			
				log('server: generating server key');
				// Bits for key to be generated | KeyName
				generator.genrsa(self.config.keysize, self.config.keyname);
				log('server: generating server cert');			
				// Country, State, City, OrgName, OrgUnit, Common, Email, Days, CertificateName
				generator.gencert(self.config.country, 
						self.config.state, 
						self.config.city, 
						self.config.orgname, 
						self.config.orgunit, 
						self.config.common,
						self.config.email, 
						self.config.days, 
						self.config.certname);
				self.emit('checked','file created');				
			}
			else
			{
				self.emit('checked', 'file present');
			}
		});
	});
};

Server.prototype.connect = function()
{
    var self = this;
    var options = 
	{
		key: fs.readFileSync(self.config.keyname),
		cert: fs.readFileSync(self.config.certname),
		ca: fs.readFileSync(self.config.certname), // This is self signed certificate, so PZH is its own CA
		requestCert:true, // This field controls whether client certificate will be fetched for mutual authentication
		requestUnauthorized:false
	};

	var server = tls.createServer(options, function(conn)
	{    	    
		if(conn.authorized)
		{
			log("Authenticated ");
			data = {'status':'Auth',
				'clientcert':'',
				'servercert':''};
			// This is a session id created randomly of size 80 
			// Each TLS connection in openssl has a session id but there accessing this id through node.js is not possible, so we create our own
			var cn=conn.getPeerCertificate().subject.CN;
			var found = false;
			// This code is needed but for development purpose it is currently commented
            /*for(var i=0; self.connected_client.length; i++)
            {
                if(self.connected_client[i] == cn)
                    found = true;
            }*/
            if(found == false)
            {    
                var obj = new Object();
			    obj.commonname=cn;
                obj.sessionid=obj.commonname+':';
                var temp = options.cert.toString();
                for(var i=0; i< (80 - obj.commonname.length -1);i++)
                {
                    id =Math.floor(Math.random() * options.cert.length);
                    obj.sessionid+=temp.substring(id, id+1);
                }   
                self.connected_client.push(obj);
                log(JSON.stringify(self.connected_client));
            }
			conn.write(JSON.stringify(data));			
		}
		else
		{
			log("Not Authenticated " + conn.authorizationError);			
			var data = {'status':'NotAuth',
				    'clientcert':'',
				    'servercert':''};
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
				generator.genclientcert(parse.clientcert, 
							self.config.days, 
							self.config.clientcertname, 
							self.config.certname, 
							function(err)
							{
								log(err);
							});
				data={'status':'',
				      'clientcert':fs.readFileSync(self.config.clientcertname).toString(),
				      'servercert':fs.readFileSync(self.config.certname).toString()};
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

exports.startTLSServer = function(arg)
{
	var server = new Server();	
	server.on('checked',function(status)
	{
		log(status);
		sock = server.connect();
		sock.listen(port,arg);		         
		
	});	
	server.checkfiles();
}	

function Client()
{
	this.config = new Object();
    this.servername = new String();
}

Client.prototype = new process.EventEmitter();

Client.prototype.readConfig = function()
{
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
				self.config.country = data1[i][1];
			else if(data1[i][0] == 'state')
				self.config.state = data1[i][1];
			else if(data1[i][0] == 'city')
				self.config.city = data1[i][1];
			else if(data1[i][0] == 'organization')
				self.config.orgname = data1[i][1];
			else if(data1[i][0] == 'organizationUnit')
				self.config.orgunit = data1[i][1];
			else if(data1[i][0] == 'common')
				self.config.common = data1[i][1];
			else if(data1[i][0] == 'email')
				self.config.email = data1[i][1];
			else if(data1[i][0] == 'days')
				self.config.days = data1[i][1];
			else if(data1[i][0] == 'keyName')
				self.config.keyname = data1[i][1];
			else if(data1[i][0] == 'keySize')
				self.config.keysize = data1[i][1];
			else if(data1[i][0] == 'certName')
				self.config.certname = data1[i][1];
			else if(data1[i][0] == 'caName')
				self.config.caname = data1[i][1];
		}
		self.emit('configread','config read');		
	});
};

Client.prototype.checkfiles = function()
{
	var self = this;
	self.readConfig();			
	self.on('configread',function()
	{
		fs.readFile(self.config.keyname, function(err)
		{	
			if(err)
			{
				log('client: generating client key');
				// Bits for key to be generated | KeyName
				generator.genrsa(self.config.keysize, self.config.keyname);
			
				log('client: generating client cert');
				generator.gencert(self.config.country, 
					self.config.state, 
					self.config.city, 
					self.config.orgname, 
					self.config.orgunit, 
					self.config.common,
					self.config.email, 
					self.config.days, 
					self.config.certname);
			
				var options1 = 
				{
					key: fs.readFileSync(self.config.keyname),		
					cert: fs.readFileSync(self.config.certname)				
				};
				self.emit('checked',options1);		
			}
			else
			{
				var options1 = 
				{
					key: fs.readFileSync(self.config.keyname),		
					cert: fs.readFileSync(self.config.certname),
					ca: fs.readFileSync(self.config.caname)			
				};
				self.emit('checked', options1);
			}
		});
	});
};

Client.prototype.connect = function(options, arg)
{
	var self = this;

	var client = tls.connect(port, arg, options, function(conn)
	{
		log('client: connect status: ' + client.authorized);	
	});
	
	client.on('data',function(data)
	{
		log('client: data received : ' + data);					
		var data1 = JSON.parse(data);
		if (data1.status == 'NotAuth')
		{
			log('client: NotAuth');
			var send = {'clientcert': fs.readFileSync(self.config.certname).toString()};
			client.write(JSON.stringify(send));	
		}
		else if (data1.status == 'Auth')
		{
			log('client: Authenticated');			
			self.servername=client.getPeerCertificate().subject.CN;					
		}		
		
		if(data1.clientcert!="")
		{
			log('creating client cert');
			fs.writeFile(self.config.certname, data1.clientcert);
		}
		
		if(data1.servercert!="")
		{
			log('creating server cert');
			fs.writeFile(self.config.caname, data1.servercert);
			self.emit('connect_again','connect');
		}
				
	});		
		
	client.on('end',function()
	{
		log('client: Data End');		
	});
	
	client.on('close',function()
	{
		log('client: server close ');		
	});	
};

// This function performs function equivalent to below commands
// openssl genrsa -out client-key.pem
// openssl req -new -key client-key.pem -out client-csr.pem
// openssl x509 -req -days 30 -in client-csr.pem -CA ../PZH/server-cert.pem -CAkey ../PZH/server-key.pem -CAcreateserial -out client-cert.pem
// cp ../PZH/server-cert.pem .
// openssl verify -CAfile server-cert.pem client-cert.pem  
exports.startTLSClient = function(arg)
{
	var client = new Client();	
	client.on('checked',function(status)
	{
		log('client connecting');
		sock = client.connect(status, arg);		
	});
	
	client.on('connect_again',function(status)
	{
		log('client connect again');
		client.checkfiles();
	});
	
	client.checkfiles();	
}
