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
    newUser: function(uid, name, email) {
      var ref = fb.child("users").child(uid);
      ref.update({
        "name": name,
        "email": email
      });
    },
    get: function(chatId) {
      for (var i = 0; i < chats.length; i++) {
        if (chats[i].id === parseInt(chatId)) {
          return chats[i];
        }
      }
      return null;
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

  $rootScope.show = function (text) {
    $rootScope.loading = $ionicLoading.show({
      template: '<i class="icon ion-looping"></i><br>' + text,
      animation: 'fade-in',
      showBackdrop: true,
      maxWidth: 200,
      showDelay: 0
    });
  };

  $rootScope.hide = function (text) {
    $ionicLoading.hide();
  };

  return null;

});

