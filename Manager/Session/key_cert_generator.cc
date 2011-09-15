/*
* Below code calls X509 functions to create self generated certificate and server signed certificate. 
* 
*/

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

#include <sys/types.h>

#include <string.h>
#include <iostream>
#include <sys/socket.h>
#include <net/if.h>
#include <sys/ioctl.h>
#include <arpa/inet.h>
#include <fstream>

#include <stdio.h>
#include <ifaddrs.h>

using namespace node;
using namespace v8;

static Persistent<String> errno_symbol;
static Persistent<String> mac_symbol;

RSA *rsa; 
char mac[32];

class KeyGenerator:ObjectWrap 
{
	public:
		static void Initialize(Handle<Object> target); 
		static void Init(Handle<Object> target); 

		KeyGenerator()
		{	
			rsa=NULL; 
		}
		
		~KeyGenerator()
		{
			RSA_free(rsa);
		}
	protected:
		static Handle<Value> GenRsa(const Arguments& args); 
		static Handle<Value> GenCert(const Arguments& args);
		static Handle<Value> GenClientCert(const Arguments& args);
		static void get_mac_addr();
		static Handle<Value> GetDeviceId(const Arguments& args);
};


void KeyGenerator::Init(Handle<Object> target) 
{
	HandleScope scope; 
	errno_symbol = NODE_PSYMBOL("errno"); 
	mac_symbol = NODE_PSYMBOL("mac"); 
    KeyGenerator::Initialize(target);
}
 
void KeyGenerator::Initialize(Handle<Object> target) 
{
    HandleScope scope;
    NODE_SET_METHOD(target, "genrsa", GenRsa);
    NODE_SET_METHOD(target, "gencert", GenCert);
    NODE_SET_METHOD(target, "genclientcert", GenClientCert);
	NODE_SET_METHOD(target, "getdeviceid", GetDeviceId);    
}
 
Handle<Value> KeyGenerator::GetDeviceId(const Arguments& args)
{
	HandleScope scope;
	get_mac_addr();
	Local<Object> info = Object::New();
	info->Set(mac_symbol, v8::String::New(mac));
	return scope.Close(info);
 }
 
/*
 * This functions generates RSA private key.
 * Input Parameters
 *	bits: 
 *  file-name: 
 * RSA value generated in this method is used in certificate signing
 */
Handle<Value> KeyGenerator::GenRsa(const Arguments& args) 
{
	HandleScope scope;
	BIO *out = BIO_new(BIO_s_file());
	BIGNUM *bn;
	Local<Object> info = Object::New();
    
	//Input Parameters
	int bits(args[0]->Uint32Value());
	String::Utf8Value outfile(args[1]->ToString());
 
	if (BIO_write_filename(out,*outfile) <= 0) 
		return ThrowException(Exception::TypeError(String::New("Writing into file error")));
   
	if(!(rsa = RSA_new()))
		return ThrowException(Exception::TypeError(String::New("Error initializing rsa")));
    
	if(!(bn = BN_new())) 
		return ThrowException(Exception::TypeError(String::New("Error initializing bn")));
  
	if (!BN_set_word(bn, RSA_F4)) 
		return ThrowException(Exception::TypeError(String::New("Error during bn set word"))); 
    
	if (!RSA_generate_key_ex(rsa, bits, bn, NULL )) 
		return ThrowException(Exception::TypeError(String::New("Error during generate key ex")));
    
	if(!PEM_write_bio_RSAPrivateKey(out,rsa, NULL, NULL, 0,NULL, NULL)) 
		return ThrowException(Exception::TypeError(String::New("Error writing private key file")));

	BIO_free_all(out);
	BN_free(bn);		
	return args.This();  
}

