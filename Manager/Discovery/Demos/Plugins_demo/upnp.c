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


#include <stdlib.h>
#include <unistd.h>
#include <assert.h>
#include <sys/select.h>
#include <sys/time.h>
#include <sys/socket.h>
#include <netinet/in.h>
#include <arpa/inet.h>
#include <netdb.h>
#include <stdio.h>
#include <pthread.h>
#include <string.h>

char *strcasestr(const char *haystack, const char *needle);

#include "WebinosPlugin.h"

/*
  scan_ssdp launches a thread to discover UPnP devices by sending
  SSDP M-SEARCH message over multicast UDP to 239.255.255.250:1900
  It then listens for unicast responses and multicast notifications.
  When a new Location is seen, a further thread is launched to
  retrieve the XML document describing the device's services.
  This is then passed back to the web page script via the browser's
  pluginthreadasynccall which calls the plugin on the UI thread,
  triggering a call back to the web page.
*/

 
#define RESPONSE_BUFFER_LEN 1024
#define SSDP_MULTICAST      "239.255.255.250"
#define SSDP_PORT           1900

typedef void *(*ThreadFn) (void *arg);

typedef struct _loc_list {
  char *loc;
  struct _loc_list *next;
} SSDPLocList;

typedef struct {
  NPNetscapeFuncs *browserFuncs;
  NPP instance;
  NPObject *object;
  PluginAsyncCall proxy;
  pthread_t thread;
  SSDPLocList *list;
  char *loc;
} SSDPContext;

// minimal HTTP client to pull device description
// and then deliver it on to the browser
static void fetch_description(SSDPContext *context)
{
  int sockfd = -1, portno = 80, n;
  struct sockaddr_in serveraddr;
  struct hostent *server;
  char *hostname, *buf = NULL;;
  struct timeval timeout;
  fd_set fds;
  ssize_t ret;

  printf("fetching description from location %s\n", context->loc);

  char *url = context->loc; // e.g. http://192.168.1.1:80/igd.xml

  hostname = strstr(url, "//");
  
  if (!hostname)
  {
    fprintf(stderr, "ERROR bad url %s", url);
    goto error_exit;
  }

  hostname += 2;

  char *path = strchr(hostname, '/');
  
  if (!path)
  {
    fprintf(stderr, "ERROR bad url %s", url);
    goto error_exit;
  }

  *path = '\0';
  ++path;

  char *port = strchr(hostname, ':');

  if (port)
  {
    sscanf(port+1, "%d", &portno);
    *port = '\0';
  }

  sockfd = socket(AF_INET, SOCK_STREAM, 0);

  if (sockfd < 0)
  {
    fprintf(stderr, "ERROR opening socket");
    goto error_exit;
  }

  server = gethostbyname(hostname);

  if (server == NULL)
  {
    fprintf(stderr,"ERROR, no such host as %s\n", hostname);
    goto error_exit;
  }

  // build the server's Internet address */
  bzero((char *) &serveraddr, sizeof(serveraddr));
  serveraddr.sin_family = AF_INET;
  bcopy((char *)server->h_addr, 
  (char *)&serveraddr.sin_addr.s_addr, server->h_length);
  serveraddr.sin_port = htons(portno);

  // connect: create a connection with the server */
  if (connect(sockfd, (const struct sockaddr *)&serveraddr, sizeof(serveraddr)) < 0)
  {
    fprintf(stderr, "ERROR connecting to %s\n", hostname);
    goto error_exit;
  }

  size_t bufsize = 8192, len = 0;
  buf = (char *)malloc(bufsize);
  assert(buf);

  sprintf(buf,
    "GET /%s HTTP/1.1\r\n"
    "Host: %s:%d\r\n"
//    "Connection: close\r\n"
    "\r\n", path, hostname, portno);

  len = strlen(buf);
  char *p = buf;
  
  FD_ZERO(&fds);
  FD_SET(sockfd, &fds);
  timeout.tv_sec = 10;
  timeout.tv_usec = 0;

  // enter loop listening for unicast and multicast responses
  while ((ret = select(sockfd+1, NULL, &fds, NULL, &timeout)) != 0)
  {
    if (ret < 0)
    {
      perror("select");
      goto error_exit;
    }

    if (!FD_ISSET(sockfd, &fds))
    {
      perror("FD_ISSET");
      goto error_exit;
    }

    printf("about to write request to %s:%d\n%s\n", hostname, portno, buf);

    if ((n = write(sockfd, p, len)) <= 0)
    {
      perror("write");
      goto error_exit;
    }

    p += n;
    len -= n;

    if (len >= 0)
    {
      printf("sent http request\n");
      break;
    }
  }

  // indicate there is no further data to send to server
  //shutdown(sockfd, 1);

  // now read response into expanding buffer

  len = 0;
  buf[len] = '\0';

  FD_ZERO(&fds);
  FD_SET(sockfd, &fds);
  timeout.tv_sec = 10;
  timeout.tv_usec = 0;

  // enter loop listening for unicast and multicast responses
  while ((ret = select(sockfd+1, &fds, NULL, NULL, &timeout)) != 0)
  {
    n = -1;

    if (ret < 0)
    {
      perror("error: select");
      break;
    }

    if (!FD_ISSET(sockfd, &fds))
    {
      printf("error: no ssdp response\n");
      break;
    }

    if (bufsize - len < 1024)
    {
      bufsize <<= 1;
      buf = realloc(buf, bufsize);
      assert(buf);
    }

    printf("about to read from %s:%d\n", hostname, portno);
    n = read(sockfd, buf+len, bufsize-len-1);
    printf("read %d bytes from %s:%d\n", n, hostname, portno);

    if (n <= 0)
      break;

    len += n;
    buf[len] = '\0';
    printf("read %u bytes (%d)\n%s\n", n, (unsigned)len, buf);
  }

  printf("n = %d\n", n);

  if (len > 0)
  {
    printf("%s\n", buf);
    SSDPData *sdata = (SSDPData *)malloc(sizeof(SSDPData));
    assert(sdata);

    sdata->instance = context->instance;
    sdata->object = context->object;
    sdata->address = strdup(hostname);
    assert(sdata->address);
    sdata->port = portno;

    char *p = strstr(buf, "\r\n\r\n");
    assert(p);
    sdata->description = strdup(p+4);
    assert(sdata->description);
    
    // released after making proxied call to web page script
    context->browserFuncs->retainobject(sdata->object);
    context->browserFuncs->pluginthreadasynccall(context->instance, context->proxy, sdata);
  }

 error_exit:  // one place to clean up when we're done

  if (sockfd >= 0)
    close(sockfd);

  if (buf)
    free(buf);

  free(context->loc);
  free(context);
}

