#ifndef CRYPTO_H
#define CRYPTO_H

#include "core/Environment.h"

#ifdef SYMBIAN
    #include "sha2.h"
#endif

#include <openssl/bio.h>

#include "sys/uio.h"
#include <fcntl.h>
#include <unistd.h>
#include <string.h>
#include <string>
#include <vector>
#include "core/BondiDebug.h"
using namespace std;

#include <openssl/err.h>
#include <openssl/pem.h>
#include <openssl/rsa.h>

#define KEY_PRIVKEY	1
#define KEY_PUBKEY	2
#define KEY_CERT	3

#define IN_FILE		0
#define IN_MEM		1

#define BUFLEN 8192


string hex2str(unsigned long hexnum);
bool compareHashes(const char* paddedhash, int paddedhashlen, const char* hash, int hashlen);

int X509_PEM_decorator(const char * cert, int certlen, char* output);

//int X509_info(char *cert, int certlen)
vector<string> X509_info(char *cert, int certlen);

int sha1(const char *in, int len, char *dgst);

int sha256(const char *in, int len, char *dgst);

int toBase64 (unsigned char* input, int inputlen, char* output);

unsigned char b64conv(char chr);

int fromBase64 (unsigned char* input, int inputlen, char* output);

EVP_PKEY * load_key(const char* inkey, int keylen, char keytype);

int dsa_sign(const char* inkey, int keylen, char keytype, const char* data, int datalen, char* signature, const char* signaturefile);

int dsa_verify(const char* inkey, int keylen, char keytype, const char* signature, int signaturelen, const char* data, int datalen);

int rsa_sign(const char* inkey, int keylen, char keytype, const char* data, int datalen, char* signature, const char* signaturefile);

int rsa_verify(const char* inkey, int keylen, char keytype, const char* signature, int signaturelen, const char* data, int datalen);
#endif
