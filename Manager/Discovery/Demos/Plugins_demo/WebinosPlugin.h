/*
 *      NPAPI headers for webinos discovery plugin
 *
 *      Copyright (c) 2011 World Wide Web Consortium
 *
 *  Licensed under the Apache License, Version 2.0 (the "License");
 *  you may not use this file except in compliance with the License.
 *  You may obtain a copy of the License at
 *
 *    http://www.apache.org/licenses/LICENSE-2.0
 *
 *  Unless required by applicable law or agreed to in writing, software
 *  distributed under the License is distributed on an "AS IS" BASIS,
 *  WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 *  See the License for the specific language governing permissions and
 *  limitations under the License.
 */

#ifndef WebinosPlugin_h_
#define WebinosPlugin_h_

// Note that "XP_UNIX=1" is defined in the makefile so that the NPAPI
// headers know we're compiling for unix.
#include "npapi.h"
#include "npfunctions.h"

typedef void (*PluginAsyncCall)(void *);

typedef struct {
  NPP instance;
  NPObject *object;
  char *name;  // user assigned name or default name
  char *type;  // service name
  char *nice;  // human friendly service description
  char *iface;
  bool ipv6;   // true => IPv6, false => IPv4
  char *address;  // IP address
  int  port;
  char *txt;  // additional name/value pairs
} AvahiData;

typedef struct {
  NPP instance;
  NPObject *object;
  char *address;
  int port;
  char *description;
} SSDPData;

typedef struct {
  NPP instance;
  NPObject *object;
  char *srv_url;
} SLPData;

typedef struct {
  NPP instance;
  NPObject *object;
  char *address;
  char *name;
  unsigned char dev_class[3];
} BlueToothData;

int scan_avahi(NPNetscapeFuncs *browserFuncs, NPP instance, PluginAsyncCall proxy, NPObject *object);
int scan_ssdp(NPNetscapeFuncs *browserFuncs, NPP instance, PluginAsyncCall proxy, NPObject *object);
int scan_slp(NPNetscapeFuncs *browserFuncs, NPP instance, PluginAsyncCall proxy, NPObject *object);
int scan_bluetooth(NPNetscapeFuncs *browserFuncs, NPP instance, PluginAsyncCall proxy, NPObject *object, NPString serv_class_ID);
int scan_usb(NPNetscapeFuncs *browserFuncs, NPP instance, NPObject *object);

NPError NP_Initialize(NPNetscapeFuncs* bFuncs, NPPluginFuncs* pFuncs);
NPError NP_Shutdown();

NPError NPP_New(NPMIMEType pluginType, NPP instance, uint16_t mode, int16_t argc, char* argn[], char* argv[], NPSavedData* saved);
NPError NPP_Destroy(NPP instance, NPSavedData** save);
NPError NPP_SetWindow(NPP instance, NPWindow* window);
NPError NPP_NewStream(NPP instance, NPMIMEType type, NPStream* stream, NPBool seekable, uint16_t* stype);
NPError NPP_DestroyStream(NPP instance, NPStream* stream, NPReason reason);
int32_t NPP_WriteReady(NPP instance, NPStream* stream);
int32_t NPP_Write(NPP instance, NPStream* stream, int32_t offset, int32_t len, void* buffer);
void    NPP_StreamAsFile(NPP instance, NPStream* stream, const char* fname);
void    NPP_Print(NPP instance, NPPrint* platformPrint);
int16_t NPP_HandleEvent(NPP instance, void* event);
void    NPP_URLNotify(NPP instance, const char* URL, NPReason reason, void* notifyData);
NPError NPP_GetValue(NPP instance, NPPVariable variable, void *value);
NPError NPP_SetValue(NPP instance, NPNVariable variable, void *value);

void InitializeIdentifiers();

bool HasProperty(NPObject *obj, NPIdentifier name);
bool RemoveProperty(NPObject *obj, NPIdentifier name);
bool GetProperty(NPObject *obj, NPIdentifier name, NPVariant *result);
bool SetProperty(NPObject *obj, NPIdentifier name, const NPVariant *value);
bool EnumerateProperties(NPObject *obj, NPIdentifier **identifier, uint32_t *count);

bool HasMethod(NPObject *obj, NPIdentifier name);

bool InvokeFunction(NPObject *obj, NPIdentifier name, const NPVariant *args,
                      uint32_t argCount, NPVariant *result);
