#include "openssl_wrapper.h"
#include <openssl/rsa.h>
#include <openssl/bio.h>
#include <openssl/bn.h>
#include <openssl/pem.h>
#include <openssl/err.h>
#include <stdio.h>
#include <string.h>
#include <iostream>

void genRsaKey(const int bits, char * privkey) throw(::WebinosCryptoException)
{ 
    BIO * out = BIO_new(BIO_s_mem());
    RSA * rsa = 0;
    BIGNUM * bn = 0;
    if (!(rsa = RSA_new())) {
        throw ::WebinosCryptoException(::ERR_error_string(::ERR_get_error(),NULL));
    }
    if (!(bn = BN_new())) {
        throw ::WebinosCryptoException(::ERR_error_string(::ERR_get_error(),NULL));
    }
    if (!BN_set_word(bn,RSA_F4)) {
        throw ::WebinosCryptoException(::ERR_error_string(::ERR_get_error(),NULL));
    }
    if (!RSA_generate_key_ex(rsa,bits,bn,NULL)) {
        throw ::WebinosCryptoException(::ERR_error_string(::ERR_get_error(),NULL));
    }
    if (!PEM_write_bio_RSAPrivateKey(out, rsa, NULL, NULL, 0, NULL, NULL)) {
        throw ::WebinosCryptoException(::ERR_error_string(::ERR_get_error(),NULL));
    }
    if (BIO_read(out,privkey,bits) <= 0) {
        throw ::WebinosCryptoException(::ERR_error_string(::ERR_get_error(),NULL));
    }  
    
    BIO_free_all(out);
    BN_free(bn);
    RSA_free(rsa);
}

void createCertificateRequest(char* result, char* keyToCertify, char * country, char* state, char* loc, char* organisation, char *organisationUnit, char* cname, char* email) throw(::WebinosCryptoException)
{
    //create a new memory BIO.
    BIO *mem = BIO_new(BIO_s_mem());
    
    //create a new X509 request
    X509_REQ * req=X509_REQ_new();
    
    //fill in details
    // C=US, ST=Maryland, L=Pasadena, O=Brent Baccala, OU=FreeSoft, CN=www.freesoft.org/emailAddress=baccala@freesoft.org
    X509_NAME *nm;
    nm = X509_NAME_new();
    if(!X509_NAME_add_entry_by_txt(nm,"C",
				MBSTRING_ASC, (unsigned char*)country, -1, -1, 0)) {
	 std::string error = "Error setting C in cert request\n";
	 error += std::string(::ERR_error_string(::ERR_get_error(),NULL));
	 throw ::WebinosCryptoException(error.c_str());
	}
	if(!X509_NAME_add_entry_by_txt(nm,"ST",
				MBSTRING_ASC, (unsigned char*)state, -1, -1, 0)) {
	 std::string error = "Error setting ST in cert request";
	 error += std::string(::ERR_error_string(::ERR_get_error(),NULL));
	 throw ::WebinosCryptoException(error.c_str());
	}

	if(!X509_NAME_add_entry_by_txt(nm,"L",
				MBSTRING_ASC, (unsigned char*)loc, -1, -1, 0)) {
	 std::string error = "Error setting L in cert request\n";
	 error += std::string(::ERR_error_string(::ERR_get_error(),NULL));
	 throw ::WebinosCryptoException(error.c_str());
	}

	if(!X509_NAME_add_entry_by_txt(nm,"O",
				MBSTRING_ASC, (unsigned char*)organisation, -1, -1, 0)) {
	 std::string error = "Error setting O in cert request\n";
	 error += std::string(::ERR_error_string(::ERR_get_error(),NULL));
	 throw ::WebinosCryptoException(error.c_str());
	}
    
	if(!X509_NAME_add_entry_by_txt(nm,"OU",
				MBSTRING_ASC, (unsigned char*)organisationUnit, -1, -1, 0)) {
	 std::string error = "Error setting OU in cert request\n";
	 error += std::string(::ERR_error_string(::ERR_get_error(),NULL));
	 throw ::WebinosCryptoException(error.c_str());
	}

	if(!X509_NAME_add_entry_by_txt(nm,"CN",
				MBSTRING_ASC, (unsigned char*)cname, -1, -1, 0)) {
	 std::string error = "Error setting CN in cert request\n";
	 error += std::string(::ERR_error_string(::ERR_get_error(),NULL));
	 throw ::WebinosCryptoException(error.c_str());
	}
	
	if(!X509_NAME_add_entry_by_txt(nm,"emailAddress",MBSTRING_ASC, (unsigned char*)email, -1, -1, 0)) {
	
	 std::string error = "Error setting Email in cert request\n";
	 error += std::string(::ERR_error_string(::ERR_get_error(),NULL));
	 throw ::WebinosCryptoException(error.c_str());
	 
    }
						
    
    X509_REQ_set_subject_name(req, nm);

    //Set the public key   
    //...convert PEM private key into a BIO
    
    BIO* bmem = BIO_new_mem_buf(keyToCertify, -1);
    if (!bmem) {
        std::string error = "Error creating BIO from key \n" + std::string(::ERR_error_string(::ERR_get_error(),NULL));
	    throw ::WebinosCryptoException(error.c_str());
    }
    
    // read the private key into an EVP_PKEY structure
    EVP_PKEY* privkey = PEM_read_bio_PrivateKey(bmem, NULL, NULL, NULL);
    if (!privkey) {
        std::string error = "Error stuffing privkey \n" + std::string(::ERR_error_string(::ERR_get_error(),NULL));
	    throw ::WebinosCryptoException(error.c_str());
    }
    
    // set the pubkey in the certificate
    if(!X509_REQ_set_pubkey(req, privkey))
    {
        std::string error = "Error creating pubkey \n" + std::string(::ERR_error_string(::ERR_get_error(),NULL));
	    throw ::WebinosCryptoException(error.c_str());
    }
    
    //set the version
    
    if(!X509_REQ_set_version(req,0L)) 
    {
        std::string error = "Error setting X509 Request version \n" + std::string(::ERR_error_string(::ERR_get_error(),NULL));
	    throw ::WebinosCryptoException(error.c_str());
    
    }
        
    //write it to PEM format
    if (!PEM_write_bio_X509_REQ(mem, req)) {
        std::string error = "Error creating PEM X509 Request from BIO \n" + std::string(::ERR_error_string(::ERR_get_error(),NULL));
	    throw ::WebinosCryptoException(error.c_str());    
    }

    BUF_MEM *bptr;
    BIO_get_mem_ptr(mem, &bptr);
    BIO_read(mem, result, bptr->length);
    
    BIO_free(bmem);
    BIO_free(mem);
    
    return;
}

