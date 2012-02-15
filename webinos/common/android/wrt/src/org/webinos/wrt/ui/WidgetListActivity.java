package org.webinos.wrt.ui;

import java.io.File;

import org.webinos.wrt.core.WrtManager;
import org.webinos.wrt.core.WrtReceiver;

import android.app.ListActivity;
import android.content.Context;
import android.content.Intent;
import android.os.Bundle;
import android.view.View;
import android.widget.ListView;

public class WidgetListActivity extends ListActivity implements WrtManager.LaunchListener {
	public void onCreate(Bundle bundle) {
		super.onCreate(bundle);

		WrtManager wrtManager = WrtManager.getInstance(this, this);
		if(wrtManager != null)
			initList();
	}

	@Override
	protected void onListItemClick(ListView l, View v, int position, long id) {
		String item = (String) getListAdapter().getItem(position);
		Context ctx = getApplicationContext();
		Intent wrtIntent = new Intent(WrtReceiver.ACTION_START);
		wrtIntent.setClassName(ctx, RendererActivity.class.getName());
		wrtIntent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK);
		wrtIntent.putExtra(WrtReceiver.ID, item);
		ctx.startActivity(wrtIntent);
	}

	public void onLaunch(WrtManager service) {
		initList();
	}

	private void initList() {
		String[] ids = (new File(WrtManager.getInstance().getWrtDir())).list();
		setListAdapter(new WidgetListAdapter(this, ids));
	}
}
