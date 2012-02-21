package org.webinos.app.wrt.channel;

import org.meshpoint.anode.bridge.Env;
import org.meshpoint.anode.java.Base;

public abstract class WebinosSocketServer extends Base {
	private static short classId = Env.getInterfaceId(WebinosSocketServer.class);
	protected WebinosSocketServer() { super(classId); }

	public WebinosSocketServerListener listener;
}
