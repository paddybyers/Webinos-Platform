int genRsaKey(const int bits, char * privkey);
int createCertificateRequest(char* result, char* keyToCertify, char * country, char* state, char* loc, char* organisation, char *organisationUnit, char* cname, char* email);
int selfSignRequest(char* pemRequest, int days, char* pemCAKey, int certType, char *url, char* result);
int signRequest(char* pemRequest, int days, char* pemCAKey, char* pemCaCert, char* result);
int createEmptyCRL(char* pemSigningKey, char* pemCaCert, int crldays, int crlhours, char* result);
int addToCRL(char* pemSigningKey, char* pemOldCrl, char* pemRevokedCert, char* result);

