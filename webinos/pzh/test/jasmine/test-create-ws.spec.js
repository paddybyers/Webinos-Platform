var path            = require('path'),	
    util            = require('util'),
    fs              = require('fs'),
    moduleRoot      = require(path.resolve(__dirname, '../dependencies.json')),
    dependencies    = require(path.resolve(__dirname, '../' + moduleRoot.root.location + '/dependencies.json')),
    webinosRoot     = path.resolve(__dirname, '../' + moduleRoot.root.location),
    webCert         = require(path.join(webinosRoot, dependencies.pzh.location, 'web/pzh_web_certs.js')),
    certman         = require(path.resolve(webinosRoot,dependencies.manager.certificate_manager.location));


var RSA_START       = "-----BEGIN RSA PRIVATE KEY-----";
var RSA_END         = "-----END RSA PRIVATE KEY-----";
var CERT_START      = "-----BEGIN CERTIFICATE-----";
var CERT_END        = "-----END CERTIFICATE-----";

function createPZH() {
    "use strict";
    var pzh = {
        server : "servername",
        config : { 
            pzhKeyDir : "./",
            pzhCertDir : "./",
            master : {
                key : { 
                    name  : "master-key.pem",
                    value : null
                },
                cert : {
                    name  : "master-cert.pem",
                    value : null
                }
            },
            webserver : {
                key : { 
                    name  : "webserver-key.pem",
                    value : null
                },
                cert : {
                    name  : "webserver-cert.pem",
                    value : null
                }                
            },
            country : "UK",
            state   : "OX",
            city    : "Oxford",
            orgname : "OU",
            orgunit : "CS",
            email   : "test@example.com"
        }
    }   
    
    pzh.config.master.key.value = certman.genRsaKey(1024).toString();
       
    
    var csr = certman.createCertificateRequest(
                            pzh.config.master.key.value, 
                            pzh.config.country, 
                            pzh.config.state,
                            pzh.config.city,
                            pzh.config.orgname,
                            pzh.config.orgunit,
                            "PZH Master common name",
                            pzh.config.email);
    
    pzh.config.master.cert.value = certman.selfSignRequest(
        csr, 30, pzh.config.master.key.value, 0 ,"http://test.url").toString();
        
    return pzh;
};

function deleteFiles() {
    if (path.existsSync("./webserver-key.pem")) {
        fs.unlinkSync("./webserver-key.pem");
    }
    if (path.existsSync("./webserver-cert.pem")) {
        fs.unlinkSync("./webserver-cert.pem");
    }

}


describe("generate web server certificate", function() {
    it("can create keys in a particular directory", function() {       
        
        var pzh = createPZH();
        console.log(pzh);
        
        deleteFiles();       

        webCert.createWSCert(pzh, function(err, wsCert, wsKey) {
            var certPath = path.join(pzh.config.pzhCertDir, pzh.config.webserver.cert.name);
            var keyPath = path.join(pzh.config.pzhKeyDir, pzh.config.webserver.key.name);
            expect(err).toBeNull();
            expect(wsCert).not.toBeNull();
            expect(wsCert).toContain(CERT_START);
            expect(wsCert).toContain(CERT_END);
            expect(path.existsSync(certPath)).toBeTruthy();  
            expect(fs.readFileSync(certPath).toString()).toEqual(wsCert);
                        
            expect(wsKey).not.toBeNull(); 
            expect(wsKey).toContain(RSA_START);
            expect(wsKey).toContain(RSA_END);
            expect(path.existsSync(keyPath)).toBeTruthy();  
            expect(fs.readFileSync(keyPath).toString()).toEqual(wsKey);
            
            deleteFiles();
        });
        
    });
});

