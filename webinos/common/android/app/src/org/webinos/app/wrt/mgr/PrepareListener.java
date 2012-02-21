package org.webinos.app.wrt.mgr;

import org.meshpoint.anode.bridge.Env;
import org.meshpoint.anode.java.Base;

public abstract class PrepareListener extends Base {
	private static short classId = Env.getInterfaceId(PrepareListener.class);
	protected PrepareListener(Env env) { super(classId, env); }

	public abstract void onPrepareComplete(ProcessingResult processingResult);
}
