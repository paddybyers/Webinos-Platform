/*
 * ziran.sun@samsung.com
 */

#include <v8.h>
#include <node.h>
#include <csignal>
#include <string>

extern "C"{
#include <stdio.h>
#include <errno.h>
#include <fcntl.h>
#include <unistd.h>
#include <stdlib.h>
#include <signal.h>
#include <termios.h>
#include <sys/poll.h>
#include <sys/ioctl.h>
#include <sys/socket.h>
#include <assert.h>


#include <bluetooth/bluetooth.h>
#include <bluetooth/hci.h>
#include <bluetooth/hci_lib.h>
#include <bluetooth/sdp.h>
#include <bluetooth/sdp_lib.h>
#include <bluetooth/rfcomm.h>

#include <obexftp/obexftp.h>
#include <obexftp/client.h>
#include <obexftp/uuid.h>
}

using namespace node;
using namespace v8;
using namespace std;

#define MAXPATHLEN 248
#define OBEXFTP_BLUETOOTH "OBEXFTP_BLUETOOTH"
#define OBEXFTP_CHANNEL "OBEXFTP_CHANNEL"

::sig_atomic_t io_canceled_=0;
obexftp_client_t *cli = NULL;

typedef struct {
  int dev_id;
  int sock;
  int ctl; //RFCOMM socket
  int channel; // RFCOMM channel
}BTDevice;


typedef struct {
  char *address;
  char *name;
} BlueToothData;

class BTDiscovery: ObjectWrap
{
  private:

	//Persistent< Value > myval;

  public:

	static void sig_hup(int sig)
	{
		return;
	}

	static void sig_term(int sig)
	{
		io_canceled_ = 1;
	}

  static Persistent<FunctionTemplate> s_ct;


  static void Init(Handle<Object> target)
  {
    HandleScope scope;

    Local<FunctionTemplate> t = FunctionTemplate::New(New);

    s_ct = Persistent<FunctionTemplate>::New(t);
    s_ct->InstanceTemplate()->SetInternalFieldCount(1);
    s_ct->SetClassName(String::NewSymbol("BT"));

    NODE_SET_PROTOTYPE_METHOD(s_ct, "scan_device", Scan_device);

    NODE_SET_PROTOTYPE_METHOD(s_ct, "bind_device", Bind_device);

    NODE_SET_PROTOTYPE_METHOD(s_ct, "bind_all", Bind_all);

    NODE_SET_PROTOTYPE_METHOD(s_ct, "connect_device", Connect_device);
    
    NODE_SET_PROTOTYPE_METHOD(s_ct, "folder_list", Folder_list);

    NODE_SET_PROTOTYPE_METHOD(s_ct, "file_list", File_list);
    
    NODE_SET_PROTOTYPE_METHOD(s_ct, "file_transfer", File_transfer);

    target->Set(String::NewSymbol("bluetooth"), s_ct->GetFunction());
  }

  BTDiscovery()
  {
  }

  ~BTDiscovery()
  {
  }

  static Handle<Value> New(const Arguments& args)
  {
    HandleScope scope;
    BTDiscovery* bd = new BTDiscovery();
    bd->Wrap(args.This());
    return args.This();
  }

