angular.module('app.routes', [])

.config(function($stateProvider, $urlRouterProvider) {

  // Ionic uses AngularUI Router which uses the concept of states
  // Learn more here: https://github.com/angular-ui/ui-router
  // Set up the various states which the app can be in.
  // Each state's controller can be found in controllers.js
  $stateProvider
    
      
        
    .state('login', {
      url: '/login',
      templateUrl: 'templates/login.html',
      controller: 'loginCtrl'
    })
        
      
    
      
        
    .state('signUp', {
      url: '/signup',
      templateUrl: 'templates/signUp.html',
      controller: 'signUpCtrl'
    })
        
      
    
      
        
    .state('groups', {
      url: '/group',
      templateUrl: 'templates/groups.html',
      controller: 'groupsCtrl'
    })
        
      
    
      
        
    .state('items', {
      url: '/group/details',
      templateUrl: 'templates/items.html',
      controller: 'itemsCtrl'
    })
        
      
    
      
        
    .state('newGroup', {
      url: '/create',
      templateUrl: 'templates/newGroup.html',
      controller: 'newGroupCtrl'
    })
        
      
    ;

  // if none of the above states are matched, use this as the fallback
  $urlRouterProvider.otherwise('/login');

});