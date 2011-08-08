/*
 *      avahi-based mDNS support for webinos discovery plugin
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

#include <stdio.h>
#include <assert.h>
#include <stdlib.h>
#include <stdarg.h>
#include <unistd.h>
#include <errno.h>
#include <string.h>
#include <net/if.h>

#include <avahi-common/gccmacro.h>
#include <avahi-common/timeval.h>
#include <avahi-common/error.h>
#include <avahi-common/malloc.h>
#include <avahi-common/thread-watch.h>
#include <avahi-client/client.h>
#include <avahi-client/lookup.h>

#include "WebinosPlugin.h"

// the stdb.h include file was installed, so declare this here
//const char* stdb_lookup(const char *name);

typedef struct {
  NPNetscapeFuncs *browserFuncs;
  NPP instance;
  NPObject *object;
  PluginAsyncCall proxy;
  const AvahiPoll *api;
  AvahiThreadedPoll *threaded_poll;
  AvahiClient *client;
} AvahiContext;

static void resolve_callback(
    AvahiServiceResolver *r,
    AvahiIfIndex interface,
    AvahiProtocol protocol,
    AvahiResolverEvent event,
    const char *name,
    const char *type,
    const char *domain,
    const char *host_name,
    const AvahiAddress *address,
    uint16_t port,
    AvahiStringList *txt,
    AvahiLookupResultFlags flags,
    void* userdata)
{
  AvahiContext *context = (AvahiContext *)userdata;
  assert(r);

  // Called whenever a service has been resolved successfully or timed out

  switch (event)
  {
    case AVAHI_RESOLVER_FAILURE:
      fprintf(stderr,
        "(Resolver) Failed to resolve service '%s' of type '%s' in domain '%s': %s\n",
        name, type, domain,
        avahi_strerror(avahi_client_errno(avahi_service_resolver_get_client(r))));
      break;

    case AVAHI_RESOLVER_FOUND:
    {
      char a[AVAHI_ADDRESS_STR_MAX], *t;
     // const char *pretty_type = stdb_lookup(type);
      const char *pretty_type = type;
      char ifname[IFNAMSIZ];

      if (!(if_indextoname(interface, ifname)))
        snprintf(ifname, sizeof(ifname), "%i", interface);

      fprintf(stderr, "Service '%s' of type '%s' in domain '%s':\n", name, type, domain);

      avahi_address_snprint(a, sizeof(a), address);
      t = avahi_string_list_to_string(txt);

      fprintf(stderr,
              "\t%s:%u (%s)\n"
              "\tTXT=%s\n",
              host_name, port, a, t);

      AvahiData *sdata = (AvahiData *)malloc(sizeof(AvahiData));
      assert(sdata);
      sdata->instance = context->instance;
      sdata->object = context->object;
      sdata->name = strdup(name);
      sdata->type = strdup(type);
      sdata->nice = strdup(pretty_type);
      sdata->iface = strdup(ifname);
      sdata->ipv6 = (protocol == AVAHI_PROTO_INET ? false : true);
      sdata->address = strdup(a);
      sdata->port = port;
      sdata->txt = t ? strdup(t) : NULL;

      avahi_free(t);
      assert(context->browserFuncs);
      assert(context->proxy);
      assert(context->browserFuncs->pluginthreadasynccall);

      // released after making proxied call to web page script
      context->browserFuncs->retainobject(sdata->object);
      context->browserFuncs->pluginthreadasynccall(context->instance, context->proxy, sdata);
    }
  }

  avahi_service_resolver_free(r);
}

static void browse_callback(
    AvahiServiceBrowser *b,
    AvahiIfIndex interface,
    AvahiProtocol protocol,
    AvahiBrowserEvent event,
    const char *name,
    const char *type,
    const char *domain,
    AVAHI_GCC_UNUSED AvahiLookupResultFlags flags,
    void* userdata)
{
  AvahiContext *context = (AvahiContext *)userdata;
  assert(context);
  AvahiClient *c = context->client;
  assert(b);
  assert(c);

  // Called whenever a new services becomes available on the LAN or is removed from the LAN

  switch (event)
  {
    case AVAHI_BROWSER_FAILURE:

      fprintf(stderr, "(Browser) %s\n",
        avahi_strerror(avahi_client_errno(avahi_service_browser_get_client(b))));
      avahi_threaded_poll_quit(context->threaded_poll);
      return;

    case AVAHI_BROWSER_NEW:
    {
//#if 0
      const char *pretty_type = NULL;
      char ifname[IFNAMSIZ];

      if (!(if_indextoname(interface, ifname)))
        snprintf(ifname, sizeof(ifname), "%i", interface);

      if (!pretty_type)
      {
//#if defined(HAVE_GDBM) || defined(HAVE_DBM)
      //  pretty_type = stdb_lookup(type);
	pretty_type = type;

//#else
//        pretty_type = type;
//#endif
      }

      fprintf(stderr,
        "ADD: service '%s' of type '%s' in domain '%s' via %s %s\n",
        name, pretty_type, domain, ifname, protocol == AVAHI_PROTO_INET ? "IPv4" : "IPv6");
//#endif
       // We ignore the returned resolver object. In the callback
       // function we free it. If the server is terminated before
       // the callback function is called the server will free
       // the resolver for us.
//#if 0
      if (!(avahi_service_resolver_new(c, interface, protocol, name,
           type, domain, AVAHI_PROTO_UNSPEC, 0, resolve_callback, userdata)))
      {
        fprintf(stderr, "Failed to resolve service '%s': %s\n",
           name, avahi_strerror(avahi_client_errno(c)));
      }
//#endif
      }
      break;

    case AVAHI_BROWSER_REMOVE:
      fprintf(stderr,
        "REMOVE: service '%s' of type '%s' in domain '%s'\n",
        name, type, domain);

      break;
    case AVAHI_BROWSER_ALL_FOR_NOW:
    case AVAHI_BROWSER_CACHE_EXHAUSTED:
#if 0
      fprintf(stderr, "(Browser) %s\n",
        event == AVAHI_BROWSER_CACHE_EXHAUSTED ?
                    "CACHE_EXHAUSTED" : "ALL_FOR_NOW");go_between
#endif
      break;
  }
}

int set_browse_service_types(AvahiContext *context, const char *type, ...)
{
  int ret = 0;
  va_list ap;
  const char *service = type;
  AvahiServiceBrowser *sb;
  assert(context);

  va_start(ap, type);

  do
  {
    sb = avahi_service_browser_new(context->client,
           AVAHI_IF_UNSPEC,
           AVAHI_PROTO_UNSPEC,
           service,
           NULL,
           0,
           browse_callback,
           context);

     if (!sb)
     {
       fprintf(stderr, "Failed to create service browser: %s\n",
               avahi_strerror(avahi_client_errno(context->client)));
       ret = 1;
       break;
     }     
  }
  while ((service = va_arg(ap, const char *)));

  va_end(ap);
  return ret;
}

static void callback(AvahiWatch *w, int fd,
          AvahiWatchEvent event, void *userdata)
{
  if (event & AVAHI_WATCH_IN)
  {
    AvahiContext *context = (AvahiContext *)userdata;
    ssize_t r;
    char c;

    if ((r = read(fd, &c, 1)) <= 0) 
    {
      fprintf(stderr, "read() failed: %s\n", r < 0 ? strerror(errno) : "EOF");
      context->api->watch_free(w);
      return;
    }

    printf("Read: %c\n", c >= 32 && c < 127 ? c : '.');
  }
}

static void wakeup(AvahiTimeout *t, AVAHI_GCC_UNUSED void *userdata)
{
  static int i = 0;
  struct timeval tv;
  AvahiContext *context = (AvahiContext *)userdata;

  if (i > 3)
  {
    // clean up and quit thread after 3 seconds
    avahi_threaded_poll_quit(context->threaded_poll);
    context->browserFuncs->releaseobject(context->object);
    free(context);
  }
  else
  {
    avahi_elapse_time(&tv, 1000, 0);
    context->api->timeout_update(t, &tv);
  }
}

static void client_callback(AvahiClient *c, AvahiClientState state,
                            void * userdata)
{
  AvahiContext *context = (AvahiContext *)userdata;
  assert(c);

  // Called whenever the client or server state changes

  if (state == AVAHI_CLIENT_FAILURE)
  {
    fprintf(stderr, "Server connection failure: %s\n",
      avahi_strerror(avahi_client_errno(c)));
    avahi_threaded_poll_quit(context->threaded_poll);
    }
}

int scan_avahi(NPNetscapeFuncs *browserFuncs, NPP instance, PluginAsyncCall proxy, NPObject *object)
{
  struct timeval tv;
  int error;
  AvahiContext *context = (AvahiContext *)malloc(sizeof(AvahiContext));
  assert(context);

  context->browserFuncs = browserFuncs;
  context->instance = instance;
  context->proxy = proxy;
  context->object = object;
  browserFuncs->retainobject(object);

  // create threaded poll object
  context->threaded_poll = avahi_threaded_poll_new();
  assert(context->threaded_poll);

  context->api = avahi_threaded_poll_get(context->threaded_poll);
  assert(context->api);

  context->api->watch_new(context->api, 0, AVAHI_WATCH_IN, callback, context);

  avahi_elapse_time(&tv, 1000, 0);
  context->api->timeout_new(context->api, &tv, wakeup, context);

  context->client = avahi_client_new(context->api, 0, client_callback, context, &error);

  if (!context->client)
  {
    fprintf(stderr, "Failed to create client: %s\n", avahi_strerror(error));

    // free threaded poll object
    avahi_threaded_poll_free(context->threaded_poll);
    browserFuncs->releaseobject(object);
    return 1;

  }

  if (set_browse_service_types(context, 
         "_rfb._tcp", "_ssh._tcp",
         "_http._tcp", "_https._tcp",
         "_presence._tcp", "_ipp._tcp",
         "_workstation._tcp",  NULL))
  {
    fprintf(stderr, "set_browse_service_types failed\n");

    // free threaded poll object
    avahi_threaded_poll_free(context->threaded_poll);
    browserFuncs->releaseobject(object);
    return 1;
  }

  avahi_threaded_poll_start(context->threaded_poll);

  printf("avahi worker thread launched\n");
  return 0;
}
