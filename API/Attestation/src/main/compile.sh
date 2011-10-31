#!/bin/bash

#
# This is how I've been compiling this module - I can't get node-waf to work
# properly, and it didn't seem worth investing the time in creating a MAKE 
# script if nobody else was doing it.
#

#configure some build paths.
NODE_LIB_PATH=/home/johl/nodejs4/local/lib
NODE_INCLUDE_PATH=/home/johl/nodejs4/local/include/node
WEBINOS_PATH=/home/johl/git-repos/wp4


THIS_PATH=$WEBINOS_PATH/API/Attestation/src/main

# remove files
rm ./attestation.o
rm ./libattestation.so
rm ./tssbridge_1.o
rm ./tssbridge.node

# compile libattestation
gcc -c attestation.c -o attestation.o -ltspi -fPIC
gcc -shared -L$THIS_PATH -Wl,-rpath=$THIS_PATH,-soname,libattestation.so -o libattestation.so attestation.o -lc -ltspi

# compile the "tssbridge" node module
/usr/bin/g++ -g -D_FILE_OFFSET_BITS=64 -D_LARGEFILE_SOURCE -fPIC -DPIC -D_LARGEFILE_SOURCE -D_FILE_OFFSET_BITS=64 -D_GNU_SOURCE -DEV_MULTIPLICITY=0 -I$NODE_INCLUDE_PATH -lattestation ./tssbridge.cpp -c -o ./tssbridge_1.o

/usr/bin/g++ ./tssbridge_1.o -o ./tssbridge.node -shared -L$NODE_LIB_PATH -L. -lattestation

# Before you run, you'll need to export your LD_LIBRARY_PATH
# export LD_LIBRARY_PATH=.