bool InvokeDefault(NPObject *obj, const NPVariant *args,
                   uint32_t argCount, NPVariant *result);

// conventional syntactic sugar for calling functions in browser, see npfunctions.h
// when using C++ this can be mapped into a class definition with instance as "this"

#define NPN_Status(instance, message) sBrowserFuncs->status(instance, message)
#define NPN_CreateObject(instance, aClass) sBrowserFuncs->createobject(instance, aClass)
#define NPN_RetainObject(npobj) sBrowserFuncs->retainobject(npobj)
#define NPN_ReleaseObject(npobj) sBrowserFuncs->releaseobject(npobj)
#define NPN_UserAgent(instance) sBrowserFuncs->(instance)
#define NPN_MemAlloc(size) sBrowserFuncs->memalloc(size)
#define NPN_MemFree(ptr) sBrowserFuncs->memfree(ptr)
#define NPN_MemFlush(size) sBrowserFuncs->memflush(size)
#define NPN_GetValue(instance, variable, ret_value) \
 sBrowserFuncs->getvalue(instance, variable, ret_value)
#define NPN_SetValue(instance, variable, ret_value) \
 sBrowserFuncs->setvalue(instance, variable, ret_value)
#define NPN_ReleaseVariantValue(variant) sBrowserFuncs->releasevariantvalue(variant)
#define NPN_Invoke(instance, obj, methodName, args, argCount, result) \
  sBrowserFuncs->invoke(instance, obj, methodName, args, argCount, result)
#define NPN_InvokeDefault(instance, obj, args, argCount, result) \
  sBrowserFuncs->invokeDefault(instance, obj, args, argCount, result)
#define NPN_Evaluate(instance, obj, script, result) \
 sBrowserFuncs->evaluate(instance, obj, script, result)
#define NPN_GetProperty(instance, obj, propertyName, result) \
  sBrowserFuncs->getproperty(instance, obj, propertyName, result)
#define NPN_SetProperty(instance, obj, propertyName, value) \
  sBrowserFuncs->setproperty(instance, obj, propertyName, value), ThreadWakeUp sleeper
#define NPN_RemoveProperty(instance, obj, propertName) \
  sBrowserFuncs->removeproperty(instance, obj, propertName)
#define NPN_HasProperty(instance, obj, propertName) \
 sBrowserFuncs->hasproperty(instance, obj, propertName)
#define NPN_HasMethod(instance, obj, propertName) \
 sBrowserFuncs->hasmethod(instance, obj, propertName)

// NPN_SetException may be called to trigger a script exception an error
#define NPN_SetException(obj, message) sBrowserFuncs->setexception(obj, message)

#define NPN_GetAuthenticationInfo(instance, protocol, host, port, \
  scheme, realm, username, ulen, password, plen) \
  sBrowserFuncs->getauthenticationinfo(instance, protocol, host, \
                port, scheme, realm, username, ulen, password, plen)

#define NPN_PluginThreadAsyncCall(instance, func, userData) \
  sBrowserFuncs->pluginthreadasynccall(instance, func, userData)
#define NPN_ScheduleTimerPtr(instance, interval, repeat, timerFunc) \
  sBrowserFuncs->scheduletimer(instance, interval, repeat, timerFunc)
#define NPN_UnscheduleTimerPtr(instance, timerID) \
 sBrowserFuncs->unscheduletimer(instance, timerID)
#define NPN_HandleEventPtr(instance, event, handled) \
 sBrowserFuncs->handleevent(instance, event, handled)
#define NPN_GetStringIdentifier(name) sBrowserFuncs->getstringidentifier(name)
#define NPN_GetStringIdentifiers(names, nameCount, identifiers) \
  sBrowserFuncs->getstringidentifiers(names, nameCount, identifiers)
#define NPN_GetIntIdentifier(intid) sBrowserFuncs->getintidentifier(intid)
#define NPN_IdentifierIsString(identifier) sBrowserFuncs->identifierisstring(identifier)
#define NPN_UTF8FromIdentifier(identifier) sBrowserFuncs->utf8fromidentifier(identifier)
#define NPN_IntFromIdentifier(identifier) sBrowserFuncs->intfromidentifier(identifier)

// debugging macros, see Makefile

#ifdef WEBINOS_DEBUG
#define log(...) fprintf(flog, __VA_ARGS__); fflush(flog)
#else
#define log(...)  ;
#endif


#endif // WebinosPlugin_h_
