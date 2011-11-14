Ext.define('WebDemo.ContactsStore', {
    extend: 'Ext.data.Store',

    constructor: function(cfg) {
        var me = this;
        cfg = cfg || {};
        me.callParent([Ext.apply({
            storeId: 'ContactsStore',
            fields: [
                {
                    name: 'fldContactEmail',
                    type: 'string'
                },
                {
                    name: 'fldContactImage',
                    type: 'string'
                },
                {
                    name: 'fldContactPhones',
                    type: 'string'
                },
                {
                    name: 'fldContactName',
                    type: 'string'
                }
            ],
           data: []
        }, cfg)]);
    }
});
