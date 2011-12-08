package org.webinos.api.nfc;

import org.meshpoint.anode.idl.ValueType;

public class NdefRecord implements ValueType {
	public int type;
	public String textPayload;
	public byte[] binaryPayload;
}
