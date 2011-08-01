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
#include <openssl/pem.h>
#include <string.h>
#include <iostream>

using namespace node;
using namespace v8;
static Persistent<String> errno_symbol;
static Persistent<String> name_symbol;
class KeyGenerator:ObjectWrap {
 public:
 
 static void InitKg(Handle<Object> target) {
  HandleScope scope; 
  errno_symbol = NODE_PSYMBOL("errno"); 
  name_symbol = NODE_PSYMBOL("name"); 
  KeyGenerator::Initialize(target);
 }
 
 static void Initialize(Handle<Object> target) {
  HandleScope scope;
  NODE_SET_METHOD(target, "genrsa", GenRsa);  
 }
 
static Handle<Value> GenRsa(const Arguments& args) {
  HandleScope scope;
  BIO *bio_err = BIO_new_fp(stderr, BIO_NOCLOSE|BIO_FP_TEXT);
  BIO *out = BIO_new(BIO_s_file());
  if (args.Length() < 2 ){
    return ThrowException(Exception::TypeError(String::New("Bad argument")));
  }
  
  int bits(args[0]->Uint32Value());
  String::Utf8Value outfile(args[1]->ToString());
  std::cerr << bits <<std::endl;
  std::cerr << *outfile << std::endl;
  
  Local<Object> info = Object::New();
  
  if (BIO_write_filename(out,*outfile) <= 0) return ThrowException(ErrnoException(errno));
   
  RSA *rsa = RSA_new();
  if(!rsa) return ThrowException(ErrnoException(errno));
  BIGNUM *bn = BN_new();
  if(!bn) return ThrowException(ErrnoException(errno));
  int ret = BN_set_word(bn, RSA_F4); 
  if (!ret) return ThrowException(ErrnoException(errno)); 
    
  ret = RSA_generate_key_ex(rsa, bits, bn, NULL );
  BIO_printf(bio_err," ret : %d\n", ret);
  if (!ret) return ThrowException(ErrnoException(errno));
    
  if(!PEM_write_bio_RSAPrivateKey(out,rsa, NULL, NULL, 0,NULL, NULL)) 
    return ThrowException(ErrnoException(errno));

  info->Set(name_symbol, String::New("Value"));
  BIO_free_all(out);
  BN_free(bn);		
  return scope.Close(info);
  
}
};
extern "C"{
	static void init (Handle<Object> target)
	{
		KeyGenerator::InitKg(target);
	}

	NODE_MODULE(generator, KeyGenerator::InitKg);
}