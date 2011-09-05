#ifndef COMMON_HEADER_DEFINED
#define	COMMON_HEADER_DEFINED
#include "slre.h"
#include <string>
#include <vector>
#include <algorithm>
#include <iostream>

using namespace std;

typedef vector<string> strings;
const int STRCMP_NORMAL = 0;
const int STRCMP_REGEXP = 1;
const int STRCMP_GLOBBING = 2;
const int MAX_CAPTURES = 4;

string glob2regexp (const string& glob);

const bool compare_regexp(const string& target,const string& expression);
const bool compare_globbing (const string& target,const string& expression);
const bool equals(const string& s1, const string& s2, const int mode=STRCMP_NORMAL);

inline const bool contains(const strings& ss, const string& s) { return (find(ss.begin(), ss.end(), s)!=ss.end()); }
const bool contains(const strings& container, const strings& contained);

const int string2strcmp_mode(const string& s);

#endif /* COMMON_HEADER_DEFINED */
