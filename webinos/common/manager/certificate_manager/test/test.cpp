#include "../src/openssl_wrapper.h"
#include <iostream>
#include <string.h>

/*
 * Compile with: 
 * g++ -g ../src/openssl_wrapper.h ../src/openssl_wrapper.cpp test.cpp -lssl -o ./test.out
 *
 */

int main()
{
  char* privkey = new char[1024];
  ::genRsaKey(1024, privkey);
  
  std::cout << privkey << std::endl;
    

  char* certreq = new char[2048];

  try {  
  ::createCertificateRequest(certreq, privkey, "UK", "CA", "Oxford", "Oxford University", "Dept Comp Sci", "john.lyle@cs.ox.ac.uk");
  } catch (WebinosCryptoException &e) {
    std::cout << e.what() << std::endl;
    delete certreq;
    delete privkey;
      
    return -1;    
  }
  //  openssl req -text -in test-cert.pem
  
  int len = ::strlen(certreq);
  char* certreqout = new char[len];
  ::memset(certreqout, 0, len);
  ::memcpy(certreqout, certreq, len);
  std::string creq(certreqout, len);

  std::cout << creq << std::endl;
  
  char* signedReq = new char[2048];
  ::memset(signedReq, 0, 2048);
  
  try { 
  ::selfSignRequest(certreqout, 365, privkey, signedReq);
  } catch (WebinosCryptoException &e) {
    std::cout << e.what() << std::endl;
      delete certreq;
      delete certreqout;
      delete privkey;
    return -1;    
  }
  len = ::strlen(signedReq);
  std::string signedReqShort(signedReq, len);
  
  std::cout << signedReqShort << std::endl;
 
  char* crl = new char[2048];
  ::memset(crl, 0, 2048);
 
  try {
    ::createEmptyCRL(privkey, (char*)signedReqShort.c_str(), 10, 24, crl);
  } catch (WebinosCryptoException &e) {
    std::cout << e.what() << std::endl;
    delete crl;
    return -1;
  }

  len = ::strlen(crl);
  std::string crlShort(crl, len);
  std::cout << crlShort << std::endl;

  char* crlRevoked = new char[2048];
  ::memset(crlRevoked, 0, 2048);
 
  try {
    ::addToCRL(privkey, (char*)crlShort.c_str(), (char*)signedReqShort.c_str(), crlRevoked);
  } catch (WebinosCryptoException &e) {
    std::cout << e.what() << std::endl;
    delete crlRevoked;
    return -1;
  }

  len = ::strlen(crlRevoked);
  std::string crlRevokedShort(crlRevoked, len);
  std::cout << crlRevokedShort << std::endl;

  
  delete crlRevoked;  
  delete certreq;
  delete certreqout;
  delete privkey;
  return 0;
}
