var revoker = exports;

var fs      = require('fs');
var path    = require('path');
var	crypto  = require('crypto');

var moduleRoot   = require(path.resolve(__dirname, '../dependencies.json'));
var dependencies = require(path.resolve(__dirname, '../' + moduleRoot.root.location + '/dependencies.json'));
var webinosRoot  = path.resolve(__dirname, '../' + moduleRoot.root.location);
var cert         = require(path.join(webinosRoot, dependencies.pzp.location, 'lib/session_certificate.js'));
var utils        = require(path.join(webinosRoot, dependencies.pzp.location, 'lib/session_common.js'));

revoker.revokePzp = function (pzpid, pzh, callback ) {
    "use strict";
    utils.debug(2,"Revocation requested of " + pzpid);
    
    var payloadErr = {
        status : "revokePzp",
        success: false,
        message: "Failed to revoke"
    };
    var msgErr = { type : 'prop', payload : payloadErr };       
    var payloadSuccess = {
        status : "revokePzp",
        success: true,
        message: "Successfully revoked"
    };
    var msgSuccess = { type : 'prop', payload : payloadSuccess };
    
    getPZPCertificate(pzpid, pzh.config.pzhSignedCertDir, function(status, cert) {
        if (!status) {
            payloadErr.message = payloadErr.message + " - failed to find certificate";
    	    callback(msgErr);
    	    return;
        } else {
 	        console.log('CRL' + cert.toString());
	        //pzh.conn.pair.credentials.context.addCRL(cert.toString());
            revoke(pzh, pzh.config.pzhKeyDir, pzh.config.pzhCertDir, cert, function(result) {
                if (result) {
                    utils.debug(2,"Revocation success! " + pzpid + " should not be able to connect anymore ");                       
                    removeRevokedCert(pzpid, pzh.config.pzhSignedCertDir, pzh.config.pzhRevokedCertDir, function(status2) {
                        if (!status2) {
                            utils.debug(2,"Could not rename certificate");                       
                            payloadSuccess.message = payloadSuccess.message + ", but failed to rename certificate";
                        }
                	    callback(msgSuccess);
                	    return;
                    });                   
                } else {
                    utils.debug(2,"Revocation failed! ");
                    payloadErr.message = payloadErr.message + " - failed to update CRL";
                    callback(msgErr);
                    return;
                }        
            });      
        }
    });
}

revoker.listAllPzps = function(certDir, callback) {
    "use strict";
    getAllPZPIds( certDir, function(pzps, error) {
        if (error === null) {
            var payload = {
                    status : "listAllPzps",
                    success: true,
                    message: []
            }; 
            var i=0;
            for (i=0;i<pzps.length;i++) {
                if (pzps[i] !== null) {
                    payload.message.push(pzps[i]);
                }
            };
        } else {
    	        var payload = {
                    status : "listAllPzps",
                    success: false,
                    message: ""
                };                   
        }
        var msg = {
            type    : 'prop', 
            payload : payload
        }; 
        callback(msg);
    });
}

function revoke(pzh, pzhKeyDir, pzhCertDir, pzpCert, callback) {
	"use strict";
	if (pzh.config.master.key.value === 'null') {
	    pzh.config.master.key.value = fs.readFileSync(pzhKeyDir+'/'+pzh.config.master.key.name).toString();
    	pzh.config.master.crl.value = fs.readFileSync(pzhCertDir+'/'+pzh.config.master.crl.name).toString();
	}
	
	cert.revokeClientCert(pzh, pzh.config.master, pzpCert, function(result, crl) {
	    if (result === "certRevoked") {
	    	try {	
	    		pzh.conn.pair.credentials.context.addCRL(crl);
	    	} catch (err) {
	    		console.log(err);
	    	}
		    pzh.config.master.crl.value = crl;
		    fs.writeFileSync(pzhCertDir+'/'+pzh.config.master.crl.name, crl);
		    //TODO : trigger the PZH to reconnect all clients
		    //TODO : trigger a synchronisation with PZPs.
		    //TODO : rename the cert.
    		callback(true);
	    } else {
		    utils.debug(1, "Failed to revoke client certificate [" + pzpCert + "]");
		    callback(false);
	    }   	    
	});		
}
	
	
function getAllPZPIds(pzhSignedCertDir, callback) {
	"use strict";
	var fileArr = fs.readdirSync(pzhSignedCertDir+'/');
	var idArray = [];
	var i=0;
	for (i=0;i<fileArr.length;i++) {
		try {
			if(fileArr[i] !== "revoked") {
				idArray.push( fileArr[i].split('.')[0]);			
			}
		} catch (err) {
			console.log(err);
		}
	}
	callback(idArray, null);
}
	
	
	
function getPZPCertificate(pzpid, pzhSignedCertDir, callback) {
    "use strict";
    try { 
        var file = pzhSignedCertDir+'/'+ pzpid + ".pem"
        var cert = fs.readFile(file, function(err, cert) {
			callback(true, cert);	    
        });  

    } catch (err) {
        utils.debug(2,"Did not find certificate ");
        console.log(err.stack); 
	    	callback(false, err);	    
    }
}
	
function removeRevokedCert(pzpid, pzhSignedCertDir, pzhRevokedCertDir, callback) {
    "use strict";
    try { 
        var cert = fs.rename(pzhSignedCertDir+'/'+ pzpid + ".pem", pzhRevokedCertDir+'/'+ pzpid + ".pem");  
        callback(true);	    
    } catch (err) {
        utils.debug(2,"Unable to rename certificate " + err); 
	    callback(false);	    
    }
}
	

