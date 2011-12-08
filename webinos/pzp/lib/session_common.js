var  fs = require('fs'),
	crypto = require('crypto'),
	child_process = require('child_process'),
	messaging = require("../../common/manager/messaging/lib/messagehandler.js");

var debug = true;

exports.debug = function(msg) {
	if(debug === true)
		console.log(msg);
}

// This is a device id through which we recognize device
// TODO: For any device, currently only ethernet mac address is being used
var getId = function (self, callback) {
	console.log('PZ Common: Selected Platform - ' + process.platform);
	if(process.platform === 'cygwin') {
		var req = "getmac -V -FO CSV | awk -F \',\' \'{if(match($1, \"Local Area Connection\")) print $3;}\'";
		child_process.exec(req, function (error, stdout, stderr) {
			//console.log('PZ Common: GetID stdout: ' + stdout);
			//console.log('PZ Common: GetID stderr: ' + stderr);
			var id = stdout.split('\n');
			if (error !== null) {
				console.log('PZ Common: GetID exec error: ' + error);
			} else {
				callback.call(self, id[0]);
			}	
		});
	} else if (process.platform === 'win32') {
		var req = 'for /f "tokens=3 delims=," %a in (\'"getmac /v /nh /fo csv"\') do @echo %a && exit /b';
		child_process.exec(req, function (error, stdout, stderr) {
//			console.log('PZ Common: GetID stdout: ' + stdout);
//			console.log('PZ Common: GetID stderr: ' + stderr);
			var id = stdout.split('\n');
			if (error !== null) {
				console.log('PZ Common: GetID exec error: ' + error);
			} else {
				callback.call(self, id[0]);
			}	
		});
	} else if (process.platform === 'linux') {
		var req = "ifconfig eth0 | grep HWaddr | tr -s \' \' | cut -d \' \' -f5";
		child_process.exec(req, function (error, stdout, stderr) {
			//console.log('PZ Common: GetID stdout: ' + stdout);
			//console.log('PZ Common: GetID stderr: ' + stderr);
			var id = stdout.split('\n');
			if (error !== null) {
				console.log('PZ Common: GetID exec error: ' + error);
			} else {
				callback.call(self, id[0]);
			}	
		});
	} else if(process.platform === 'darwin') {
		var req = "ifconfig en1 | grep ether | tr -s \' \'|cut -d \' \' -f2"
		child_process.exec(req, function(err, stdout, stderr) {
			var id = stdout.split('\n');
			if(err !== null)
				console.log('PZ common: GetID exec error: ' + err);
			else {
				callback.call(self, id[0]); 
			}				
		});
	}
	
}

exports.getId = getId;
/* generate self signed certificates if certificates are not present. 
 * This results in native code call.Create self signed certificate for PZH. 
 * It performs following functionality
 * 1. openssl genrsa -out server-key.pem
 * 2. openssl req -new -key server-key.pem -out server-csr.pem
 * 3. openssl x509 -req -days 30 -in server-csr.pem -signkey server-key.pem -out server-cert.pem
 * 
 */
exports.generateSelfSignedCert = function(self, name, callback) {
	child_process.exec('openssl genrsa -out ' + self.config.keyname + ' ' +self.config.keysize, 
		function (error, stdout, stderr) {
		//console.log('PZ Common: Self Generated Key stderr: ' + stderr);
		if (error !== null) {
		  console.log('PZ Common: Self Generated Key exec error: ' + error);
		};
		var common = name+':'+self.config.common;
		var req = 'openssl req -new -subj \"/C='+self.config.country+'/ST='+self.config.state+
			'/L='+self.config.city+'/CN='+common+'/emailAddress='+self.config.email + '\" -key ' +
			self.config.keyname + ' -out '+self.config.certnamecsr;
		//console.log(req);
		child_process.exec(req, function (error, stdout, stderr) {
			//console.log('PZ Common: Self Generated Cert 1 stderr: ' + stderr);
			if (error !== null) {
			  console.log('PZ Common: Self Generated Cert 1 exec error: ' + error);
			};
			var req = 'openssl x509 -req -days ' + self.config.days + ' -in ' + self.config.certnamecsr + ' -signkey ' + 
			self.config.keyname + ' -out ' + self.config.certname;
			//console.log(req);
			child_process.exec(req, function (error, stdout, stderr) {
				//console.log('PZ Common: Self Generated Cert 2 stderr: ' + stderr);
				if (error !== null) {
					console.log('PZ Common: Self Genereated Cert 2 Exec error: ' + error);
				} else {
					callback.call(self, 'true');
				}
			});
		});
	});	
};

/* This creates certificate signed by master certificate on PZH. This function
 *  is used twice on PZH only. This results in native code call.
 */