ASN1_INTEGER* getRandomSN() 
{
    ASN1_INTEGER* res = ASN1_INTEGER_new();
    BIGNUM *btmp = BN_new();
	//64 bits of randomness?
	BN_pseudo_rand(btmp, 64, 0, 0);
	BN_to_ASN1_INTEGER(btmp, res);
	
	BN_free(btmp);
	return res;
}

void selfSignRequest(char* pemRequest, int days, char* pemCAKey, char* result) throw(::WebinosCryptoException) {

    BIO* bioReq = BIO_new_mem_buf(pemRequest, -1);
    BIO* bioCAKey = BIO_new_mem_buf(pemCAKey, -1);
    
    X509_REQ *req=NULL;
    if (!(req=PEM_read_bio_X509_REQ(bioReq, NULL, NULL, NULL))) {
        std::string error = "Error reading X509_REQ structure \n" + std::string(::ERR_error_string(::ERR_get_error(),NULL));
	    throw ::WebinosCryptoException(error.c_str());
    }
    
    EVP_PKEY* caKey = PEM_read_bio_PrivateKey(bioCAKey, NULL, NULL, NULL);
    if (!caKey) { 
        std::string error = "Error reading CA Key from BIO \n" + std::string(::ERR_error_string(::ERR_get_error(),NULL));
	    throw ::WebinosCryptoException(error.c_str());    
    }
    
    X509* cert = X509_new();
    EVP_PKEY* reqPub;
    
    //redo all the certificate details, because OpenSSL wants us to work hard
	X509_set_issuer_name(cert, X509_REQ_get_subject_name(req));
    X509_gmtime_adj(X509_get_notBefore(cert),0);
    X509_gmtime_adj(X509_get_notAfter(cert), (long)60*60*24*days);
    X509_set_subject_name(cert, X509_REQ_get_subject_name(req));
	reqPub = X509_REQ_get_pubkey(req);
	X509_set_pubkey(cert,reqPub);
	EVP_PKEY_free(reqPub);
    
    //create a serial number at random
    ASN1_INTEGER* serial = getRandomSN(); 
    X509_set_serialNumber(cert, serial);

    //sign!
	if (!X509_sign(cert,caKey,EVP_sha1()))
	{
        std::string error = "Error signing X509 certificate \n" + std::string(::ERR_error_string(::ERR_get_error(),NULL));
	    throw ::WebinosCryptoException(error.c_str());    
    }

    BIO *mem = BIO_new(BIO_s_mem());
    PEM_write_bio_X509(mem,cert);
    
    BUF_MEM *bptr;
    BIO_get_mem_ptr(mem, &bptr);
    BIO_read(mem, result, bptr->length);
    
    BIO_free(mem);
    BIO_free(bioReq);
    BIO_free(bioCAKey);

}

