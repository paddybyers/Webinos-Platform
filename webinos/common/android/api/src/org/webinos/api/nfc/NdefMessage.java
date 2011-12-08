package org.webinos.api.nfc;

import org.meshpoint.anode.bridge.Env;
import org.meshpoint.anode.idl.IDLInterface;
import org.meshpoint.anode.java.Base;

public abstract class NdefMessage extends Base {
	private static IDLInterface iface = Env.getCurrent().getInterfaceManager().getByName(NdefMessage.class.getName());
	protected NdefMessage() { super(iface); }

	public static final int NDEFRECTYPE_UNKNOWN = 0;
	public static final int NDEFRECTYPE_URI = 1;
	public static final int NDEFRECTYPE_MEDIA = 2;
	public static final int NDEFRECTYPE_EMPTY = 3;
	public static final int NDEFRECTYPE_RTD = 4;
	public static final int NDEFRECTYPE_EXTERNALRTD = 5;

	public NdefRecord[] ndefRecords;

	public abstract void addTextNdefRecord(int type, String payload) throws NfcError;
	public abstract void addBinaryNdefRecord(int type, byte[] payload) throws NfcError;
}
