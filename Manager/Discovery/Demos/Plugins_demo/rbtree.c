/*
 *      rbtree.c -- Red Black balanced tree library
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

#include "rbtree.h"

// Checks the color of a red black node
static int is_red (RbNode *node)
{
  return node != NULL && node->red == 1;
}

// Performs a single red black rotation in given direction
// where dir is 0 for left and 1 for right
// assumes that all nodes are valid for a rotation
static RbNode *rotate1 (RbNode *node, int dir)
{
  RbNode *save = node->link[!dir];

  node->link[!dir] = save->link[dir];
  save->link[dir] = node;

  node->red = 1;
  save->red = 0;

  return save;
}

// Performs a double red black rotation in given direction
// assumes all nodes are valid for a rotation
static RbNode *rotate2 (RbNode *node, int dir)
{
  node->link[!dir] = rotate1 (node->link[!dir], !dir);

  return rotate1 (node, dir);
}

// Create and initialize new red black node with a copy of the
// data. This function does not insert the new node into a tree
static RbNode *new_node (RbTree *tree, RbKey key, RbValue value)
{
  RbNode *rn = (RbNode *)malloc (sizeof *rn);

  assert(rn);
  rn->red = 1;

  if (tree->newNode)
    tree->newNode(rn, key, value);
  else
  {
    rn->key = key;
    rn->value = value;
  }

  rn->link[0] = rn->link[1] = NULL;

  return rn;
}

// Search for a copy of the specified
// node data in a red black tree
RbValue rbTreeFindKey (RbTree *tree, RbKey key)
{
  if (!tree)
    assert(tree);
  RbNode *it = tree->root;

  while (it != NULL)
  {
    int cmp = tree->compareKeys (it->key, key);

    if (cmp == 0)
      break;

    // If the tree supports duplicates, they should be
    // chained to the right subtree for this to work
    it = it->link[cmp < 0];
  }

  return it == NULL ? NULL : it->value;
}

// Insert user-specified key and data into a red
// black tree and return the new root of the tree
void rbTreeInsertKey (RbTree *tree, RbKey key, RbValue value)
{
  assert(tree);

  if (tree->root == NULL)
  {
    // We have an empty tree; attach the
    // new node directly to the root
    tree->root = new_node (tree, key, value);
  }
  else
  {
    RbNode head = {0}; // False tree root
    RbNode *g, *t;     // Grandparent and parent
    RbNode *p, *q;     // Iterator and parent
    int dir = 0, last = 0, novel = 0;

    // Set up our helpers
    t = &head;
    g = p = NULL;
    q = t->link[1] = tree->root;

    // Search down the tree for a place to insert
    for (; ;)
    {
      novel = 0;
      if (q == NULL)
      {
        // Insert a new node at the first null link
        p->link[dir] = q = new_node (tree, key, value);
        novel = 1;

        if (q == NULL)  // not sure if this is needed
          return;
      }
      else if (is_red (q->link[0]) && is_red (q->link[1]))
      {
        // Simple red violation: color flip
        q->red = 1;
        q->link[0]->red = 0;
        q->link[1]->red = 0;
      }

      if (is_red (q) && is_red (p))
      {
        // Hard red violation: rotations necessary
        int dir2 = t->link[1] == g;

        if (q == p->link[last])
          t->link[dir2] = rotate1 (g, !last);
        else
          t->link[dir2] = rotate2 (g, !last);
      }

      // check existing node with same key and
      // update the value if desired then stop
      int sign = tree->compareKeys (q->key, key);

      if (sign == 0)
      {
        if (!novel && tree->updateNode)
          tree->updateNode(q, value);

         break;
      }

      last = dir;
      dir = sign < 0;

      // Move the helpers down
      if (g != NULL)
        t = g;

      g = p, p = q;
      q = q->link[dir];
    }

    // Update the root (it may be different)
    tree->root = head.link[1];
  }

  // Make the root black for simplified logic
  tree->root->red = 0;
}

// Remove a node from a red black tree for given
// key and return the updated root node
void rbTreeRemoveKey (RbTree *tree, RbKey key)
{
  assert(tree);

  if (tree->root != NULL)
  {
    RbNode head = {0}; // False tree root
    RbNode *q, *p, *g; // Helpers
    RbNode *f = NULL;  // Found item
    int dir = 1;

    // Set up our helpers
    q = &head;
    g = p = NULL;
    q->link[1] = tree->root;

    // Search and push a red node down
    // to fix red violations as we go

    while (q->link[dir] != NULL)
    {
      int last = dir;

      // Move the helpers down
      g = p, p = q;
      q = q->link[dir];
      dir = tree->compareKeys (q->key, key) < 0;

      // Save the node with matching data and keep
      // going; we'll do removal tasks at the end
      if (tree->compareKeys (q->key, key) == 0)
        f = q;

      // Push the red node down with rotations and color flips
      if (!is_red (q) && !is_red (q->link[dir]))
      {
        if (is_red (q->link[!dir]))
          p = p->link[last] = rotate1 (q, dir);
        else if (!is_red (q->link[!dir]))
        {
          RbNode *s = p->link[!last];

          if (s != NULL)
          {
            if (!is_red (s->link[!last]) && !is_red (s->link[last]))
            {
              // Color flip
              p->red = 0;
              s->red = 1;
              q->red = 1;
            }
            else
            {
              int dir2 = g->link[1] == p;

              if (is_red (s->link[last]))
                g->link[dir2] = rotate2 (p, last);
              else if (is_red (s->link[!last]))
                g->link[dir2] = rotate1 (p, last);

              // Ensure correct coloring
              q->red = g->link[dir2]->red = 1;
              g->link[dir2]->link[0]->red = 0;
              g->link[dir2]->link[1]->red = 0;
            }
          }
        }
      }
    }

    // Replace and remove the saved node
    if (f != NULL)
    {
      if (tree->eraseNode)
        tree->eraseNode (f->key, f->value);

      f->key = q->key;
      f->value = q->value;
      p->link[p->link[1] == q] =
      q->link[q->link[0] == NULL];
      free (q);
    }

    // Update the root (it may be different)
    tree->root = head.link[1];

    // Make the root black for simplified logic
    if (tree->root != NULL)
      tree->root->red = 0;
  }
}

static RbSize rbSize (RbNode *node)
{
  if (node)
    return rbSize(node->link[0]) + 1 + rbSize(node->link[1]);

  return 0;
}

// Gets the number of nodes in a red black tree
RbSize rbTreeSize (RbTree *tree)
{
  assert(tree);
  return rbSize(tree->root);
}

// true if node exists and has no children
int rbTreeHasOneEntry (RbTree *tree)
{
  assert(tree);
  return (tree->root && !tree->root->link[0] && !tree->root->link[1]);
}

// return value of root node
RbValue rbTreeRootValue(RbTree *tree)
{
  assert(tree);
  RbNode *node = tree->root;
  return (node ? node->value : NULL);
}

// return value of first node
RbValue rbTreeFirstValue(RbTree *tree)
{
  assert(tree);
  RbNode *node = tree->root;
  RbNode *first;

  if (node)
  {
    do
    {
      first = node;
       node = node->link[0];
    }
    while (node);

    return first->value;
  }

  return NULL;
}

// return value of last node
RbValue rbTreeLastValue(RbTree *tree)
{
  assert(tree);
  RbNode *node = tree->root;
  RbNode *last;

  if (node)
  {
     do
     {
       last = node;
       node = node->link[1];
     }
     while (node);

     return last->value;
  }

  return NULL;
}

// traverse tree, left to right, calling use defined func on each node
static void rbApplyLR(RbNode *node, RbApplyFn func, RbContext context)
{
  if (node)
  {
    rbApplyLR(node->link[0], func, context);
    (*func)(node->key, node->value, context);
    rbApplyLR(node->link[1], func, context);
  }
}

void rbTreeApplyLR(RbTree *tree, RbApplyFn func, RbContext context)
{
  assert(tree);
  rbApplyLR(tree->root, func, context);
}

// traverse tree, right to left, calling use defined func on each node
static void rbApplyRL(RbNode *node, RbApplyFn func, RbContext context)
{
  if (node)
  {
    rbApplyRL(node->link[1], func, context);
    (*func)(node->key, node->value, context);
    rbApplyRL(node->link[0], func, context);
  }
}

void rbTreeApplyRL(RbTree *tree, RbApplyFn func, RbContext context)
{
  assert(tree);
  rbApplyRL(tree->root, func, context);
}

void rbTreeNewEmbedded(RbTree *tree, RbNewFn newNode, RbUpdateFn updateNode, RbEraseFn eraseNode,  RbCmpKeyFn compareKeys)
{
  assert(tree);
  assert(compareKeys);

  tree->newNode = newNode;
  tree->updateNode = updateNode;
  tree->eraseNode = eraseNode;
  tree->compareKeys = compareKeys;
  tree->root = NULL;
}

// compareKeys is required, but the others can be passed as NULL
RbTree *rbTreeNew(RbNewFn newNode, RbUpdateFn updateNode, RbEraseFn eraseNode,  RbCmpKeyFn compareKeys)
{
  RbTree *tree = malloc(sizeof(RbTree));
  assert(tree);

  tree->newNode = newNode;
  tree->updateNode = updateNode;
  tree->eraseNode = eraseNode;
  tree->compareKeys = compareKeys;
  tree->root = NULL;
  return tree;
}

void rbTreeFreeEmbedded(RbTree *tree)
{
  if (tree)
  {
    if (tree->root)
    {
      RbNode *it = tree->root;
      RbNode *save;

      // Rotate away the left links so that
      // we can treat this like the destruction
      // of a linked list
      while (it != NULL)
      {
        if (it->link[0] == NULL)
        {
          // No left links, just kill the node and move on
          save = it->link[1];

          if (tree->eraseNode)
            tree->eraseNode (it->key, it->value);

          free (it);
        }
        else // Rotate away the left link and check again
        {
          save = it->link[0];
          it->link[0] = save->link[1];
          save->link[1] = it;
        }

        it = save;
      }

      tree->root = NULL;
    }
  }
}


void rbTreeFree(RbTree *tree)
{
  if (tree)
  {
    rbTreeFreeEmbedded(tree);
    free(tree);
  }
}
