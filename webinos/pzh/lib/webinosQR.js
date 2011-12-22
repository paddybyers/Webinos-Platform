

var webinosqr = exports;


webinosqr.create = function(url, code, cb) {
    "use strict";
    try { 
        var QRCode = require('qrcode');
        QRCode.toDataURL("" + url + ' ' + code, function(err,url) {
            cb(err,"<img src=\"" + url + "\" />");
        });
    } catch (err) {
        cb(err, "<img src=\"http://www.yooter.com/images/pagenotfound.jpg\" />");
    }
}


