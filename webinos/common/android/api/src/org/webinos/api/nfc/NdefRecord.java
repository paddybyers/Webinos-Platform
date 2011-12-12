package org.webinos.api.nfc;

import org.meshpoint.anode.idl.Dictionary;

public class NdefRecord implements Dictionary {
	public int type;
	public String textPayload;
	public byte[] binaryPayload;
}