void signRequest(char* pemRequest, int days, char* pemCAKey, char* pemCaCert, char* result) throw(::WebinosCryptoException) {
    
    BIO* bioReq = BIO_new_mem_buf(pemRequest, -1);
    BIO* bioCAKey = BIO_new_mem_buf(pemCAKey, -1);
    
    BIO* bioCert = BIO_new_mem_buf(pemCaCert, -1);
    X509* caCert = PEM_read_bio_X509(bioCert, NULL, NULL, NULL);   
    
    X509_REQ *req=NULL;
    if (!(req=PEM_read_bio_X509_REQ(bioReq, NULL, NULL, NULL))) {
        BIO_free(bioReq);
        BIO_free(bioCert);
        BIO_free(bioCAKey);
        std::string error = "Error reading X509_REQ structure \n" + std::string(::ERR_error_string(::ERR_get_error(),NULL));
	    throw ::WebinosCryptoException(error.c_str());
    }
    
    EVP_PKEY* caKey = PEM_read_bio_PrivateKey(bioCAKey, NULL, NULL, NULL);
    if (!caKey) { 
        BIO_free(bioReq);
        BIO_free(bioCert);
        BIO_free(bioCAKey);
        std::string error = "Error reading CA Key from BIO \n" + std::string(::ERR_error_string(::ERR_get_error(),NULL));
	    throw ::WebinosCryptoException(error.c_str());    
    }
    
    X509* cert = X509_new();
    EVP_PKEY* reqPub;
    
    //redo all the certificate details, because OpenSSL wants us to work hard
	X509_set_issuer_name(cert, X509_get_subject_name(caCert));
    X509_gmtime_adj(X509_get_notBefore(cert),0);
    X509_gmtime_adj(X509_get_notAfter(cert), (long)60*60*24*days);
    X509_set_subject_name(cert, X509_REQ_get_subject_name(req));
	reqPub = X509_REQ_get_pubkey(req);
	X509_set_pubkey(cert,reqPub);
	EVP_PKEY_free(reqPub);
    
    //create a serial number at random
    ASN1_INTEGER* serial = getRandomSN(); 
    X509_set_serialNumber(cert, serial);

    //sign!
	if (!X509_sign(cert,caKey,EVP_sha1()))
	{
        BIO_free(bioReq);
        BIO_free(bioCert);
        BIO_free(bioCAKey);
        std::string error = "Error signing X509 certificate \n" + std::string(::ERR_error_string(::ERR_get_error(),NULL));
	    throw ::WebinosCryptoException(error.c_str());    
    }

    BIO *mem = BIO_new(BIO_s_mem());
    PEM_write_bio_X509(mem,cert);
    
    BUF_MEM *bptr;
    BIO_get_mem_ptr(mem, &bptr);
    BIO_read(mem, result, bptr->length);
    
    BIO_free(mem);
    BIO_free(bioReq);
    BIO_free(bioCert);
    BIO_free(bioCAKey);
}

