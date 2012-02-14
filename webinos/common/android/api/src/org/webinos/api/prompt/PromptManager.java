package org.webinos.api.prompt;

import org.meshpoint.anode.bridge.Env;
import org.meshpoint.anode.java.Base;
import org.webinos.api.DeviceAPIError;

public abstract class PromptManager extends Base {
	private static short classId = Env.getInterfaceId(PromptManager.class);
	protected PromptManager() { super(classId); }

	public abstract int display(String message, String[] choice) throws DeviceAPIError;
}
