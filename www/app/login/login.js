angular.module('app.login', [])

.controller('loginController', function($scope, $rootScope, $state, $http, Popup,
	Users, $ionicHistory, $ionicPopup) {

	// Simple login with email
	$scope.login = function(userData)
	{
	    $rootScope.show('Loading...');

	    if(!userData)
			{
				$rootScope.notify("Please enter all the credentials");
				$rootScope.hide();
				return false;
	    }

	    if(!userData.email || !userData.password)
			{
				$rootScope.notify("Please enter all the credentials");
				$rootScope.hide();
				return false;
	    }

	    // Log user into the system
	    fb.authWithPassword({
	      email    : userData.email,
	      password : userData.password
	    }, function(error, authData) {
	      if (error) {
	        $rootScope.hide();
	        $scope.loginErrorMessages(error);
	      } else {
	        $rootScope.hide();

	        // To save the user's email in the factory which will later be used for group filtering
	        Users.setEmail(userData.email);

	        // Save Firebase user key
	        Users.setUserKey(authData.uid);

	        // Save Firebase user name
	        Users.setUserName(authData.uid);

	      	// disable back button
			$ionicHistory.nextViewOptions({
				disableBack: true
			});

	        $state.go("grouplist");
	      }
	    });
	};

	// User login via facebook
	$scope.loginWithFacebook = function()
	{
		var usersRef_get;

		$rootScope.show('Loading...');

		fb.authWithOAuthPopup("facebook", function(error, authData)
		{
		  if (error) {
		    $rootScope.hide();
		    $scope.loginErrorMessages(error);
		  } else {
		    //var fb_accToken = authData.facebook.accessToken;
		    // Get data via facebook graph API
		    /*$http.get('https://graph.facebook.com/' + authData.facebook.id
					+ '/friends?fields=id,name,birthday&access_token='
					+ fb_accToken).then(function(data) {
		      // console.log(data.data.data[0].name);
		      // Insert user profile into Firebase

		      Users.newUser(authData.uid, authData.facebook.displayName, authData.facebook.email);
		    }), (function(data) {
		      console.log("Data Failed: " + data);
		    });*/
		    // End

			//To check the uniqueness of the entered email
			var duplicatedEmail = false;

			usersRef_get = fb.child("users");
			usersRef_get.once("value", function(snapshot) {
				snapshot.forEach(function(childSnapShot) {
					var user = childSnapShot.val();
					if(user.email == authData.facebook.email) {
						if(user.provider != authData.provider) {
							duplicatedEmail = true;	
						}
					}
				});

				if(duplicatedEmail) {
					fb.unauth();
					$rootScope.hide();
					$scope.showAlert("Opps! Email address has already been used");
				}
				else {
					// To insert the user in the user entity
				    Users.newUser(authData.uid, authData.facebook.displayName, authData.facebook.email, authData.provider);

				    // To save the user's email in the factory which will later be used for group filtering
				    Users.setEmail(authData.facebook.email);

					// Save Firebase user key
		    		Users.setUserKey(authData.uid);

					// Save Firebase user name
		   			Users.setUserName(authData.uid);

				    $rootScope.hide();

				    // disable back button
		        	$ionicHistory.nextViewOptions({
						disableBack: true
					});

		       		$state.go("grouplist");
				}
			});
		  }
		}, {
		  scope: "email,user_likes,user_friends"
		});
	};

	//User login via Google Plus
	$scope.loginWithGoogle = function()
	{
		var usersRef_get;

		$rootScope.show('Loading...');

		fb.authWithOAuthPopup("google", function(error, authData)
		{
			if (error) {
				$rootScope.hide();
				$scope.loginErrorMessages(error);
			} else {
				//To check the uniqueness of the entered email
				var duplicatedEmail = false;

				usersRef_get = fb.child("users");
				usersRef_get.once("value", function(snapshot) {
					snapshot.forEach(function(childSnapShot) {
						var user = childSnapShot.val();
						if(user.email == authData.google.email) {
							if(user.provider != authData.provider) {
								duplicatedEmail = true;	
							}
						}
					});

					if(duplicatedEmail) {
						fb.unauth();
						$rootScope.hide();
						$scope.showAlert("Opps! Email address has already been used");
					}
					else {
						Users.newUser(authData.uid, authData.google.displayName, authData.google.email, authData.provider);

						// To save the user's email in the factory which will later be used for group filtering
						Users.setEmail(authData.google.email);

						// Save Firebase user key
						Users.setUserKey(authData.uid);

						// Save Firebase user name
						Users.setUserName(authData.uid);

						$rootScope.hide();

						// disable back button
						$ionicHistory.nextViewOptions({
							disableBack: true
						});

						$state.go("grouplist");
					}
				});
			}
		}, {
		  scope: "email"
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
