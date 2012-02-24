package org.webinos.util;

import java.io.File;
import java.io.FileOutputStream;
import java.io.IOException;
import java.io.InputStream;

import android.content.Context;

public class AssetUtils {
	
	public static final String ASSET_URI = "asset://";

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

	public static File writeAssetToFile(Context ctx, String assetName, String destinationFile) throws IOException {
		File destination = new File(destinationFile);
		if(!destination.getParentFile().exists())
			destination.getParentFile().mkdirs();
		if(destination.exists())
			destination.delete();
		InputStream is = null;
		FileOutputStream fos = null;
		try {
			is = ctx.getAssets().open(assetName);
			fos = new FileOutputStream(destination);
			int read;
			byte[] buf = new byte[65536];
			while((read = is.read(buf, 0, buf.length)) != -1) {
				fos.write(buf, 0, read);
			}
		} finally {
			if(is != null)
				is.close();
			if(fos != null)
				fos.close();
		}
		return destination;
	}
}
