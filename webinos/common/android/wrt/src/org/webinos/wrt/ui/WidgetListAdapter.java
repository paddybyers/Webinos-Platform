package org.webinos.wrt.ui;

import org.webinos.wrt.R;
import org.webinos.wrt.core.WidgetConfig;
import org.webinos.wrt.core.WrtManager;

import android.content.Context;
import android.graphics.drawable.Drawable;
import android.view.LayoutInflater;
import android.view.View;
import android.view.ViewGroup;
import android.widget.ArrayAdapter;
import android.widget.ImageView;
import android.widget.TextView;

public class WidgetListAdapter extends ArrayAdapter<String> {
	private final Context context;
	private final String[] values;

	public WidgetListAdapter(Context context, String[] values) {
		super(context, R.layout.rowlayout, values);
		this.context = context;
		this.values = values;
	}

	@Override
	public View getView(int position, View convertView, ViewGroup parent) {
		LayoutInflater inflater = (LayoutInflater) context
				.getSystemService(Context.LAYOUT_INFLATER_SERVICE);
		View rowView = inflater.inflate(R.layout.rowlayout, parent, false);
		TextView labelView = (TextView) rowView.findViewById(R.id.label);
		TextView detailView = (TextView) rowView.findViewById(R.id.detail);
		ImageView imageView = (ImageView) rowView.findViewById(R.id.icon);
		
		String installId = values[position];
		
		/* decide what to show as the main label text */
		WidgetConfig widgetConfig = WrtManager.getInstance().getWidgetConfig(installId);
		String labelText = widgetConfig.getConfig().getProperty("widget.name.visual");
		if(labelText == null || labelText.isEmpty()) {
			labelText = widgetConfig.getConfig().getProperty("widget.shortName.visual");
			if(labelText == null || labelText.isEmpty()) {
				labelText = widgetConfig.getConfig().getProperty("widget.id");
				if(labelText == null || labelText.isEmpty()) {
					labelText = "Untitled";	
				}
			}
		}
		labelView.setText(labelText);

		/* decide what to show as the detail label text */
		String descriptionText = widgetConfig.getConfig().getProperty("widget.description.visual");
		if(descriptionText == null) descriptionText = "";
		String authorText = widgetConfig.getConfig().getProperty("widget.author.name.visual");
		if(authorText == null || authorText.isEmpty()) {
			authorText = widgetConfig.getConfig().getProperty("widget.author.href");
			if(authorText == null) authorText = "";
		}
		String versionText = widgetConfig.getConfig().getProperty("widget.version.visual");
		if(versionText == null) versionText = "";

		String detailText = authorText;
		if(!versionText.isEmpty()) {
			if(!detailText.isEmpty()) detailText += " ";
			detailText += versionText;
		}
		if(!descriptionText.isEmpty()) {
			if(!detailText.isEmpty()) detailText += " ";
			detailText += descriptionText;
		}
		detailView.setText(detailText);

		/* decide what to show as the icon */
		String prefIcon = widgetConfig.getConfig().getProperty("widget.prefIcon");
		if(prefIcon == null || prefIcon.isEmpty()) {
			imageView.setImageResource(R.drawable.widget_icon);
		} else {
			imageView.setImageDrawable(Drawable.createFromPath(widgetConfig.getWidgetDir() + '/' + prefIcon));
		}

		return rowView;
	}
}
