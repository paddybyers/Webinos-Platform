this.Icon = (function() {

  /* public constructor */
  function Icon(path) {    

    /* public instance variables */
    this.path = path;
    this.width = -1;
    this.height = -1;
  }

  Icon.serialize = {
    path: 'string',
    width: 'number',
    height: 'number'
  };

  return Icon;
})();