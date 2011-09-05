/*
 * ReferenceObject.cpp
 *
 *  Created on: 30/giu/2010
 *      Author: Giuseppe La Torre
 */

#include "ReferenceObject.h"

ReferenceObject::ReferenceObject(string method, string value, string uri){
	this->digestMethod = method;
	this->digestValue = value;
	this->URI = uri;
}

ReferenceObject::~ReferenceObject(){}

bool ReferenceObject::checkDigest(){
	return true;
}

string ReferenceObject::getDigestMethod(){
	return digestMethod;
}

string ReferenceObject::getDigestValue(){
	return digestValue;
}

string ReferenceObject::getURI(){
	return URI;
}
