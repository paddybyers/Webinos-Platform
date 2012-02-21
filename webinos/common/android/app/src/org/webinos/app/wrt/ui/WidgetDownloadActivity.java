package org.webinos.app.wrt.ui;

import java.io.File;
import java.io.IOException;
import java.net.URI;
import java.net.URISyntaxException;

import org.webinos.app.R;
import org.webinos.util.ModuleUtils;

import android.app.Activity;
import android.app.ProgressDialog;
import android.content.Intent;
import android.net.Uri;
import android.os.AsyncTask;
import android.os.Bundle;
import android.util.Log;

public class WidgetDownloadActivity extends Activity {
	private ProgressDialog downloadProgressDialog;
	private static final String TAG = "org.webinos.impl.widgetmanager.WidgetDownloadActivity";

	@Override
	protected void onCreate(Bundle savedInstanceState) {
		super.onCreate(savedInstanceState);
		Uri downloadUri = getIntent().getData();
		if(downloadUri == null)
			throw new RuntimeException("WidgetDownloadActivity.onCreate(): unable to get data URI");

		if (downloadUri.getScheme().equals("file")) {
			installFromFile(downloadUri.getPath());
			finish();
			return;
		}

		(new AsyncTask<String, Integer, File>() {
			@Override
			protected void onPreExecute() {
				super.onPreExecute();
				showProgressDialog(getString(R.string.downloading_widget));
			}

			@Override
			protected File doInBackground(String... params) {
				String downloadUri = params[0];
				String downloadPath = ModuleUtils.getResourceUriHash(downloadUri);
				try {
					return ModuleUtils.getResource(new URI(downloadUri), downloadPath);
				} catch(IOException e) {
					Log.v(TAG, "WidgetDownloadActivity: aborting (unable to download resource); exception: " + e + "; resource = " + downloadUri);
				} catch(URISyntaxException e) {
					Log.v(TAG, "WidgetDownloadActivity: aborting (invalid URI specified for resource); exception: " + e + "; resource = " + downloadUri);
				}
				return null;
			}

			@Override
			protected void onPostExecute(File wgtResource) {
				dismissProgressDialog();
				installFromFile(wgtResource.getAbsolutePath());
				wgtResource.delete();
				finish();
			}
		}).execute(downloadUri.toString());
	}

	private void installFromFile(String path) {
		Intent installIntent = new Intent();
		installIntent.setClass(this, WidgetInstallActivity.class);
		installIntent.putExtra("path", path);
		startActivityForResult(installIntent, 0);
	}

	public void showProgressDialog(String message) {
		if(downloadProgressDialog != null)
			downloadProgressDialog.dismiss();

		downloadProgressDialog = new ProgressDialog(this);
		downloadProgressDialog.setIndeterminate(true);
		downloadProgressDialog.setMessage(message);
		downloadProgressDialog.show();
	}

	public void dismissProgressDialog() {
		if (downloadProgressDialog != null)
			downloadProgressDialog.dismiss();
		downloadProgressDialog = null;
	}
}
