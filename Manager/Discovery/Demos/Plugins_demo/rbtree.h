/*
 *      rbtree.h -- Red Black balanced tree library
 *
 *      Copyright (c) 2008 World Wide Web Consortium
 *      and adapted from original code by Julienne Walker
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

#ifndef RBTREE_H
#define RBTREE_H

#ifdef __cplusplus
extern "C" {
#endif

#include <stddef.h>
#include <stdlib.h>
#include <assert.h>

typedef void *RbKey;   // e.g. memory address of object
typedef void *RbValue;
typedef void *RbContext;
typedef unsigned long RbSize;  // long for compatibility with LP64

typedef struct _rbnode
{
    int red;     // Color (1=red, 0=black)
    RbKey key; // same size as void *
    RbValue value;  // User-defined content
    struct _rbnode *link[2]; // Left (0) and right (1) links
} RbNode;

// create new value in red-black tree node
typedef void (*RbNewFn) ( RbNode *node, RbKey key, RbValue value );

// for updating existing data in red-black tree node
typedef void  (*RbUpdateFn) ( RbNode *node, RbValue value );

// for freeing data stored in red-black tree node
typedef void  (*RbEraseFn) ( RbKey key, RbValue value );

typedef int (*RbCmpKeyFn) (RbKey key1, RbKey key2);

// user supplied function for apply mechanism
typedef void (*RbApplyFn)(RbKey key, RbValue value, RbContext context);

typedef struct _rbtree
{
    RbNewFn newNode;
    RbUpdateFn updateNode;
    RbEraseFn eraseNode;
    RbCmpKeyFn compareKeys;
    RbNode *root;
} RbTree;

// red black tree functions
RbTree *rbTreeNew(RbNewFn newNode, RbUpdateFn updateNode,
                   RbEraseFn eraseNode,  RbCmpKeyFn compareKeys);

void rbTreeNewEmbedded(RbTree *tree, RbNewFn newNode, RbUpdateFn updateNode,
                        RbEraseFn eraseNode,  RbCmpKeyFn compareKeys);

void rbTreeFree(RbTree *tree);

void rbTreeFreeEmbedded(RbTree *tree);


RbValue rbTreeFindKey ( RbTree *tree, RbKey key );
void rbTreeInsertKey ( RbTree *tree, RbKey key, RbValue data );
void rbTreeRemoveKey ( RbTree *tree, RbKey key );

RbSize rbTreeSize ( RbTree *tree ); // number of nodes in tree
int rbTreeHasOneEntry ( RbTree *tree ); // true of tree has just one node

RbValue rbTreeRootValue(RbTree *tree);
RbValue rbTreeFirstValue(RbTree *tree);
RbValue rbTreeLastValue(RbTree *tree);

// calls user defined func on all nodes with given context
void rbTreeApplyLR(RbTree *tree, RbApplyFn func, RbContext context);
void rbTreeApplyRL(RbTree *tree, RbApplyFn func, RbContext context);

 #ifdef __cplusplus
 }
 #endif

#endif // RBTREE_H
