#include <v8.h>
#include <node.h>
#include <stdio.h>
#include "openssl_wrapper.h"
#include <string.h>

using namespace node;
using namespace v8;

static int BUFFER_SIZE = 4096;

void prettyPrintArray(char* pem, int len) {
	printf("\n%s",pem);
	printf("\n");
	for (int i=0; i<len; i++) {
		if (pem[i]<10) {
			printf("  %d", pem[i]);
		} else if (pem[i] < 100) {
			printf(" %d", pem[i]);
		} else {
			printf("%d", pem[i]);
		}
		if (((i+1) % 20) == 0) {
			printf("\n");
		} else if (i<(len-1)) {
			printf(",");
		}
	}
	printf("\n\n");
}

v8::Handle<Value> _genRsaKey(const Arguments& args)
{
    HandleScope scope;
    if (args.Length() == 1 && args[0]->IsNumber()) {
      //extract the integer
      int keyLen = args[0]->Int32Value();
      //check that the size is sane: less than 4096 and bigger than 128
      if (keyLen > BUFFER_SIZE || keyLen < 128) {
        return ThrowException(Exception::TypeError(String::New("Key length must be between 128 and 4096")));
      }
      //call the wrapper & check for errors
      
      char* pem = new char[BUFFER_SIZE];
      ::memset(pem, 0, BUFFER_SIZE);
      int res = 0;
      res = ::genRsaKey(keyLen, pem);
	  if (res != 0) {
    	  delete pem;
          return ThrowException(Exception::TypeError(String::New("**Error creating private key**")));
      }

      int len = strlen(pem);
      //prettyPrintArray(pem,len);
	  char* pem2 = new char[len+1];
	  ::memset(pem2, 0, len+1);
	  ::strncpy(pem2, pem, len);
	  delete pem;

      //create composite remote object 
      Local<String> result = String::New(pem2);
      
      return scope.Close(result);
    }
    else {
      return ThrowException(Exception::TypeError(String::New("Exactly one argument expected")));
    }
}

v8::Handle<Value> _createCertificateRequest(const Arguments& args)
{
    HandleScope scope;
    if (args.Length() == 8 && args[0]->IsString() && args[1]->IsString() 
        && args[2]->IsString() && args[3]->IsString() && args[4]->IsString() 
        && args[5]->IsString() && args[6]->IsString() && args[7]->IsString()  ) {
      //extract the strings
      
      String::Utf8Value key(args[0]->ToString());
      String::Utf8Value country(args[1]->ToString());
      String::Utf8Value state(args[2]->ToString());
      String::Utf8Value loc(args[3]->ToString());
      String::Utf8Value organisation(args[4]->ToString());
      String::Utf8Value organisationUnit(args[5]->ToString());
      String::Utf8Value cname(args[6]->ToString());
      String::Utf8Value email(args[7]->ToString());
            
      //call the wrapper & check for errors
      
      char* pem = new char[BUFFER_SIZE];
      ::memset(pem, 0, BUFFER_SIZE);
      int res = ::createCertificateRequest(pem, key.operator*(),
                country.operator*(), state.operator*(), loc.operator*(), 
                organisation.operator*(), organisationUnit.operator*(), cname.operator*(), email.operator*());

	  if (res != 0) {
          delete pem;
          return ThrowException(Exception::TypeError(String::New("Error creating certificate request")));
      }
      //create composite remote object 
      int len = strlen(pem);
      //prettyPrintArray(pem,len);
	  char* pem2 = new char[len+1];
	  ::memset(pem2, 0, len+1);
	  ::strncpy(pem2, pem, len);
	  delete pem;

      Local<String> result = String::New(pem2);
      return scope.Close(result);
    }
    else {
      return ThrowException(Exception::TypeError(String::New("8 arguments expected: all strings.")));
    }
}


v8::Handle<Value> _selfSignRequest(const Arguments& args)
{
	HandleScope scope;
	if (args.Length() == 3 && args[0]->IsString() && args[1]->IsNumber()
		&& args[2]->IsString() ) {
	  //extract the strings and ints

	  String::Utf8Value pemRequest(args[0]->ToString());
	  int days = args[1]->Int32Value();
	  String::Utf8Value pemCAKey(args[2]->ToString());

	  //call the wrapper & check for errors

	  char* pem = new char[BUFFER_SIZE];
	  ::memset(pem, 0, BUFFER_SIZE);

	  int res = selfSignRequest(pemRequest.operator*(),days,pemCAKey.operator*(),pem);
	  if (res != 0) {
		  delete pem;
		  printf("Error code %c",res);
		  return ThrowException(Exception::TypeError(String::New("Error creating self-signed certificate")));
	  }


	  //create composite remote object
	  int len = strlen(pem);
	  //prettyPrintArray(pem,len);
	  char* pem2 = new char[len+1];
	  ::memset(pem2, 0, len+1);
	  ::strncpy(pem2, pem, len);
	  delete pem;


	  Local<String> result = String::New(pem2);

	  return scope.Close(result);
	}
	else {
	  return ThrowException(Exception::TypeError(String::New("3 arguments expected: string int string")));
	}
}

