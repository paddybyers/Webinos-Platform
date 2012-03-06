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


var crypto  = require('crypto');
var path    = require('path');

var webinosqr = exports;

webinosqr.createQR = function(url, code, cb) {
    create(url,code,cb);
}

function create(url, code, cb) {
    "use strict";
    try { 
        var QRCode = require('qrcode');
        QRCode.toDataURL("" + url + ' ' + code, function(err,url) {
            cb(err, url);
        });
    } catch (err) {
        cb(err, "<img src=\"http://www.yooter.com/images/pagenotfound.jpg\" />");
    }
}

function generateRandomCode() {
    return crypto.randomBytes(8).toString("base64");
}


// Add a new PZP by generating a QR code.  This function:
// (1) returns a QR code 
// (2) generates a new secret code, to be held by the PZH
// (3) tells the PZH to be ready for a new PZP to be added
webinosqr.addPzpQR = function(pzh, connection) {
    "use strict";
    
    var code = generateRandomCode();

    pzh.expecting.setExpectedCode(code,function() {
        pzh.getMyUrl(function(url) { 
            create(url, code, function(err, qrimg) {
                if (err == null) {
                    var message = {
                        name: pzh.sessionId, 
                        img: qrimg,
                        result: "success"
                        };
		            var payload = {status : 'addPzpQR', message : message};
                    var msg = {type: 'prop', payload: payload};	                    
                    connection.sendUTF(JSON.stringify(msg));
                } else {
                    pzh.expecting.unsetExpected( function() {
                        var message = {
                            name: pzh.sessionId, 
                            img: qrimg,
                            result: "failure: not suppported"
                            };			            
                        var payload = {status : 'addPzpQR', message : message};
                        var msg = {type: 'prop', payload: payload};
    	                connection.sendUTF(JSON.stringify(msg));
                    });
                }
            });
        });	    
    }); 
}

webinosqr.addPzpQRAgain = function(pzh, next) {
    "use strict";
    
    var code = generateRandomCode();

    pzh.expecting.setExpectedCode(code,function() {
        pzh.getMyUrl(function(url) {
            create(url, code, function(err, qrimg) {
		    next({cmd: 'addPzpQR', payload:{err: err, img: qrimg, code: code}});

            });
        });	    
    }); 
}



