var  fs = require('fs'),
	crypto = require('crypto'),
	child_process = require('child_process'),
	messaging = require("../../common/manager/messaging/lib/messagehandler.js");

var debug = function(num, msg) {
	var info = true; // Change this if you want no prints from session manager
	var debug = true; 
	if(num === 1)
		console.log('ERROR:' + msg);
	else if(num === 2 && info)
		console.log('INFO:' + msg);
	else if(num === 3 && debug)
		console.log('DEBUG:' + msg);
}

// This is a device id through which we recognize device
// TODO: For any device, currently only ethernet mac address is being used
var getId = function (self, callback) {
	console.log('PZ Common: Selected Platform - ' + process.platform);
	// Unique id per platform work underway by ISMB. Below code is obsolute and will be removed shortly
	callback.call(self, process.platform);
	/*if(process.platform === 'cygwin') {
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
	}*/
	
}

exports.getId = getId;
exports.debug = debug;
/* generate self signed certificates if certificates are not present. 
 * This results in native code call.Create self signed certificate for PZH. 
 * It performs following functionality
 * 1. openssl genrsa -out server-key.pem
 * 2. openssl req -new -key server-key.pem -out server-csr.pem
 * 3. openssl x509 -req -days 30 -in server-csr.pem -signkey server-key.pem -out server-cert.pem
 * 
 */
exports.selfSigned = function(self, name, obj, callback) {
	var certman;
	try {
		certman = require("../../common/manager/certificate_manager");		
	} catch (err) {
		debug(1, "Error opening certificate manager obj file, please make sure you have compiled cert manager");
		debug(1, err);
		callback.call(self, "failed");
		return;
	}

	try {
		obj.key.value = certman.genRsaKey(1024);
	} catch(err) {
		debug(1, 'Error generating key');
		debug(1, err);
		callback.call(self, "failed");
		return;
	}

	var common = name+':'+self.config.common
	try {
		obj.csr.value = certman.createCertificateRequest(obj.key.value, 
			self.config.country,
			self.config.state,
			self.config.city,
			self.config.orgname,
			self.config.orgunit,
			common, 
			self.config.email);
	} catch (err) {
		debug(1, "Error in certificate request");
		debug(1, err);
		callback.call(self, "failed");
		return;
	}

	try {
		obj.cert.value = certman.selfSignRequest(obj.csr.value, 30, obj.key.value);
	} catch (err) {
		debug(1, "Error generating self signed certificate");
		debug(1, err);
		callback.call(self, "failed");
		return;
	}

	try {
		obj.crl.value = certman.createEmptyCRL(obj.key.value,  obj.cert.value, 30, 0);
	} catch (err) {
		debug(1, "Error generating empty crl");
		debug(1, err);
		callback.call(self, "failed");
		return;
	}
	callback.call(self, "certGenerated");
};

exports.signRequest = function(self, csr, master, callback) {
	var certman;
	try {
		certman = require("../../common/manager/certificate_manager");		
	} catch (err) {
		debug(1, "Error opening certificate manager obj file, please make sure you have compiled cert manager");
		debug(1, err);
		callback.call(self, "failed");
		return;
	}
	try {
		var clientCert = certman.signRequest(csr, 30, master.key.value, master.cert.value);
		callback.call(self, "certSigned", clientCert);
	} catch(err) {
		debug(1, "Error generating signed request");
		debug(1, err);
		return;
	}	
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
			self.config.conn = {};
			self.config.conn.key = {};
			self.config.conn.key.name = name+'_conn_key.pem';
			self.config.conn.cert = {};
			self.config.conn.cert.name = name+'_conn_cert.pem';
			self.config.conn.csr = {};
			self.config.conn.csr.name = name+'_conn_cert.csr';
			self.config.conn.crl = {};
			self.config.conn.crl.name = name+'_conn_cert.crl';
			self.config.master = {};
			self.config.master.cert = {};
			self.config.master.cert.name = name+'_master_cert.pem';
			self.config.master.key = {};
			self.config.master.key.name = name+'_master_key.pem';
			self.config.master.csr = {};
			self.config.master.csr.name = name+'_master_cert.csr';
			self.config.master.crl = {};
			self.config.master.crl.name = name+'_master_cert.crl';
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
			self.config.conn = {};
			self.config.conn.key = {};
			self.config.conn.key.name = name+'_conn_key.pem';
			self.config.conn.cert = {};
			self.config.conn.cert.name = name+'_conn_cert.pem';
			self.config.conn.csr = {};
			self.config.conn.csr.name = name+'_conn_cert.csr';
			self.config.conn.crl = {};
			self.config.conn.crl.name = name+'_conn_cert.crl';
			self.config.master = {};
			self.config.master.cert = {};
			self.config.master.cert.name = name+'_master_cert.pem';
			self.config.master.key = {};
			self.config.master.key.name = name+'_master_key.pem';
			self.config.master.csr = {};
			self.config.master.csr.name = name+'_master_cert.csr';
			self.config.master.crl = {};
			self.config.master.crl.name = name+'_master_cert.crl';
			self.config.common = common;
			self.config.days = 180;			
			callback.call(self,'Certificate Present');	
		}		
	});	
};

