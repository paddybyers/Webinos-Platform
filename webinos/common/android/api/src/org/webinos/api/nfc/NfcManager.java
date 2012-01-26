package org.webinos.api.nfc;

import org.meshpoint.anode.bridge.Env;
import org.meshpoint.anode.java.Base;

public abstract class NfcManager extends Base {
	private static short classId = Env.getInterfaceId(NfcManager.class);
	protected NfcManager() { super(classId); }

	public abstract void addEventListener(String type, NfcEventListener listener, boolean useCapture);
	public abstract void removeEventListener(String type, NfcEventListener listener, boolean useCapture);
}
