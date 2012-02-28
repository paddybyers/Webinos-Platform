package org.webinos.app.wrt.channel;

import org.meshpoint.anode.bridge.Env;
import org.meshpoint.anode.java.Base;

public abstract class WebinosSocket extends Base {
	private static short classId = Env.getInterfaceId(WebinosSocket.class);
	protected WebinosSocket(Env env) { super(classId, env); }

	public abstract void send(String message);
	public WebinosSocketListener listener;
	public String installId;
	public String instanceId;
}
