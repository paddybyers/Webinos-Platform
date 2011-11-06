Ext.define('WebDemo.ContextStore', {
    extend: 'Ext.data.Store',

    constructor: function(cfg) {
        var me = this;
        cfg = cfg || {};
        me.callParent([Ext.apply({
            storeId: 'ContextStore',
            fields: [
                {
                    name: 'channel',
                    type: 'string'
                },
                {
                    name: 'frequency',
                    type: 'number'
                }
            ],
           data: []
        }, cfg)]);
    }
});
