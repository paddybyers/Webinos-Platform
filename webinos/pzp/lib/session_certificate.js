var certificate = exports;
var path = require('path');	

var moduleRoot   = require(path.resolve(__dirname, '../dependencies.json'));
var dependencies = require(path.resolve(__dirname, '../' + moduleRoot.root.location + '/dependencies.json'));
var webinosRoot  = path.resolve(__dirname, '../' + moduleRoot.root.location);


var utils =  require(path.resolve(webinosRoot,dependencies.pzp.location, 'lib/session_common.js')).debug;
/* @description Create private key, certificate request, self signed certificate and empty crl. This is crypto sensitive function
 * @param {Object} self is currect object of Pzh/Pzp
 * @param {String} name used in common field to differentiate Pzh and Pzp 
 * @param {Object} obj holds key, certificate and crl certificate values and names
 * @returns {Function} callback returns failed or certGenerated. Added to get synchronous behaviour
 */

certificate.selfSigned = function(name, certValues, obj, callback) {
	"use strict";
	var certman;
	var certType;
	try {
	  if(process.platform !== 'android') {
		certman = require(path.resolve(webinosRoot,dependencies.manager.certificate_manager.location));	
	  } else {
		certman = require('certificate_manager');
	  }
	} catch (err) {
		callback("failed", err);
		return;
	}

	try {
		obj.key.value = certman.genRsaKey(1024);
	} catch(err1) {
		callback("failed", err1);
		return;
	}

	
	var cn = name+':'+certValues.common;

	if ( name === 'PzhFarm' || name === 'PzhFarmCA') {
		certType = 0;
	} else if(name === 'Pzh') {
		certType = 1;
	} else if(name === 'Pzp') {
		certType = 2;
	}

	try {
		obj.csr.value = certman.createCertificateRequest(obj.key.value,
			certValues.country,
			certValues.state,
			certValues.city,
			certValues.orgname,
			certValues.orgunit,
			cn, 
			certValues.email);
	} catch (e) {
		callback("failed", e);
		return;
	}

	try {
		obj.cert.value = certman.selfSignRequest(obj.csr.value, 180, obj.key.value, certType, "pzh.webinos.org");
	} catch (e1) {
		callback("failed", e1);
		return;
	}

	try {
		obj.crl.value = certman.createEmptyCRL(obj.key.value,  obj.cert.value, 180, 0);
	} catch (e2) {
		callback("failed", e2);
		return;
	}

	callback("certGenerated");
};

/* @description Crypto sensitive 
*/
certificate.signRequest = function(csr, master, certType, callback) {
	"use strict";
	var certman;
	
	try {
		certman = require(path.resolve(webinosRoot,dependencies.manager.certificate_manager.location));
	} catch (err) {
		callback( "failed");
		return;
	}
	try {
		var clientCert = certman.signRequest(csr, 30, master.key.value, master.cert.value, certType, "pzh.webinos.org");
		callback("certSigned", clientCert);
	} catch(err1) {
		log('ERROR', "Failed to sign certificate: " + err1.code + ", " + err1.stack);
		callback("failed");
		return;
	}	
};

certificate.revokeClientCert = function(self, master, pzpCert, callback) {
	"use strict";
	var certman;
	
	try {
		certman = require(path.resolve(webinosRoot,dependencies.manager.certificate_manager.location));		
	} catch (err) {
		log("ERROR", "Failed to find the certificate manager");
		callback("failed", err);
		return;
	}
	try {
		log("ERROR", "Calling certman.addToCRL\n");
		var crl = certman.addToCRL("" + master.key.value, "" + master.crl.value, "" + pzpCert); 
		// master.key.value, master.cert.value
		callback("certRevoked", crl);
	} catch(err1) {
		log("ERROR", "Error: " + err1);
		callback("failed", err1);
		return;
	}
}
