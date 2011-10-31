/*
 *  tssbridge.cpp
 *
 *  Created on: 25 Oct 2011
 *  Author: John Lyle
 *
 *  This is a node.js module capable of communicating with attestation.c
 *  and therefore interfacing the with a Trusted Platform Module via
 *  the Trusted Software Stack.
 *
 *  Requirements are listed in attestation.c, but essentially the TrouSerS
 *  library, a TPM and OpenSSL.
 *
 *  Two methods are exposed to node.js:
 *
 *   - getPCR( index )
 *
 *   This method returns the content of a PCR register.
 *
 *   Argument : an integer referencing the PCR index.
 *   Returns  : an array of bytes containing the value of that PCR register
 *
 *   - getQuote( pwd, filename, [index], nonce )
 *
 *   This method returns the result of performing a TPM_Quote operation.
 *
 *   Arguments: (1) The Storage Root Key password
 *   			(2) The AIK blob file generated using privacyca.com code
 *   			(3) An array of PCR indexes to include in the quote
 *   			(4) A byte array of length 20 containing a nonce
 *
 *   Returns  : A structure consisting of two objects,
 *   			(1) validationData
 *   			(2) quoteInfo
 *   			These conform to the TSS specification's return values.
 *
 */

#include <v8.h>
#include <node.h>
#include <iostream>

extern "C" {
#include "attestation.h"
}

extern "C" {
/*
 * Read a pcr with the given number, and store it into the given BYTE array.
 * Returns either  -1 on error, or the length of the pcr byte array.
 */
UINT32 pcrRead(int pcrNumber, BYTE* pcrRes) {
	TSS_HCONTEXT context;
	TSS_RESULT result;
	TSS_HTPM tpm;
	UINT32 pcrResLength;

	result = createContext(&context);
	if (result != 0)
		return -1;
	result = connectContext(context);
	if (result != 0)
		return -1;
	result = getTpm(context, &tpm);
	if (result != 0)
		return -1;
	result = getPcrs(tpm, pcrNumber, &pcrResLength, &pcrRes);
	if (result != 0) {
		printf("Could not read PCR %d\n", pcrNumber);
		return -1;
	}
	return pcrResLength;
}
/*
 * Creates a TPM quote and stores the output into "valid" and "quoteInfo"
 * Returns either 0 (success) or another value on error.
 *
 * Needs an SRK Password char* array, a filename, a list of PCR indexs,
 * the length of the PCR index, and a 20-byte nonce.
 *
 */
TSS_RESULT quote(char* srkPwd, char* aikfile, long pcrs[], int npcrs,
		BYTE nonce[], TSS_VALIDATION* valid, TPM_QUOTE_INFO* quoteInfo) {
	TSS_HCONTEXT context;
	TSS_RESULT result;
	TSS_HTPM tpm;
	TSS_HKEY srk;
	TSS_HKEY aik;

	UINT32 pcrResLength;
	BYTE* pcrRes;

	result = createContext(&context);
	if (result != 0)
		return result;
	result = connectContext(context);
	if (result != 0)
		return result;
	result = getTpm(context, &tpm);
	if (result != 0)
		return result;
	result = getSrk(context, TSS_SECRET_MODE_PLAIN, srkPwd, strlen(srkPwd),
			&srk);
	if (result != 0)
		return result;
	result = getKeyFromFile(context, srk, aikfile, &aik);
	if (result != 0)
		return result;
	result = createQuote(pcrs, 1, nonce, context, tpm, srk, aik, valid,
			quoteInfo);
	if (result != 0)
		return result;
	result = closeContext(context);
	if (result != 0)
		return result;

	return result;
}
}

using namespace node;
using namespace v8;

/*
 * Wrap the "pcrRead" function to marshal and unmarshall arguments.
 */
static Handle<Value> getPCR(const Arguments& args) {
	int pcr = args[0]->IntegerValue();
	BYTE* pcrRes = (BYTE*) malloc(20 * sizeof(BYTE));
	UINT32 pcrLen = pcrRead(pcr, pcrRes);
	//printf("%d\n", pcrLen);
	if (pcrLen < 0) {
		return ThrowException(
				Exception::Error(String::New("Could not read PCR")));
	}
	Local<Array> arr = Array::New(pcrLen);
	for (int i = 0; i < pcrLen; i++) {
		arr->Set(i, Number::New(pcrRes[i]));
	}
	free(pcrRes);
	return arr;
}

