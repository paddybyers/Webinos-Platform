/**
* @description Session common has functions that are used by both Pzh and Pzp
* @author <a href="mailto:habib.virji@samsung.com">Habib Virji</a>
*/
 

if (typeof exports !== "undefined") {
	var path = require('path');
	var moduleRoot = require(path.resolve(__dirname, '../dependencies.json'));
	var dependencies = require(path.resolve(__dirname, '../' + moduleRoot.root.location + '/dependencies.json'));
	var webinosRoot = path.resolve(__dirname, '../' + moduleRoot.root.location);

	var messaging = require(path.join(webinosRoot, dependencies.manager.messaging.location, 'lib/messagehandler.js'));
	var rpc = require(path.join(webinosRoot, dependencies.rpc.location, 'lib/rpc.js'));
	var fs = require('fs');
	var crashMsg = fs.createWriteStream('crash.txt', {'flags': 'a'});
	var infoMsg = fs.createWriteStream('info.txt', {'flags': 'a'});
}

var debug = function(num, msg) {
	"use strict";
	var info = true; // Change this if you want no prints from session manager
	var debug = true;
	var fs = require('fs');
	
	if(num === 1) {
		console.log('ERROR:' + msg);
		crashMsg.write(msg);
		crashMsg.write('\n');
	} else if(num === 2 && info) {
		console.log('INFO:' + msg);
		infoMsg.write(msg);
		infoMsg.write('\n');
	} else if(num === 3 && debug) {
		console.log('DEBUG:' + msg);
	}
};

// This is a device id through which we recognize device
var getId = function (self, callback) {
	"use strict";
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
};

/* @description Create private key, certificate request, self signed certificate and empty crl. This is crypto sensitive function
 * @param {Object} self is currect object of Pzh/Pzp
 * @param {String} name used in common field to differentiate Pzh and Pzp 
 * @param {Object} obj holds key, certificate and crl certificate values and names
 * @returns {Function} callback returns failed or certGenerated. Added to get synchronous behaviour
 */
exports.selfSigned = function(self, name, obj, callback) {
	"use strict";
	var certman;
	try {
		certman = require("../../common/manager/certificate_manager/src/build/Release/certificate_manager");		
	} catch (err) {
		callback.call(self, "failed");
		return;
	}

	try {
		obj.key.value = certman.genRsaKey(1024);
	} catch(err1) {
		callback.call(self, "failed");
		return;
	}

	var common = name+':'+self.config.common;
	self.config.cn = common; 
	

	try {
		obj.csr.value = certman.createCertificateRequest(obj.key.value, 
			self.config.country,
			self.config.state,
			self.config.city,
			self.config.orgname,
			self.config.orgunit,
			common, 
			self.config.email);
	} catch (e) {
		callback.call(self, "failed");
		return;
	}

	try {
		obj.cert.value = certman.selfSignRequest(obj.csr.value, 30, obj.key.value);
	} catch (e1) {
		callback.call(self, "failed");
		return;
	}

	try {
		obj.crl.value = certman.createEmptyCRL(obj.key.value,  obj.cert.value, 30, 0);
	} catch (e2) {
		callback.call(self, "failed");
		return;
	}
	callback.call(self, "certGenerated");
};

/* @description Crypto sensitive 
*/
exports.signRequest = function(self, csr, master, callback) {
	"use strict";
	var certman;
	
	try {
		certman = require("../../common/manager/certificate_manager/src/build/Release/certificate_manager");		
	} catch (err) {
		callback.call(self, "failed");
		return;
	}
	try {
		var clientCert = certman.signRequest(csr, 30, master.key.value, master.cert.value);
		callback.call(self, "certSigned", clientCert);
	} catch(err1) {
		callback.call(self, "failed");
		return;
	}	
};

exports.revokeClientCert = function(self, master, pzpCert, callback) {
    "use strict";
    var certman;
	
	try {
		certman = require("../../common/manager/certificate_manager/src/build/Release/certificate_manager");		
	} catch (err) {
	    debug(1, "Failed to require the certificate manager");
		callback.call(self, "failed");
		return;
	}
	try {
	    debug(2, "Calling certman.addToCRL\n");    
		var crl = certman.addToCRL("" + master.key.value, "" + master.crl.value, "" + pzpCert); 
		// master.key.value, master.cert.value
		callback.call(self, "certRevoked", crl);
	} catch(err1) {
	    debug(1, "Error: " + err1);
		callback.call(self, "failed");
		return;
	}
}



/** @desription It removes the connected PZP/Pzh details.
 */
