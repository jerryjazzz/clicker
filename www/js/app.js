// Firebase initialization
// Production FB environment
// var fb = new Firebase("https://clickerprj.firebaseio.com/");
// Development FB environment
var fb = new Firebase("https://clicker-project-dev.firebaseio.com/");


angular.module('app', ['ionic', 'app.login', 'app.signup', 'app.dash',
  'app.members','app.services', 'firebase','monospaced.qrcode','ngCordova'])

.run(function($ionicPlatform) {
  $ionicPlatform.ready(function() {
    if(window.cordova && window.cordova.plugins.Keyboard) {
      cordova.plugins.Keyboard.hideKeyboardAccessoryBar(true);
    }
    if(window.StatusBar) {
      StatusBar.styleDefault();
    }

    //This code snippet will be used to save user's authentication (one time login)
    fb.onAuth(function (authData) {
      if (authData) {
        console.log("Logged in as:", authData);
        /* STORE AUTHDATA */
        //$rootScope.authData = authData;
        //$rootScope.email = $rootScope.authData.password.email;
        //$state.go("tab.dash");
      } else {
        console.log("Not logged in");
        //$rootScope.hide();
        //$state.go("intro");
        //$state.go("login");
      }
    });

  });
})

.config(function($stateProvider, $urlRouterProvider) {

  $stateProvider
    .state('login', {
      url: '/login',
      templateUrl: 'app/login/login.html',
      controller: 'loginController'
    })
    .state('signup', {
      url: '/signup',
      templateUrl: 'app/signup/signup.html',
      controller: 'signupController'
    })
    .state('grouplist', {
      url: '/grouplist',
      templateUrl: 'app/dash/dash.html',
      controller: 'groupListController',
      onEnter: function($state, SessionAuth){
        if(!SessionAuth.isLoggedIn()){
           $state.go('login');
        }
      }
    })
    .state('group', {
        url: '/grouplist',
        templateUrl: 'app/dash/details.html',
        controller: 'groupController',
        params: {
          grp_key: null,
          grp_name: null
        }
    })
    .state('grouplistmember', {
      url: '/grouplistmember',
      templateUrl: 'app/members/members.html',
      controller: 'groupListMemberController',
      params: {
        grp_key: null,
        grp_name: null,
        grp_desc: null,
        grp_img: null
      }
    });

  // if none of the above states are matched, use this as the fallback
  $urlRouterProvider.otherwise('/grouplist');

});
