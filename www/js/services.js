angular.module('app.services', [])

.factory('BlankFactory', [function(){

}])

.service('BlankService', [function(){

}])

//Authentication Factory
.factory('Auth', function($firebaseAuth) {
    var endPoint = "https://clickerprj.firebaseio.com/";
    var usersRef = new Firebase(endPoint);
    return $firebaseAuth(usersRef);
})

// use session data to login
.factory('SessionAuth',function(){
  return{
    isLoggedIn: function () {
      var user_key = JSON.parse(window.localStorage.getItem("user_key"));
          if(user_key == null || user_key == undefined || user_key == ""){
            return false;
          }else {
            return true;
          }
         //return _user ? true : false;
      }
  }


})

//Users Factory
.factory('Users', function() {
  return {
    all: function() {
      return chats;
    },
    setEmail: function(email) {
      window.localStorage.setItem("user_email", JSON.stringify(email));
    },
    getEmail: function() {
      var user_email = window.localStorage.getItem("user_email");
      return JSON.parse(user_email);
    },
    newUser: function(uid, name, email, provider) {
      var usersRef_set = fb.child("users").child(uid);
      usersRef_set.update({
        "name": name,
        "email": email,
        "provider": provider
      });
    },
    setUserKey: function(user_key) {
      window.localStorage.setItem("user_key", JSON.stringify(user_key));
    },
    getUserKey: function() {
      var user_key = window.localStorage.getItem("user_key");
      return JSON.parse(user_key);
    },
    setUserName: function(user_key) {
      var usersRef_get = fb.child("users").child(user_key);

      usersRef_get.once("value", function(snapshot) {
        var user = snapshot.val();
        window.localStorage.setItem("user_name", JSON.stringify(user.name));
      });

    },
    getUserName: function() {
      var user_name = window.localStorage.getItem("user_name");
      return JSON.parse(user_name);
    }
  };
})

.factory('Popup', function ($firebase, $rootScope, $ionicPopup, $ionicLoading, $q) {

  var currentData = {
    //currentUser: false,
    //currentHouse: false,
    idadmin: false
  };

  $rootScope.notify = function (title, text) {
    var alertPopup = $ionicPopup.alert({
      title: title ? title : 'Error',
      template: text
    });
  };

  $rootScope.show = function () {
    $rootScope.loading = $ionicLoading.show({
      template: '<ion-spinner></ion-spinner>',
      animation: 'fade-in',
      showBackdrop: true,
      maxWidth: 200,
      showDelay: 0
    });
  };

  $rootScope.hide = function () {
    $ionicLoading.hide();
  };

  return null;

});