exports.removeClient = function(self, conn) {
	"use strict";
	var i, delId, delPzhId;
	
	for (i in self.connectedPzp) {
		if(self.connectedPzp.hasOwnProperty(i)) {
			if(conn.socket._peername.address === self.connectedPzp[i].address) {
				delId = i;
				delete self.connectedPzp[i];
			}
		}
	}
	
	if (typeof delId !== "undefined") {
		for ( i = 0 ; i < self.connectedPzpIds.length; i += 1) {
			if ( delId === self.connectedPzpIds[i]) {
				//delete self.connectedPzpIds[i];
				self.connectedPzpIds.splice(i, 1);
				return delId;
			}
		}
	}
	
	for (i in self.connectedPzh) {
		if(self.connectedPzh.hasOwnProperty(i)) {
			if(conn.socket._peername.address === self.connectedPzh[i].address) {
				delPzhId = i;
				self.connectedPzh.splice(i, 1);
				//delete self.connectedPzh[i];
			}
		}
	}
	if (typeof delIPzhId !== "undefined") {
		for ( i = 0 ; i < self.connectedPzhIds.length; i += 1) {
			if ( delPzhId === self.connectedPzhIds[i]) {
				//delete self.connectedPzhIds[i];
				self.connectedPzhIds.splice(i, 1);
				return delPzhId;
			}
		}
	}
	
	
};

var checkSchema = function(message) {
	var myEnv, assert, schema, validation;
	try {
		myEnv = require('schema')('myEnvironment', {locale: 'en'});
	} catch (err) {
		return 'failed';
	}
	try {
		assert = require('assert');
	} catch (err1) {
		return 'failed';
	}
	try {
		message = JSON.parse(message);
	} catch(err2) {
		return 'failed';
	}	
	
	schema = myEnv.Schema.create({
		type: 'object',
		properties:{
			register: {
				type:'boolean',
				default: false
			},
			
			type: {
				type: 'string',
				enum: ['JSONRPC', 'prop'],
				minLength: 0,
				maxLength: 7,
				default: 'JSONRPC'
			},
			from: {
				type: 'string',
				minLength: 0,
				maxLength: 99,
				default: '',
			},
			to: {
				type: 'string',
				minLength: 0,
				maxLength: 99,
				default: '',
			},
			resp_to: {
				type: 'string',
				minLength: 0,
				maxLength: 99,
				default: '',
			},
			timestamp: {
				type: 'string',
				minLength: 0,
				maxLength: 200,
				default: '',
			},
			timeout: {
				type: 'string',
				minLength: 0,
				maxLength: 200,
				default: '',
			},
			payload: {
				type: 'object',
				default:[]
			}			
		},
		additionalProperties: false
	});
	try {
		validation = schema.validate(message);
		assert.strictEqual(validation.isError(), false);
		return validation.isError();
	} catch (err2) {
		console.log(validation.getError());
		return true;
	}
};


exports.processedMsg = function(self, data, dataLen, callback) {
	"use strict";
	var msg = data.toString('utf8');
	if(msg[0] ==='#' && msg[msg.length-dataLen] === '#') {
		msg = msg.split('#');
		/*if(checkSchema(msg[1]) === false) */{
			var parse = JSON.parse(msg[1]);
			callback.call(self, parse);
		}
	}	
};

/**
* @description Helper function used by messaging and rpc. Object differentiates between different instance of Pzp. This function is called via mesaging.
* @param {Object} message rpc request or response message
* @param {String} address address to forward message 
* @param {Object} object current pzh or pzp instance
*/
var send = function (message, address, object) {
	"use strict";
	message.from = address;
	object.sendMessage(message, address);
};

var setMessagingParam = function(self){
	"use strict";
	messaging.setGetOwnId(self.sessionId);
	messaging.setObjectRef(self);
	messaging.setSendMessage(send);
	messaging.setSeparator("/");
};

/** Calls messaging function, to adapt to correct object and process received message
* @param data message forwarded to messaging  
*/
exports.sendMessageMessaging = function(self, data) {
	"use strict";
	setMessagingParam(self);
	if(typeof data.to !== 'undefined') {
		messaging.onMessageReceived(data, data.to);
	} else {
		messaging.onMessageReceived(data);
	}
};

/** This functions configure pzp. It first check in current directory matching with common
* name. It it finds then it does not set certificate vale in config structure. Else it just
* sets certificate name to expect in directory
* @param contents of certificate 
* @param callback to be called after executing 
*/
exports.configure = function(self, id, contents, callback) {
	"use strict";
	var name, i =0, j, flag = true, common = '', data1;
	var fs = require('fs');
	fs.readdir(__dirname, function(err, files) {
		for(i = 0; i < files.length; i += 1) {
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
//TODO: IP first address fails, use second address support
exports.resolveIP = function(serverName, callback) {
	var dns = require('dns');
	var net = require('net');
	if(net.isIP(serverName) !== 0) {
		callback(serverName);
	} else {
		dns.resolve(serverName, function(err, address) {
			if(err) {
				return "undefined";
			} else {
				callback(address[0]);
			}
		});
	}
};

exports.getId = getId;
exports.debug = debug;
exports.setMessagingParam = setMessagingParam;
exports.checkSchema = checkSchema;
