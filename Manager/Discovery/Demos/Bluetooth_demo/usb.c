/*
 *      USB support for webinos discovery plugin
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
#include <stdlib.h>
#include <assert.h>
#include <string.h>
#include <dirent.h>
#include <ctype.h>
#include <errno.h>
#include <unistd.h>
#include <sys/types.h>
#include <sys/stat.h>

#ifndef __cplusplus

#ifndef WS_BOOL
#define WS_BOOL
typedef enum { false, true } bool;
#define null (void *)0
#endif

#endif

#include "WebinosPlugin.h"
#include "rbtree.h"


typedef struct {
  NPNetscapeFuncs *browserFuncs;
  NPP instance;
  NPObject *object;
} UsbContext;


typedef struct _usbdev {
  unsigned long vendnum;
  unsigned long prodnum;
  struct _usbdev *next;
} UsbDevice;

typedef struct {
  char *name;
  RbTree products;
} UsbVendor;

static RbTree *vendors;

/*
 As a simple demo, I could search the directory tree for 
 directories with idVendor, idProduct, and report the 
 description from "usb.ids". Note that product id's are missing 
 for some of the vendors, but a fallback is to use the device 
 class in bDeviceClass.

 Start in /sys/bus/usb/devices and look for directory names
 without a colom.

 for now map usb.ids to c file, but later think about
 way to periodically refresh the file from website.

 num -> vendor
        vendor -> name, num -> prod name

 How to include a text file as a big string in a C build?

*/

static void update_vendor(RbNode *node, RbValue value)
{
  UsbVendor *vendor = (UsbVendor *)node->value;

  if (vendor->name)
    free(vendor->name);

  rbTreeFreeEmbedded(&vendor->products);
  free(vendor);

  node->value = value;
}

static void  erase_vendor(RbKey key, RbValue value)
{
  UsbVendor *vendor = (UsbVendor *)value;

  if (vendor->name)
    free(vendor->name);

  rbTreeFreeEmbedded(&vendor->products);
  free(vendor);
}

static void new_product(RbNode *node, RbKey key, RbValue value)
{
  node->key = key;
  node->value = (RbValue)strdup((char *)value);
  assert(node->value);
}

static void update_product(RbNode *node, RbValue value)
{
  char *product = (char *)node->value;

  if (product)
    free(product);

  node->value = (RbValue)strdup((char *)value);
  assert(node->value);
}

static void  erase_product(RbKey key, RbValue value)
{
  if (value)
    free(value);
}

static int compare_keys(RbKey key1, RbKey key2)
{
  if ((unsigned long)key1 == (unsigned long)key2)
    return 0;

  if ((unsigned long)key1 < (unsigned long)key2)
    return -1;

  return 1;
}

static UsbVendor *find_vendor(unsigned long vendor_num)
{
  return (UsbVendor *)rbTreeFindKey(vendors, (RbKey)vendor_num);
}

static UsbVendor *add_vendor(unsigned long vendor_num, char *name)
{
  UsbVendor *vendor = (UsbVendor *)malloc(sizeof(UsbVendor));
  assert(vendor);
  vendor->name = strdup(name);
  assert(vendor->name);

  rbTreeNewEmbedded(&vendor->products, new_product, update_product,
                                       erase_product, compare_keys);

  if (!vendors)
    vendors = rbTreeNew(NULL, update_vendor, erase_vendor, compare_keys);

  rbTreeInsertKey(vendors, (RbKey)vendor_num, (RbValue)vendor);
  return vendor;
}

static void add_product(UsbVendor *vendor, unsigned long prod_num, char *name)
{
  assert(vendor);
  rbTreeInsertKey(&vendor->products, (RbKey)prod_num, (RbValue)name);
}

static char *find_product(unsigned long vendor_num, unsigned long prod_num)
{
  UsbVendor *vendor = find_vendor(vendor_num);
  
  if (vendor)
    return (char *)rbTreeFindKey(&vendor->products, (RbKey)prod_num);

  return null;
}

// should be called by plugin when it is being shut down
void erase_usb_vendors()
{
  rbTreeFree(vendors);
}

static int read_line(FILE *fp, char **pbuf, size_t *plen)
{
  int c, count = 0;
  size_t size = 0;

  while ((c = getc(fp)) != -1)
  {
    if (*plen - size < 512)
    {
      if (*plen == 0)
        *plen = 512;

      while (*plen - size < 512)
        *plen <<= 1;

      *pbuf = realloc(*pbuf, *plen);
      assert(*pbuf);
    }

    ++count;

    if (c == '\r' || c == '\n')
    {
      if (c == '\r')
        c = getc(fp);

      (*pbuf)[size] = '\0';
      break;
    }

    (*pbuf)[size++] = c;
  }

  return count;
}

