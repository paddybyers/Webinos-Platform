/* 
 * This file will provide support for the Gnome Keyring in ubuntu
 * Designed to take advantage of the credential storage already provided.
 *
 * THIS IS CURRENTLY INCOMPLETE AND DOES NOT DO ANYTHING
 *
 * All methods return success results, where 0 = success.
 *
 */



#include <stdlib.h>
#include <stdio.h>
 
#include <glib.h>
#include "gnome-keyring.h"
 
 
#define APPLICATION_NAME "webinos"
#define MAX_PASSWORD_LENGTH 100

#define NOT_SUPPORTED_ERROR 5 

/*
 * Stores a password with the given label in the keyring.
 * Note: passwords should be held in secure memory objects.
 */ 
int store_password( char* label, char* password ) {
    return NOT_SUPPORTED_ERROR;
}
/*
 * Retrieves a password with the given label from the keyring.
 * Note: passwords should be held in secure memory objects.
 */ 
int retrieve_password( char* label, char** password ) {
    return NOT_SUPPORTED_ERROR;
}

/*
 * Create a new key in the keystore, with the assigned label.
 */ 
int create_key( char* label, char* params, Key** key) {
    return NOT_SUPPORTED_ERROR;
}

/*
 * Is the key with this label present in the key store?
 */
bool is_key_present(char* label) {
    return NOT_SUPPORTED_ERROR;
}



