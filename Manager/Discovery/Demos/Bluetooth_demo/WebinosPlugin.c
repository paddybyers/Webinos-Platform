/*
 *      NPAPI code for webinos discovery plugin
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

#include "WebinosPlugin.h"

#include <stdlib.h>
#include <string.h>
#include <stdio.h>

#define PLUGIN_NAME        "Webinos Platform Plug-in"
#define PLUGIN_DESCRIPTION PLUGIN_NAME " (Mozilla SDK)"
#define PLUGIN_VERSION     "1.0.0.0"

// later define x and y as properties
#define WEBINOS_PROPERTY_COUNT 2

static NPNetscapeFuncs *sBrowserFuncs = NULL;
static NPClass sNPClass;

#ifdef WEBINOS_DEBUG
static FILE *flog = NULL;
#endif

// forward references
NPObject *NPP_Allocate(NPP npp, NPClass *aClass);
void NPP_Deallocate(NPObject *npobj);

static NPIdentifier sXId, sYId, sZId,
   sScanMDNSId, sScanSSDPId, sScanSLPId, sScanUsbId, sScanBluetoothId;
static NPIdentifier sIdentifiers[WEBINOS_PROPERTY_COUNT];

// extended NPClass with field for instance as a
// work around for broken design of NPRuntime
typedef struct {
  uint32_t structVersion;
  NPAllocateFunctionPtr allocate;
  NPDeallocateFunctionPtr deallocate;
  NPInvalidateFunctionPtr invalidate;
  NPHasMethodFunctionPtr hasMethod;
  NPInvokeFunctionPtr invoke;
  NPInvokeDefaultFunctionPtr invokeDefault;
  NPHasPropertyFunctionPtr hasProperty;
  NPGetPropertyFunctionPtr getProperty;
  NPSetPropertyFunctionPtr setProperty;
  NPRemovePropertyFunctionPtr removeProperty;
  NPEnumerationFunctionPtr enumerate;
  NPConstructFunctionPtr construct;
  NPP instance;
} ScriptObject;

typedef struct InstanceData {
  NPP npp;
  NPWindow window;
  NPObject *object;
} InstanceData;


// start of exported functions

// NP_Initialize -  set up method tables for both directions
// NP_GetPluginVersion - return plugin's version string
// NP_GetMIMEDescription - return plugin's supported MIME types
// NP_GetValue - used to get plugin's description
// NP_Shutdown - called when last instance is closed

NP_EXPORT(NPError) NP_Initialize(NPNetscapeFuncs* bFuncs, NPPluginFuncs* pFuncs)
{
#ifdef WEBINOS_DEBUG
  // open log file for debugging
  flog = fopen(WEBINOS_LOG_FILE, "w+");
  log("initialized plugin\n");
#endif

  sBrowserFuncs = bFuncs;

  log("browser funcs version number is %d\n", sBrowserFuncs->version);

  if (!sBrowserFuncs->getstringidentifier)
    log("Eeek: getstringidentifier is undefined\n");

  // Check the size of the provided structure based on the offset of the
  // last member we need.
  if (pFuncs->size < (offsetof(NPPluginFuncs, setvalue) + sizeof(void*)))
    return NPERR_INVALID_FUNCTABLE_ERROR;

  pFuncs->newp = NPP_New;
  pFuncs->destroy = NPP_Destroy;
  pFuncs->setwindow = NPP_SetWindow;
  pFuncs->newstream = NPP_NewStream;
  pFuncs->destroystream = NPP_DestroyStream;
  pFuncs->asfile = NPP_StreamAsFile;
  pFuncs->writeready = NPP_WriteReady;
  pFuncs->write = NPP_Write;
  pFuncs->print = NPP_Print;
  pFuncs->event = NPP_HandleEvent;
  pFuncs->urlnotify = NPP_URLNotify;
  pFuncs->getvalue = NPP_GetValue;
  pFuncs->setvalue = NPP_SetValue;

  // initialize method dispatch table for scripting plugin
  sNPClass.structVersion = NP_CLASS_STRUCT_VERSION;
  sNPClass.allocate = NPP_Allocate;
  sNPClass.deallocate = NPP_Deallocate;
  sNPClass.hasProperty = HasProperty;
  sNPClass.getProperty = GetProperty;
  sNPClass.setProperty = SetProperty;
  sNPClass.enumerate = EnumerateProperties;
  sNPClass.hasMethod = HasMethod;
  sNPClass.invoke = InvokeFunction;
  sNPClass.invokeDefault = InvokeDefault;

  InitializeIdentifiers();

  printf("initialized\n");
  return NPERR_NO_ERROR;
}

NP_EXPORT(char*) NP_GetPluginVersion()
{
  return PLUGIN_VERSION;
}

NP_EXPORT(const char*) NP_GetMIMEDescription()
{
  return "application/x-webinos-plugin:nos:Webinos Platform plugin";
}


// Called during initialization to retrieve the plug-in's name and
// description, which will appear in the navigator.plugins DOM
// object which is used to populate about:plugins.
NP_EXPORT(NPError) NP_GetValue(void* future, NPPVariable aVariable, void* aValue)
{
  return NPP_GetValue(future, aVariable, aValue);
}

NP_EXPORT(NPError) NP_Shutdown()
{
#ifdef WEBINOS_DEBUG
  // close log file
  log("shutdown: closing log file\n");
  fclose(flog);
#endif

  return NPERR_NO_ERROR;
}

// end of exported functions

// Start of plugin instance related functions
// NPP functions are ones defined by plugin and called by browser
// NPN functions wrappers for functions exported by browser


// called by browser to create new plugin instance
NPError NPP_New(NPMIMEType pluginType, NPP instance, uint16_t mode,
        int16_t argc, char* argn[], char* argv[], NPSavedData* saved)
{
  // Make sure we can render this plugin
  NPBool browserSupportsWindowless = false;
  NPN_GetValue(instance, NPNVSupportsWindowless, &browserSupportsWindowless);
  if (!browserSupportsWindowless)
  {
    return NPERR_GENERIC_ERROR;
  }

  NPN_SetValue(instance, NPPVpluginWindowBool, (void*)false);

  // set up our our instance data
  InstanceData* instanceData = (InstanceData*)malloc(sizeof(InstanceData));

  if (!instanceData)
    return NPERR_OUT_OF_MEMORY_ERROR;

  memset(instanceData, 0, sizeof(InstanceData));
  instanceData->npp = instance;
  instanceData->object = NULL;
  instance->pdata = instanceData;

  printf("created instance at %lx, data %lx\n", (long unsigned)instance, (long unsigned)instanceData);

  return NPERR_NO_ERROR;
}


// called by browser to close plugin instance
NPError NPP_Destroy(NPP instance, NPSavedData **save)
{
  InstanceData* instanceData = (InstanceData*)(instance->pdata);
  free(instanceData);
  return NPERR_NO_ERROR;
}

NPError NPP_SetWindow(NPP instance, NPWindow* window)
{
  InstanceData* instanceData = (InstanceData*)(instance->pdata);
  instanceData->window = *window;
  return NPERR_NO_ERROR;
}

// this is used to initiate a data stream from the plugin
NPError NPP_NewStream(NPP instance, NPMIMEType type, NPStream* stream,
                      NPBool seekable, uint16_t* stype)
{
  return NPERR_GENERIC_ERROR;
}

NPError NPP_DestroyStream(NPP instance, NPStream* stream, NPReason reason)
{
  return NPERR_GENERIC_ERROR;
}

int32_t NPP_WriteReady(NPP instance, NPStream* stream)
{
  return 0;
}

int32_t NPP_Write(NPP instance, NPStream* stream, int32_t offset,
                  int32_t len, void* buffer)
{
  return 0;
}

void NPP_StreamAsFile(NPP instance, NPStream* stream, const char* fname)
{

}

void NPP_Print(NPP instance, NPPrint* platformPrint)
{

}

// allows the plugin to handle a variety of platform specific events
// note that Windowless plug-ins are transparent by default

// scripts can call methods exposed by the plugin as a work around
// for the plugin not being able to register for DOM events, i.e.
// you proxy the event listener via JavaScript.
int16_t NPP_HandleEvent(NPP instance, void* event)
{
  return 0;
}

void NPP_URLNotify(NPP instance, const char* URL, NPReason reason, void* notifyData)
{
}

NPObject *NPP_Allocate(NPP instance, NPClass *aClass)
{
  ScriptObject *obj = (ScriptObject *)malloc(sizeof(ScriptObject));

  if (obj)
  {
    // initialize method dispatch table for scripting plugin
    obj->structVersion = NP_CLASS_STRUCT_VERSION;
    obj->allocate = NPP_Allocate;
    obj->deallocate = NPP_Deallocate;
    obj->hasProperty = HasProperty;
    obj->getProperty = GetProperty;
    obj->setProperty = SetProperty;
    obj->enumerate = EnumerateProperties;
    obj->hasMethod = HasMethod;
    obj->invoke = InvokeFunction;
    obj->invokeDefault = InvokeDefault;

    // and add reference to plugin instance for later use
    obj->instance = instance;
  }

  return (NPObject*)obj;
}

void NPP_Deallocate(NPObject *npobj)
{
  free(npobj);
}

// Called after the plug-in is initialized to get the scripting interface
NPError NPP_GetValue(NPP instance, NPPVariable aVariable, void* aValue)
{
  switch (aVariable) {
    case NPPVpluginNameString:
      *((char**)aValue) = PLUGIN_NAME;
      break;

    case NPPVpluginDescriptionString:
      *((char**)aValue) = PLUGIN_DESCRIPTION;
      break;

    case NPPVpluginScriptableNPObject:
      if (!instance || !instance->pdata)
        return NPERR_INVALID_INSTANCE_ERROR;

      InitializeIdentifiers();
      InstanceData *instanceData = instance->pdata;

      if (instanceData->object == NULL)
      {
         instanceData->object = NPN_CreateObject(instance, &sNPClass);
      }
      printf("NPObject created at %lx\n", (long unsigned)instanceData->object);

      *((NPObject **) aValue) = NPN_RetainObject(instanceData->object);
      break;

    default:
      return NPERR_INVALID_PARAM;
      break;
  }

  return NPERR_NO_ERROR;
}

NPError NPP_SetValue(NPP instance, NPNVariable variable, void *value)
{
  return NPERR_GENERIC_ERROR;
}

// copy string using browser's allocator and critical
// for webkit based browsers; free with NPN_MemFree()
char *DuplicateString(const char *s)
{
  char *str = (char *)NPN_MemAlloc(strlen(s)+1);

  if (str)
    strcpy(str, s);

  return str;
}

// find actual window for windowless plugins
// caller must later call NPN_ReleaseObject()
// when done with the reference obtained here
NPWindow *GetWindowObject(NPP instance)
{
  NPWindow *object;
  NPN_GetValue(instance, NPNVWindowNPObject, &object);
  return object;
}

// caller must later call NPN_ReleaseObject()
// when done with the reference obtained here
// see instanceData for simpler alternative
NPObject *GetPluginObject(NPP instance)
{
  NPObject *object;
  NPN_GetValue(instance, NPNVPluginElementNPObject, &object);
  return object;
}

void PrintIdentifier(char *msg, NPIdentifier name)
{
  if (NPN_IdentifierIsString(name))
  {
    char *s = NPN_UTF8FromIdentifier(name);
    printf("%s with string %s\n", msg, s);
    if (s) NPN_MemFree(s);
  }
  else
    printf("%s with integer %x\n", msg, NPN_IntFromIdentifier(name));
}

void InitializeIdentifiers()
{
  if (sIdentifiers[0] == NULL)
  {
    // declare identifiers for properties, there
    // should be WEBINOS_PROPERTY_COUNT of them
    sIdentifiers[0] = sXId = NPN_GetStringIdentifier("x");
    sIdentifiers[1] = sYId = NPN_GetStringIdentifier("y");

    // declare identifiers for methods
    sZId = NPN_GetStringIdentifier("z");
    sScanMDNSId = NPN_GetStringIdentifier("scan_mdns");
    sScanSSDPId = NPN_GetStringIdentifier("scan_ssdp");
    sScanSLPId = NPN_GetStringIdentifier("scan_slp");
    sScanUsbId = NPN_GetStringIdentifier("scan_usb");
    sScanBluetoothId = NPN_GetStringIdentifier("scan_bluetooth");
  }
}

/*
typedef struct _NPVariant {
    NPVariantType type;
    union {
        bool boolValue;
        int32_t intValue;
        double doubleValue;
        NPString stringValue;
        NPObject *objectValue;
    } value;
} NPVariant;
*/
static void PrintValue(const NPVariant *value)
{
  printf("value is ");

  switch (value->type)
  {
    case NPVariantType_Void:
      printf("undefined");
      break;

    case NPVariantType_Null:
      printf("null");
      break;

    case NPVariantType_Bool:
      printf("bool");
      break;

    case NPVariantType_Int32:
      printf("integer");
      break;

    case NPVariantType_Double:
      printf("double");
      break;

    case NPVariantType_String:
      printf("string");
      break;

    case NPVariantType_Object:
      printf("object");
      break;

    default:
      printf("unknown type");
      break;
  }

  printf("\n");
}