Handle<Value> KeyGenerator::GenCert(const Arguments& args)
{
	HandleScope scope;
	X509 *x509;
	EVP_PKEY *pkey;
	X509_NAME *name;
    BIO *out = BIO_new(BIO_s_file());
    ASN1_INTEGER *sno;
	BIGNUM *rand; 

	// Input parameters
	String::Utf8Value country(args[0]->ToString());
	String::Utf8Value state(args[1]->ToString());
	String::Utf8Value city(args[2]->ToString());
	String::Utf8Value organization(args[3]->ToString());
	String::Utf8Value organizationUnit(args[4]->ToString());
	String::Utf8Value commonname(args[5]->ToString());
	String::Utf8Value email(args[6]->ToString());
	int days(args[7]->Uint32Value());
	String::Utf8Value outfile(args[8]->ToString());

	if((x509 = X509_new()) == NULL)
		return ThrowException(Exception::TypeError(String::New("Mem alloc error")));

	//Version 3 is hardcoded
	if(!X509_set_version(x509, 0x2)) 
  		return ThrowException(Exception::TypeError(String::New("Error setting version error")));
	
	//Should this be random or in sequence order??
	sno = ASN1_INTEGER_new();
	rand = BN_new();
	BN_pseudo_rand(rand, 64, 0 , 0);
	BN_to_ASN1_INTEGER(rand, sno);

	if(!X509_set_serialNumber(x509, sno))
	  	return ThrowException(Exception::TypeError(String::New("Error setting serial number")));
	
	if((name = X509_NAME_new()) == NULL)
	 	return ThrowException(Exception::TypeError(String::New("Mem alloc error")));
		
	name = X509_get_subject_name(x509);
	
	X509_NAME_add_entry_by_txt(name, "C", MBSTRING_ASC, (const unsigned char*)*country, -1, -1, 0); 
	X509_NAME_add_entry_by_txt(name, "ST", MBSTRING_ASC, (const unsigned char*)*state, -1, -1, 0); 
	X509_NAME_add_entry_by_txt(name, "L", MBSTRING_ASC, (const unsigned char*)*city, -1, -1, 0); 
	X509_NAME_add_entry_by_txt(name, "O", MBSTRING_ASC, (const unsigned char*)*organization, -1, -1, 0); 
	X509_NAME_add_entry_by_txt(name, "OU", MBSTRING_ASC, (const unsigned char*)*organizationUnit, -1, -1, 0); 

	// We get information from user about common name we append information of common name with device id
	// Result of below concatenation will be for example: PC:Deviceid@macaddress
	Handle<String> name1 = String::NewSymbol(*commonname);       
	get_mac_addr();
	Local<String> str = String::Concat(name1, String::New(":Deviceid@"));
	Local<String> str1 = String::Concat(str->ToString(), String::NewSymbol(mac));  
	String::Utf8Value str2(str1->ToString());
	X509_NAME_add_entry_by_txt(name, "CN", MBSTRING_ASC, (const unsigned char*)*str2, -1, -1, 0); 
	  
	X509_NAME_add_entry_by_txt(name, "emailAddress", MBSTRING_ASC, (const unsigned char*)*email, -1, -1, 0); 
	if(!X509_set_issuer_name(x509, name))
	 	return ThrowException(Exception::TypeError(String::New("Error setting issuer name")));
	if(!X509_set_subject_name(x509, name))
  	 	return ThrowException(Exception::TypeError(String::New("Error setting subject name")));

	// Certificate validity
	if(X509_gmtime_adj(X509_get_notBefore(x509),0) == NULL)
		return ThrowException(Exception::TypeError(String::New("Error setting days in certificate")));	
	if(X509_gmtime_adj(X509_get_notAfter(x509),(long)60*60*24*days) == NULL)
		return ThrowException(Exception::TypeError(String::New("Error setting days in certificate")));	

	// Considering private key is available from above structure		
	if((pkey = EVP_PKEY_new()) == NULL)
		return ThrowException(Exception::TypeError(String::New("Mem Alloc Error")));
	EVP_PKEY_assign_RSA(pkey, rsa);
	X509_set_pubkey(x509, pkey);

	// Cerificate Signature + Algorithm
	if(!X509_sign(x509,pkey,EVP_sha1()))
		return ThrowException(Exception::TypeError(String::New("Signing Error")));
	
	// Write into the file
	if (BIO_write_filename(out,*outfile) <= 0) 
		return ThrowException(Exception::TypeError(String::New("Output Create File Error")));
	if(!PEM_write_bio_X509(out, x509))
		return ThrowException(Exception::TypeError(String::New("Output File Writing Error")));
  
	// Free allocated stuff
	BN_free(rand);
	EVP_PKEY_free(pkey);
	X509_free(x509);
	BIO_free_all(out);
	ASN1_INTEGER_free(sno);
	return args.This();;
}

