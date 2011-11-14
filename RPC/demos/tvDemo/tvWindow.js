Ext.define('WebDemo.TVWindow', {
    extend: 'Ext.ux.desktop.Module',

    uses: [
        'Ext.ux.desktop.Video'
    ],

    id:'video',
    windowId: 'video-window',

    tipWidth: 160,
    tipHeight: 96,

    init : function(){
        this.launcher = {
            text: 'TV Window',
            iconCls:'tv-icon',
            handler : this.createWindow,
            scope: this
        }
    },

    createWindow : function(){
        var me = this, desktop = me.app.getDesktop(),
            win = desktop.getWindow(me.windowId);

        if (!win) {
            win = desktop.createWindow({
                id: me.windowId,
                title: this.launcher.text,
                width: 320,
                height: 240,
                iconCls: this.launcher.iconCls,
                animCollapse: false,
                border: false,

                layout: 'fit',
                items: [
                    {
                        xtype: 'video',
                        id: 'video-player',
                        src: [],
                        autobuffer: true,
                        autoplay : true,
                        controls : true,
			loop: true,
                        /* default */
                        listeners: {
                            afterrender: function(video) {
                                me.videoEl = video.video.dom;

                                if (video.supported) {
                                    me.tip = new Ext.tip.ToolTip({
                                        anchor   : 'bottom',
                                        dismissDelay : 0,
                                        height   : me.tipHeight,
                                        width    : me.tipWidth,
                                        renderTpl: [
                                            '<canvas width="', me.tipWidth,
                                                  '" height="', me.tipHeight, '">'
                                        ],
                                        renderSelectors: {
                                            body: 'canvas'
                                        },
                                        listeners: {
                                            afterrender: me.onTooltipRender,
                                            show: me.renderPreview,
                                            scope: me
                                        }
                                    }); // tip
                                }
                            }
                        }
                    }
                ],
		dockedItems: [
                {
                    xtype: 'toolbar',
                    height: 32,
                    anchor: '100%',
                    dock: 'top',
                    items: [
                        {
                            xtype: 'label',
			    id: 'tvSourceLabel',
                            text: Abot.TV.currentSourceName
                        },
                        {
                            xtype: 'tbfill',
                            height: 10
                        },
                        {
                            xtype: 'label',
			    id: 'channelNameLabel',
                            text: Abot.TV.currentChannelName
                        }
                    ]
                }
		],
                listeners: {
                    beforedestroy: function() {
                        me.tip = me.ctx = me.videoEl = null;
                    }
                }
            });
        }

        win.show();

        if (me.tip) {
            me.tip.setTarget(win.taskButton.el);
        }
        
        if (Abot.TV.currentStream)
	  Ext.getCmp('video-player').setSrc(Abot.TV.currentStream);

        return win;
    },

    onTooltipRender: function (tip) {
        // get the canvas 2d context
        var el = tip.body.dom, me = this;
        me.ctx = el.getContext && el.getContext('2d');
    },

    renderPreview: function() {
        var me = this;

        if ((me.tip && !me.tip.isVisible()) || !me.videoEl) {
            return;
        }

        if (me.ctx) {
            try {
                me.ctx.drawImage(me.videoEl, 0, 0, me.tipWidth, me.tipHeight);
            } catch(e) {};
        }

        // 20ms to keep the tooltip video smooth
        Ext.Function.defer(me.renderPreview, 20, me);
    }
});