/* 
    NPObjects have methods and properties.  Methods and properties are 
    identified with NPIdentifiers.  These identifiers may be reflected 
    in script.  NPIdentifiers can be either strings or integers, IOW, 
    methods and properties can be identified by either strings or 
    integers (i.e. foo["bar"] vs foo[1]). NPIdentifiers can be 
    compared using ==.  In case of any errors, the requested 
    NPIdentifier(s) will be NULL. 
*/ 

// following functions called by browser through the    uint32_t structVersion;
/*
    NPAllocateFunctionPtr allocate;
    NPDeallocateFunctionPtr deallocate;
    NPInvalidateFunctionPtr invalidate;
    NPHasMethodFunctionPtr hasMethod;
    NPInvokeFunctionPtr invoke;
    NPInvokeDefaultFunctionPtr invokeDefault;
    NPHasPropertyFunctionPtr hasProperty;
    NPGetPropertyFunctionPtr getProperty;
    NPSetPropertyFunctionPtr setProperty;
    NPRemovePropertyFunctionPtr removeProperty;
    NPEnumerationFunctionPtr enumerate;
    NPConstructFunctionPtr construct;
*/

NPP GetInstance(NPObject *obj)
{
  ScriptObject *my_obj = (ScriptObject *)obj;
  return my_obj->instance;
}

