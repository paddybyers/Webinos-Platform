/*
 *      SSDP support for webinos discovery plugin
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

#define MAX_SERVICE_TYPES 16

#include <stdio.h>
#include <stdlib.h>
#include <assert.h>
#include <unistd.h>
#include <string.h>
#include <pthread.h>

#include <slp.h>
#include "WebinosPlugin.h"

typedef void *(*ThreadFn) (void *arg);

typedef struct {
  NPNetscapeFuncs *browserFuncs;
  NPP instance;
  NPObject *object;
  PluginAsyncCall proxy;
  pthread_t thread;
  char* srvtypes[MAX_SERVICE_TYPES];
} SLPContext;

SLPBoolean WebinosSLPSrvTypeCallback (SLPHandle hslp,
        const char *pcSrvTypes, SLPError errcode, void *cookie)
{
  printf("WebinosSLPSrvTypeCallback\n");
  SLPContext *context = (SLPContext *)cookie;
  char *token, *s;

  switch(errcode)
  {
    case SLP_OK:
      token = strtok((char *)pcSrvTypes, ",");
      int i = 0;

      while (token != NULL && i < MAX_SERVICE_TYPES)
      {
        s = context->srvtypes[i] = (char *)malloc(strlen(token)+1);
        assert(s);

        strcpy(s, token);
        printf("srvtype = %s\n", s);
        token = strtok (NULL, ",");
        context->srvtypes[++i] = NULL;
      }
      break;

    case SLP_LAST_CALL:
      printf("WebinosSLPSrvTypeCallback SLP_LAST_CALL\n");
      break;

    default:
      break;
  }

  return SLP_TRUE;
}

SLPBoolean WebinosSLPSrvURLCallback (SLPHandle hslp,
         const char *srvurl,
         unsigned short lifetime, SLPError errcode, void *cookie)
{
  printf("WebinosSLPSrvURLCallback\n");
  SLPContext *context = (SLPContext *)cookie;

  switch(errcode)
  {
    case SLP_OK:
      printf ("Service URL     = %s\n", srvurl);
      printf ("Service Timeout = %i\n", lifetime);

      SLPData *sdata = (SLPData *)malloc(sizeof(SLPData));
      assert(sdata);

      sdata->instance = context->instance;
      sdata->object = context->object;

      sdata->srv_url = strdup(srvurl);
      assert(sdata->srv_url);

      // released after making proxied call to web page script
      context->browserFuncs->retainobject(sdata->object);
      context->browserFuncs->pluginthreadasynccall(context->instance, context->proxy, sdata);
      break;

    case SLP_LAST_CALL:
      printf("WebinosSLPSrvURLCallback SLP_LAST_CALL\n");
      break;

    default:
      break;
  }

  return SLP_TRUE;
}

void get_slp_device_detail(SLPContext *context)
{
  int i;
  SLPError err;
  SLPHandle hslp;

  printf("get_slp_device_detail\n");

  err = SLPOpen ("en", SLP_FALSE, &hslp);

  if(err != SLP_OK)
  {
    printf ("Error %d opening slp handle\n", err);
    goto error_exit;
    return;
  }

  printf("slp: SLPOpen succeeded\n");

  err = SLPFindSrvTypes (
      hslp,
      "*", // all service types
      "",
      WebinosSLPSrvTypeCallback,
      context);

  if (err != SLP_OK)
  {
    printf ("Error %d in SLPFindSrvTypes\n", err);
    SLPClose (hslp);
    goto error_exit;
  }

  for (i = 0; (i < MAX_SERVICE_TYPES) && (context->srvtypes[i] != NULL); ++i)
  {
    printf("slp: %s\n", context->srvtypes[i]);

    err = SLPFindSrvs (
        hslp,
        context->srvtypes[i],
        "",
        "",
        WebinosSLPSrvURLCallback,
        context);

    if(err != SLP_OK)
      printf ("Error %d registering service with slp\n", err);

    free(context->srvtypes[i]);
  }

  SLPClose (hslp);

 error_exit:

  printf("freeing slp context\n");
  context->browserFuncs->releaseobject(context->object);
  free(context);
  printf("slp: all done\n");
}

int scan_slp(NPNetscapeFuncs *browserFuncs, NPP instance, PluginAsyncCall proxy, NPObject *object)
{
  SLPContext *context = (SLPContext *)calloc(1, sizeof(SLPContext));
  assert(context);

  context->browserFuncs = browserFuncs;
  context->instance = instance;
  context->proxy = proxy;
  context->object = object;
  browserFuncs->retainobject(object);

  pthread_t *pthread = &(context->thread);
  return (pthread_create(pthread, NULL, (ThreadFn)get_slp_device_detail, (void *)context));
}