exports.generateServerCertifiedCert = function(self, config, callback) {
	/*generator.genCertifiedCertificate(cert,	config.days, config.certname, config.mastercertname, config.masterkeyname, 
	function(err) {	console.log('PZ Common: Certificate generation error' + err);});*/
	var req = 'openssl x509 -req -days ' + config.days + ' -in ' +self.config.certnamecsr+ 
	' -CAcreateserial -CAkey ' + config.masterkeyname + ' -CA ' + config.mastercertname+
	' -out ' + config.certname;

	//console.log(req);

	child_process.exec(req,  function (error, stdout, stderr) {
		//console.log('PZ Common: Server Certified Cert stderr: ' + stderr);	
		if (error !== null) {
		  console.log('PZ Common: Server Certified Cert exec error: ' + error);						
		} else {
			callback.call(self, 'done');
		}
	});
};


/* This is called once from PZH to generate master certificate for PZH.
 * This results in native code call.
 */
 
exports.generateClientCertifiedCert = function(self, cert, callback) {
	var id, id1;
	fs.readdir(__dirname, function(err, files) {
		for(var i=0; i<files.length; i++) {
			if( (files[i].indexOf('pzh',0) === 0) &&  
				(files[i].indexOf('client_certified', 0) !== -1)) {
				id = files[i].split('_');
				id1 = parseInt(id[2]) + 1;
			}
		}
	
		var name = 'pzh_'+self.config.common.split(':')[0]+'_'+id1;
		self.config.tempcsr = name+'_client_temp.csr';
		self.config.clientcert = name+'_client_certified.pem';

		// If we could get this information from within key exchange in openssl,
		// it would not require certificate
		fs.writeFile(self.config.tempcsr, cert, function() {
			var req = 'openssl x509 -req -days ' + self.config.days + 
			' -in ' + self.config.tempcsr +' -CAcreateserial -CAkey ' + self.config.masterkeyname + 
			' -CA ' + self.config.mastercertname + ' -out ' + self.config.clientcert;
			child_process.exec(req, function (error, stdout, stderr) {
				if (error !== null) {
					console.log('PZ Common: Server Certified Client Cert error: ' + error);
					callback.call(self, 'not done');
				} else if(typeof callback === "function") {
					callback.call(self, 'done');
				}
			});
		});
	});
};

/* Before adding client it checks if client is already present or not.
 * Not used currently
 */
exports.checkClient = function (self, cn){
	if(self.connectedPzp[cn]) {
		return true;
	} else 	if(self.connectedPzh[cn]) {
		return true;
	}
	return false;
};

/*  It removes the connected PZP details.
 */
exports.removeClient = function(self, conn) {
	var i;
	for (i in self.connected_pzp) {
		if(conn.socket.remoteAddress === self.connectedPzp[i].address) {
			delete self.connectedPzp[i];
		}
	}
	
	for (i in self.connected_pzh) {
		if(conn.socket.remoteAddress === self.connectedPzh[i].address) {
			delete self.connectedPzh[i];
		}
	}
};

/* This is called once from PZH to generate master certificate for PZH. 
 * This results in native code call.
 */
exports.generateMasterCert = function (self, callback) {
	var common = 'MasterCert:' + self.config.common;
	console.log('PZ Common: Generating Master Key & Certificate ');
	child_process.exec('openssl genrsa -out ' + self.config.masterkeyname + ' ' +self.config.masterkeysize, 
		function (error, stdout, stderr) {
			//console.log('PZ Common: Master Key  stdout: ' + stdout);
			//console.log('PZ Common: Master Key stderr: ' + stderr);
			if (error !== null) {
				console.log('PZ Common: Master Key exec error: ' + error);
			};
			var req = 'openssl req -new -subj \"/C='+self.config.country+'/ST='+self.config.state+
					'/L='+self.config.city+'/CN='+common+'/emailAddress='+self.config.email + '\" -key ' +
						self.config.masterkeyname + ' -out temp.csr';
			//console.log(req);
			child_process.exec(req, function (error, stdout, stderr) {
				//console.log('PZ Common: Master Cert stdout: ' + stdout);
				//console.log('PZ Common: Master Cert stderr: ' + stderr);
				if (error !== null) {
					console.log('PZ Common: Master Cert exec error: ' + error);
				};
				var req = 'openssl x509 -req -days ' + self.config.days + ' -in temp.csr -signkey ' + 
						self.config.masterkeyname + ' -out ' + self.config.mastercertname;
				//console.log(req);
				child_process.exec(req, function (error, stdout, stderr) {
					//console.log('PZ Common: Master Cert 2 stdout: ' + stdout);
					//console.log('PZ Common: Master Cert 2 stderr: ' + stderr);
					if (error !== null) {
						console.log('PZ Common: Master Cert 2 Exec error: ' + error);
					};
					if(typeof callback === "function")
						callback.call(self, 'done');
				});
			});
	});
};

