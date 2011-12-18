/* This file has been automatically generated; do not edit */

package org.meshpoint.anode.stub.gen.platform;

public final class Org_webinos_api_mediacapture_MediacaptureManager {

	private static Object[] __args = new Object[3];

	public static Object[] __getArgs() { return __args; }

	static Object __invoke(org.webinos.api.mediacapture.MediacaptureManager inst, int opIdx, Object[] args) {
		Object result = null;
		switch(opIdx) {
		case 0: /* captureAudio */
			result = inst.captureAudio(
				(org.webinos.api.mediacapture.CaptureCB)args[0],
				(org.webinos.api.mediacapture.CaptureErrorCB)args[1],
				(org.webinos.api.mediacapture.CaptureMediaOptions)args[2]
			);
			break;
		case 1: /* captureImage */
			result = inst.captureImage(
				(org.webinos.api.mediacapture.CaptureCB)args[0],
				(org.webinos.api.mediacapture.CaptureErrorCB)args[1],
				(org.webinos.api.mediacapture.CaptureMediaOptions)args[2]
			);
			break;
		case 2: /* captureVideo */
			result = inst.captureVideo(
				(org.webinos.api.mediacapture.CaptureCB)args[0],
				(org.webinos.api.mediacapture.CaptureErrorCB)args[1],
				(org.webinos.api.mediacapture.CaptureVideoOptions)args[2]
			);
			break;
		default:
		}
		return result;
	}

}