static void check_location(char *loc, SSDPContext *context)
{
  printf("found UPnP device with location %s\n", loc);

  SSDPContext *my_context = (SSDPContext *)calloc(1, sizeof(SSDPContext));
  assert(my_context);

  memcpy(my_context, context, sizeof(SSDPContext));
  my_context->loc = loc;  // should free along with context
  my_context->list = NULL;   // not used here

  pthread_t *pthread = &(my_context->thread);
  assert(!pthread_create(pthread, NULL, (ThreadFn)fetch_description, my_context));
}

static void scan(SSDPContext *context)
{
  int sock;
  ssize_t ret;
  SSDPLocList *list;
  unsigned int from_len;
  struct sockaddr_in sockname;
  struct sockaddr_in mc_addr;
  struct sockaddr_in from_addr;
  struct hostent *hostname;
  char data[] = 
    "M-SEARCH * HTTP/1.1\r\n"
    "Host: 239.255.255.250\r\n"
    "Man: \"ssdp:discover\"\r\n"
//    "ST:upnp:rootdevice\r\n"
    "ST:ssdp:all\r\n"
//    "ST:urn:www.pwg.org/schemas/ps/0.95:device:pwg-psitd:95\r\n"
    "MX:3\r\n"
    "\r\n";
  char buffer[RESPONSE_BUFFER_LEN];
  unsigned int recv_len = RESPONSE_BUFFER_LEN;
  struct timeval timeout;
  fd_set fds;

  printf("starting to scan for UPnP devices\n");
    
  if ((sock = socket(PF_INET, SOCK_DGRAM, IPPROTO_UDP)) == -1)
  {
    perror("error: socket() failed");
    goto exit_scan;
  }

  // optional - check ttl, should be 1
  unsigned char ttl;  // max hop count
  socklen_t ttl_size = sizeof(ttl);

  if ((getsockopt(sock, IPPROTO_IP, IP_MULTICAST_TTL,
                  &ttl, &ttl_size)) < 0)
  {
    perror("error: getting ttl");
    goto exit_scan;
  }
  printf("max hop count = %u\n", (unsigned) ttl);

  // disable loopback of multicast packets
  unsigned char loopback = 0;

  if ((setsockopt(sock, IPPROTO_IP, IP_MULTICAST_LOOP,
                  &loopback, sizeof(loopback))) < 0)
  {
    perror("error: disabling loopback");
    goto exit_scan;
  }

  printf("multicast loopback disabled\n");

  int flag = 1;

  if ((setsockopt(sock, SOL_SOCKET, SO_REUSEADDR,
                  &flag, sizeof(flag))) < 0)
  {
    perror("error: enabling address reuse");
    goto exit_scan;
  }

  memset(&mc_addr, 0, sizeof(mc_addr));
  mc_addr.sin_family = AF_INET;
  mc_addr.sin_addr.s_addr = htonl(INADDR_ANY);
  mc_addr.sin_port = htons(SSDP_PORT);

  // bind multicast address to socket
  if (bind(sock, (struct sockaddr *)&mc_addr, sizeof(mc_addr)) < 0)
  {
    perror("error: bind() failed");
    goto exit_scan;
  }

  // construct and IGMP join request structure
  struct ip_mreq mc_req;

  mc_req.imr_multiaddr.s_addr = inet_addr(SSDP_MULTICAST);
  mc_req.imr_interface.s_addr = htonl(INADDR_ANY);

  // send an ADD MEMBERSHIP message via setsockopt
  if ((setsockopt(sock, IPPROTO_IP, IP_ADD_MEMBERSHIP,
                  (void *)&mc_req, sizeof(mc_req))) < 0)
  {
    perror("error: add membeship");
    goto exit_scan;
  }

  // prepare to send SSDP query as multicast datagram
  hostname = gethostbyname(SSDP_MULTICAST);
  hostname->h_addrtype = AF_INET;

  memset((char*)&sockname, 0, sizeof(struct sockaddr_in));
  sockname.sin_family = AF_INET;
  sockname.sin_port=htons(SSDP_PORT);

  sockname.sin_addr.s_addr = *((unsigned long*)(hostname->h_addr_list[0]));
  
  // and send it
  ret = sendto(sock, data, strlen(data), 0, 
               (struct sockaddr*) &sockname, sizeof(struct sockaddr_in));

  if (ret != strlen(data))
  {
    perror("error: sendto");
    goto exit_scan;
  }

  FD_ZERO(&fds);
  FD_SET(sock, &fds);
  timeout.tv_sec = 60;
  timeout.tv_usec = 0;
    printf("preparing to scan for UPnP devices\n");

  // enter loop listening for unicast and multicast responses
  while ((ret = select(sock+1, &fds, NULL, NULL, &timeout)) != 0)
  {
    if (ret < 0)
    {
      perror("error: select");
      break;
    }

    if (!FD_ISSET(sock, &fds))
    {
      printf("error: no ssdp response\n");
      break;
    }

    // clear data buffer and address
    memset(buffer, 0, RESPONSE_BUFFER_LEN);
    from_len = sizeof(from_addr);
    memset(&from_addr, 0, from_len);

    // block waiting for a packet
    if ((recv_len = recvfrom(sock, buffer, RESPONSE_BUFFER_LEN-1, 0, 
          (struct sockaddr *)&from_addr, &from_len)) < 0)
    {
      perror("error: recvfrom");
      break;
    }

    buffer[recv_len] = '\0';

    // check the HTTP response code
    if(strncmp(buffer, "NOTIFY ", 7) && strncmp(buffer, "HTTP/1.1 200 OK", 12))
    {
      perror("error: ssdp parsing ");
      printf("Received %d bytes from %s\n",
            recv_len, inet_ntoa(from_addr.sin_addr));
      printf("%s\n", buffer);
      break;
    }

    printf("Received %d bytes from %s\n",
            recv_len, inet_ntoa(from_addr.sin_addr));

    char *loc = strcasestr(buffer, "Location:");

    if (loc)
    {
      loc += strlen("Location:");
      char *p = strchr(loc, '\r');

      if (p)
        *p = '\0';
      else
      {
        p = strchr(loc, '\n');

        if (p)
          *p = '\n';
      }

      // is this a new location?

      list = context->list;

      while (list)
      {
        if (strcmp(list->loc, loc) == 0)
          break;

        list = list->next;
      }

      if (list)
        continue;

      // yes it hasn't been seen before

      list = (SSDPLocList *)malloc(sizeof(SSDPLocList));
      assert(list);

      list->loc = strdup(loc);
      assert(list->loc);
      list->next = context->list;
      context->list = list;

      // prepare to retrieve description from the location
      loc = strdup(loc);
      assert(loc);

      check_location(loc, context);
    }
    else
      printf("%s\n", buffer);
  }

  // send an DROP MEMBERSHIP message via setsockopt
  if ((setsockopt(sock, IPPROTO_IP, IP_DROP_MEMBERSHIP,
                  (void *)&mc_req, sizeof(mc_req))) < 0)
    perror("error: drop membership");

  printf("all done\n");
  close(sock);

 exit_scan:

  while (context->list)
  {
     list = context->list->next;
     free(context->list->loc);
     free(context->list);
     context->list = list;
  }

  context->browserFuncs->releaseobject(context->object);
  free(context);
}

int scan_ssdp(NPNetscapeFuncs *browserFuncs, NPP instance, PluginAsyncCall proxy, NPObject *object)
{
  printf("preparing to scan for UPnP devices\n");
  printf("scan_ssdp called with obj %lx, instance %lx\n", (long unsigned)object, (long unsigned)instance);

  SSDPContext *context = (SSDPContext *)calloc(1, sizeof(SSDPContext));
  assert(context);
  context->browserFuncs = browserFuncs;
  context->instance = instance;
  context->object = object;
  context->proxy = proxy;
  browserFuncs->retainobject(object);  

  pthread_t *pthread = &(context->thread);
  return pthread_create(pthread, NULL, (ThreadFn)scan, context);
}

