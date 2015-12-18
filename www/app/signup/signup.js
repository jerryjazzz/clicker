angular.module('app.signup', [])

.controller('signupController', function($scope, $rootScope, $state, Popup,
  Users, $ionicHistory) {

	$scope.signup = function(userData)
  {
	    $rootScope.show('Loading...');

	    if(!userData)
      {
        $rootScope.notify("Please enter all the credentials");
  			$rootScope.hide();
  			return false;
	    }

  		var name = userData.name;
	    var email = userData.email;
	    var psw = userData.password;

  		if(!name || !email || !psw)
      {
  			$rootScope.hide();
        $rootScope.notify("Please enter all the credentials");
  			return false;
  		}

	    fb.createUser({
	      email    : userData.email,
	      password : userData.password
	    }, function(error, userData) {
	      if (error)
        {
	        $rootScope.hide();
	        // console.log("Error creating user:", error);
	      }
        else
        {
	        // console.log("Successfully created user account with uid:", userData);
	        // To insert a new user in Firebase
	        Users.newUser(userData.uid, name, email);

	        //Log user into the system
	        fb.authWithPassword({
	          email    : email,
	          password : psw
	        }, function(error, authData) {
	          if (error)
            {
	            $rootScope.hide();
	            // console.log("Login Failed!", error);
	          }
            else
            {
	            //To save the user's email in the factory which will later be used for group filtering
	            Users.setEmail(email);
	      	  	//Save Firebase user key
  	      	 	Users.setUserKey(userData.uid);
              // ve Firebase user name
      				//$scope.setUserName(userData.uid);
      				Users.setUserName(userData.uid);

	            $rootScope.hide();
	            // console.log("Authenticated successfully with payload:", authData);

	            // disable back button
	            $ionicHistory.nextViewOptions({
      				 disableBack: true
      				});
	            $state.go("grouplist");
	          }
	        });
	        // End
	      }
	    });
	};
})