static Local<Object> versionToObject(TPM_STRUCT_VER ver) {
	Local<Object> verObj = Object::New();
	verObj->Set(String::New("major"), Number::New(ver.major));
	verObj->Set(String::New("minor"), Number::New(ver.minor));
	verObj->Set(String::New("revMajor"), Number::New(ver.revMajor));
	verObj->Set(String::New("revMinor"), Number::New(ver.revMinor));
	return verObj;
}

static Local<Object> version2ToObject(TSS_VERSION ver) {
	Local<Object> verObj = Object::New();
	verObj->Set(String::New("bMajor"), Number::New(ver.bMajor));
	verObj->Set(String::New("bMinor"), Number::New(ver.bMinor));
	verObj->Set(String::New("bRevMajor"), Number::New(ver.bRevMajor));
	verObj->Set(String::New("bRevMinor"), Number::New(ver.bRevMinor));
	return verObj;
}

static Local<Array> bytesToArray(BYTE* array, long size) {
	Local<Array> arr = Array::New(size);
	for (int i = 0; i < size; i++) {
		arr->Set(i, Number::New(array[i]));
	}
	return arr;
}

static char* stringToChar(Local<String> str) {
	char* strChars = (char*) malloc(sizeof(char) * str->Length());
	str->WriteUtf8(strChars);
	return strChars;
}

/*
 * Wrap the quote() method to marshal and unmarshal arguments
 *
 * Entirely inefficient.
 *
 * Will throw an exception if the Quote fails.
 * Currently doing NO INPUT VALIDATION WHATSOEVER!
 *
 * Arguments: srkpwd, aikfile, pcrs[], nonce
 *
 */
static Handle<Value> getQuote(const Arguments& args) {
	//unmarshal the arguments
	Local<String> srkpwd = args[0]->ToString();
	Local<String> aik = args[1]->ToString();
	Local<Object> pcrsObj = args[2]->ToObject();
	Local<Object> nonceObj = args[3]->ToObject();

	int fieldCount = 0;
	while (pcrsObj->Has(fieldCount))
		fieldCount++;
	long pcrs[fieldCount];
	int i = 0;
	for (i = 0; i < fieldCount; i++) {
		pcrs[i] = pcrsObj->Get(i)->Int32Value();
	}

	int j = 0;

	BYTE nonce[20];
	while (nonceObj->Has(j) && j < 20) {
		nonce[j] = nonceObj->Get(j)->Int32Value();
		j++;
	}

	char* srkpwdAscii = stringToChar(srkpwd);
	char* aikAscii = stringToChar(aik);

	TSS_VALIDATION valid;
	TPM_QUOTE_INFO quoteInfo;

	//perform the quote
	TSS_RESULT quoteRes = quote(srkpwdAscii, aikAscii, pcrs, fieldCount, nonce,
			&valid, &quoteInfo);
	if (quoteRes != 0) {
		return ThrowException(
				Exception::Error(String::New("Error producing TPM Quote")));
	}

	// turn all these stupid TSS structs into stupid JSON structures!
	Local<Object> validData = Object::New();

	validData->Set(String::New("rgbData"),
			bytesToArray(valid.rgbData, valid.ulDataLength));
	validData->Set(String::New("rgbExternalData"),
			bytesToArray(valid.rgbExternalData, valid.ulExternalDataLength));
	validData->Set(String::New("rgbValidationData"),
			bytesToArray(valid.rgbValidationData, valid.ulValidationDataLength));
	validData->Set(String::New("versionInfo"),
			version2ToObject(valid.versionInfo));

	Local<Object> quoteData = Object::New();

	quoteData->Set(String::New("compositeHash"),
			bytesToArray(quoteInfo.compositeHash.digest, 20));
	quoteData->Set(String::New("externalData"),
			bytesToArray(quoteInfo.externalData.nonce, 20));
	quoteData->Set(String::New("fixed"), bytesToArray(quoteInfo.fixed, 4));
	quoteData->Set(String::New("versionInfo"),
			versionToObject(quoteInfo.version));

	Local<Object> both = Object::New();
	both->Set(String::New("validationData"), validData);
	both->Set(String::New("quoteInfo"), quoteData);

	free(aikAscii);
	free(srkpwdAscii);

	return both;
}

extern "C" {
static void init(Handle<Object> target) {
	NODE_SET_METHOD(target, "getPCR", getPCR);
	NODE_SET_METHOD(target, "getQuote", getQuote);
}
NODE_MODULE(tssbridge, init)
;
}
