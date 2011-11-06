Ext.define('WebDemo.LogsStore', {
    extend: 'Ext.data.Store',

    constructor: function(cfg) {
        var me = this;
        cfg = cfg || {};
        me.callParent([Ext.apply({
            storeId: 'LogsStore',
            fields: [
                {
                    name: 'timestamp',
                    type: 'date'
                },
                {
                    name: 'logEntry',
                    type: 'string'
                }
            ],
	    data: []
        }, cfg)]);
    }
});