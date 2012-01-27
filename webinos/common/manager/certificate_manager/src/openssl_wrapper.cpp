#include "openssl_wrapper.h"
#include <openssl/rsa.h>
#include <openssl/bio.h>
#include <openssl/bn.h>
#include <openssl/pem.h>
#include <openssl/err.h>
#include <openssl/x509v3.h>
#include <openssl/x509.h>
#include <stdlib.h>
#include <string.h>

int genRsaKey(const int bits, char * privkey)
{ 
    BIO * out = BIO_new(BIO_s_mem());
    RSA * rsa = 0;
    BIGNUM * bn = 0;
    int err = 0;
    if (!(rsa = RSA_new())) return -1;
    if (!(bn = BN_new())) return -2;
    if (!(err = BN_set_word(bn,RSA_F4))) {
    	BN_free(bn);
    	return err;
    }
    if (!(err = RSA_generate_key_ex(rsa,bits,bn,NULL))) {
    	BN_free(bn);
		RSA_free(rsa);
    	return err;
    }
    if (!(err = PEM_write_bio_RSAPrivateKey(out, rsa, NULL, NULL, 0, NULL, NULL))) {
    	BIO_free_all(out);
    	BN_free(bn);
		RSA_free(rsa);
    	return err;
    }
    if (!(err = BIO_read(out,privkey,bits) <= 0)) {
    	BIO_free_all(out);
		BN_free(bn);
		RSA_free(rsa);
    	return err;
    }
    return 0;
}

