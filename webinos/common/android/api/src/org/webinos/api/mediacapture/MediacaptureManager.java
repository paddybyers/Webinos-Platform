package org.webinos.api.mediacapture;

import org.meshpoint.anode.bridge.Env;
import org.meshpoint.anode.idl.IDLInterface;
import org.meshpoint.anode.java.Base;
import org.w3c.dom.ObjectArray;
import org.webinos.api.PendingOperation;

public abstract class MediacaptureManager extends Base {
	private static IDLInterface iface = Env.getCurrent().getInterfaceManager().getByClass(MediacaptureManager.class);
	protected MediacaptureManager() { super(iface); }

	public ObjectArray<MediaFileData> supportedImageFormats;
	public ObjectArray<MediaFileData> supportedVideoFormats;
	public ObjectArray<MediaFileData> supportedAudioFormats;
	public abstract PendingOperation captureImage (CaptureCB successCB, CaptureErrorCB errorCB, CaptureMediaOptions options);
	public abstract PendingOperation captureVideo (CaptureCB successCB, CaptureErrorCB errorCB, CaptureVideoOptions options);
	public abstract PendingOperation captureAudio (CaptureCB successCB, CaptureErrorCB errorCB, CaptureMediaOptions options);
}
