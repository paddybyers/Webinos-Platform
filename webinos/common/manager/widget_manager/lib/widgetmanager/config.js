this.Dimension = (function() {
  function Dimension(width, height) {
    this.width = width;
    this.height = height;
  }
  return Dimension;
})();

this.Config = (function() {

  /* private static variables */
  var currentConfig;

  var supported = {
    encodings: [
      'utf-8',
      'iso-8859-1'
    ],
    startfileTypes: [
      'text/html',
      'text/plain',
      'application/xhtml+xml'
    ],
    iconTypes: [
      'image/png',
      'image/gif',
      'image/jpeg'
    ],
    viewModes: [
      WidgetConfig.MODE_MAXIMIZED,
      WidgetConfig.MODE_FLOATING,
      WidgetConfig.MODE_MINIMIZED,
      WidgetConfig.MODE_FULL_SCREEN
    ]
  };
  
  var wrtHome = process.env.WRT_HOME;
  if(!wrtHome) {
	  /* FIXME: remove nasty hack */
	  if(process.platform == 'android')
		  wrtHome = '/data/data/org.webinos.app/wrt';
	  else
		  throw new Error('widgetmanager.Config: FATAL ERROR: WRT_HOME not configured');
  }

  /* public constructor */
  function Config(args) {
    
    /* public instance variables */
    this.capabilities        = supported;
    this.iconSize            = new Dimension(128, 128);
    this.w3cTestMode         = false;
    this.locales             = ['en'];
    this.certificateMgr      = CertificateManager.get();
    this.processSignatures   = true;
    this.processPolicy       = true;
    this.processOCSP         = true;
    this.authorIdentityCheck = true;
    this.wrtHome             = wrtHome;
  }

  /* public static variables */
  Config.defaultConfig = new Config();

  /* public static functions */
  Config.set = function(config) {
    currentConfig = config;
  };

  Config.get = function() {
    if(!currentConfig)
      currentConfig = Config.defaultConfig;
    return currentConfig;
  };

  return Config;
})();
