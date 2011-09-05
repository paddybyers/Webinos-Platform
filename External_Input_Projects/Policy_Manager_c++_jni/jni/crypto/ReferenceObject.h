/*
 * ReferenceObject.h
 *
 *  Created on: 30/giu/2010
 *      Author: Giuseppe La Torre
 */

#ifndef REFERENCEOBJECT_H_
#define REFERENCEOBJECT_H_

#include <string>

using namespace std;
class ReferenceObject
	{
	
private:
	string digestMethod;
	string digestValue;
	string URI;
	
public:
	ReferenceObject(string,string,string);
	virtual ~ReferenceObject();
	
	bool checkDigest();
	string getDigestMethod();
	string getDigestValue();
	string getURI();
	};

#endif /* REFERENCEOBJECT_H_ */
