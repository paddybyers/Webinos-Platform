/*
 * ziran.sun@samsung.com
 */

#include <stdio.h>
#include <stdlib.h>
#include <assert.h>
#include <unistd.h>
#include <sys/socket.h>
#include <pthread.h>

#include <bluetooth/bluetooth.h>
#include <bluetooth/hci.h>
#include <bluetooth/hci_lib.h>

#include <bluetooth/sdp.h>
#include <bluetooth/sdp_lib.h>

#include "WebinosPlugin.h"

typedef void *(*ThreadFn) (void *arg);

int hci_inquiry(int dev_id, int len, int num_rsp,
                const uint8_t *lap, inquiry_info **ii, long flags);

typedef struct {
  NPNetscapeFuncs *browserFuncs;
  NPP instance;
  NPObject *object;
  PluginAsyncCall proxy;
  pthread_t thread;
  char* serv_class_ID;

} BTContext;

typedef struct {
  inquiry_info *ii;
  int dev_id;
  int num_rsp;
  int sock;
}BTDevice;

static char* toCString(const NPString string)
{
  char* result = (char*)(malloc(string.UTF8Length + 1));
  memcpy(result, string.UTF8Characters, string.UTF8Length);
  result[string.UTF8Length] = '\0';

  return result;
}

static BTDevice scan_device(void)
{
  BTDevice bt_dev;

  bt_dev.dev_id = hci_get_route(NULL);
  bt_dev.sock = hci_open_dev( bt_dev.dev_id );

  if (bt_dev.dev_id < 0 || bt_dev.sock < 0)
  {
    perror("opening bluetooth socket");
    printf("bluetooth: releasing object\n");
  }

  int len  = 4;  // search time is len * 1.28 seconds
  int max_rsp = 255; // max number of devices to report
  int flags = IREQ_CACHE_FLUSH;

  bt_dev.ii = (inquiry_info*)malloc(max_rsp * sizeof(inquiry_info));
  assert(bt_dev.ii);

  // okay fire up the bluetooth scan for len * 1.28 seconds
  // or 255 devices, whichever happens soonest
  bt_dev.num_rsp = hci_inquiry(bt_dev.dev_id, len, max_rsp, NULL, &bt_dev.ii, flags);
  printf("found %d bluetooth devices\n", bt_dev.num_rsp);
  return bt_dev;
}

static void scan(BTContext *context)
{
  char dev_addr[19] = { 0 };  // device address as string
  char dev_name[248] = { 0 }; // device name

  uuid_t svc_uuid;
  int err;
  bdaddr_t target;
  sdp_list_t *response_list = NULL, *search_list, *attrid_list;
  sdp_session_t *session = 0;
  uint32_t class = 0;
  int i;

  BTDevice bt_dev = scan_device();

  for (i = 0; i < bt_dev.num_rsp; i++)
  {
    target = (bt_dev.ii+i)->bdaddr;

    if (!strncasecmp(context->serv_class_ID, "0x", 2))
    {
      int num;
	  /* This is a UUID16, just convert to int */
	  sscanf(context->serv_class_ID + 2, "%X", &num);
	  class = num;
    }

    if (class)
    {
	  if (class & 0xffff0000)
	  {
	    sdp_uuid32_create(&svc_uuid, class);
		printf("Creating a 32 bit uuid\n");
	  }
	  else
	  {
		uint16_t class16 = class & 0xffff;
		sdp_uuid16_create(&svc_uuid, class16);
	  }
    }
    else
      printf("service class is not correct)\n");

    // connect to the SDP server running on the remote machine

    session = sdp_connect( BDADDR_ANY, &target, SDP_RETRY_IF_BUSY );
    if (session == (sdp_session_t *)NULL)
    {
      printf("couldn't find device\n");
    }

    search_list = sdp_list_append( NULL, &svc_uuid );

    // specify that we want a list of all the matching applications' attributes
    uint32_t range = 0x0000ffff;
    attrid_list = sdp_list_append( NULL, &range );

    // get a list of service records that have the specified UUID, e.g. 0x1106
    err = sdp_service_search_attr_req( session, search_list, \
    SDP_ATTR_REQ_RANGE, attrid_list, &response_list);

    sdp_list_t *r = response_list;

    // go through each of the service records
    for (; r; r = r->next )
    {
	  ba2str(&(bt_dev.ii+i)->bdaddr, dev_addr);
	  strcpy(dev_name, "[unknown]");

      if(hci_read_remote_name(bt_dev.sock, &(bt_dev.ii+i)->bdaddr,
		 sizeof(dev_name)-1, dev_name, 0) < 0);

      sdp_record_t *rec = (sdp_record_t*) r->data;
      sdp_record_print(rec);
      printf("Service RecHandle: 0x%x\n", rec->handle);

      sdp_list_t *proto_list;

	  // get a list of the protocol sequences
	  if( sdp_get_access_protos( rec, &proto_list ) == 0 )
	  {
        sdp_list_t *p = proto_list;

        // go through each protocol sequence
        for( ; p ; p = p->next )
        {
          sdp_list_t *pds = (sdp_list_t*)p->data;

          // go through each protocol list of the protocol sequence
          for( ; pds ; pds = pds->next )
          {
            // check the protocol attributes
            sdp_data_t *d = (sdp_data_t*)pds->data;
            int proto = 0;
            for( ; d; d = d->next )
            {
              switch( d->dtd )
              {
                case SDP_UUID16:
                case SDP_UUID32:
                case SDP_UUID128:
                  proto = sdp_uuid_to_proto( &d->val.uuid );

                break;
                case SDP_UINT8:
                  if( proto == RFCOMM_UUID )
                    printf("rfcomm channel: %d\n",d->val.int8);
                break;
              }
            }
          }
          sdp_list_free( (sdp_list_t*)p->data, 0 );
        }
        sdp_list_free( proto_list, 0 );
      }

      printf("found service record 0x%x\n", rec->handle);
      BlueToothData *sdata = (BlueToothData *)calloc(1, sizeof(BlueToothData));
      assert(sdata);

      sdata->instance = context->instance;
      sdata->object = context->object;

      sdata->address = strdup(dev_addr);
      assert(sdata->address);

      sdata->name = strdup(dev_name);
      assert(sdata->name);

      sdata->dev_class[0] = (bt_dev.ii+i)->dev_class[0];
      sdata->dev_class[1] = (bt_dev.ii+i)->dev_class[1];
      sdata->dev_class[2] = (bt_dev.ii+i)->dev_class[2];

      // released after making proxied call to web page script
      context->browserFuncs->retainobject(sdata->object);
      context->browserFuncs->pluginthreadasynccall(context->instance,
      context->proxy, sdata);
      sdp_record_free( rec );
    }

    sdp_close(session);
  }
  // matches retainObject in scan_bluetooth()
  context->browserFuncs->releaseobject(context->object);
  free(context);

  free( bt_dev.ii );
  close(bt_dev.sock);
}

int scan_bluetooth(NPNetscapeFuncs *browserFuncs, NPP instance,
                   PluginAsyncCall proxy, NPObject *object, NPString serv_class_ID)

{
  BTContext *context = (BTContext *)malloc(sizeof(BTContext));
  assert(context);

  context->browserFuncs = browserFuncs;
  context->instance = instance;
  context->proxy = proxy;
  context->object = object;
  browserFuncs->retainobject(object);


  context->serv_class_ID = toCString(serv_class_ID);
  pthread_t *pthread = &(context->thread);
  return pthread_create(pthread, NULL, (ThreadFn)scan, (void *)context);
}