// method table set up in NP_Initialize(), and wrapped
// in NPObject. Call NPN_SetException() to indicate an error

bool HasProperty(NPObject *obj, NPIdentifier name)
{
  PrintIdentifier("hasProperty called", name); // prints (null) !!!

  return (name == sXId || name == sYId);
}

bool RemoveProperty(NPObject *obj, NPIdentifier name)
{
  PrintIdentifier("removeProperty called", name);
  return false;
}

bool GetProperty(NPObject *obj, NPIdentifier name, NPVariant *result)
{
  PrintIdentifier("getProperty called", name);

  if (name == sXId)
  {
    char *s = DuplicateString("hello world");

    if (!s)
      return false;

    STRINGZ_TO_NPVARIANT(s, *result);
    return true;
  }

  if (name == sYId)
  {
    char *s = DuplicateString("hello moon");

    if (!s)
      return false;

    STRINGZ_TO_NPVARIANT(s, *result);
    return true;
  }

  return false;
}

bool SetProperty(NPObject *obj, NPIdentifier name, const NPVariant *value)
{
  PrintIdentifier("setProperty called", name);
  // need to switch on variant type and figure out how to keep a local copy
  // could throw exception on attempt to store wrong type of value
  return true;
}

bool EnumerateProperties(NPObject *obj, NPIdentifier **identifier, uint32_t *count)
{
  // create array of identifiers using browser's allocator
  // caller (in browser) is responsible for freeing memory

  size_t size = WEBINOS_PROPERTY_COUNT * sizeof(NPIdentifier);
  NPIdentifier *ids = (NPIdentifier *)NPN_MemAlloc(size);

  if (!ids)
    return false;

  memcpy(ids, &sIdentifiers, size);
  *identifier = ids;
  *count = WEBINOS_PROPERTY_COUNT;
  return true;
}

