/*******************************************************************************
*  Code contributed to the webinos project
*
* Licensed under the Apache License, Version 2.0 (the "License");
* you may not use this file except in compliance with the License.
* You may obtain a copy of the License at
* 
*     http://www.apache.org/licenses/LICENSE-2.0
* 
* Unless required by applicable law or agreed to in writing, software
* distributed under the License is distributed on an "AS IS" BASIS,
* WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
* See the License for the specific language governing permissions and
* limitations under the License.
*
*******************************************************************************/


var revoker = exports;

var fs      = require('fs');
var path    = require('path');
var	crypto  = require('crypto');
var	util    = require('util');


var moduleRoot   = require(path.resolve(__dirname, '../dependencies.json'));
var dependencies = require(path.resolve(__dirname, '../' + moduleRoot.root.location + '/dependencies.json'));
var webinosRoot  = path.resolve(__dirname, '../' + moduleRoot.root.location);
var cert         = require(path.join(webinosRoot, dependencies.pzp.location, 'lib/session_certificate.js'));
var utils        = require(path.join(webinosRoot, dependencies.pzp.location, 'lib/session_common.js'));

revoker.revokePzp = function (pzpid, pzh, callback ) {
    "use strict";
    getPZPCertificate(pzpid, pzh.config.pzhSignedCertDir, function(status, pzpcert) {
        if (!status) {
    	    callback("Failed to find pzp certificate");
        } else {
            revoke(pzh, pzh.config.pzhKeyDir, pzh.config.pzhCertDir, pzpcert, function(result) {
                if (result) {
                    utils.debug(2,"Revocation success! " + pzpid + " should not be able to connect anymore ");                       
                    removeRevokedCert(pzpid, pzh.config.pzhSignedCertDir, pzh.config.pzhRevokedCertDir, function(status2) {
                        if (!status2) {
                            utils.debug(2,"Could not rename certificate");                       
                        }
                	    callback();
                	    return;
                    });                   
                } else {
                    utils.debug(2,"Revocation failed! ");
                    callback("failed to update CRL");
                }        
            });      
        }
    });
}

// from here - remove the JSON crap.

revoker.listAllPzps = function(pzh, callback) {
    "use strict";
    var pzpList = [];
    getAllPZPIds(pzh.config.pzhSignedCertDir, function(pzps, error) {
        if (error === null) {
            for (var i=0;i<pzps.length;i++) {
                if (pzps[i] !== null) {
                    pzpList.push(pzps[i]);
                }
            }
            callback(null, pzpList);
        } else {
    	    callback(error);
        }
    });
}

revoker.listAllPzhs = function(pzh, callback) {
    var list = [];
    var me = "Your PZH";
    if (pzh.config.common.split(':')[0] !== null) {
        me = pzh.config.common.split(':')[0];
    } 
    
    list.push(me);  
    var id;
    for (id in pzh.connectedPzh) {
          list.push(id);
    }

//    self.connectedPzh[connPzhId]

/*    
    pzh.getMyUrl(function(url)) {
        callback(null, [url]);
        //TODO
    }
*/

    callback(null, list);
  
}


function revoke(pzh, pzhKeyDir, pzhCertDir, pzpCert, callback) {
	"use strict";
	if (pzh.config.master.key.value === 'null') {
	    pzh.config.master.key.value = fs.readFileSync(pzhKeyDir+'/'+pzh.config.master.key.name).toString();
    	pzh.config.master.crl.value = fs.readFileSync(pzhCertDir+'/'+pzh.config.master.crl.name).toString();
	}
	
	cert.revokeClientCert(pzh, pzh.config.master, pzpCert, function(result, crl) {
	    if (result === "certRevoked") {
/*
	    	try {	
	    		pzh.conn.pair.credentials.context.addCRL(crl);
	    	} catch (err) {
	    		console.log(err);
	    	}
*/
		    pzh.config.master.crl.value = crl;
		    fs.writeFileSync(pzhCertDir+'/'+pzh.config.master.crl.name, crl);
		    //TODO : trigger the PZH to reconnect all clients
		    //TODO : trigger a synchronisation with PZPs.
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
        var cert = fs.readFileSync(file) 		        
		callback(true, cert);	    
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
	

