

var certman = require("../src/build/Release/certificate_manager");


var caKey = certman.genRsaKey(1024);
console.log("CA Master Key \n" + caKey + "\n");

var caCertReq = certman.createCertificateRequest(caKey, 
    "UK","OX","Oxford","Univ. Oxford","Computer Science", "Johns PZH CA", "john.lyle@cs.ox.ac.uk");
console.log("CA Certificate Request: \n" + caCertReq + "\n");

var caCert = certman.selfSignRequest(caCertReq, 30, caKey);
console.log("CA Certificate: \n" + caCert + "\n");


var crl = certman.createEmptyCRL(caKey, caCert, 30, 0);
console.log("Empty PZH CRL: \n" + crl + "\n");





var pzpKey = certman.genRsaKey(1024);
console.log("Dummy PZP Master Key \n" + pzpKey + "\n");

var pzpCertReq = certman.createCertificateRequest(pzpKey, 
    "UK","OX","Oxford","Univ. Oxford","Computer Science", "Johns PZP", "john.lyle@cs.ox.ac.uk");
console.log("PZP Certificate Request: \n" + pzpCertReq + "\n");

var pzpCert = certman.signRequest(pzpCertReq, 30, caKey, caCert);
console.log("PZP Certificate, signed by PZH CA: \n" + pzpCert + "\n");




var crlWithKey = certman.addToCRL(caKey, crl, pzpCert);
console.log("PZP Certificate revoked, new CRL: \n" + crlWithKey + "\n");

 
