

var certman = null;
if (process.platform != 'android')
  certman = require("../src/build/Release/certificate_manager");
else
  certman = require('certificate_manager');

var debug = true;
var caKey = null;
caKey = certman.genRsaKey(1024);
if (debug) console.log("CA Master Key \n[" + caKey + "]\n");

var caCertReq = null;
caCertReq = certman.createCertificateRequest(caKey, 
    "UK","OX","Oxford","Univ. Oxford","Computer Science", "Johns PZH CA", "john.lyle@cs.ox.ac.uk");
if (debug) console.log("CA Certificate Request: \n[" + caCertReq + "]\n");

var caCert = null;
caCert = certman.selfSignRequest(caCertReq, 30, caKey,1);
if (debug) console.log("CA Certificate: \n[" + caCert + "]\n");


var crl = null;
crl = certman.createEmptyCRL(caKey, caCert, 30, 0);
if (debug) console.log("Empty PZH CRL: \n[" + crl + "]\n");





var pzpKey = null; 
pzpKey = certman.genRsaKey(1024);
if (debug) console.log("Dummy PZP Master Key \n[" + pzpKey + "]\n");

var pzpCertReq = null;
pzpCertReq = certman.createCertificateRequest(pzpKey, 
    "UK","OX","Oxford","Univ. Oxford","Computer Science", "Johns PZP", "john.lyle@cs.ox.ac.uk");
if (debug) console.log("PZP Certificate Request: \n[" + pzpCertReq + "]\n");

var pzpCert = null;
pzpCert = certman.signRequest(pzpCertReq, 30, caKey, caCert);
if (debug) console.log("PZP Certificate, signed by PZH CA: \n[" + pzpCert + "]\n");




var crlWithKey = null;
crlWithKey = certman.addToCRL(caKey, crl, pzpCert);
if (debug) console.log("PZP Certificate revoked, new CRL: \n[" + crlWithKey + "]\n");

 
