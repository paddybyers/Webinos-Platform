package org.webinos.api.widgetmanager;

import org.meshpoint.anode.bridge.Env;
import org.meshpoint.anode.java.Base;

public abstract class PrepareListener extends Base {
	private static short classId = Env.getInterfaceId(PrepareListener.class);
	protected PrepareListener() { super(classId); }

	public abstract void onPrepareComplete(ProcessingResult processingResult);
}
