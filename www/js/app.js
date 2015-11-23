// Firebase initialization
// Jack's FB environment
var fb = new Firebase("https://clickerprj.firebaseio.com/");

angular.module('app', ['ionic', 'app.controllers', 'app.routes', 'app.services', 'app.directives', 'firebase'])

.run(function($ionicPlatform) {
  $ionicPlatform.ready(function() {
    if(window.cordova && window.cordova.plugins.Keyboard) {
      cordova.plugins.Keyboard.hideKeyboardAccessoryBar(true);
    }
    if(window.StatusBar) {
      StatusBar.styleDefault();
    }
  });
})