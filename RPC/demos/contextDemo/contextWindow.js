Ext.define('WebDemo.ContextWindow', {
    extend: 'Ext.ux.desktop.Module',
    id: 'win-context',

    init: function () {
        this.sidelauncher = {
            text: 'Context',
            iconCls: 'context-icon',
            handler: this.createWindow,
            scope: this
        };
    },

    createWindow: function () {
        var desktop = this.app.getDesktop();
        var win = desktop.getWindow(this.id);
        if (!win) {
            win = desktop.createWindow({
    xtype: 'window',
    height: 526,
    width: 200,
    layout: {
        type: 'fit'
    },
     id: this.id,
     title: this.sidelauncher.text,
     iconCls: this.sidelauncher.iconCls,
    items: [
        {
            xtype: 'gridpanel',
	    id: 'contextGrid',
            title: 'Channel\'s usage statistics',
	    forceFit: true,
            store: 'ContextStore',
            columns: [
                {
                    xtype: 'gridcolumn',
                    dataIndex: 'channel',
                    text: 'Channel Name'
                },
                {
                    xtype: 'numbercolumn',
                    dataIndex: 'frequency',
                    text: 'Frequency',
		    width: 50
                }
            ]
        }
    ],
    dockedItems: [
        {
            xtype: 'toolbar',
            dock: 'top',
            items: [
                {
                    xtype: 'button',
		    id: 'cmdGetContextData',
                    text: 'Retrieve channels\' usage statistics',
		    handler: Abot.Context.getChannelsFrequency
                }
            ]
        }
    ]
});
        }
        win.show();
        return win;
    },
    loadingResults: function(){
      if (Ext.getCmp('contextGrid')){
	Ext.getCmp('contextGrid').body.mask();
	Ext.getCmp('cmdGetContextData').disable();
      }
    },
    loadingFinished: function(){
      if (Ext.getCmp('contextGrid')){
	Ext.getCmp('contextGrid').body.unmask();
        Ext.getCmp('cmdGetContextData').enable();
      }
    }
});
