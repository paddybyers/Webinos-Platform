#
#      Makefile for webinos discovery plugin
#
#      Copyright (c) 2011 World Wide Web Consortium
#
#  Licensed under the Apache License, Version 2.0 (the "License");
#  you may not use this file except in compliance with the License.
#  You may obtain a copy of the License at
#
#    http://www.apache.org/licenses/LICENSE-2.0
#
#  Unless required by applicable law or agreed to in writing, software
#  distributed under the License is distributed on an "AS IS" BASIS,
#  WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
#  See the License for the specific language governing permissions and
#  limitations under the License.
#
# Webinos plugin requires various libaries and associated dev
# packages for the C header files

# this enables logging to the named file for debugging purposes
# with log("initialized\n") like printf statement
#DEBUG = -DWEBINOS_DEBUG -DWEBINOS_LOG_FILE=\"/home/dsr/Projects/webinos/plugin/log.txt\"

CFLAGS = -Wall -DXP_UNIX=1 -DMOZ_X11=1 -fPIC -g $(DEBUG)
LIBS = -l avahi-client -l avahi-common -l avahi-ui -l gdbm -l bluetooth -l slp -l pthread

npwWebinosplugin : WebinosPlugin.o avahi.o upnp.o slp.o bluetooth.o usb.o rbtree.o
	cc $(CFLAGS) -shared WebinosPlugin.o avahi.o upnp.o slp.o \
 bluetooth.o usb.o rbtree.o -o npwebinosplugin.so $(LIBS)
	cp npwebinosplugin.so manifest.json ~/.mozilla/plugins/
	cp usb.ids /tmp/

WebinosPlugin.o : WebinosPlugin.c WebinosPlugin.h
	cc $(CFLAGS) -c WebinosPlugin.c

avahi.o : avahi.c WebinosPlugin.h
	cc $(CFLAGS) -c avahi.c

upno.o : upnp.c WebinosPlugin.h
	cc $(CFLAGS) -pthread -c upnp.c

slp.o : slp.c WebinosPlugin.h
	cc $(CFLAGS) -pthread -c slp.c

bluetooth.o : bluetooth.c WebinosPlugin.h
	cc $(CFLAGS) -pthread -c bluetooth.c

usb.o : usb.c WebinosPlugin.h
	cc $(CFLAGS) -c usb.c

rbtree.o : rbtree.c rbtree.h
	cc $(CFLAGS) -c rbtree.c

clean :
	rm -rf npwebinosplugin.so WebinosPlugin.o avahi.o upnp.o \
 slp.o bluetooth.o usb.o rbtree.o log.txt