/**
* This is used to generate CSR
*/
int createCertificateRequest(char* result, char* keyToCertify, char * country, char* state, char* loc, char* organisation, char *organisationUnit, char* cname, char* email)
{
    //create a new memory BIO.
    BIO *mem = BIO_new(BIO_s_mem());
    
    //create a new X509 request
    X509_REQ * req=X509_REQ_new();
    
    X509_NAME *nm;
    nm = X509_NAME_new();

	
    int err=0;

    //fill in details
    if(!(err = X509_NAME_add_entry_by_txt(nm,"C",
				MBSTRING_ASC, (unsigned char*)country, -1, -1, 0))) {
    	return err;
	}
	if(!(err = X509_NAME_add_entry_by_txt(nm,"ST",
				MBSTRING_ASC, (unsigned char*)state, -1, -1, 0))) {
		return err;
	}
	if(!(err = X509_NAME_add_entry_by_txt(nm,"L",
				MBSTRING_ASC, (unsigned char*)loc, -1, -1, 0))) {
		return err;
	}
	if(!(err = X509_NAME_add_entry_by_txt(nm,"O",
				MBSTRING_ASC, (unsigned char*)organisation, -1, -1, 0))) {
		return err;
	}
	if(!(err = X509_NAME_add_entry_by_txt(nm,"OU",
				MBSTRING_ASC, (unsigned char*)organisationUnit, -1, -1, 0))) {
		return err;
	}
	if(!(err = X509_NAME_add_entry_by_txt(nm,"CN",
				MBSTRING_ASC, (unsigned char*)cname, -1, -1, 0))) {
		return err;
	}
	if(!(err = X509_NAME_add_entry_by_txt(nm,"emailAddress",MBSTRING_ASC, (unsigned char*)email, -1, -1, 0))) {
		return err;
    }
	if(!(err = X509_REQ_set_subject_name(req, nm))) {
		return err;
	}
	
	//Set the public key   
    //...convert PEM private key into a BIO
    
    BIO* bmem = BIO_new_mem_buf(keyToCertify, -1);
    if (!bmem) {
    	BIO_free(bmem);
        return -3;
    }
    
    // read the private key into an EVP_PKEY structure
    EVP_PKEY* privkey = PEM_read_bio_PrivateKey(bmem, NULL, NULL, NULL);
    if (!privkey) {
    	BIO_free(bmem);
        return -4;
    }

    if(!(err = X509_REQ_set_pubkey(req, privkey)))
    {
    	BIO_free(bmem);
        return err;
    }
    
    if(!(err = X509_REQ_set_version(req,3)))
    {
    	BIO_free(bmem);
        return err;
    }
        
    //write it to PEM format
    if (!(err = PEM_write_bio_X509_REQ(mem, req))) {
        BIO_free(mem);
        BIO_free(bmem);
    	return err;
    }

    BUF_MEM *bptr;
    BIO_get_mem_ptr(mem, &bptr);
    BIO_read(mem, result, bptr->length);
    
    BIO_free(bmem);
    BIO_free(mem);

    return 0;
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

/**
* This is used to sign request
*/
int selfSignRequest(char* pemRequest, int days, char* pemCAKey, int certType, char *url, char* result)  {

    BIO* bioReq = BIO_new_mem_buf(pemRequest, -1);
    BIO* bioCAKey = BIO_new_mem_buf(pemCAKey, -1);
    
    int err = 0;
	
	X509_REQ *req=NULL;
    if (!(req=PEM_read_bio_X509_REQ(bioReq, NULL, NULL, NULL))) {
    	BIO_free(bioReq);
    	BIO_free(bioCAKey);
    	return -5;
    }

    EVP_PKEY* caKey = PEM_read_bio_PrivateKey(bioCAKey, NULL, NULL, NULL);
    if (!caKey) { 
    	BIO_free(bioReq);
    	BIO_free(bioCAKey);
    	return -6;
    }

    X509* cert = X509_new();
    EVP_PKEY* reqPub;
    
    //redo all the certificate details, because OpenSSL wants us to work hard
    if(!(err =  X509_set_version(cert, 3)))
    {
    	BIO_free(bioReq);
    	BIO_free(bioCAKey);
        return err;
    }

 	if(!(err = X509_set_issuer_name(cert, X509_REQ_get_subject_name(req))))
    {
    	BIO_free(bioReq);
    	BIO_free(bioCAKey);
        return err;
    }

    if(!(X509_gmtime_adj(X509_get_notBefore(cert),0)))
    {
    	BIO_free(bioReq);
    	BIO_free(bioCAKey);
        return err;
    }

	if(!(X509_gmtime_adj(X509_get_notAfter(cert), (long)60*60*24*days)))
    {
    	BIO_free(bioReq);
    	BIO_free(bioCAKey);
        return err;
    }
    
	if(!(err = X509_set_subject_name(cert, X509_REQ_get_subject_name(req))))
    {
    	BIO_free(bioReq);
    	BIO_free(bioCAKey);
        return err;
    }
	
	if (!(reqPub = X509_REQ_get_pubkey(req))) {
		BIO_free(bioReq);
		BIO_free(bioCAKey);
		return -7;
	}
	err = X509_set_pubkey(cert,reqPub);
	EVP_PKEY_free(reqPub);
    if (!err) {
    	return err; // an error occurred, this is terrible style.
    }

    //create a serial number at random
    ASN1_INTEGER* serial = getRandomSN(); 
    X509_set_serialNumber(cert, serial);

	// V3 extensions
	X509_EXTENSION *ex;
	X509V3_CTX ctx;
	X509V3_set_ctx_nodb(&ctx);
	X509V3_set_ctx(&ctx, cert, cert, NULL, NULL, 0);

	char *str = (char*)malloc(strlen("URI:") + strlen(url));
	strcpy(str, "URI:");
	strcpy(str + strlen("URI:"), url);
	if(!(ex = X509V3_EXT_conf_nid(NULL, &ctx, NID_subject_alt_name, (char*)str))) {
		free(str);
		return 0;
	} else {
		X509_add_ext(cert, ex, -1);
	}
	free(str);

	if(!(ex = X509V3_EXT_conf_nid(NULL, &ctx, NID_subject_key_identifier, (char*)"hash"))) {
		return 0;
	} else {
		X509_add_ext(cert, ex, -1);
	}

	if( certType == 0) {

		if(!(ex = X509V3_EXT_conf_nid(NULL, &ctx, NID_basic_constraints, (char*)"critical, CA:TRUE"))) {
			return 0;
		} else {
			X509_add_ext(cert, ex, -1);
		}
		
		if(!(ex = X509V3_EXT_conf_nid(NULL,  &ctx, NID_key_usage, (char*)"critical,  keyCertSign, digitalSignature, cRLSign"))) { /* nonRepudiation,*/
			return 0;
		} else {
			X509_add_ext(cert, ex, -1);
		}

		if(!(ex = X509V3_EXT_conf_nid(NULL,  &ctx, NID_ext_key_usage, (char*)"critical, serverAuth"))) {
			return 0;
		} else {
			X509_add_ext(cert, ex, -1);
		}	 	
		
		if(!(ex = X509V3_EXT_conf_nid(NULL,  &ctx, NID_inhibit_any_policy, (char*)"0"))) {
			return 0;
		} else {
			X509_add_ext(cert, ex, -1);
		}
		char *str = (char*)malloc(strlen("URI:") + strlen(url));
		strcpy(str, "URI:");
		strcpy(str + strlen("URI:"), url);
		if(!(ex = X509V3_EXT_conf_nid(NULL, &ctx, NID_crl_distribution_points, (char*)str))) {
			free(str);
			return 0;
		} else {
			X509_add_ext(cert, ex, -1);
		}
		free(str);
	}
	

	/**/
    //sign!
	if (!(err = X509_sign(cert,caKey,EVP_sha1())))
	{
		BIO_free(bioReq);
		BIO_free(bioCAKey);
		return err;
    }

    BIO *mem = BIO_new(BIO_s_mem());
    PEM_write_bio_X509(mem,cert);
    
    BUF_MEM *bptr;
    BIO_get_mem_ptr(mem, &bptr);
    BIO_read(mem, result, bptr->length);
    
    BIO_free(mem);
    BIO_free(bioReq);
    BIO_free(bioCAKey);
    return 0;

}

int signRequest(char* pemRequest, int days, char* pemCAKey, char* pemCaCert,  int certType, char *url, char* result)  {
    
    BIO* bioReq = BIO_new_mem_buf(pemRequest, -1);
    BIO* bioCAKey = BIO_new_mem_buf(pemCAKey, -1);
    
    BIO* bioCert = BIO_new_mem_buf(pemCaCert, -1);
    X509* caCert = PEM_read_bio_X509(bioCert, NULL, NULL, NULL);   
    
    int err = 0;

    X509_REQ *req=NULL;
    if (!(req=PEM_read_bio_X509_REQ(bioReq, NULL, NULL, NULL))) {
        BIO_free(bioReq);
        BIO_free(bioCert);
        BIO_free(bioCAKey);
        return -8;
    }
    
    EVP_PKEY* caKey = PEM_read_bio_PrivateKey(bioCAKey, NULL, NULL, NULL);
    if (!caKey) { 
        BIO_free(bioReq);
        BIO_free(bioCert);
        BIO_free(bioCAKey);
        return -9;
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
    
    X509_EXTENSION *ex;
	X509V3_CTX ctx;
	X509V3_set_ctx_nodb(&ctx);
	X509V3_set_ctx(&ctx, cert, cert, NULL, NULL, 0);

	char *str = (char*)malloc(strlen("URI:") + strlen(url));
	strcpy(str, "URI:");
	strcpy(str + strlen("URI:"), url);
	if(!(ex = X509V3_EXT_conf_nid(NULL, &ctx, NID_subject_alt_name, (char*)str))) {
		free(str);
		return 0;
	} else {
		X509_add_ext(cert, ex, -1);
	}
	free(str);

	if(!(ex = X509V3_EXT_conf_nid(NULL, &ctx, NID_subject_key_identifier, (char*)"hash"))) {
		return 0;
	} else {
		X509_add_ext(cert, ex, -1);
	}

	 if( certType == 1) {
		if(!(ex = X509V3_EXT_conf_nid(NULL,  &ctx, NID_basic_constraints, (char*)"critical, CA:FALSE"))) {
			return 0;
		} else {
			X509_add_ext(cert, ex, -1);
		}


		if(!(ex = X509V3_EXT_conf_nid(NULL,  &ctx, NID_ext_key_usage, (char*)"critical, serverAuth"))) {
			return 0;
		} else {
			X509_add_ext(cert, ex, -1);
		}

		if(!(ex = X509V3_EXT_conf_nid(NULL, &ctx, NID_issuer_alt_name, (char*)"issuer:copy"))) {
			return 0;
		} else {
			X509_add_ext(cert, ex, -1);
		}
		char *str = (char*)malloc(strlen("caIssuers;URI:") + strlen(url));
		strcpy(str, "caIssuers;URI:");
		strcpy(str + strlen("caIssuers;URI:"), url);

		if(!(ex = X509V3_EXT_conf_nid(NULL, &ctx, NID_info_access, (char*)str))) {
			return 0;
			free(str);
		} else {
			X509_add_ext(cert, ex, -1);
		}
		free(str);
		
	} else if( certType == 2) {
		if(!(ex = X509V3_EXT_conf_nid(NULL, &ctx, NID_basic_constraints, (char*)"critical, CA:FALSE"))) {
			return 0;
		} else {
			X509_add_ext(cert, ex, -1);
		}			

		if(!(ex = X509V3_EXT_conf_nid(NULL, &ctx, NID_ext_key_usage, (char*)"critical, clientAuth, serverAuth"))) {
			return 0;
		} else {
			X509_add_ext(cert, ex, -1);
		}

		if(!(ex = X509V3_EXT_conf_nid(NULL, &ctx, NID_issuer_alt_name, (char*)"issuer:copy"))) {
			return 0;
		} else {
			X509_add_ext(cert, ex, -1);
		}

		char *str = (char*)malloc(strlen("caIssuers;URI:") + strlen(url));
		strcpy(str, "caIssuers;URI:");
		strcpy(str + strlen("caIssuers;URI:"), url);

		if(!(ex = X509V3_EXT_conf_nid(NULL, &ctx, NID_info_access, (char*)str))) {
			return 0;
			free(str);
		} else {
			X509_add_ext(cert, ex, -1);
		}
		free(str);
	}	
	
    //sign!
	if (!(err = X509_sign(cert,caKey,EVP_sha1())))
	{
        BIO_free(bioReq);
        BIO_free(bioCert);
        BIO_free(bioCAKey);
        return err;
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

    return 0;
}

int createEmptyCRL(char* pemSigningKey, char* pemCaCert, int crldays, int crlhours, char* result) {
	int err = 0;

    //convert to BIOs and then keys and x509 structures
    BIO* bioCert = BIO_new_mem_buf(pemCaCert, -1);
    if (!bioCert) {
    	BIO_free(bioCert);
    	return -10;
    }

    BIO* bioSigningKey = BIO_new_mem_buf(pemSigningKey, -1);
    if (!bioSigningKey) {
    	BIO_free(bioCert);
    	BIO_free(bioSigningKey);
    	return -11;
    }

    X509* caCert = PEM_read_bio_X509(bioCert, NULL, NULL, NULL);
    if (!caCert) {
    	BIO_free(bioCert);
		BIO_free(bioSigningKey);
    	return -12;
    }

    EVP_PKEY* caKey = PEM_read_bio_PrivateKey(bioSigningKey, NULL, NULL, NULL);
    if (!caKey) {
    	BIO_free(bioCert);
		BIO_free(bioSigningKey);
    	return -13;
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
	if (!(err = X509_CRL_sign(crl,caKey,EVP_sha1())))
    {
		BIO_free(bioCert);
		BIO_free(bioSigningKey);
        return err;
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
	return 0;
}


int addToCRL(char* pemSigningKey, char* pemOldCrl, char* pemRevokedCert, char* result) {
	int err = 0;
    //read BIOs for the signing key, current CRL and revoked certificate
    
    //convert to BIOs and then keys and x509 structures
    BIO* bioSigningKey = BIO_new_mem_buf(pemSigningKey, -1);
    if (!bioSigningKey) {
    	return -14;
    }
    BIO* bioRevCert = BIO_new_mem_buf(pemRevokedCert, -1);
    if (!bioRevCert) {
    	BIO_free(bioSigningKey);
		return -15;
	}
    BIO* bioOldCRL = BIO_new_mem_buf(pemOldCrl, -1);
    if (!bioOldCRL) {
		BIO_free(bioSigningKey);
		BIO_free(bioRevCert);
		return -16;
	}
    
    X509* badCert = PEM_read_bio_X509(bioRevCert, NULL, NULL, NULL);
    if (!badCert) {
		BIO_free(bioSigningKey);
		BIO_free(bioRevCert);
		return -17;
	}

    EVP_PKEY* caKey = PEM_read_bio_PrivateKey(bioSigningKey, NULL, NULL, NULL);
    if (!caKey) {
		BIO_free(bioSigningKey);
		BIO_free(bioRevCert);
		return -18;
	}

    X509_CRL* crl = PEM_read_bio_X509_CRL(bioOldCRL, NULL, NULL, NULL);
    if (!crl) {
		BIO_free(bioSigningKey);
		BIO_free(bioRevCert);
		return -19;
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

	if(!(err = X509_CRL_add0_revoked(crl,revoked))) {
		BIO_free(bioSigningKey);
		BIO_free(bioRevCert);
		return err;
    }


    
    X509_CRL_sort(crl);
    
    //re-sign and output
    //Sign with out caKey
	if(!(err=X509_CRL_sign(crl,caKey,EVP_sha1()))) {
		BIO_free(bioSigningKey);
		BIO_free(bioRevCert);
		return err;
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
	
    return 0;
}





