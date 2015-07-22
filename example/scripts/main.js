(function configRequireJS() {
  requirejs.config({
    //By default load any module IDs from js/lib
    baseUrl: '..'
  });

  require(['navigation_simulator'], function(NavigationSimulator) {
    new NavigationSimulator();
  });
})();
