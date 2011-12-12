#include <v8.h>
#include <node.h>
#include <stdio.h>
#include <string.h>
#include <iostream>
#include "openssl_wrapper.h"

using namespace node;
using namespace v8;


v8::Handle<Value> _genRsaKey(const Arguments& args)
{

  try {
    HandleScope scope;
    if (args.Length() == 1 && args[0]->IsNumber()) {
      //extract the integer
      int keyLen = args[0]->Int32Value();
      //check that the size is sane: less than 4096 and bigger than 128
      if (keyLen > 4096 || keyLen < 128) {
        return ThrowException(Exception::TypeError(String::New("Key length must be between 128 and 4096")));
      }
      //call the wrapper & check for errors
      
      char* priv = new char[2048];
      ::memset(priv, 0, 2048);
      try {
          ::genRsaKey(keyLen, priv);
      } catch (WebinosCryptoException &e) {
          delete priv;
          return ThrowException(Exception::TypeError(String::New(e.what())));
      }
      std::string privKey(priv, ::strlen(priv));
      
      //create composite remote object 
      Local<String> result = String::New(privKey.c_str());
      
      return scope.Close(result);
    }
    else {
      return ThrowException(Exception::TypeError(String::New("Exactly one argument expected")));
    }
  }
  catch(::WebinosCryptoException& e) {
    return ThrowException(Exception::TypeError(String::New(e.what())));
  }
  catch(...) {
    return ThrowException(Exception::TypeError(String::New("Unknown exception")));
  }
}

v8::Handle<Value> _createCertificateRequest(const Arguments& args)
{
  try {
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
      
      char* req = new char[2048];
      ::memset(req, 0, 2048);
      
      try {
          ::createCertificateRequest(req, key.operator*(), 
                country.operator*(), state.operator*(), loc.operator*(), 
                organisation.operator*(), organisationUnit.operator*(), cname.operator*(), email.operator*());
                
      } catch (WebinosCryptoException &e) {
          delete req;
          return ThrowException(Exception::TypeError(String::New(e.what())));
      }
      
      std::string reqStr(req, ::strlen(req));
      
      
      //create composite remote object 
      Local<String> result = String::New(reqStr.c_str());
      
      return scope.Close(result);
    }
    else {
      return ThrowException(Exception::TypeError(String::New("8 arguments expected: all strings.")));
    }
  }
  catch(::WebinosCryptoException& e) {
    return ThrowException(Exception::TypeError(String::New(e.what())));
  }
  catch(...) {
    return ThrowException(Exception::TypeError(String::New("Unknown exception")));
  }
}


v8::Handle<Value> _selfSignRequest(const Arguments& args)
{
  try {
    HandleScope scope;
    if (args.Length() == 3 && args[0]->IsString() && args[1]->IsNumber() 
        && args[2]->IsString() ) {
      //extract the strings and ints
      
      String::Utf8Value pemRequest(args[0]->ToString());
      int days = args[1]->Int32Value();
      String::Utf8Value pemCAKey(args[2]->ToString());
      
      //call the wrapper & check for errors
      
      char* cert = new char[2048];
      ::memset(cert, 0, 2048);
      
      try {
          ::selfSignRequest(pemRequest.operator*(),days,pemCAKey.operator*(),cert);
                
      } catch (WebinosCryptoException &e) {
          delete cert;
          return ThrowException(Exception::TypeError(String::New(e.what())));
      }
      
      std::string certStr(cert, ::strlen(cert));
      
      
      //create composite remote object 
      Local<String> result = String::New(certStr.c_str());
      
      return scope.Close(result);
    }
    else {
      return ThrowException(Exception::TypeError(String::New("3 arguments expected: string int string")));
    }
  }
  catch(::WebinosCryptoException& e) {
    return ThrowException(Exception::TypeError(String::New(e.what())));
  }
  catch(...) {
    return ThrowException(Exception::TypeError(String::New("Unknown exception")));
  }
}

