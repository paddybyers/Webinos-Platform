this.CertificateManager = (function() {

  /* private static variables */
  var theManager = new CertificateManager();

  /* public constructor */
  function CertificateManager() {
  }

  /* public static functions */
  CertificateManager.get = function() {
    return theManager;
  };

  return CertificateManager;
})();
