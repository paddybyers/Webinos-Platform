/*
 * CryptoManager.h
 *
 *  Created on: 30/giu/2010
 *      Author: Giuseppe La Torre
 */

#ifndef CRYPTOMANAGER_H_
#define CRYPTOMANAGER_H_

#include "core/policymanager/WidgetInfo.h"
#include "SignatureParser.h"
#include "crypto/crypto.h"

#include <vector>
using namespace std;

class CryptoManager
	{

private:
	vector<pair<string,string>* > subjectInfo;
	vector<pair<string,string>* > resourcesInfo;
		
	bool validateSignature(const string &);
	bool verify(const string &);
	
public:
	static string CANONICALIZATION_ALGORITHM_C14N;
	static string SIGNATURE_ALGORITHM_RSA_SHA256;
	static string SIGNATURE_ALGORITHM_DSA_SHA1;
	static string DIGEST_ALGORITHM_SHA256;
	
	CryptoManager();
	virtual ~CryptoManager();
	
	bool validateAllSignatures(const vector<string> &);
	bool validateAllReferences(const string &, vector<pair<string,string>*>&);
	int calculateSHA256(const char* in, char* out);
	int calculateSHA256(const char* in,int len, char* out);
	vector<pair<string,string>* > getSubjectInfo();
	vector<pair<string,string>* > getResourcesInfo();
	void sign(const string &);
	bool verifyOnLoad(const string &);
	bool verifyOnSave(const string &);
};

#endif /* CRYPTOMANAGER_H_ */