bool HasMethod(NPObject *obj, NPIdentifier name)
{
  PrintIdentifier("hasMethod called", name);
  return (name == sZId ||
          name == sScanMDNSId ||
          name == sScanSSDPId ||
          name == sScanSLPId ||
          name == sScanUsbId ||
          name == sScanBluetoothId);
}

void FreeAvahiData(AvahiData *sdata)
{
  if (sdata->name) free(sdata->name);
  if (sdata->type) free(sdata->type);
  if (sdata->nice) free(sdata->nice);
  if (sdata->iface) free(sdata->iface);
  if (sdata->address) free(sdata->address);
  if (sdata->txt) free(sdata->txt);
  free(sdata);
}

// to be called via NPN_PluginThreadAsyncCall()
void avahi_notify(void *data)
{
  fprintf(stderr, "** avahi notify\n");

  if (data)
  {
    NPVariant result;
    AvahiData *sdata = (AvahiData *)data;

    fprintf(stderr, "name: %s, type: \"%s\"\n", sdata->name, sdata->nice);

    NPVariant name;
    NPVariant type;
    NPVariant iface;
    NPVariant address;
    NPVariant port;
    STRINGZ_TO_NPVARIANT(sdata->name, name);
    STRINGZ_TO_NPVARIANT(sdata->nice, type);
    STRINGZ_TO_NPVARIANT(sdata->iface, iface);
    STRINGZ_TO_NPVARIANT(sdata->address, address);
    INT32_TO_NPVARIANT(((int32_t)sdata->port), port);
    NPObject *object = sdata->object;
    NPVariant args[] = { name, type, iface, address, port };
    NPIdentifier methodId = NPN_GetStringIdentifier("mdns");
    
    NPN_Invoke(sdata->instance, object, methodId, args,
             sizeof(args) / sizeof(args[0]), &result);

    sBrowserFuncs->releaseobject(object);
    FreeAvahiData(sdata);
  }
  else
    fprintf(stderr, "NPN_PluginThreadAsyncCall called function with null argument\n");
}

