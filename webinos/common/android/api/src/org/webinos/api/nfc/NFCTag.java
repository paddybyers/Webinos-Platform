package org.webinos.api.nfc;

import org.meshpoint.anode.idl.Dictionary;

public class NFCTag implements Dictionary {
	public byte[] tagId;
	public NFCTagTechnology[] techList;
}