Handle<Value> KeyGenerator::GenClientCert(const Arguments& args)
{
	HandleScope scope;
	EVP_PKEY *pkey;
	X509 *client, *server;
	ASN1_INTEGER *sno;
	BIO *bp;
  	BIGNUM *rand; 

	// Input parameters	
	String::Utf8Value certInput(args[0]->ToString());
	int days(args[1]->Uint32Value());
	String::Utf8Value outfile(args[2]->ToString());
  
	// store in file
	std::ofstream file;
	file.open("client-cert.pem");
	file << *certInput;
	file.close();
  
	if((bp = BIO_new(BIO_s_file())) == NULL)
		return ThrowException(Exception::TypeError(String::New("Error creating bio_new")));
    
	// Reads CA certificate key and fetch private key
	if (BIO_read_filename(bp,"server-key.pem") <= 0)
		return ThrowException(Exception::TypeError(String::New("Error reading server key")));
	if((pkey = PEM_read_bio_PrivateKey(bp,NULL, NULL, NULL)) == NULL)
		return ThrowException(Exception::TypeError(String::New("Error reading private key error")));

	// Read CA certificate
	if(BIO_read_filename(bp,"server-cert.pem") <= 0)
		return ThrowException(Exception::TypeError(String::New("Error reading server key")));
	if((server = PEM_read_bio_X509(bp,NULL, NULL, NULL)) == NULL)
		return ThrowException(Exception::TypeError(String::New("Server cert bio failed")));

	// Read Client certificate
	if(BIO_read_filename(bp,"client-cert.pem") <= 0)
		return ThrowException(Exception::TypeError(String::New("Client read failed")));
	if((client = PEM_read_bio_X509(bp,NULL, NULL, NULL)) == NULL)
		return ThrowException(Exception::TypeError(String::New("Client cert bio failed")));

	// fetch Server Key
	EVP_PKEY *upkey = X509_get_pubkey(server);
	EVP_PKEY_copy_parameters(upkey,pkey);
	EVP_PKEY_free(upkey);
	if(pkey == NULL)
		return ThrowException(Exception::TypeError(String::New("Error getting server private key")));

  // This generates random number and writes into file ending with .srl
    sno = ASN1_INTEGER_new();
	rand = BN_new();
	BN_pseudo_rand(rand, 64, 0 , 0);
	BN_to_ASN1_INTEGER(rand, sno);

    // Serial Number
	if(!X509_set_serialNumber(client, sno))
		return ThrowException(Exception::TypeError(String::New("Error setting serial number in certificate")));
	 
  // Set new issuer name based on this field certificate chain is checked
	if(!X509_set_issuer_name(client, X509_get_subject_name(server)))
		return ThrowException(Exception::TypeError(String::New("Error setting issuer name in certificate")));

   // Certificate validity
	if(X509_gmtime_adj(X509_get_notBefore(client),0) == NULL)
		return ThrowException(Exception::TypeError(String::New("Error setting days in certificate")));	
	if(X509_gmtime_adj(X509_get_notAfter(client),(long)60*60*24*days) == NULL)
		return ThrowException(Exception::TypeError(String::New("Error setting days in certificate")));	

  // Cerificate Signature
	if(!X509_sign(client,pkey,EVP_sha1()))
		return ThrowException(Exception::TypeError(String::New("Signing Error")));
  
  // Write certificate into file
	if (BIO_write_filename(bp,*outfile) <= 0) 
		return ThrowException(Exception::TypeError(String::New("Error reading/creating file")));
	if(!PEM_write_bio_X509(bp, client))
		return ThrowException(Exception::TypeError(String::New("Output File Writing Error")));
    
  // Free allocated stuff
	BIO_free_all(bp);  // Without this line client cert will not be written
	EVP_PKEY_free(pkey);
	X509_free(client);
	X509_free(server);
	ASN1_INTEGER_free(sno);
	BN_free(rand);
	return args.This();;
}

// To read mac address based on iface
// This should hopefully work 
// Ethernet : eth0
// Bluetooth: bnep0, pan0
// Wifi: wlan0
// Loopback: lo0
#ifdef __APPLE__
void KeyGenerator::get_mac_addr()
{
  struct ifaddrs     *ifaddr, *ifa;
  struct sockaddr *sdl;
  unsigned char *ptr;
  char *mac = (char*)calloc(sizeof(char), 18);

  if (getifaddrs(&ifaddr)==-1)
  {
    perror("getifaddrs");
    exit(-1);
  }

  for (ifa = ifaddr; ifa != NULL; ifa = ifa->ifa_next)
  {
    if (ifa->ifa_addr != NULL) {
      int family = ifa->ifa_addr->sa_family;
      
    	std::cerr<< ifa->ifa_name << ": " << family << std::endl;
      
      // TODO: Next line should check for family (on linux PF_PACKET, on mac BPF), but BPF doesn't seem to work
      if((strcmp("eth0", ifa->ifa_name) == 0 || strcmp("en0", ifa->ifa_name) == 0))
      {
        std::cerr<< "ok" << std::endl;
        sdl = (struct sockaddr *)(ifa->ifa_addr);
        ptr = (unsigned char *)sdl->sa_data;
        ptr += 10;
        sprintf(mac, "%02x:%02x:%02x:%02x:%02x:%02x", *(ptr+5), *ptr, *(ptr+1), *(ptr+2), *(ptr+3), *(ptr+4));

        break;
      }
    }
  }
  
	std::cerr<< "MAC address @ " << mac << std::endl;
  freeifaddrs(ifaddr);
}
#else
void KeyGenerator::get_mac_addr()
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
	}
	std::cerr<< "MAC address @ " << mac << std::endl;	
}
#endif

extern "C"
{
	static void init (Handle<Object> target)
	{
		KeyGenerator::Init(target);
	}
	
	NODE_MODULE(generator, KeyGenerator::Init);
}