int init_usb_vendors(char *path)
{
  char *line = NULL;
  size_t len = 0;
  UsbVendor *vendor;
  unsigned long vendor_num, prod_num;
  FILE *fp = fopen(path, "r");

  if (!fp)
  {
    perror("couldn't open usb.ids");
    return -1;
  }

  vendors = NULL;

  while (read_line(fp, &line, &len))
  {
    int c = line[0];

    if (vendor && c == '\t' && line[1] != '\t')
    {
      sscanf(line+1, "%lx", &prod_num);
      add_product(vendor, prod_num, line+7);
    }
    else if (('0' <= c && c <= '9') || ('a' <= c && c <= 'f'))
    {
       // 4 digit hex vendor id, 2 spaces, vendor name
       sscanf(line, "%lx", &vendor_num);
       vendor = add_vendor(vendor_num, line+6);
    }
  }

  if (line)
    free(line);

  fclose(fp);
  return 0;
}

static bool new_device(UsbDevice **devices, unsigned long vendnum, unsigned long prodnum)
{
  UsbDevice *device = *devices;

  while (device)
  {
    if (device->vendnum == vendnum && device->prodnum == prodnum)
      return false;

    device = device->next;
  }

  // new so insert in list
  device = (UsbDevice *)malloc(sizeof(UsbDevice));
  assert(device);
  device->vendnum = vendnum;
  device->prodnum = prodnum;
  device->next = *devices;
  *devices = device;
  return true;
}

static void free_devices(UsbDevice *device)
{
  while (device)
  {
    UsbDevice *next = device->next;
    free(device);
    device = next;
  }
}

static bool is_dir(const char *path)
{
  struct stat statbuf;

  if (stat(path, &statbuf))
  {
    perror("couldn't stat path");
    return false;
  }

  return S_ISDIR(statbuf.st_mode);
}

static char *get_path(const char *dir, char *name)
{
  size_t len = strlen(dir);
  char *path = (char *)malloc(len + strlen(name) + 2);
  assert(path);
  strcpy(path, dir);
  path[len] = '/';
  strcpy(path+len+1, name);

  return path;
}

static bool file_to_num(const char *path, unsigned long *num)
{
  FILE *fp = fopen(path, "r");

  if (!fp)
  {
    perror("couldn't open file");
    return false;
  }

  int count = fscanf(fp, "%lx", num);

  fclose(fp);
  return count ? true : false;
}

static void usb_notify(UsbContext *context, long unsigned vendnum,
 long unsigned prodnum, long unsigned devclass, char *desc)
{
  fprintf(stderr, "** usb notify\n");

  char id[16];
  NPVariant result;
  NPVariant address;
  NPVariant dclass;
  NPVariant name;

  sprintf(id, "%4.4lx:%4.4lx", vendnum, prodnum);

  STRINGZ_TO_NPVARIANT(id, address);
  STRINGZ_TO_NPVARIANT(desc, name);

  INT32_TO_NPVARIANT((int32_t)devclass, dclass);
  NPObject *object = context->object;
  NPVariant args[] = { address, dclass, name };
  NPIdentifier methodId = context->browserFuncs->getstringidentifier("usb");

  context->browserFuncs->invoke(context->instance, object, methodId, args,
           sizeof(args) / sizeof(args[0]), &result);
}


static int scan_devices(const char *dir, UsbDevice **devices, UsbContext *context)
{
  unsigned long busnum = 0;
  unsigned long vendnum = 0;
  unsigned long prodnum = 0;
  unsigned long devclass = 0;
  unsigned long devsubclass = 0;
  unsigned long devnum = 0;

  struct dirent *de;
  DIR *dp = opendir(dir);

  if (!dp)
  {
    //perror("can't open directory");
    return -1;
  }

  while ((de = readdir(dp)))
  {
    char *name = de->d_name;
    if (!strcmp(name, ".") || !strcmp(name, ".."))
      continue;

    char *path = get_path(dir, name);

    if (isdigit(name[0]) && !strchr(path, ':') && is_dir(path))
      scan_devices(path, devices, context);
    else if (!strcmp(name, "idVendor"))
      file_to_num(path, &vendnum);
    else if (!strcmp(name, "idProduct"))
      file_to_num(path, &prodnum);
    else if (!strcmp(name, "bDeviceClass"))
      file_to_num(path, &devclass);
    else if (!strcmp(name, "bDeviceSubClass"))
      file_to_num(path, &devsubclass);
    else if (!strcmp(name, "devnum"))
      file_to_num(path, &devnum);
    else if (!strcmp(name, "busnum"))
      file_to_num(path, &busnum);

    free(path);  
  }

  if ((vendnum || prodnum) && new_device(devices, vendnum, prodnum))
  {
    
    char *desc = find_product(vendnum, prodnum);

    if (!desc)
      desc = "unknown";

    printf("%4.4lx:%4.4lx %lu %s\n", vendnum, prodnum, devclass, desc);
    usb_notify(context, vendnum, prodnum, devclass, desc);
  }

  closedir(dp);
  return 0;
}

int scan_usb(NPNetscapeFuncs *browserFuncs, NPP instance, NPObject *object)
{
  UsbContext context;

  context.browserFuncs = browserFuncs;
  context.instance = instance;
  context.object = object;
  UsbDevice *devices = NULL;

  if (init_usb_vendors("/tmp/usb.ids"))
    return 1;

  scan_devices("/sys/bus/usb/devices", &devices, &context);
  free_devices(devices);
  erase_usb_vendors();
  return 0;
}

