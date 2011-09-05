#ifndef MY_DEBUG_H
#define MY_DEBUG_H
#include <android/log.h>
#include <jni.h>

#define  LOG_TAG  "NATIVE"

//#define  LOGD(...) 
#define  LOGD(...)  __android_log_print(ANDROID_LOG_DEBUG, LOG_TAG, __VA_ARGS__)

inline char* jstring2chars( JNIEnv*  env, jstring s){
	const jbyte * s_byte = (jbyte*)env->GetStringUTFChars(s, 0);
	return (char*)s_byte;
}


#endif