void FreeSSDPData(SSDPData *sdata)
{
  if (sdata->address)
    free(sdata->address);
  if (sdata->description)
    free(sdata->description);

  free(sdata);
}

// to be called via NPN_PluginThreadAsyncCall()
void ssdp_notify(void *data)
{
  fprintf(stderr, "** ssdp notify\n");

  if (data)
  {
    NPVariant result;
    SSDPData *sdata = (SSDPData *)data;

    fprintf(stderr, "host: %s, port: %d\n", sdata->address, sdata->port);

    NPVariant address;
    NPVariant port;
    NPVariant description;
    STRINGZ_TO_NPVARIANT(sdata->address, address);
    INT32_TO_NPVARIANT(((int32_t)sdata->port), port);
    STRINGZ_TO_NPVARIANT(sdata->description, description);
    NPObject *object = sdata->object;
    NPVariant args[] = { address, port, description };
    NPIdentifier methodId = NPN_GetStringIdentifier("ssdp");
    
    fprintf(stderr, "about to call web page script\n");
    NPN_Invoke(sdata->instance, object, methodId, args,
             sizeof(args) / sizeof(args[0]), &result);

    sBrowserFuncs->releaseobject(object);
    FreeSSDPData(sdata);
  }
  else
    fprintf(stderr, "NPN_PluginThreadAsyncCall called function with null argument\n");
}

void FreeSLPData(SLPData *sdata)
{
  if (sdata->srv_url)
    free(sdata->srv_url);

  free(sdata);
}

// to be called via NPN_PluginThreadAsyncCall()
void slp_notify(void *data)
{
  fprintf(stderr, "** slp notify\n");

  if (data)
  {
    NPVariant result;
    SLPData *sdata = (SLPData *)data;

    fprintf(stderr, "slp url %s\n", sdata->srv_url);

    NPVariant description;
    STRINGZ_TO_NPVARIANT(sdata->srv_url, description);
    NPObject *object = sdata->object;
    NPVariant args[] = { description };
    NPIdentifier methodId = NPN_GetStringIdentifier("slp");
    
    fprintf(stderr, "about to call web page script\n");
    NPN_Invoke(sdata->instance, object, methodId, args,
             sizeof(args) / sizeof(args[0]), &result);

    sBrowserFuncs->releaseobject(object);
    FreeSLPData(sdata);
  }
  else
    fprintf(stderr, "NPN_PluginThreadAsyncCall called function with null argument\n");
}

void FreeBluetoothData(BlueToothData *sdata)
{
  if (sdata->address)
    free(sdata->address);
  if (sdata->name)
    free(sdata->name);

  free(sdata);
}