//This is used for generating id for session. This code is currently not used.
exports.generateSessionId = function(cn, options) {
	var temp, obj = {}, id, tmp;
	obj={'commnonname':cn, 'sessionid':''};
	obj.sessionid= cn +':';
	temp = options.cert.toString();
	for(i = 0; i < (40 - obj.sessionid.length -1); i += 1) {
		id = Math.floor(Math.random() * options.cert.length);
		tmp = temp.substring(id, id+1);
		if(tmp === ' ' || tmp === '\n')	{
			i -= 1;
			continue;
		}	
		obj.sessionid+=temp.substring(id, id+1);
	}
	return obj;
};

exports.processedMsg = function(self, data, dataLen, callback) {
	var msg = data.toString('utf8');//.split('#')
	if(msg[0] ==='#' && msg[msg.length-dataLen] === '#') {
		msg = msg.split('#');
		var parse = JSON.parse(msg[1]);
		callback.call(self, parse);
	}	
};
/* Helper function used by messaging and rpc.
* Object differentiates between different instance of Pzp.
* @param message: rpc request or response message
* @param address: address to forward message 
* @param object: current pzp instance
*/
var send = function (message, address, object) {
	message.resp_to = object.sessionId;
	console.log("                                                  SESSION ID: " + object.sessionId);
	object.sendMessage(message, address);
};

var setMessagingParam = function(self){
	messaging.setGetOwnId(self.sessionId);
	messaging.setObjectRef(self);
	messaging.setSendMessage(send);
	messaging.setSeparator("/");
};
exports.setMessagingParam = setMessagingParam;


/* Calls messaging function, to adapt to correct object and process received message
* @param data, message forwarded to messaging  
*/
exports.sendMessageMessaging = function(self, data) {
	setMessagingParam(self);
	if(typeof data.to !== 'undefined')
		messaging.onMessageReceived(data, data.to);
	else
		messaging.onMessageReceived(data);
};


/* This functions configure pzp. It first check in current directory matching with common
* name. It it finds then it does not set certificate vale in config structure. Else it just
* sets certificate name to expect in directory
* @param contents of certificate 
* @param callback to be called after executing 
*/
exports.configure = function(self, id, contents, callback) {
	var id;
	var name, i =0, j;
	var flag = true, common = '', data1;

	fs.readdir(__dirname, function(err, files) {
		for(var i=0; i<files.length; i++) {
			if( (files[i].indexOf(id,0) === 0) &&  
			files[i].indexOf('master_cert.pem', 0) !== -1) {
				id = files[i].split('_');
				data1 = contents.toString().split('\n');
				for(j = 0; j < data1.length; j += 1) {
					if(data1[j].split('=')[0] === 'common') {
						// If matches no need to generate new config
						common = data1[j].split('=')[1];
						if(id[1] === common) {
							common = id[1];
							flag = false;
						}								
					}
				}
			}
		}
		
		if(flag === true) {
			if(common === '') {
				data1 = contents.toString().split('\n');
				for(j = 0; j < data1.length; j += 1) {
					if(data1[j].split('=')[0] === 'common') {
						common = data1[j].split('=')[1];
						break;
					}
				}					
			}
			name = id+'_'+common;
			self.config.keyname = name+'_conn_key.pem';
			self.config.certname = name+'_conn_cert.pem';
			self.config.certnamecsr = name+'_conn_cert.csr';
			self.config.keysize = 1024;
			self.config.mastercertname = name+'_master_cert.pem';
			self.config.masterkeyname = name+'_master_key.pem';
			self.config.masterkeysize = 1024;
		
			data1 = contents.toString().split('\n');
			getId(self, function(getid) {
				self.config.id = getid;
				for(i = 0; i < data1.length; i += 1) {
					data1[i] = data1[i].split('=');			
				}
				for(i = 0; i < data1.length; i += 1) {
					if(data1[i][0] === 'country') {
						self.config.country = data1[i][1];
					} else if(data1[i][0] === 'state') {
						self.config.state = data1[i][1];
					} else if(data1[i][0] === 'city') {
						self.config.city = data1[i][1];
					} else if(data1[i][0] === 'organization') {
						self.config.orgname = data1[i][1];
					} else if(data1[i][0] === 'organizationUnit') {
						self.config.orgunit = data1[i][1];
					} else if(data1[i][0] === 'common') {
						self.config.common = data1[i][1] + 
						':DeviceId('+self.config.id+')';
					} else if(data1[i][0] === 'email') {
						self.config.email = data1[i][1];
					} else if(data1[i][0] === 'days') {
						self.config.days = data1[i][1];
					}
				} 
				callback.call(self,'Certificate Value Set');					
			});
		} else if (flag === false) {
			name = id+'_'+common;//+'_'+getid;
			self.config.keyname = name+'_conn_key.pem';
			self.config.certname = name+'_conn_cert.pem';
			self.config.common = common;
			self.config.days = 180;
			self.config.masterkeyname = name+'_master_key.pem';
			self.config.mastercertname = name+'_master_cert.pem';
			callback.call(self,'Certificate Present');	
		}		
	});	
};