v8::Handle<Value> _signRequest(const Arguments& args)
{
  try {
    HandleScope scope;
    if (args.Length() == 4 && args[0]->IsString() && args[1]->IsNumber() 
        && args[2]->IsString() && args[3]->IsString() ) {
      //extract the strings and ints
      
      String::Utf8Value pemRequest(args[0]->ToString());
      int days = args[1]->Int32Value();
      String::Utf8Value pemCAKey(args[2]->ToString());
      String::Utf8Value pemCACert(args[3]->ToString());
      
      //call the wrapper & check for errors
      
      char* cert = new char[2048];
      ::memset(cert, 0, 2048);
      
      try {
          ::signRequest(pemRequest.operator*(),days,pemCAKey.operator*(),pemCACert.operator*(),cert);
                
      } catch (WebinosCryptoException &e) {
          delete cert;
          return ThrowException(Exception::TypeError(String::New(e.what())));
      }
      
      std::string certStr(cert, ::strlen(cert));
      
      
      //create composite remote object 
      Local<String> result = String::New(certStr.c_str());
      
      return scope.Close(result);
    }
    else {
      return ThrowException(Exception::TypeError(String::New("4 arguments expected: string int string string")));
    }
  }
  catch(::WebinosCryptoException& e) {
    return ThrowException(Exception::TypeError(String::New(e.what())));
  }
  catch(...) {
    return ThrowException(Exception::TypeError(String::New("Unknown exception")));
  }
}

//char* pemSigningKey, char* pemCaCert, int crldays, int crlhours, char* result
v8::Handle<Value> _createEmptyCRL(const Arguments& args)
{
  try {
    HandleScope scope;
    if (args.Length() == 4 && args[0]->IsString() && args[1]->IsString() 
        && args[2]->IsNumber() && args[3]->IsNumber() ) {
      //extract the strings and ints
      
      String::Utf8Value pemKey(args[0]->ToString());
      String::Utf8Value pemCert(args[1]->ToString());
      int days = args[2]->Int32Value();
      int hours = args[3]->Int32Value();
      
      
            
      //call the wrapper & check for errors
      
      char* crl = new char[2048];
      ::memset(crl, 0, 2048);
      
      try {
          ::createEmptyCRL(pemKey.operator*(), pemCert.operator*(), days,hours,crl);
                
      } catch (WebinosCryptoException &e) {
          delete crl;
          return ThrowException(Exception::TypeError(String::New(e.what())));
      }
      
      std::string crlStr(crl, ::strlen(crl));
      
      
      //create composite remote object 
      Local<String> result = String::New(crlStr.c_str());
      
      return scope.Close(result);
    }
    else {
      return ThrowException(Exception::TypeError(String::New("4 arguments expected: string string int int")));
    }
  }
  catch(::WebinosCryptoException& e) {
    return ThrowException(Exception::TypeError(String::New(e.what())));
  }
  catch(...) {
    return ThrowException(Exception::TypeError(String::New("Unknown exception")));
  }
}

//void addToCRL(char* pemSigningKey, char* pemOldCrl, char* pemRevokedCert, char* result) 
v8::Handle<Value> _addToCRL(const Arguments& args)
{
  try {
    HandleScope scope;
    if (args.Length() == 3 && args[0]->IsString() && args[1]->IsString() 
        && args[2]->IsString() ) {
      //extract the strings
      
      String::Utf8Value pemKey(args[0]->ToString());
      String::Utf8Value pemOldCRL(args[1]->ToString());
      String::Utf8Value pemRevokedCert(args[2]->ToString());
      
            
      //call the wrapper & check for errors
      
      char* crl = new char[2048];
      ::memset(crl, 0, 2048);
      
      try {
          ::addToCRL(pemKey.operator*(), pemOldCRL.operator*(), pemRevokedCert.operator*(),crl);
                
      } catch (WebinosCryptoException &e) {
          delete crl;
          return ThrowException(Exception::TypeError(String::New(e.what())));
      }
      
      std::string crlStr(crl, ::strlen(crl));
      
      
      //create composite remote object 
      Local<String> result = String::New(crlStr.c_str());
      
      return scope.Close(result);
    }
    else {
      return ThrowException(Exception::TypeError(String::New("3 arguments expected: all PEM strings")));
    }
  }
  catch(::WebinosCryptoException& e) {
    return ThrowException(Exception::TypeError(String::New(e.what())));
  }
  catch(...) {
    return ThrowException(Exception::TypeError(String::New("Unknown exception")));
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