void createEmptyCRL(char* pemSigningKey, char* pemCaCert, int crldays, int crlhours, char* result) throw(::WebinosCryptoException) {

    //convert to BIOs and then keys and x509 structures
    BIO* bioCert = BIO_new_mem_buf(pemCaCert, -1);
    BIO* bioSigningKey = BIO_new_mem_buf(pemSigningKey, -1);
    
    X509* caCert = PEM_read_bio_X509(bioCert, NULL, NULL, NULL);
    EVP_PKEY* caKey = PEM_read_bio_PrivateKey(bioSigningKey, NULL, NULL, NULL);
    
    if (!bioSigningKey || !bioCert || !caCert || !caKey) {
        std::string error = "Error reading arguments to createEmptyCRL \n" + std::string(::ERR_error_string(::ERR_get_error(),NULL));
	    throw ::WebinosCryptoException(error.c_str());    
    }
    

    //create a new, empty CRL
    X509_CRL* crl = X509_CRL_new();

    //set the issuer from our caCert.
	X509_CRL_set_issuer_name(crl, X509_get_subject_name(caCert));
	
	//set update times (probably not essential, but why not.
	ASN1_TIME* tmptm = ASN1_TIME_new();
	X509_gmtime_adj(tmptm,0);
	X509_CRL_set_lastUpdate(crl, tmptm);	
	X509_gmtime_adj(tmptm,(crldays*24+crlhours)*60*60);
	X509_CRL_set_nextUpdate(crl, tmptm);	
	ASN1_TIME_free(tmptm);
	
	//sort?
	X509_CRL_sort(crl);
	
	//extensions would go here.
	
	//Sign with out caKey
	if (!X509_CRL_sign(crl,caKey,EVP_sha1()))
    {
        std::string error = "Error signing empty CRL.  This does not bode well. \n" + std::string(::ERR_error_string(::ERR_get_error(),NULL));
	    throw ::WebinosCryptoException(error.c_str());    
    }


    //Write to a BIO and Output in PEM
    BIO *mem = BIO_new(BIO_s_mem());
	PEM_write_bio_X509_CRL(mem,crl);
	BUF_MEM *bptr;
    BIO_get_mem_ptr(mem, &bptr);
    BIO_read(mem, result, bptr->length);
	
	
	BIO_free(bioCert);
	BIO_free(bioSigningKey);
	BIO_free(mem);
}


void addToCRL(char* pemSigningKey, char* pemOldCrl, char* pemRevokedCert, char* result) 
    throw(::WebinosCryptoException) {

    //read BIOs for the signing key, current CRL and revoked certificate
    
    //convert to BIOs and then keys and x509 structures
    BIO* bioSigningKey = BIO_new_mem_buf(pemSigningKey, -1);
    BIO* bioRevCert = BIO_new_mem_buf(pemRevokedCert, -1);
    BIO* bioOldCRL = BIO_new_mem_buf(pemOldCrl, -1);
    
    X509* badCert = PEM_read_bio_X509(bioRevCert, NULL, NULL, NULL);
    EVP_PKEY* caKey = PEM_read_bio_PrivateKey(bioSigningKey, NULL, NULL, NULL);
    X509_CRL* crl = PEM_read_bio_X509_CRL(bioOldCRL, NULL, NULL, NULL);
    
    if (!bioSigningKey || !bioRevCert || !bioOldCRL || !badCert || !caKey || !crl) {
        std::string error = "Error reading arguments to addToCRL \n" + std::string(::ERR_error_string(::ERR_get_error(),NULL));
	    throw ::WebinosCryptoException(error.c_str());    
    }
    
    //create a new 'revoked' structure and populate.
    X509_REVOKED* revoked = X509_REVOKED_new();
    X509_REVOKED_set_serialNumber(revoked, X509_get_serialNumber(badCert));
    ASN1_TIME* tmptm = ASN1_TIME_new();
	X509_gmtime_adj(tmptm,0);
    X509_REVOKED_set_revocationDate(revoked, tmptm);

//set the reason?  Not yet.
//    ASN1_ENUMERATED* rtmp = ASN1_ENUMERATED_new();
//	ASN1_ENUMERATED_set(rtmp, reasonCode);
//		goto err;
//	if (!X509_REVOKED_add1_ext_i2d(rev, NID_crl_reason, rtmp, 0, 0))
//		goto err;
//	}

	if(!X509_CRL_add0_revoked(crl,revoked)) {
        std::string error = "Error adding a certificate serial number to the revocation list \n" + std::string(::ERR_error_string(::ERR_get_error(),NULL));
	    throw ::WebinosCryptoException(error.c_str());    
    }


    
    X509_CRL_sort(crl);
    
    //re-sign and output
    //Sign with out caKey
	if(!X509_CRL_sign(crl,caKey,EVP_sha1())) {
        std::string error = "Error signing CRL \n" + std::string(::ERR_error_string(::ERR_get_error(),NULL));
	    throw ::WebinosCryptoException(error.c_str());    
    }

    //Write to a BIO and Output in PEM
    BIO *mem = BIO_new(BIO_s_mem());
	PEM_write_bio_X509_CRL(mem,crl);
	BUF_MEM *bptr;
    BIO_get_mem_ptr(mem, &bptr);
    BIO_read(mem, result, bptr->length);
	
	
	BIO_free(bioRevCert);
	BIO_free(bioSigningKey);
	BIO_free(bioOldCRL);
    BIO_free(mem);
	

}







