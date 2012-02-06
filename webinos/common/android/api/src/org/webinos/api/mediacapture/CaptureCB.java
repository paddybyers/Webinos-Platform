package org.webinos.api.mediacapture;

import org.webinos.api.File;

public interface CaptureCB {
	void onSuccess (File[] capturedMedia);
}
