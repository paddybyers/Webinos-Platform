this.WidgetStorage = (function() {
  var fs = require('fs');
  var path = require('path');

  /* private static variables */
  var WGT_FILE         = '.wgt',
      CONFIG_FILE      = '.config',
      PREFERENCES_FILE = '.preferences',
      FEATURES_FILE    = '.features',
      WARP_FILE        = '.warp',
      POLICY_FILE      = '.policy',
      OCSP_FILE        = '.ocsp',
      CERT_DIR         = '.cert',
      PERSIST_DIR      = '.persist';

  var DELETE_TMP       = '.deleting',
      EXTRACT_DIR      = 'wgt',
      DISABLED_CHAR    = '_';

  /* public constructor */
  function WidgetStorage(rootPath) {
    this.rootPath = ManagerUtils.mkdirs(rootPath);
  }

  /* public static variables */
  WidgetStorage.WGT_FILE         = WGT_FILE;
  WidgetStorage.CONFIG_FILE      = CONFIG_FILE;
  WidgetStorage.PREFERENCES_FILE = PREFERENCES_FILE;
  WidgetStorage.FEATURES_FILE    = FEATURES_FILE;
  WidgetStorage.WARP_FILE        = WARP_FILE;
  WidgetStorage.POLICY_FILE      = POLICY_FILE;
  WidgetStorage.OCSP_FILE        = OCSP_FILE;
  WidgetStorage.CERT_DIR         = CERT_DIR;

  /* public instance methods */
  WidgetStorage.prototype.createItem = function(item) {
    var dir = this.getItemDir(item, false);
    if(path.existsSync(dir))
    	ManagerUtils.deleteDir(dir);
    ManagerUtils.mkdirs(dir);
  };

  WidgetStorage.prototype.deleteItem = function(item) {
    var dir = this.getItemDir(item, false);
	if(!path.existsSync(dir)) {
      dir = this.getItemDir(item, true);
      if(!path.existsSync(dir))
        throw new Error('WidgetStorage.deleteItem ' + item + ": item doesn't exist");
	}
	/* atomically rename to remove this from visibility of the manager */
	var deleteTmpDir = path.resolve(this.rootPath, DELETE_TMP);
	if(path.existsSync(deleteTmpDir))
	  ManagerUtils.deleteDir(deleteTmpDir);
	fs.renameSync(dir, deleteTmpDir);

	/* remove */
	ManagerUtils.deleteDir(deleteTmpDir);
  };

  WidgetStorage.prototype.containsItem = function(item) {
    var dir = this.getItemDir(item, false);
    var result = path.existsSync(dir);
	if(!result) {
      dir = this.getItemDir(item, true);
      result = path.existsSync(dir);
	}
    return result;
  };

  WidgetStorage.prototype.setItemEnabled = function(item, newState, copyUserdata) {
    var newStateDir = this.getItemDir(item, newState);
    var oldState = !newState;
    var oldStateDir = this.getItemDir(item, oldState);
    var newStateExists = path.existsSync(newStateDir);
    var oldStateExists = path.existsSync(oldStateDir);

    /* work out what action to do ... */
    if(!oldStateExists) {
      if(newStateExists) {
        /* if solely the new state exists, then do nothing */
        return;
      }
      /* else neither exists, which is an error */
      throw new Error('WidgetStorage.setItemEnabled ' + item + ": item doesn't exist");
	}

    /* so work out if this is a simple upgrade or a reinstall */
    if(newStateExists) {
      /* a reinstall */
      if (copyUserdata) {
        var oldUserData = path.resolve(oldStateDir, PERSIST_DIR);
        var newUserData = path.resolve(newStateDir, PERSIST_DIR);
        if(path.existsSync(oldUserData) && path.existsSync(newUserData))
          ManagerUtils.copyDir(newUserData, oldUserData);

		/* remove the new state now */
		ManagerUtils.deleteDir(newStateDir);
	  }
	}
	/* rename */
	fs.rename(oldStateDir, newStateDir);
  };

  WidgetStorage.prototype.getMetaFile = function(item, name, isDir) {
    var metaFile = path.resolve(this.getMetadataDir(item), name);
    if(!path.existsSync(metaFile)) {
      if(isDir)
        fs.mkdirSync(metaFile);
      else
        fs.writeFileSync(metaFile, '');
    }
    return metaFile;
  };

  WidgetStorage.prototype.listItems = function() {
    var allItems = fs.readdirSync(this.rootPath);
    var result = [];
    for(var i in allItems) {
      if(allItems[i].length == WidgetProcessor.HASH_LEN)
        result.push(allItems[i]);
    }
    return result;
  };

  WidgetStorage.prototype.getWidgetResource = function(item) {
	/* FIXME: move this to a separately configured location */
    return new DirectoryWidgetResource(this.getContentDir(item));
  };

  WidgetStorage.prototype.getWidgetDir = function(item) {
    return this.getContentDir(item);
  };

  WidgetStorage.prototype.getMetadataDir = function(item) {
	/* FIXME: move this to a separately configured location */
    return this.getItemDir(item);
  };

  WidgetStorage.prototype.hasUserdata = function(item) {
    /* FIXME: return a value depending on actual usage */
    return true;
  };

  WidgetStorage.prototype.getItemDir = function(item, enabled) {
    if(arguments.length >= 2)
      return path.resolve(this.rootPath, (item + (enabled ? '' : DISABLED_CHAR)));

    var dir = this.getItemDir(item, false);
    if(!path.existsSync(dir)) {
      dir = this.getItemDir(item, true);
      if(!path.existsSync(dir))
        throw new Error('WidgetStorage.getItemDir: ' + item + ": item doesn't exist");
    }
    return dir;
  };

  WidgetStorage.prototype.getContentDir = function(item) {
    var wgtDir = path.resolve(this.getItemDir(item), EXTRACT_DIR);
	if(!path.existsSync(wgtDir))
	  fs.mkdirSync(wgtDir);

	return wgtDir;
  };

  return WidgetStorage;
})();
