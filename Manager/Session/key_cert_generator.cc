// code to generate functionality similar to genrsa

// This will call genrsa and get the result back

// The need for this code is to allow pzh and pzp to generate their own certificate

#include <node.h>
#include <v8.h>
#include <openssl/rsa.h>
#include <errno.h>
#include <openssl/bio.h>
#include <openssl/bn.h>

#include <openssl/err.h>
#include <openssl/x509v3.h>

#include <openssl/pem.h>
#include <openssl/asn1.h>

#include <string.h>
#include <iostream>
#include <net/if.h>
#include <sys/ioctl.h>
#include <arpa/inet.h>

using namespace node;
using namespace v8;
static RSA *rsa;
static Persistent<String> errno_symbol;
static Persistent<String> mac_symbol;
static char mac[32];

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
   mac_symbol = NODE_PSYMBOL("mac"); 
   KeyGenerator::Initialize(target);
 }
 
 static void Initialize(Handle<Object> target) 
 {
   HandleScope scope;
   NODE_SET_METHOD(target, "genrsa", GenRsa);
   NODE_SET_METHOD(target, "gencert", GenCert);
   NODE_SET_METHOD(target, "genclientcert", GenClientCert);
   NODE_SET_METHOD(target, "getdeviceid", GetDeviceId);        
 }
 
 static Handle<Value> GetDeviceId(const Arguments& args)
 {
	HandleScope scope;
	Local<Object> info = Object::New();
	get_mac_addr();
	info->Set(mac_symbol, v8::String::New(mac));
	return scope.Close(info);
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
  std::cerr << bits << "\t" << *outfile << std::endl;  
  
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

static Handle<Value> GenClientCert(const Arguments& args)
{
  HandleScope scope;
  X509 *x509 = X509_new();
  BIO *bio_err = BIO_new_fp(stderr, BIO_NOCLOSE);
  EVP_PKEY *pkey = EVP_PKEY_new(); 
  X509_NAME *name = X509_NAME_new();
  X509_EXTENSION *ex;
  BIGNUM *rand;
  BIO *out = BIO_new(BIO_s_file());
  ASN1_INTEGER *sno = NULL;
  sno = ASN1_INTEGER_new();
  rand = BN_new();
  int validupto(args[0]->Uint32Value());
  String::Utf8Value outfile(args[1]->ToString());
  String::Utf8Value deviceid(args[2]->ToString());
  
  //String::Utf8Value interface(args[3]->ToString());
  std::cerr<<"1";
  if (BIO_write_filename(out,*outfile) <= 0) 
	return ThrowException(Exception::TypeError(String::New("Output File Writing Error")));
  BN_pseudo_rand(rand, 64, 0 , 0);
  BN_to_ASN1_INTEGER(rand, sno);  	
  EVP_PKEY_assign_RSA(pkey, rsa);
  X509_set_version(x509, 2);
  X509_set_serialNumber(x509, sno);
  name = X509_get_subject_name(x509);
  X509_NAME_add_entry_by_txt(name, "C", MBSTRING_ASC, (const unsigned char*)"UK", -1, -1, 0); 
  X509_NAME_add_entry_by_txt(name, "CN", MBSTRING_ASC, (const unsigned char*)"webinos", -1, -1, 0); 
  X509_set_issuer_name(x509, name);
  X509_set_subject_name(x509, name);
  X509_set_pubkey(x509, pkey);
  X509_gmtime_adj(X509_get_notBefore(x509),0);
  X509_gmtime_adj(X509_get_notAfter(x509),(long)60*60*24*validupto);
  ex = X509V3_EXT_conf_nid(NULL, NULL, NID_netscape_cert_type, (char*) "client");
  X509_add_ext(x509,ex, -1);
  X509_EXTENSION_free(ex);
  ex = X509V3_EXT_conf_nid(NULL, NULL, NID_netscape_comment, (char*) "PZH generated certificate for client");
  X509_add_ext(x509,ex, -1);
  X509_EXTENSION_free(ex);
  ex = X509V3_EXT_conf_nid(NULL, NULL, NID_netscape_ssl_server_name, (char*) "www.webinos.org");
  X509_add_ext(x509,ex, -1);
  X509_EXTENSION_free(ex);
  std::cerr<< "Before Signing" << std::endl;
  // Cerificate Signature + Algorithm
  int ret = X509_sign(x509,pkey,EVP_sha1());
  std::cerr<< "Signing Error : %d " << ret << std::endl;
  if(!ret)
	return ThrowException(Exception::TypeError(String::New("Signing Error")));
  // Writes into the file
  PEM_write_bio_X509(out, x509);
  
  // Free allocate stuff
  EVP_PKEY_free(pkey);
  X509_free(x509);
  BN_free(rand);
  BIO_free_all(out);
  BIO_free(bio_err);
  ASN1_INTEGER_free(sno);
  return args.This();;
}
static Handle<Value> GenCert(const Arguments& args)
{
  HandleScope scope;
  X509 *x509 = X509_new();
  BIO *bio_err = BIO_new_fp(stderr, BIO_NOCLOSE);
  EVP_PKEY *pkey = EVP_PKEY_new(); 
  X509_NAME *name = X509_NAME_new();
  X509_EXTENSION *ex;
  BIGNUM *rand;
  BIO *out = BIO_new(BIO_s_file());
  ASN1_INTEGER *sno = NULL;
  sno = ASN1_INTEGER_new();
  rand = BN_new();
  int validupto(args[0]->Uint32Value());
  String::Utf8Value outfile(args[1]->ToString());
  get_mac_addr();	

  if (BIO_write_filename(out,*outfile) <= 0) 
	return ThrowException(Exception::TypeError(String::New("Output File Writing Error")));
  BN_pseudo_rand(rand, 64, 0 , 0);
  BN_to_ASN1_INTEGER(rand, sno);  	
  EVP_PKEY_assign_RSA(pkey, rsa);
  X509_set_version(x509, 2);
  X509_set_serialNumber(x509, sno);
  name = X509_get_subject_name(x509);
  X509_NAME_add_entry_by_txt(name, "C", MBSTRING_ASC, (const unsigned char*)"UK", -1, -1, 0); 
  X509_NAME_add_entry_by_txt(name, "CN", MBSTRING_ASC, (const unsigned char*)"webinos", -1, -1, 0); 
  X509_set_issuer_name(x509, name);
  X509_set_subject_name(x509, name);
  X509_set_pubkey(x509, pkey);
  X509_gmtime_adj(X509_get_notBefore(x509),0);
  X509_gmtime_adj(X509_get_notAfter(x509),(long)60*60*24*validupto);
  ex = X509V3_EXT_conf_nid(NULL, NULL, NID_netscape_cert_type, (char*) "server");
  X509_add_ext(x509,ex, -1);
  X509_EXTENSION_free(ex);
  ex = X509V3_EXT_conf_nid(NULL, NULL, NID_netscape_comment, (char*) "PZH self generated certificate");
  X509_add_ext(x509,ex, -1);
  X509_EXTENSION_free(ex);
  ex = X509V3_EXT_conf_nid(NULL, NULL, NID_netscape_ssl_server_name, (char*) "www.webinos.org");
  X509_add_ext(x509,ex, -1);
  X509_EXTENSION_free(ex);
  ex = X509V3_EXT_conf_nid(NULL, NULL, NID_basic_constraints, (char*)"critical,CA:TRUE");
  X509_add_ext(x509,ex, -1);
  X509_EXTENSION_free(ex);
  /*ex = X509V3_EXT_conf_nid(NULL, NULL, NID_subject_key_identifier, (char*)"aes192");
  X509_add_ext(x509,ex, -1);
  X509_EXTENSION_free(ex);
  std::cerr<<"18";*/
  /*ex = X509V3_EXT_conf_nid(NULL, NULL, NID_authority_key_identifier, (char*)"keyid:always");
  X509_add_ext(x509,ex, -1);
  X509_EXTENSION_free(ex);*/
 /* std::cerr<<"19";	
  ex = X509V3_EXT_conf_nid(NULL, NULL, NID_key_usage, (char*)"critical,keyCertSign,cRLSign");
  X509_add_ext(x509,ex, -1);
  X509_EXTENSION_free(ex);	*/	
  // Cerificate Signature + Algorithm
  int ret = X509_sign(x509,pkey,EVP_sha1());
  if(!ret)
	return ThrowException(Exception::TypeError(String::New("Signing Error")));
  // Writes into the file
  PEM_write_bio_X509(out, x509);
  
  // Free allocate stuff
  EVP_PKEY_free(pkey);
  X509_free(x509);
  BN_free(rand);
  BIO_free_all(out);
  BIO_free(bio_err);
  ASN1_INTEGER_free(sno);
  return args.This();;
}

// To read mac address based on iface
// This should hopefully work 
// Ethernet : eth0
// Bluetooth: bnep0, pan0
// Wifi: wlan0
// Loopback: lo0

static void get_mac_addr()
{
	
	struct ifreq ifr;
	int sock;
	sock = socket(PF_INET, SOCK_STREAM, 0);
	snprintf(ifr.ifr_name, strlen("eth0")+1, "eth0");
	
	int ret = ioctl(sock, SIOCGIFHWADDR, &ifr);
		
	int j, k = 0;
	
	for(j = 0; j < 6; j++)
	{				
		k+=snprintf((mac)+k,sizeof(mac)-k-1, j ? ":%02x": "%02x", (int)(unsigned int)(unsigned char)(ifr.ifr_hwaddr.sa_data[j]));
		//std::cerr<< mac << "\t" << k << "\t" << j << std::endl;			
	}
	std::cerr<< "MAC address @ " << mac << std::endl;	
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