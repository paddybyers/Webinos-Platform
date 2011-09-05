#ifndef CRYPTO_MANAGER_ANDROID__H
#define CRYPTO_MANAGER_ANDROID__H
#include "crypto/CryptoManager.h"

class CryptoManager_Android : public CryptoManager
{
	public:
	bool validateAllSignatures(const string & widgetRootPath);
	int size();

};
#endif
