// test for the openssl wrapper.
// TODO: more than just checks for not-empty, need to check some fields
// there is an x509 module somewhere I need to use...

var certman = require("../../src/build/Release/certificate_manager");

var rsakey;
var certReq;
var ssCert;
var cert;
var childKey;
var childReq;
var childCert;
var emptyCRL;

var RSA_START       = "-----BEGIN RSA PRIVATE KEY-----";
var RSA_END         = "-----END RSA PRIVATE KEY-----";
var CERT_REQ_START  = "-----BEGIN CERTIFICATE REQUEST-----";
var CERT_REQ_END    = "-----END CERTIFICATE REQUEST-----";
var CERT_START      = "-----BEGIN CERTIFICATE-----";
var CERT_END        = "-----END CERTIFICATE-----";
var CRL_START       = "-----BEGIN X509 CRL-----";
var CRL_END         = "-----END X509 CRL-----";


describe("generate keys", function() {
    it("can create a 1024 size key", function() {       
        rsakey = certman.genRsaKey(1024);
        expect(rsakey).not.toBeNull();
        expect(rsakey).not.toEqual("");
        expect(rsakey).toContain(RSA_START);
        expect(rsakey).toContain(RSA_END);
        expect(rsakey.length).toBeGreaterThan(100);
    });
    it("can create a bigger key", function() {
        var rsakey2 = certman.genRsaKey(2048);
        expect(rsakey).not.toEqual(rsakey2);
    });
});

describe("generate certificate requests", function() {
    it("can create a certificate request", function() {       
        certReq = certman.createCertificateRequest(rsakey, 
    "UK","OX","Oxford","Univ. Oxford","CA Key", "john.lyle@cs.ox.ac.uk");
        
        expect(certReq).not.toBeNull();
        expect(certReq).toContain(CERT_REQ_START);
        expect(certReq).toContain(CERT_REQ_END);
        expect(certReq.length).toBeGreaterThan(100);
    });
});

describe("sign certificate requests", function() {
    it("can self-sign a certificate request", function() {
        ssCert = certman.selfSignRequest(certReq, 30, rsakey);
        expect(ssCert).not.toBeNull();
        expect(ssCert).toContain(CERT_START);
        expect(ssCert).toContain(CERT_END);
        expect(ssCert.length).toBeGreaterThan(100);
    });
    
    it("can sign another certificate request", function() {
        childKey = certman.genRsaKey(1024);
        childReq = certReq = certman.createCertificateRequest(rsakey, 
    "UK","OX","Oxford","Univ. Oxford","Client Key", "john.lyle@cs.ox.ac.uk");
        childCert = certman.signRequest(childReq, 30, rsakey, ssCert);
        expect(childCert).not.toBeNull();
        expect(childCert).toContain(CERT_START);
        expect(childCert).toContain(CERT_END);
        expect(childCert.length).toBeGreaterThan(100);
    });
});

describe("create certificate revocation lists", function() {
    it("can create an empty CRL", function() {
        emptyCRL = certman.createEmptyCRL(rsakey, ssCert, 30, 0);
        expect(emptyCRL).not.toBeNull();
        expect(emptyCRL).toContain(CRL_START);
        expect(emptyCRL).toContain(CRL_END);
        expect(emptyCRL.length).toBeGreaterThan(50);
    });
    it("can add to a CRL", function() {
        newCRL = certman.addToCRL(rsakey, emptyCRL, childCert);
        expect(newCRL).not.toBeNull();
        expect(newCRL).toContain(CRL_START);
        expect(newCRL).toContain(CRL_END);
        expect(newCRL.length).toBeGreaterThan(50);
        expect(newCRL).not.toEqual(emptyCRL);
    });
});
    
    
    

