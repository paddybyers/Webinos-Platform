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
	
}


var debug = function(num, msg) {
	"use strict";
	var info = true; // Change this if you want no prints from session manager
	var debug = true;
	var fs = require('fs');
	
	if(num === 1) {
		console.log('ERROR:' + msg);	
	} else if(num === 2 && info) {
		console.log('INFO:' + msg);		
	} else if(num === 3 && debug) {
		console.log('DEBUG:' + msg);
	}	
};

// This is a device id through which we recognize device
var getId = function (self, callback) {
	"use strict";
	console.log('PZ Common: Selected Platform - ' + process.platform);	
	callback.call(self, process.platform);
};


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

exports.resolveIP = function(serverName, callback) {
	var dns = require('dns');
	var net = require('net');
	if(net.isIP(serverName) !== 0) {
		callback(serverName);
	} else {
		dns.resolve(serverName, function(err, addresses) {			
			if (typeof err !== 'undefined') {
				// try again with lookup
				dns.lookup(serverName, function(err, address, family) {
					callback(address);
				});				
			} else {
				// resolve succeeded
				callback(addresses[0]);			
			}
		});
	}
};

exports.getId = getId;
exports.debug = debug;
exports.setMessagingParam = setMessagingParam;