// to be called via NPN_PluginThreadAsyncCall()
void bluetooth_notify(void *data)
{
  fprintf(stderr, "** bluetooth notify\n");

  if (data)
  {
    NPVariant result;
    BlueToothData *sdata = (BlueToothData *)data;
    unsigned code = sdata->dev_class[2] << 16 |
                    sdata->dev_class[1] << 8 |
                    sdata->dev_class[0];

    NPVariant address;
    NPVariant name;
    NPVariant devclass;
    STRINGZ_TO_NPVARIANT(sdata->address, address);
    STRINGZ_TO_NPVARIANT(sdata->name, name);
    INT32_TO_NPVARIANT(((int32_t)code), devclass);
    NPObject *object = sdata->object;
    NPVariant args[] = { address, name, devclass };
    NPIdentifier methodId = NPN_GetStringIdentifier("bluetooth");

    printf("bluetooth: %s %s [%x, %x, %x]\n", sdata->name, sdata->address,
        sdata->dev_class[0], sdata->dev_class[1], sdata->dev_class[2]);

    NPN_Invoke(sdata->instance, object, methodId, args,
             sizeof(args) / sizeof(args[0]), &result);

    sBrowserFuncs->releaseobject(object);
    FreeBluetoothData(sdata);
  }
  else
    fprintf(stderr, "NPN_PluginThreadAsyncCall called function with null argument\n");
}

// should think about throwing exception to script rather than returning false
bool InvokeFunction(NPObject *obj, NPIdentifier name,
            const NPVariant *args, uint32_t argCount, NPVariant *result)
{
  // we saved the instance when creating the scripting object
  NPP instance = GetInstance(obj);

  PrintIdentifier("Invoke called", name);
//  printf("invoke called with arg[0] %lx,\n  instance %lx,\n  browserFuncs %lx\n",
//   (long unsigned)NPVARIANT_TO_OBJECT(args[0]), (long unsigned)instance, (long unsigned)sBrowserFuncs);

  printf("invoke called with arg[0] %lx,\n  instance %lx,\n  browserFuncs %lx\n arg[1] %s\n",
    (long unsigned)NPVARIANT_TO_OBJECT(args[0]), (long unsigned)instance, (long unsigned)sBrowserFuncs, NPVARIANT_TO_STRING(args[1]));

  if (name == sZId)
  {
    char *s = DuplicateString("nice day");

    if (!s)
      return false;

    STRINGZ_TO_NPVARIANT(s, *result);
    return true;
  }

  if (name == sScanMDNSId)
  {
    if (argCount != 1 || !NPVARIANT_IS_OBJECT(args[0]))
      return false;

    if (scan_avahi(sBrowserFuncs, instance, avahi_notify, NPVARIANT_TO_OBJECT(args[0])))
      return false;

    return true;
  }

  if (name == sScanSSDPId)
  {
    if (argCount != 1 || !NPVARIANT_IS_OBJECT(args[0]))
      return false;

    if (scan_ssdp(sBrowserFuncs, instance, ssdp_notify, NPVARIANT_TO_OBJECT(args[0])))
      return false;

    return true;
  }

  if (name == sScanSLPId)
  {
    if (argCount != 1 || !NPVARIANT_IS_OBJECT(args[0]))
      return false;

    if (scan_slp(sBrowserFuncs, instance, slp_notify, NPVARIANT_TO_OBJECT(args[0])))
      return false;

    return true;
  }

  if (name == sScanBluetoothId)
  {
//    if (argCount != 1 || !NPVARIANT_IS_OBJECT(args[0]))
	  if (!NPVARIANT_IS_OBJECT(args[0]))
      return false;


    if (scan_bluetooth(sBrowserFuncs, instance, bluetooth_notify, NPVARIANT_TO_OBJECT(args[0]), NPVARIANT_TO_STRING(args[1])))
      return false;

    return true;
  }

  if (name == sScanUsbId)
  {
    if (argCount != 1 || !NPVARIANT_IS_OBJECT(args[0]))
      return false;

    if (scan_usb(sBrowserFuncs, instance, NPVARIANT_TO_OBJECT(args[0])))
      return false;

    return true;
  }

  return false;
}

// the plugin object's default function, i.e. what gets called
// if you treat the plugin's script object as a function
bool InvokeDefault(NPObject *obj,
            const NPVariant *args, uint32_t argCount, NPVariant *result)
{
  char *s = DuplicateString("nice morning");

  if (!s)
    return false;

  STRINGZ_TO_NPVARIANT(s, *result);
  return true;
}

