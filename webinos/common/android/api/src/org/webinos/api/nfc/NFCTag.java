package org.webinos.api.nfc;

import org.meshpoint.anode.idl.ValueType;

public class NFCTag implements ValueType {
	public byte[] tagId;
	public NFCTagTechnology[] techList;
}
