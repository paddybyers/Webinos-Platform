#include "WebinosCryptoException.h"

void genRsaKey(const int bits, char * privkey) throw(::WebinosCryptoException);
void createCertificateRequest(char* result, char* keyToCertify, char * country, char* state, char* loc, char* organisation, char* cname, char* email) throw(::WebinosCryptoException);
void selfSignRequest(char* pemRequest, int days, char* pemCAKey, char* result) throw(::WebinosCryptoException);
void signRequest(char* pemRequest, int days, char* pemCAKey, char* pemCaCert, char* result) throw(::WebinosCryptoException);
void createEmptyCRL(char* pemSigningKey, char* pemCaCert, int crldays, int crlhours, char* result) throw(::WebinosCryptoException);
void addToCRL(char* pemSigningKey, char* pemOldCrl, char* pemRevokedCert, char* result) throw(::WebinosCryptoException);

