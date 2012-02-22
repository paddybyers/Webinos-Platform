this.Param = (function() {

  /* public constructor */
  function Param(name, value) {

    /* public instance variables */
    this.name = name;
    this.value = value;
  }
  
  Param.serialize = {
    name: 'string',
    value: 'string'
  };

  return Param;
})();
