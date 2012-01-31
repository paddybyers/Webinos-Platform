var	crypto  = require('crypto');
var path = require('path');
var utils   = require(path.resolve(__dirname, '../../pzp/lib/session_common.js'));

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
                if (err === null) {
                    next(err, qrimg, code);
                } else {
                    next(err);
                }
            });
        });	    
    }); 
}



