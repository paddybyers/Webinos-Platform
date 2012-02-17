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


var path            = require('path'),	
    util            = require('util'),
    fs              = require('fs'),
    moduleRoot      = require(path.resolve(__dirname, '../dependencies.json')),
    dependencies    = require(path.resolve(__dirname, '../' + moduleRoot.root.location + '/dependencies.json')),
    webinosRoot     = path.resolve(__dirname, '../' + moduleRoot.root.location),
    certman         = require(path.resolve(webinosRoot,dependencies.manager.certificate_manager.location)),
    utils           = require(path.join(webinosRoot, dependencies.pzp.location, 'lib/session_common.js'));

var wscert = exports;

/* Create a certificate and key for the web interface 
 * callback(err, key, cert)
 */
wscert.createWSCert = function(pzh, callback) {
    "use strict";
    
    var wsCert, wsKey, wsCSR;

    try { 
        wsKey = certman.genRsaKey(2048);
        wsCSR = certman.createCertificateRequest(
            wsKey, 
            pzh.config.country,
			pzh.config.state,
			pzh.config.city,
			pzh.config.orgname,
			pzh.config.orgunit,
			pzh.server, 
			pzh.config.email
    	);         
        wsCert = certman.signRequest(
            wsCSR, 
            30, 
            pzh.config.master.key.value, 
            pzh.config.master.cert.value, 
            1, /* we're like a connection certificate. */
            pzh.server
        );
    } catch (err) {
        utils.debug(1, "Error creating web server PZH certificates - CertificateManager error");
        utils.debug(1, err);
        utils.debug(1, "wsCert: " + util.inspect(wsCert));
        utils.debug(1, "wsKey: " + util.inspect(wsKey));        
        callback(err);    
    }


    /* store certificate in pre-created directories - we assume as a 
     * precondition that these already exist.
     */
    try { 
        fs.writeFileSync(path.join(pzh.config.pzhKeyDir,pzh.config.webserver.key.name), wsKey);
        fs.writeFileSync(path.join(pzh.config.pzhCertDir,pzh.config.webserver.cert.name), wsCert);
    } catch (err) {
        utils.debug(1, "Error creating web server PZH certificates - could not write to files");
        utils.debug(1, err);
        callback(err);
    }
    
    callback(null,wsCert,wsKey);
}

