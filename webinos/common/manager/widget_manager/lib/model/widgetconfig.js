this.WidgetConfig = (function() {
	
  /* public constructor */
  function WidgetConfig() {}

  /* public static variables */
  WidgetConfig.STATUS_TRANSIENT_ERROR  =  -4;
  WidgetConfig.STATUS_IO_ERROR         =  -3;
  WidgetConfig.STATUS_CAPABILITY_ERROR =  -2;
  WidgetConfig.STATUS_INTERNAL_ERROR   =  -1;
  WidgetConfig.STATUS_OK               =   0;
  WidgetConfig.STATUS_INVALID          =   1;
  WidgetConfig.STATUS_DENIED           =   2;
  WidgetConfig.STATUS_REVOKED          =   3;
  WidgetConfig.STATUS_UNSIGNED         = 100;
  WidgetConfig.STATUS_VALID            = 101;
  
  WidgetConfig.serialize = {
    author            : { name : LocalisableString, email: 'string', href: 'string' },
    prefIcon          : 'string',
    icons             : [ 'string' ],
    startFile         : { path: 'string', encoding: 'string', contentType: 'string' },
    description       : LocalisableString,
    height            : 'number',
    width             : 'number',
    id                : 'string',
    license           : { text: LocalisableString, file: 'string', href: 'string' },
    name              : LocalisableString,
    shortName         : LocalisableString,
    version           : VersionString,
    windowModes       : [ 'string' ],
    defaultLocale     : 'string',
    installId         : 'string',
    origin            : Origin
  };

  return WidgetConfig;
})();