  static Handle<Value> Scan_device(const Arguments& args)
  {
    HandleScope scope;
    BTDiscovery* bd = ObjectWrap::Unwrap<BTDiscovery>(args.This());
    Local<Object> result =  Object::New();

    // Convert first argument to V8 String
    v8::String::Utf8Value v8str(args[0]);

    int cnt = 1024;
    v8::Handle<v8::Array> result1 = v8::Array::New(12);

    BTDevice bt_dev;
    int num_rsp;
    inquiry_info *ii;

    char dev_addr[19] = { 0 };  // device address as string
    char dev_name[248] = { 0 }; // device name
    char dev_name_tmp[248] = { 0 }; // device name

    uuid_t svc_uuid;
    int err;
    bdaddr_t dest;
    sdp_list_t *response_list = NULL, *search_list, *attrid_list;
    sdp_session_t *session = 0;
    uint32_t serv_class = 0;
    int i;

   //scan_device

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

    ii = (inquiry_info*)malloc(max_rsp * sizeof(inquiry_info));
    assert(ii);

    // okay fire up the bluetooth scan for len * 1.28 seconds
    // or 255 devices, whichever happens soonest
    num_rsp = hci_inquiry(bt_dev.dev_id, len, max_rsp, NULL, &ii, flags);

    printf("found %d bluetooth devices\n", num_rsp);

    // end - scan_device

    int j = 0;

    for (i = 0; i < num_rsp; i++)
    {
      dest = (ii+i)->bdaddr;

      if (!strncasecmp(*v8str, "0x", 2))
      {
    	int num;
	    /* This is a UUID16, just convert to int */
	    sscanf(*v8str + 2, "%X", &num);
	    serv_class = num;
      }

      if (serv_class)
      {
    	if (serv_class & 0xffff0000)
	    {
	      sdp_uuid32_create(&svc_uuid, serv_class);
		  printf("Creating a 32 bit uuid\n");
	    }
	    else
	    {
		  uint16_t class16 = serv_class & 0xffff;
		  sdp_uuid16_create(&svc_uuid, class16);
	    }
      }
      else
      {
        printf("service class is not correct\n");
        return args.This();
      }
    // connect to the SDP server running on the remote machine

      session = sdp_connect( BDADDR_ANY, &dest, SDP_RETRY_IF_BUSY );
      if (session == (sdp_session_t *)NULL)
      {
        printf("session for device to connect is not available, go to next device\n");
        //return args.This();
      }
      else
      {
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
    	ba2str(&(ii+i)->bdaddr, dev_addr);
	    strcpy(dev_name, "[unknown]");

        if(hci_read_remote_name(bt_dev.sock, &(ii+i)->bdaddr,
		 sizeof(dev_name)-1, dev_name, 0) < 0);

        printf("bluetooth device name: %s\n", dev_name);
        printf("bluetooth device address: %s\n", dev_addr);

        if(strcmp(dev_name, dev_name_tmp))
        {
          result1->Set(v8::Number::New(j), v8::String::New(dev_name));
          result1->Set(v8::Number::New(++j), v8::String::New(dev_addr));
          result1->Set(v8::Number::New(++j), v8::String::New("\n"));
          j++;
        }

        strcpy(dev_name_tmp, dev_name);

        sdp_record_t *rec = (sdp_record_t*) r->data;
        sdp_record_print(rec);
        //printf("Service RecHandle: 0x%x\n", rec->handle);

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
                      //printf("rfcomm channel: %d\n",d->val.int8);
                      bt_dev.channel = d->val.int8;
                  break;
                }
              }
            }
            sdp_list_free( (sdp_list_t*)p->data, 0 );
          }
          sdp_list_free( proto_list, 0 );
        }

        sdp_record_free( rec );

      }
     }
      sdp_close(session);
    }

  free( ii );
  close(bt_dev.sock);

  return result1;

  }

  static Handle<Value> Bind_device(const Arguments& args)
  {
    HandleScope scope;
    BTDiscovery* bd = ObjectWrap::Unwrap<BTDiscovery>(args.This());
    Local<Object> result =  Object::New();

    //bind

    BTDevice bt_dev; //ctl, dev_id
    struct rfcomm_dev_req req;
    int err, dev_id;
    bdaddr_t bdaddr;

	memset(&req, 0, sizeof(req));
    bacpy(&bdaddr, BDADDR_ANY);
    bt_dev.ctl = socket(AF_BLUETOOTH, SOCK_RAW, BTPROTO_RFCOMM);
    if (bt_dev.ctl < 0)
    {
      perror("Can't open RFCOMM control socket");
      exit(1);
    }

    v8::String::Utf8Value v8arg0(args[0]);

    if (strncmp(*v8arg0, "/dev/rfcomm", 11) == 0)
      dev_id = atoi(*v8arg0 + 11);
    else if (strncmp(*v8arg0, "rfcomm", 6) == 0)
      dev_id = atoi(*v8arg0 + 6);
    else
      dev_id = atoi(*v8arg0);

    req.dev_id = dev_id;

    printf("dev_id: %d\n", dev_id);

    v8::String::Utf8Value v8arg1(args[1]);
    str2ba(*v8arg1, &req.dst);

    bacpy(&req.src, &bdaddr);

	err = ioctl(bt_dev.ctl, RFCOMMCREATEDEV, &req);
	if (err == EOPNOTSUPP)
	  fprintf(stderr, "RFCOMM TTY support not available\n");
	else if (err < 0)
	  perror("Can't create device");

    //	return err;  //?
    //end of bind

    return scope.Close(result);
  }

  static Handle<Value> Bind_all(const Arguments& args)
  {
    HandleScope scope;
    BTDiscovery* bd = ObjectWrap::Unwrap<BTDiscovery>(args.This());

    Local<Object> result =  Object::New();

    return scope.Close(result);
  }

  static Handle<Value> Connect_device(const Arguments& args)
  {
    HandleScope scope;
    BTDiscovery* bd = ObjectWrap::Unwrap<BTDiscovery>(args.This());

    Local<Object> result =  Object::New();

    //start connect  // int ctl, int dev, bdaddr_t *bdaddr

    BTDevice bt_dev; //ctl, dev_id
    bdaddr_t bdaddr;

    struct sockaddr_rc laddr, raddr;
    struct rfcomm_dev_req req;
    struct termios ti;
    struct sigaction sa;
    struct pollfd p;
    sigset_t sigs;
    socklen_t alen;
    char dst[18], devname[248];
    int sk, fd, tries = 30;

    bacpy(&bdaddr, BDADDR_ANY);

    laddr.rc_family = AF_BLUETOOTH;
    bacpy(&laddr.rc_bdaddr, &bdaddr);
    laddr.rc_channel = 0;

    raddr.rc_family = AF_BLUETOOTH;

    v8::String::Utf8Value v8arg1(args[1]);
    str2ba(*v8arg1, &raddr.rc_bdaddr);

    raddr.rc_channel = 1;

    sk = socket(AF_BLUETOOTH, SOCK_STREAM, BTPROTO_RFCOMM);
    if (sk < 0)
    {
      perror("Can't create RFCOMM socket");
      return args.This();
    }

    if (bind(sk, (struct sockaddr *)&laddr, sizeof(laddr)) < 0)
    {
      perror("Can't bind RFCOMM socket");
      close(sk);
      return args.This();
    }

    if (connect(sk, (struct sockaddr *) &raddr, sizeof(raddr)) < 0)
    {
      perror("Can't connect RFCOMM socket");
      close(sk);
      return args.This();
    }

    alen = sizeof(laddr);
    if (getsockname(sk, (struct sockaddr *)&laddr, &alen) < 0)
    {
      perror("Can't get RFCOMM socket name");
      close(sk);
      return args.This();
    }

   //start

    v8::String::Utf8Value v8arg0(args[0]);

    if (strncmp(*v8arg0, "/dev/rfcomm", 11) == 0)
      bt_dev.dev_id = atoi(*v8arg0 + 11);
    else if (strncmp(*v8arg0, "rfcomm", 6) == 0)
    	bt_dev.dev_id = atoi(*v8arg0 + 6);
    else
      bt_dev.dev_id = atoi(*v8arg0);

    int dev = bt_dev.dev_id;

    printf("connect dev_id: %d\n", bt_dev.dev_id);

    memset(&req, 0, sizeof(req));
    req.dev_id = dev;

    req.flags = (1 << RFCOMM_REUSE_DLC) | (1 << RFCOMM_RELEASE_ONHUP);

    bacpy(&req.src, &laddr.rc_bdaddr);
    bacpy(&req.dst, &raddr.rc_bdaddr);
    req.channel = raddr.rc_channel;

    dev = ioctl(sk, RFCOMMCREATEDEV, &req);
    if (dev < 0)
    {
      perror("Can't create RFCOMM TTY");
      close(sk);
      return args.This();
    }

    snprintf(devname, MAXPATHLEN - 1, "/dev/rfcomm%d", dev);
    while ((fd = open(devname, O_RDONLY | O_NOCTTY)) < 0)
    {
      if (errno == EACCES)
      {
        perror("Can't open RFCOMM device");
        goto release;
      }

      snprintf(devname, MAXPATHLEN - 1, "/dev/bluetooth/rfcomm/%d", dev);
      if ((fd = open(devname, O_RDONLY | O_NOCTTY)) < 0)
      {
        if (tries--)
        {
          snprintf(devname, MAXPATHLEN - 1, "/dev/rfcomm%d", dev);
          usleep(100 * 1000);
    	  continue;
        }
        perror("Can't open RFCOMM device");
        goto release;
      }
    }

//    if (rfcomm_raw_tty)
  //  {
  //    tcflush(fd, TCIOFLUSH);

      //cfmakeraw(&ti);
      //tcsetattr(fd, TCSANOW, &ti);
   // }

    close(sk);

    ba2str(&req.dst, dst);
    printf("Connected %s to %s on channel %d\n", devname, dst, req.channel);
    printf("Press CTRL-C for hangup\n");

    memset(&sa, 0, sizeof(sa));
    sa.sa_flags   = SA_NOCLDSTOP;
    sa.sa_handler = SIG_IGN;
    sigaction(SIGCHLD, &sa, NULL);
    sigaction(SIGPIPE, &sa, NULL);

    sa.sa_handler = sig_term;
    sigaction(SIGTERM, &sa, NULL);
    sigaction(SIGINT,  &sa, NULL);

    sa.sa_handler = sig_hup;
    sigaction(SIGHUP, &sa, NULL);

    sigfillset(&sigs);
    sigdelset(&sigs, SIGCHLD);
    sigdelset(&sigs, SIGPIPE);
    sigdelset(&sigs, SIGTERM);
    sigdelset(&sigs, SIGINT);
    sigdelset(&sigs, SIGHUP);

    p.fd = fd;
    p.events = POLLERR | POLLHUP;

    while (!io_canceled_)
    {
      p.revents = 0;
      if (ppoll(&p, 1, NULL, &sigs) > 0)
      break;
    }

    printf("Disconnected\n");

    close(fd);
    return args.This();

  release:
    memset(&req, 0, sizeof(req));
	bt_dev.ctl = socket(AF_BLUETOOTH, SOCK_RAW, BTPROTO_RFCOMM);
    req.dev_id = dev;
    req.flags = (1 << RFCOMM_HANGUP_NOW);
    ioctl(bt_dev.ctl, RFCOMMRELEASEDEV, &req);

    close(sk);

  return scope.Close(result);
  }

  static void info_cb(int event, const char *msg, int len, void *data)
  {
	int c;
  	char progress[] = "\\|/-";
  	static unsigned int i = 0;

  	switch (event) {

  	case OBEXFTP_EV_ERRMSG:
  		fprintf(stderr, "Error: %s\n", msg);
  		break;

  	case OBEXFTP_EV_ERR:
  		// OBEX_EV_REQDONE: obex_rsp=43  (SE user reject)
  		fprintf(stderr, "failed: %s\n", msg);
  		break;
  	case OBEXFTP_EV_OK:
  		fprintf(stderr, "done\n");
  		break;

  	case OBEXFTP_EV_CONNECTING:
  		fprintf(stderr, "Connecting...");
  		break;
  	case OBEXFTP_EV_DISCONNECTING:
  		fprintf(stderr, "Disconnecting...");
  		break;
  	case OBEXFTP_EV_SENDING:
  		fprintf(stderr, "Sending \"%s\"... ", msg);
  		break;
  	case OBEXFTP_EV_RECEIVING:
  		fprintf(stderr, "Receiving \"%s\"... ", msg);
  		break;

  	case OBEXFTP_EV_LISTENING:
  		fprintf(stderr, "Waiting for incoming connection\n");
  		break;

  	case OBEXFTP_EV_CONNECTIND:
  		fprintf(stderr, "Incoming connection\n");
  		break;
  	case OBEXFTP_EV_DISCONNECTIND:
  		fprintf(stderr, "Disconnecting\n");
  		break;

  	case OBEXFTP_EV_INFO:
  		printf("Got info %u: \n", *(uint32_t*)msg);
  		break;

  	case OBEXFTP_EV_BODY:
  		if (c == 'l' || c == 'X' || c == 'P') {
  			if (msg == NULL)
  				fprintf(stderr, "No body.\n");
  			else if (len == 0)
  				fprintf(stderr, "Empty body.\n");
  			else
  				write(STDOUT_FILENO, msg, len);
  		}
  		break;

  	case OBEXFTP_EV_PROGRESS:
  		fprintf(stderr, "%c%c", 0x08, progress[i++]);
  		fflush(stdout);
  		if (i >= strlen(progress))
  			i = 0;
  		break;

  	}
  }

  static int find_bt(char *addr, char **res_bdaddr, int *res_channel)
  {
  	char **devices;
  	char **dev;

  	*res_bdaddr = addr;
  	if (!addr || strlen(addr) < (6*2+5) || addr[2]!=':')
  	{
        fprintf(stderr, "Scanning for %s ...\n", addr);
  		devices = obexftp_discover(OBEX_TRANS_BLUETOOTH);

  		for(dev = devices; dev && *dev; dev++)
  		{
          if (!addr || strcasestr(*dev, addr))
          {
  			fprintf(stderr, "Found: %s\n", *dev);
  			*res_bdaddr = *dev;
  			break;
          }
          fprintf(stderr, "Seen: %s\n", *dev);
  		}
  	}
  	if (!*res_bdaddr)
  		return -1; /* No (matching) BT device found */
  //	(*res_bdaddr)[17] = '\0';

         	if (*res_channel < 0) {
  		fprintf(stderr, "Browsing %s ...\n", *res_bdaddr);
  		*res_channel = obexftp_browse_bt_ftp(*res_bdaddr);
  	}
  	if (*res_channel < 0)
  		return -1; /* No valid BT channel found */

  	return 0;
  }
  
  static Handle<Value> Folder_list(const Arguments& args)
  {
    HandleScope scope;
    BTDiscovery* bd = ObjectWrap::Unwrap<BTDiscovery>(args.This());
    Local<Object> result =  Object::New();
    
    v8::String::Utf8Value v8arg0(args[0]);
    v8::Handle<v8::Array> result1 = v8::Array::New(12);
    
    //static obexftp_client_t *cli = NULL;
    static const char *src_dev = NULL;
    static int transport = OBEX_TRANS_BLUETOOTH;
    char *device = *v8arg0;
   // static int channel = -1;
    static int channel = 4;
    static const char *use_uuid = (const char *)UUID_FBS;
    static int use_uuid_len = sizeof(UUID_FBS);
    static int use_conn=1;
    static int use_path=1;

    /* preset the port from environment */
    if (getenv(OBEXFTP_CHANNEL) != NULL)
    {
      channel = atoi(getenv(OBEXFTP_CHANNEL));
      printf("channel = %d\n", channel);
    }

    if (getenv(OBEXFTP_BLUETOOTH) != NULL)
    {
      device = getenv(OBEXFTP_BLUETOOTH);
      transport = OBEX_TRANS_BLUETOOTH;
      fprintf(stderr, "Presetting to BT: %s (%d)\n", device, channel);
    }

      transport = OBEX_TRANS_BLUETOOTH;
	   
  // if ((strncmp(*v8arg2, "c", 1) == 0) || (strncmp(*v8arg2, "connect", 7) == 0))
    {
	  if(cli == NULL)
	  {
	    // complete bt address if necessary
	    if (transport == OBEX_TRANS_BLUETOOTH)
	    {
		  find_bt(device, &device, &channel);
		// we should free() the find_bt result at some point
	    }
	 	//  if (cli_connect_uuid(use_uuid, use_uuid_len) < 0)
		//exit(1);

	    // connect_uuid
	    int ret, retry;
	    #ifdef HAVE_SYS_TIMES_H
	    clock_t clock;
	    #endif

	    if (cli == NULL)
	    {
	      // Open
	      cli = obexftp_open (transport, NULL, info_cb, NULL);
	      if(cli == NULL)
	      {
            fprintf(stderr, "Error opening obexftp-client\n");
	     //	exit(1);
            return args.This();
	      }
	      if (!use_conn)
	      {
	       cli->quirks &= ~OBEXFTP_CONN_HEADER;
	      }
	      if (!use_path)
	      {
	       cli->quirks &= ~OBEXFTP_SPLIT_SETPATH;
	      }
	    }
	
	    for (retry = 0; retry < 3; retry++)
	    {
	      // Connect
	      #ifdef HAVE_SYS_TIMES_H
	        clock = times(NULL);
	      #endif
	      ret = obexftp_connect_src(cli, src_dev, device, channel, (const uint8_t *)use_uuid, use_uuid_len);
	      #ifdef HAVE_SYS_TIMES_H
	        clock = times(NULL)-clock;
	        fprintf(stderr, "Tried to connect for %ldms\n", clock);
	      #endif
	      if (ret >= 0)
	      {
	        printf("connect successful\n");
	      	goto listfolder;
	      }
	      else
	      {
	    	 switch (errno)
	         {
	           case ETIMEDOUT:
	             perror("The device may have moved out of range");
	           break; // retry

	           case ECONNREFUSED:
	             perror("The user may have rejected the list folder");
	            
 	           break;

	           case EHOSTDOWN:
	             perror("The device may be out of range or turned off");
	           break; // retry

	           case EINPROGRESS:
	             perror("Interupted/bad reception or the device moved out of range");
	           break; // retry

	           default:
	             perror("error on connect()");
	           break;
	        }

	       fprintf(stderr, "Still trying to connect\n");
	      }
	    }
       //  if(ret<0)
	   //  obexftp_close(cli);
	   //  cli = NULL;
	  }

		listfolder:
			stat_entry_t *ent;
			void *dir = obexftp_opendir(cli, "/");
			int j = 0;
			while ((ent = obexftp_readdir(dir)) != NULL) {
				stat_entry_t *st;
				st = obexftp_stat(cli, ent->name);
				if (!st) continue;
				printf("%d %s%s\n", st->size, ent->name,
					ent->mode&S_IFDIR?"/":"");
			    result1->Set(v8::Number::New(j), v8::String::New(ent->name));
	          	j++;
	        }
			obexftp_closedir(dir);
		}

  	//  obexftp_close(cli);
	//	cli = NULL;
    return result1;
  }

  static Handle<Value> File_list(const Arguments& args)
  {
    HandleScope scope;
    BTDiscovery* bd = ObjectWrap::Unwrap<BTDiscovery>(args.This());
    Local<Object> result =  Object::New();
    
    v8::String::Utf8Value v8arg0(args[0]);
    v8::String::Utf8Value v8arg1(args[1]);
    
    printf("arg1: %s\n", *v8arg1);
    
    int cnt = 1024;
    v8::Handle<v8::Array> result1 = v8::Array::New(12);
    
   // static obexftp_client_t *cli = NULL;
    static const char *src_dev = NULL;
    static int transport = OBEX_TRANS_BLUETOOTH;
//    static char *device = NULL;
    //static char *device = "3C:5A:37:12:3E:32";
   // static int channel = -1;
    static int channel = 4;
    static const char *use_uuid = (const char *)UUID_FBS;
    static int use_uuid_len = sizeof(UUID_FBS);
    static int use_conn=1;
    static int use_path=1;
    
    char* device = *v8arg0;

    /* preset the port from environment */
    if (getenv(OBEXFTP_CHANNEL) != NULL)
    {
      channel = atoi(getenv(OBEXFTP_CHANNEL));
      printf("channel = %d\n", channel);
    }

    if (getenv(OBEXFTP_BLUETOOTH) != NULL)
    {
      device = getenv(OBEXFTP_BLUETOOTH);
      transport = OBEX_TRANS_BLUETOOTH;
      fprintf(stderr, "Presetting to BT: %s (%d)\n", device, channel);
    }

      transport = OBEX_TRANS_BLUETOOTH;
	
	// handle severed optional option argument

   //   v8::String::Utf8Value v8arg1(args[1]);
   //   channel = atoi(*v8arg1);

  //  v8::String::Utf8Value v8arg2(args[2]);
  // if ((strncmp(*v8arg2, "c", 1) == 0) || (strncmp(*v8arg2, "connect", 7) == 0))
    {
	  if(cli == NULL)
	  {
	    // complete bt address if necessary
	    if (transport == OBEX_TRANS_BLUETOOTH)
	    {
		  find_bt(device, &device, &channel);
		// we should free() the find_bt result at some point
	    }
	 	//  if (cli_connect_uuid(use_uuid, use_uuid_len) < 0)
		//exit(1);

	    // connect_uuid
	    int ret, retry;
	    #ifdef HAVE_SYS_TIMES_H
	    clock_t clock;
	    #endif

	    if (cli == NULL)
	    {
	      // Open
	      cli = obexftp_open (transport, NULL, info_cb, NULL);
	      if(cli == NULL)
	      {
            fprintf(stderr, "Error opening obexftp-client\n");
	     //	exit(1);
            return args.This();
	      }
	      if (!use_conn)
	      {
	       cli->quirks &= ~OBEXFTP_CONN_HEADER;
	      }
	      if (!use_path)
	      {
	       cli->quirks &= ~OBEXFTP_SPLIT_SETPATH;
	      }
	    }

	    // Connect
		/*  #ifdef HAVE_SYS_TIMES_H
			clock = times(NULL);
		  #endif
		  ret = obexftp_connect_src(cli, src_dev, device, channel, (const uint8_t *)use_uuid, use_uuid_len);
		  #ifdef HAVE_SYS_TIMES_H
			clock = times(NULL)-clock;
			fprintf(stderr, "Tried to connect for %ldms\n", clock);
		  #endif
		  if (ret >= 0)
		  {
		   printf("connect successful\n");
		   goto transfer;
		  } */

	    for (retry = 0; retry < 3; retry++)
	    {
	      // Connect
	      #ifdef HAVE_SYS_TIMES_H
	        clock = times(NULL);
	      #endif
	      ret = obexftp_connect_src(cli, src_dev, device, channel, (const uint8_t *)use_uuid, use_uuid_len);
	      #ifdef HAVE_SYS_TIMES_H
	        clock = times(NULL)-clock;
	        fprintf(stderr, "Tried to connect for %ldms\n", clock);
	      #endif
	      if (ret >= 0)
	      {
	        printf("connect successful\n");
	      	//goto transfer;
	      	goto listfile;
	      }
	      // printf("connect successful\n");
	      else
	      {
	    	 switch (errno)
	         {
	           case ETIMEDOUT:
	             perror("The device may have moved out of range");
	           break; // retry

	           case ECONNREFUSED:
	            // perror("The user may have rejected the transfer");
	             perror("The user may have rejected the listfolder");
	            
 	           break;

	           case EHOSTDOWN:
	             perror("The device may be out of range or turned off");
	           break; // retry

	           case EINPROGRESS:
	             perror("Interupted/bad reception or the device moved out of range");
	           break; // retry

	           default:
	             perror("error on connect()");
	           break;
	        }

	       fprintf(stderr, "Still trying to connect\n");
	      }
	    }
       //  if(ret<0)
	   //  obexftp_close(cli);
	   //  cli = NULL;
	  }

    	listfile:
 		
		int ret = obexftp_list(cli, NULL, *v8arg1);
		
		if (ret < 0) {
			fprintf(stderr, "Error getting a folder listing\n");
		} 
		else {
			  if(cli->buf_data)
			  {
				   printf("come to file list\n");
				 // printf("%s\n", cli->buf_data);
				  result1->Set(v8::Number::New(0), v8::String::New((char*)cli->buf_data));
			  }
			  //list folder
			  else
			  {
				printf("comes to nested folder\n");
				stat_entry_t *ent;
				//void *dir = obexftp_opendir(cli, "/");
				void *dir = obexftp_opendir(cli, *v8arg1);

				int j = 0;
				while ((ent = obexftp_readdir(dir)) != NULL) {
					printf("nested folder 1\n");
					stat_entry_t *st;
					st = obexftp_stat(cli, ent->name);
					if (!st) continue;
					/*printf("%d %s%s\n", st->size, ent->name,
						ent->mode&S_IFDIR?"/":"");*/
					char* name = strcat(*v8arg1, ent->name);
					printf("name is: %s\n", name);
					result1->Set(v8::Number::New(j), v8::String::New(name));
					j++;
				}
				obexftp_closedir(dir);
			  }
			} 
    }
    
  //  obexftp_close(cli);
//	cli = NULL;
    return result1;
  }
 
 static Handle<Value> File_transfer(const Arguments& args)
{
	HandleScope scope;
    BTDiscovery* bd = ObjectWrap::Unwrap<BTDiscovery>(args.This());
    Local<Object> result =  Object::New();
    
    v8::Handle<v8::Array> result1 = v8::Array::New(1);
    
    v8::String::Utf8Value v8arg0(args[0]);
    v8::String::Utf8Value v8arg1(args[1]);
    v8::String::Utf8Value v8arg2(args[2]);
    
    //static obexftp_client_t *cli = NULL;
    static const char *src_dev = NULL;
    static int transport = OBEX_TRANS_BLUETOOTH;
    // static int channel = -1;
    static int channel = 4;
    static const char *use_uuid = (const char *)UUID_FBS;
    static int use_uuid_len = sizeof(UUID_FBS);
    static int use_conn=1;
    static int use_path=1;
    
    char* device = *v8arg0;
    
   // printf("v8arg0 = %s\n", v8arg0);
    
    /* preset the port from environment */
    if (getenv(OBEXFTP_CHANNEL) != NULL)
    {
      channel = atoi(getenv(OBEXFTP_CHANNEL));
      printf("channel = %d\n", channel);
    }

    if (getenv(OBEXFTP_BLUETOOTH) != NULL)
    {
      device = getenv(OBEXFTP_BLUETOOTH);
      transport = OBEX_TRANS_BLUETOOTH;
      fprintf(stderr, "Presetting to BT: %s (%d)\n", device, channel);
    }

      transport = OBEX_TRANS_BLUETOOTH;
	
	// handle severed optional option argument

   //   v8::String::Utf8Value v8arg1(args[1]);
   //   channel = atoi(*v8arg1);

  //  v8::String::Utf8Value v8arg2(args[2]);
  // if ((strncmp(*v8arg2, "c", 1) == 0) || (strncmp(*v8arg2, "connect", 7) == 0))
    {
	  if(cli == NULL)
	  {
	    // complete bt address if necessary
	    if (transport == OBEX_TRANS_BLUETOOTH)
	    {
		  find_bt(device, &device, &channel);
		// we should free() the find_bt result at some point
	    }
	 	//  if (cli_connect_uuid(use_uuid, use_uuid_len) < 0)
		//exit(1);

	    // connect_uuid
	    int ret, retry;
	    #ifdef HAVE_SYS_TIMES_H
	    clock_t clock;
	    #endif

	    if (cli == NULL)
	    {
	      // Open
	      cli = obexftp_open (transport, NULL, info_cb, NULL);
	      if(cli == NULL)
	      {
            fprintf(stderr, "Error opening obexftp-client\n");
	     //	exit(1);
            return args.This();
	      }
	      if (!use_conn)
	      {
	       cli->quirks &= ~OBEXFTP_CONN_HEADER;
	      }
	      if (!use_path)
	      {
	       cli->quirks &= ~OBEXFTP_SPLIT_SETPATH;
	      }
	    }

	    // Connect
		/*  #ifdef HAVE_SYS_TIMES_H
			clock = times(NULL);
		  #endif
		  ret = obexftp_connect_src(cli, src_dev, device, channel, (const uint8_t *)use_uuid, use_uuid_len);
		  #ifdef HAVE_SYS_TIMES_H
			clock = times(NULL)-clock;
			fprintf(stderr, "Tried to connect for %ldms\n", clock);
		  #endif
		  if (ret >= 0)
		  {
		   printf("connect successful\n");
		   goto transfer;
		  } */

	    for (retry = 0; retry < 3; retry++)
	    {
	      // Connect
	      #ifdef HAVE_SYS_TIMES_H
	        clock = times(NULL);
	      #endif
	      ret = obexftp_connect_src(cli, src_dev, device, channel, (const uint8_t *)use_uuid, use_uuid_len);
	      #ifdef HAVE_SYS_TIMES_H
	        clock = times(NULL)-clock;
	        fprintf(stderr, "Tried to connect for %ldms\n", clock);
	      #endif
	      if (ret >= 0)
	      {
	        printf("connect successful\n");
	      	goto transfer;
	      }
	      // printf("connect successful\n");
	      else
	      {
	    	 switch (errno)
	         {
	           case ETIMEDOUT:
	             perror("The device may have moved out of range");
	           break; // retry

	           case ECONNREFUSED:
	             perror("The user may have rejected the transfer");
 	           break;

	           case EHOSTDOWN:
	             perror("The device may be out of range or turned off");
	           break; // retry

	           case EINPROGRESS:
	             perror("Interupted/bad reception or the device moved out of range");
	           break; // retry

	           default:
	             perror("error on connect()");
	           break;
	        }

	       fprintf(stderr, "Still trying to connect\n");
	      }
	    }
        // if(ret<0)
	    // obexftp_close(cli);
	    // cli = NULL;
	  }

    	transfer:
    	
    	
    	printf("v8arg1 = %s\n", *v8arg1);
    	printf("v8arg2 = %s\n", *v8arg2);
    	
    	int ret = obexftp_get(cli, *v8arg2, *v8arg1);  

		if (ret < 0) {
			fprintf(stderr, "Error getting a file\n");
		} 
		else 
		{
			printf("get file successful!");
		} 
		result1->Set(v8::Number::New(0), v8::Integer::New(ret));
    }
	//obexftp_close(cli);
	//cli = NULL;
	
	v8::Handle<v8::Value> res(result1);
	return result1;
  }
  
};

Persistent<FunctionTemplate> BTDiscovery::s_ct;

extern "C" {
  static void init (Handle<Object> target)
  {
	  BTDiscovery::Init(target);
  }

  NODE_MODULE(bluetooth, init);
}
