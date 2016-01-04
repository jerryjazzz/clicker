angular.module('app.signup', [])

.controller('signupController', function($scope, $rootScope, $state, Popup,
  Users, $ionicHistory, $ionicPopup) {

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

		var duplicatedEmail = false;

		usersRef_get = fb.child("users");
		usersRef_get.once("value", function(snapshot) {
			snapshot.forEach(function(childSnapShot) {
				var user = childSnapShot.val();
				if(user.email == email) {
					duplicatedEmail = true;	
				}
			});

			if(duplicatedEmail) {
				$rootScope.hide();
				$scope.showAlert("Opps! Email address has already been used");
			}
			else {
				fb.createUser({
			      email    : userData.email,
			      password : userData.password
			    }, function(error, userData) {
			      	if (error)
			        {
				        $rootScope.hide();
				        $scope.loginErrorMessages(error);
			      	}
			        else
			        {
				        //Log user into the system
				        fb.authWithPassword({
				          email    : email,
				          password : psw
				        }, function(error, authData) {
				          if (error)
			            {
				            $rootScope.hide();
			            	$scope.loginErrorMessages(error);
			          	}
			            else
			            {

			            	// To insert a new user in Firebase
			            	Users.newUser(userData.uid, name, email, authData.provider);

				            //To save the user's email in the factory which will later be used for group filtering
				            Users.setEmail(email);
				      	  	//Save Firebase user key
			  	      	 	Users.setUserKey(userData.uid);
			      			// Save Firebase user name
			  				Users.setUserName(userData.uid);

				            $rootScope.hide();

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
			}
		});
	};

	$scope.loginErrorMessages = function(error)
	{
		switch (error.code) {
			case "INVALID_USER":
				// console.log("The specified user account does not exist.");
				$rootScope.hide();
				$rootScope.notify('Error','Email or Password is incorrect!');
				break;
			case "INVALID_PASSWORD":
				// console.log("The specified user account password is incorrect.");
				$rootScope.hide();
				$rootScope.notify('Error','Email or Password is incorrect!');
				break;
			case "NETWORK_ERROR":
				// console.log("Network Error.");
				$rootScope.hide();
				$rootScope.notify('Error','An error occurred while attempting to contact the authentication server.');
				break;
			case "SERVICE_UNAVAILABLE":
				// console.log("Service Unavailable.");
				$rootScope.hide();
				$rootScope.notify('Error','Service is not available at this moment. Please try again later.');
				break;
			default:
				console.log("Error login to application:", error);
				$rootScope.hide();
				$rootScope.notify('Error','Opps! Something went wrong!');
		}
	};

	$scope.showAlert = function(message) {
		var alertPopup = $ionicPopup.alert({
			title: 'Clicker',
			template: message
		});
    };

})