v8::Handle<Value> _signRequest(const Arguments& args)
{
	HandleScope scope;
	if (args.Length() == 4 && args[0]->IsString() && args[1]->IsNumber()
		&& args[2]->IsString() && args[3]->IsString() ) {
	  //extract the strings and ints

	  String::Utf8Value pemRequest(args[0]->ToString());
	  int days = args[1]->Int32Value();
	  String::Utf8Value pemCAKey(args[2]->ToString());
	  String::Utf8Value pemCACert(args[3]->ToString());

	  //call the wrapper & check for errors

	  char* pem = new char[BUFFER_SIZE];
	  ::memset(pem, 0, BUFFER_SIZE);
	  int res = signRequest(pemRequest.operator*(),days,pemCAKey.operator*(),pemCACert.operator*(),pem);
	  if (res != 0) {
		  delete pem;
		  return ThrowException(Exception::TypeError(String::New("Failed to sign a certificate")));
	  }

	  //create composite remote object

	  int len = strlen(pem);
	  //prettyPrintArray(pem,len);
	  char* pem2 = new char[len+1];
	  ::memset(pem2, 0, len+1);
	  ::strncpy(pem2, pem, len);
	  delete pem;


	  Local<String> result = String::New(pem2);

	  return scope.Close(result);
	}
	else {
	  return ThrowException(Exception::TypeError(String::New("4 arguments expected: string int string string")));
	}
}

//char* pemSigningKey, char* pemCaCert, int crldays, int crlhours, char* result
v8::Handle<Value> _createEmptyCRL(const Arguments& args)
{
    HandleScope scope;
    if (args.Length() == 4 && args[0]->IsString() && args[1]->IsString() 
        && args[2]->IsNumber() && args[3]->IsNumber() ) {
      //extract the strings and ints
      
      String::Utf8Value pemKey(args[0]->ToString());
      String::Utf8Value pemCert(args[1]->ToString());
      int days = args[2]->Int32Value();
      int hours = args[3]->Int32Value();
      
      
            
      //call the wrapper & check for errors
      
      char* pem = new char[BUFFER_SIZE];
	  ::memset(pem, 0, BUFFER_SIZE);
      int res = createEmptyCRL(pemKey.operator*(), pemCert.operator*(), days,hours,pem);
      if (res != 0) {
          delete pem;
          return ThrowException(Exception::TypeError(String::New("Failed to create empty CRL")));
      }
      //create composite remote object
      int len = strlen(pem);
      //prettyPrintArray(pem,len);
	  char* pem2 = new char[len+1];
	  ::memset(pem2, 0, len+1);
	  ::strncpy(pem2, pem, len);
	  delete pem;

      Local<String> result = String::New(pem2);
      return scope.Close(result);
    }
    else {
      return ThrowException(Exception::TypeError(String::New("4 arguments expected: string string int int")));
    }
}

//void addToCRL(char* pemSigningKey, char* pemOldCrl, char* pemRevokedCert, char* result) 
v8::Handle<Value> _addToCRL(const Arguments& args)
{
    HandleScope scope;
    if (args.Length() == 3 && args[0]->IsString() && args[1]->IsString() 
        && args[2]->IsString() ) {
      //extract the strings
      
      String::Utf8Value pemKey(args[0]->ToString());
      String::Utf8Value pemOldCRL(args[1]->ToString());
      String::Utf8Value pemRevokedCert(args[2]->ToString());
      
            
      //call the wrapper & check for errors
      char* pem = new char[BUFFER_SIZE];
	  ::memset(pem, 0, BUFFER_SIZE);

      int res = ::addToCRL(pemKey.operator*(), pemOldCRL.operator*(), pemRevokedCert.operator*(),pem);
      if (res != 0) {
          delete pem;
          return ThrowException(Exception::TypeError(String::New("Failed to add a certificate to the CRL")));
      }

      //create composite remote object
      int len = strlen(pem);
      //prettyPrintArray(pem,len);
	  char* pem2 = new char[len+1];
	  ::memset(pem2, 0, len+1);
	  ::strncpy(pem2, pem, len);
	  delete pem;

	  //prettyPrintArray(pem2,len);
      Local<String> result = String::New(pem2);
      return scope.Close(result);
    }
    else {
      return ThrowException(Exception::TypeError(String::New("3 arguments expected: all PEM strings")));
    }
}


extern "C" {
  static void init(v8::Handle<Object> target)
  {
    NODE_SET_METHOD(target,"genRsaKey",_genRsaKey);
    NODE_SET_METHOD(target,"createCertificateRequest",_createCertificateRequest);
    NODE_SET_METHOD(target,"selfSignRequest",_selfSignRequest);
    NODE_SET_METHOD(target,"signRequest",_signRequest);
    NODE_SET_METHOD(target,"createEmptyCRL",_createEmptyCRL);
    NODE_SET_METHOD(target,"addToCRL",_addToCRL);
  }
  NODE_MODULE(certificate_manager,init);
}