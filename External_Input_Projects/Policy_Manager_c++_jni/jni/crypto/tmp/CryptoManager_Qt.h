/*
 * CryptoManager_Qt.h
 *
 *  Created on: 30/giu/2010
 *      Author: Giuseppe La Torre
 */

#ifndef CRYPTOMANAGERQT_H_
#define CRYPTOMANAGERQT_H_

#include "CryptoManager.h"

#include <string>
#include <vector>
using namespace std;

#include <QDirIterator>
#include <QMapIterator>
#include <QRegExpValidator>
#include <QRegExp>


class CryptoManager_Qt : public CryptoManager, public QObject {
	
	private:
	//Qt Method
	vector<string>& getSignaturePaths(const QString &);
	
	
	public:
	CryptoManager_Qt();
	virtual ~CryptoManager_Qt();
	
	bool validateAllSignatures(const string &);
};

#endif
