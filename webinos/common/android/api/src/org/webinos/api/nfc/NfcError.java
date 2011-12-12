package org.webinos.api.nfc;

import org.meshpoint.anode.idl.Dictionary;

@SuppressWarnings("serial")
public class NfcError extends Exception implements Dictionary {
	public static final int UNKNOWN_ERR = 0;
	public static final int IO_ERR = 1;

	public int code;
	public String message;
}
