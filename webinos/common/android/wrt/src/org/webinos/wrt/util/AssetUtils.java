package org.webinos.wrt.util;

import java.io.IOException;
import java.io.InputStream;

import android.content.Context;

public class AssetUtils {
	public static byte[] getAssetAsBuffer(Context ctx, String assetName) throws IOException {
		InputStream is = ctx.getAssets().open(assetName);
		int read, available, offset = 0;
		byte[] result = new byte[available = is.available()];
		while(available > 0 && (read = is.read(result, offset, available)) != -1) {
			offset += read;
			available = is.available();
			if(offset + available > result.length) {
				byte[] newResult = new byte[offset + available];
				System.arraycopy(result, 0, newResult, 0, offset);
				result = newResult;
			}
		}
		return result;
	}

	public static String getAssetAsString(Context ctx, String assetName) throws IOException {
		return getAssetAsString(ctx, assetName, "UTF8");
	}

	public static String getAssetAsString(Context ctx, String assetName, String encoding) throws IOException {
		return new String(getAssetAsBuffer(ctx, assetName), encoding);
	}
}
