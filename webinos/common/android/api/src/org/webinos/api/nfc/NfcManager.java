package org.webinos.api.nfc;
import org.meshpoint.anode.bridge.Env;
import org.meshpoint.anode.idl.IDLInterface;
import org.meshpoint.anode.java.Base;

public abstract class NfcManager extends Base {
	private static IDLInterface iface = Env.getCurrent().getInterfaceManager().getByName(NfcManager.class.getName());
	protected NfcManager() { super(iface); }

	public abstract void addEventListener(String type, NfcEventListener listener, boolean useCapture);
	public abstract void removeEventListener(String type, NfcEventListener listener, boolean useCapture);
}
