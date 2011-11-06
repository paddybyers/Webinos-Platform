Ext.define('WebDemo.LogsWindow', {
    extend: 'Ext.ux.desktop.Module',
    id: 'win-logs',

    init: function () {
        this.sidelauncher = {
            text: 'Logs',
            iconCls: 'logs-icon',
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
    height: 642,
    width: 592,
    layout: {
        type: 'fit'
    },
    title: 'GUI Logs',
    id: this.id,
    iconCls: this.sidelauncher.iconCls,
    items: [
        {
            xtype: 'gridpanel',
            autoScroll: true,
            enableColumnHide: false,
            enableColumnMove: false,
            forceFit: true,
            store: 'LogsStore',
            columns: [
                {
                    xtype: 'datecolumn',
                    width: 40,
                    dataIndex: 'timestamp',
                    text: 'Time stamp',
		    format: 'H:i:s.u'
                },
                {
                    xtype: 'gridcolumn',
                    dataIndex: 'logEntry',
                    text: 'LogEntry'
                }
            ],
            viewConfig: {

            }
        }
    ]
});
        }
        win.show();
        return win;
    }
});