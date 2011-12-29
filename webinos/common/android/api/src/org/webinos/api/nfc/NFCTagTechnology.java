package org.webinos.api.nfc;

import org.meshpoint.anode.bridge.Env;
import org.meshpoint.anode.java.Base;

public abstract class NFCTagTechnology extends Base {
	private static short classId = Env.getInterfaceId(NFCTagTechnology.class);
	protected NFCTagTechnology() { super(classId); }

	public static final int TECH_OTHERS = 0;
	public static final int TECH_NFCA = 1;
	public static final int TECH_NFCB = 2;
	public static final int TECH_NFCF = 3;
	public static final int TECH_NFCV = 4;
	public static final int TECH_ISODEP = 5;
	public static final int TECH_NDEF = 6;

	public int type;
	public boolean isConnected;

	public abstract void connect();
	public abstract void close();	
}
