var certificate = exports;
var path = require('path');	
var utils =  require(path.resolve(__dirname, '../../pzp/lib/session_common.js'));
/* @description Create private key, certificate request, self signed certificate and empty crl. This is crypto sensitive function
 * @param {Object} self is currect object of Pzh/Pzp
 * @param {String} name used in common field to differentiate Pzh and Pzp 
 * @param {Object} obj holds key, certificate and crl certificate values and names
 * @returns {Function} callback returns failed or certGenerated. Added to get synchronous behaviour
 */
certificate.selfSigned = function(self, name, obj, callback) {
	"use strict";
	var certman;
	try {
		certman = require("../../common/manager/certificate_manager/src/build/Release/certificate_manager");		
	} catch (err) {
		callback.call(self, "failed", err);
		return;
	}

	try {
		obj.key.value = certman.genRsaKey(1024);
	} catch(err1) {
		callback.call(self, "failed", err1);
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
		callback.call(self, "failed", e);
		return;
	}

	try {
		obj.cert.value = certman.selfSignRequest(obj.csr.value, 30, obj.key.value);
	} catch (e1) {
		callback.call(self, "failed", e1);
		return;
	}

	try {
		obj.crl.value = certman.createEmptyCRL(obj.key.value,  obj.cert.value, 30, 0);
	} catch (e2) {
		callback.call(self, "failed", e2);
		return;
	}
	callback.call(self, "certGenerated");
};

/* @description Crypto sensitive 
*/
certificate.signRequest = function(self, csr, master, callback) {
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
	    utils.debug(1, "Failed to sign certificate: " + err1.code + ", " + err1.stack);
		callback.call(self, "failed");
		return;
	}	
};

certificate.revokeClientCert = function(self, master, pzpCert, callback) {
    "use strict";
    var certman;
	
	try {
		certman = require("../../common/manager/certificate_manager/src/build/Release/certificate_manager");		
	} catch (err) {
	    utils.debug(1, "Failed to require the certificate manager");
		callback.call(self, "failed");
		return;
	}
	try {
	    utils.debug(2, "Calling certman.addToCRL\n");    
		var crl = certman.addToCRL("" + master.key.value, "" + master.crl.value, "" + pzpCert); 
		// master.key.value, master.cert.value
		callback.call(self, "certRevoked", crl);
	} catch(err1) {
	    utils.debug(1, "Error: " + err1);
		callback.call(self, "failed");
		return;
	}
}
