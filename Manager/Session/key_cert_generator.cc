// code to generate functionality similar to genrsa

// This will call genrsa and get the result back

// The need for this code is to allow pzh and pzp to generate their own certificate

#include <node.h>
#include <v8.h>
#include <openssl/rsa.h>
#include <errno.h>
#include <openssl/bio.h>
#include <openssl/bn.h>
#include <openssl/x509.h>
#include <openssl/err.h>
#include <openssl/pem.h>
#include <string.h>
#include <iostream>

using namespace node;
using namespace v8;
static RSA *rsa;
static Persistent<String> errno_symbol;
static Persistent<String> name_symbol;

class KeyGenerator:ObjectWrap 
{
 public:
 
 KeyGenerator()
 {	
 
 }
 ~KeyGenerator()
 {
	RSA_free(rsa);
 }
 static void InitKg(Handle<Object> target) 
 {
  HandleScope scope; 
  errno_symbol = NODE_PSYMBOL("errno"); 
  name_symbol = NODE_PSYMBOL("name"); 
  KeyGenerator::Initialize(target);
 }
 
 static void Initialize(Handle<Object> target) 
 {
  HandleScope scope;
  NODE_SET_METHOD(target, "genrsa", GenRsa);
  NODE_SET_METHOD(target, "gencert", GenCert);    
 }
 
static Handle<Value> GenRsa(const Arguments& args) 
{
  HandleScope scope;
  BIO *bio_err = BIO_new_fp(stderr, BIO_NOCLOSE|BIO_FP_TEXT);
  BIO *out = BIO_new(BIO_s_file());
  if (args.Length() < 2 )
  {
    return ThrowException(Exception::TypeError(String::New("Bad argument")));
  }
	
  int bits(args[0]->Uint32Value());
  String::Utf8Value outfile(args[1]->ToString());
  //std::cerr << bits << "\t" << *outfile << std::endl;  
  
  Local<Object> info = Object::New();
  
  if (BIO_write_filename(out,*outfile) <= 0) 
	return ThrowException(ErrnoException(errno));
   
  rsa = RSA_new();
  if(!rsa) 
	return ThrowException(ErrnoException(errno));
  BIGNUM *bn = BN_new();
  
  if(!bn) 
	return ThrowException(ErrnoException(errno));
  int ret = BN_set_word(bn, RSA_F4); 
  
  if (!ret) 
	return ThrowException(ErrnoException(errno)); 
    
  ret = RSA_generate_key_ex(rsa, bits, bn, NULL );
  if (!ret) 
	return ThrowException(ErrnoException(errno));
    
  if(!PEM_write_bio_RSAPrivateKey(out,rsa, NULL, NULL, 0,NULL, NULL)) 
    return ThrowException(ErrnoException(errno));

//  info->Set(name_symbol, String::New("Value"));
  BIO_free_all(out);
  BIO_free_all(bio_err);
  BN_free(bn);		
  return scope.Close(info);  
}

static Handle<Value> GenCert(const Arguments& args)
{
  HandleScope scope;
  X509 *x509 = X509_new();
  BIO *bio_err = BIO_new_fp(stderr, BIO_NOCLOSE);
  EVP_PKEY *pkey = EVP_PKEY_new();
  X509_NAME *name;
  BIO *out = BIO_new(BIO_s_file());
 
  int version(args[0]->Uint32Value());
  int serial(args[1]->Uint32Value());
  int validupto (args[2]->Uint32Value());
  String::Utf8Value outfile(args[3]->ToString());
  
  if (BIO_write_filename(out,*outfile) <= 0) 
	return ThrowException(ErrnoException(errno));

  EVP_PKEY_assign_RSA(pkey, rsa);

  // Version
  X509_set_version(x509, version);
  // Serial Number
  ASN1_INTEGER_set(X509_get_serialNumber(x509),serial); 
  // Algorithm ID
  name = X509_get_subject_name(x509);
  // Issuer
  X509_set_issuer_name(x509, name);
  //Validity
  X509_gmtime_adj(X509_get_notBefore(x509),0);
  X509_gmtime_adj(X509_get_notAfter(x509),(long)60*60*24*validupto);
  //Subject
  X509_set_subject_name(x509, name);
  //Subject public key info (Alg, key)
  X509_set_pubkey(x509, pkey);
  
  // Cerificate Signature + Algorithm
  X509_sign(x509,pkey,EVP_sha1());
  
  PEM_write_bio_X509(out, x509);
  EVP_PKEY_free(pkey);
  X509_free(x509);
  BIO_free_all(out);
  BIO_free(bio_err);
  return args.This();;
}
};
extern "C"
{
	static void init (Handle<Object> target)
	{
		KeyGenerator::InitKg(target);
	}

	NODE_MODULE(generator, KeyGenerator::InitKg);
}