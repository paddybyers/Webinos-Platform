this.Preference = (function() {

  /* public constructor */
  function Preference(name, value, readonly) {

    /* public instance variables */
    this.name = name;
    this.value = value;
    this.readonly = readonly;
  }

  Preference.serialize = {
    name: 'string',
    value: 'string',
    readonly: 'boolean'
  };

  return Preference;
})();
