// Firebase initialization
// Jack's FB environment
var fb = new Firebase("https://clickerprj.firebaseio.com/");

angular.module('app', ['ionic', 'app.controllers', 'app.services', 'firebase','monospaced.qrcode','ngCordova'])

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

.config(function($stateProvider, $urlRouterProvider) {

  $stateProvider
    .state('login', {
      url: '/login',
      templateUrl: 'templates/login.html',
      controller: 'loginController'
    })
    .state('signup', {
      url: '/signup',
      templateUrl: 'templates/signup.html',
      controller: 'signupController'
    })
    .state('grouplist', {
      url: '/grouplist',
      templateUrl: 'templates/grouplist.html',
      controller: 'groupListController'
    })
    .state('group', {
        url: '/grouplist',
        templateUrl: 'templates/group.html',
        controller: 'groupController',
        params: {
          grp_key: null,
          grp_name: null
        }
    });

  // if none of the above states are matched, use this as the fallback
  $urlRouterProvider.otherwise('/login');

});
