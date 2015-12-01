angular.module('app.controllers', [])

.controller('loginController', function($scope, $rootScope, $state, $http, Popup, Users) {
	$scope.login = function(userData) {
	    $rootScope.show('Loading...');

	    if(!userData) {
			$rootScope.notify("Please enter all the credentials");
			$rootScope.hide();
			return false;
	    }
	    if(!userData.email || !userData.password) {
			$rootScope.notify("Please enter all the credentials");
			$rootScope.hide();
			return false;
	    }

	    //Log user into the system
	    fb.authWithPassword({
	      email    : userData.email,
	      password : userData.password
	    }, function(error, authData) {
	      if (error) {
	        $rootScope.hide();
	        console.log(error.code);
	        $scope.loginErrorMessages(error);

	      } else {
	        $rootScope.hide();
	        console.log("Authenticated successfully with payload:", authData);
	        //To save the user's email in the factory which will later be used for group filtering
	        Users.setEmail(userData.email);
	        //Save Firebase user key
	        Users.setUserKey(authData.uid);
	        //Save Firebase user name
	        $scope.setUserName(authData.uid);

	        $state.go("grouplist");
	      }
	    });
	    //End
	};

	//User login via facebook
	$scope.loginWithFacebook = function() {
		$rootScope.show('Loading...');
		fb.authWithOAuthPopup("facebook", function(error, authData) {
		  if (error) {
		    $rootScope.hide();
		    console.log("Login Failed!", error);
		    $scope.loginErrorMessages(error);
		  } else {
		    console.log("Authenticated successfully with payload:", authData);
		    //console.log(authData.facebook.accessToken);
		    var fb_accToken = authData.facebook.accessToken;

		    // Get data via facebook graph API
		    $http.get('https://graph.facebook.com/'+ authData.facebook.id +'/friends?fields=id,name,birthday&access_token='+fb_accToken).
		    then(function(data) {
		      //console.log(data.data.data[0].name);

		      //Insert user profile into Firebase
		      Users.newUser(authData.uid, authData.facebook.displayName, authData.facebook.email);
		    }), (function(data) {
		      console.log("Data Failed: " + data);
		    });
		    //End

		    //To save the user's email in the factory which will later be used for group filtering
		    Users.setEmail(authData.facebook.email);
		    //Save Firebase user key
	        Users.setUserKey(authData.uid);
	        //Save Firebase user name
	        $scope.setUserName(authData.uid);

		    $rootScope.hide();
		    $state.go("grouplist");
		  }
		}, {
		  scope: "email,user_likes,user_friends"
		});
	};

	//Save Firebase user name
	$scope.setUserName = function(user_key) {
		var userRef = fb.child("users").child(user_key);

		userRef.once("value", function(snapshot) {
			var user = snapshot.val();
			Users.setUserName(user.name);
		});

	};

	$scope.loginErrorMessages = function(error) {
		switch (error.code) {
			case "INVALID_USER":
				console.log("The specified user account does not exist.");
				$rootScope.hide();
				$rootScope.notify('Error','Email or Password is incorrect!');
				break;
			case "INVALID_PASSWORD":
				console.log("The specified user account password is incorrect.");
				$rootScope.hide();
				$rootScope.notify('Error','Email or Password is incorrect!');
				break;
			case "NETWORK_ERROR":
				console.log("Network Error.");
				$rootScope.hide();
				$rootScope.notify('Error','An error occurred while attempting to contact the authentication server.');
				break;
			case "SERVICE_UNAVAILABLE":
				console.log("Service Unavailable.");
				$rootScope.hide();
				$rootScope.notify('Error','Service is not available at this moment. Please try again later.');
				break;
			default:
				console.log("Error login to application:", error);
				$rootScope.hide();
				$rootScope.notify('Error','Opps! Something went wrong!');
		}
	};
})

.controller('signupController', function($scope, $rootScope, $state, Popup, Users) {

	$scope.signup = function(userData) {

	    $rootScope.show('Loading...');

	    if(!userData) {
			$rootScope.notify("Please enter all the credentials");
			$rootScope.hide();
			return false;
	    }

		var name = userData.name;
	    var email = userData.email;
	    var psw = userData.password;

		if(!name || !email || !psw) {
			$rootScope.notify("Please enter all the credentials");
			$rootScope.hide();
			return false;
		}

	    fb.createUser({
	      email    : userData.email,
	      password : userData.password
	    }, function(error, userData) {
	      if (error) {
	        $rootScope.hide();
	        console.log("Error creating user:", error);
	      } else {
	        console.log("Successfully created user account with uid:", userData);
	        //To insert a new user in Firebase
	        Users.newUser(userData.uid, name, email);

	        //Log user into the system
	        fb.authWithPassword({
	          email    : email,
	          password : psw
	        }, function(error, authData) {
	          if (error) {
	            $rootScope.hide();
	            console.log("Login Failed!", error);
	          } else {
	            //To save the user's email in the factory which will later be used for group filtering
	            Users.setEmail(email);
	      	  	//Save Firebase user key
	      	 	Users.setUserKey(userData.uid);
	      	 	//Save Firebase user name
				$scope.setUserName(userData.uid);

	            $rootScope.hide();
	            console.log("Authenticated successfully with payload:", authData);
	            $state.go("grouplist");
	          }
	        });
	        //End
	      }
	    });
	};

	//Save Firebase user name
	$scope.setUserName = function(user_key) {
		var userRef = fb.child("users").child(user_key);

		userRef.once("value", function(snapshot) {
			var user = snapshot.val();
			Users.setUserName(user.name);
		});
	};
})

.controller('groupListController', function($scope, $ionicModal, Users, $timeout, $ionicPopup) {
	$scope.$on('$ionicView.enter', function(){
		console.log(Users.getUserName());
		$scope.refresh();
	});

	//Load all the groups from local storage (if any) to improve performance
	if (!angular.isUndefined(window.localStorage['dash_group'])){
		var ls_dashGroup = window.localStorage.getItem("dash_group");
		$scope.listOfAllGroups = JSON.parse(ls_dashGroup);
	}
	//End

	$scope.save   = function(group) {
		// save the group and close the modal;
		if(group) {
			if(group.name) {
				//Insert the new group in the firebase
				var user_email = Users.getEmail();
				var user_key = Users.getUserKey();
				var user_name = Users.getUserName();

				var newGroupRef = fb.child("groups");
				newGroupRef = newGroupRef.push({
					group_name: group.name,
					group_admin: user_email,
					created_dt: Date.now()
				});

				//Get the unique key created by push method
				var newGroupKey = newGroupRef.key();

				//To insert the newly generated unique key to the group entity
				newGroupRef = fb.child("groups").child(newGroupKey);
					newGroupRef.update({
					group_key: newGroupKey,
					group_member_count: 1
				});

				//To insert group admin as member
				newGroupRef = fb.child("groups").child(newGroupKey).child("group_member");
				newGroupRef.push({
					key: user_key,
					name: user_name,
					email: user_email,
					group_admin: true
				});

				//To insert the group into user's entity
				var userRef = fb.child("users").child(user_key).child("group_list");
				userRef.push({group_key: newGroupKey});

				$scope.refresh();
			}
		}
		$scope.close();
	};

	$scope.removeGroup = function(group_key) {
	    var isGroupAdmin = false;
	    var user_email = Users.getEmail();

	    for(var i=0; i<$scope.listOfAllGroups.length; i++) {
	      if($scope.listOfAllGroups[i].group_key == group_key) {
	        if($scope.listOfAllGroups[i].group_admin == user_email) {
	          isGroupAdmin = true;
	          break;
	        }

	      }
	    }

	    if(isGroupAdmin) {
			// remove groups
			var confirmPopup = $ionicPopup.confirm({
				title: 'Groups',
				template: 'Are you sure you want to delete this group?'
			});
			confirmPopup.then(function(res) {
				if(res) {
					var groupRef = fb.child("groups").child(group_key);
					groupRef.remove();
					$scope.refresh();
				}
			});
	    }
	    else {
	    	$scope.showAlert();
	    }

    };

    $scope.refresh = function() {
    	// refresh the groups by retrieving from db
	    $timeout( function() {
	    	var user_group_list = [];
	    	var user_key = Users.getUserKey();
	    	
	    	var userRef = fb.child("users").child(user_key).child("group_list");
	    	var allGroupsRef = fb.child("groups");
	    	
	    	//To get a list of groups that are relevant to the user
	    	userRef.on("value", function(snapshot) {
	    		snapshot.forEach(function(childSnapShot) {
	    			var userGroup = childSnapShot.val();
	    			user_group_list.push(userGroup.group_key);
	    		});

				//To get a list of relevant groups to be shown in dashbaord
				allGroupsRef.on("value", function(snapshot) {
					$scope.listOfAllGroups = [];
					snapshot.forEach(function(childSnapShot) {
					  var group = childSnapShot.val();
					  var checkDupGroup = false;
					  var chkIsUserGroup = false;

					  //Check for duplication of group in the array
					  for(var i=0; i<$scope.listOfAllGroups.length; i++) {
					    if(group.group_key == $scope.listOfAllGroups.group_key)
					      checkDupGroup = true;
					  }

					  if(!checkDupGroup) {
					  	//Check the visibility of this group to the user
					  	for(var i=0; i<user_group_list.length; i++) {
					  		if(group.group_key == user_group_list[i]) {
					  			chkIsUserGroup = true;
					  		}
					  	}

					  	if(chkIsUserGroup) {
					  		$scope.listOfAllGroups.push(group);	
					  	}
					  }
					});
			  		//Copy all the groups to the local storage after refreshed
					window.localStorage.setItem("dash_group", JSON.stringify($scope.listOfAllGroups));

					//Stop the ion-refresher from spinning
					$scope.$broadcast('scroll.refreshComplete');
				}, function (errorObject) {
					console.log("The read failed: " + errorObject.code);
				});

	    	});	
		}, 1000);
    };

	$ionicModal.fromTemplateUrl('create_group.html', function(modal) {
	    $scope.modal = modal;
	}, {
		scope: $scope
	});

    $scope.new    = function() {
     	$scope.modal.show();
    };

	$scope.close  = function() {
		$scope.modal.hide();
	};

    // An alert dialog - Saved Sucessfully
    $scope.showAlert = function() {
     var alertPopup = $ionicPopup.alert({
       title: 'Clicker',
       template: 'Opps only admin can delete group!'
     });
     /*alertPopup.then(function(res) {
       console.log('Saved Successfully');
     });*/
    };
    //End
})

.controller('groupListMemberController', function($scope, $stateParams) {
	$scope.group_name = $stateParams.grp_name;
	var group_key = $stateParams.grp_key;
	$scope.listOfAllGroupMembers = [];

	var groupMemberRef = fb.child("groups").child(group_key).child("group_member");

	groupMemberRef.on("value", function(snapshot) {
		$scope.listOfAllGroupMembers = [];

		snapshot.forEach(function(childSnapShot) {
			$scope.listOfAllGroupMembers.push(childSnapShot.val());
		});
		console.log($scope.listOfAllGroupMembers);
	});

	$scope.removeGroupMember = function(member_key) {

	};

})

.controller('groupController', function($scope, $stateParams, $ionicModal, $timeout, $ionicPopup, Users) {
	var user_email = Users.getEmail();
	var group_key = $stateParams.grp_key;
	$scope.group_name = $stateParams.grp_name;

	$scope.$on('$ionicView.enter', function(){
		$scope.refreshWithoutTimeout();
	});

    $scope.refresh = function() {
    	// refresh the groups by retrieving from db
	    $timeout( function() {
			allGroupItemsRef = fb.child("groups").child(group_key).child("group_item");
			allGroupItemsRef.on("value", function(snapshot) {
				$scope.listOfAllGroupItems = [];
				snapshot.forEach(function(childSnapShot) {
					var groupItem = childSnapShot.val();

					var checkDupGroupItem = false;

					for(var i=0; i<$scope.listOfAllGroupItems.length; i++) {
						if(groupItem.group_item_key == $scope.listOfAllGroupItems[i].group_item_key)
							checkDupGroupItem = true;
					}

					if(!checkDupGroupItem) {
						groupItem.voted = false;

						angular.forEach(groupItem.voters, function(voter, key) {
						  if(user_email == voter.email) {
						  	groupItem.voted = true;
						  }
						});

						$scope.listOfAllGroupItems.push(groupItem);
					}

					//Stop the ion-refresher from spinning
					$scope.$broadcast('scroll.refreshComplete');
				});


        	//$scope.listOfAllGroupItems = snapshot.val();
			//$scope.$broadcast('scroll.refreshComplete');

	        }, function (errorObject) {
	        console.log("The read failed: " + errorObject.code);
	      });
	    }, 500);
    };

    $scope.refreshWithoutTimeout = function() {
    	// refresh the groups by retrieving from db
		allGroupItemsRef = fb.child("groups").child(group_key).child("group_item");
		allGroupItemsRef.on("value", function(snapshot) {
			$scope.listOfAllGroupItems = [];
			snapshot.forEach(function(childSnapShot) {
				var groupItem = childSnapShot.val();

				var checkDupGroupItem = false;

				for(var i=0; i<$scope.listOfAllGroupItems.length; i++) {
					if(groupItem.group_item_key == $scope.listOfAllGroupItems[i].group_item_key)
						checkDupGroupItem = true;
				}

				if(!checkDupGroupItem) {
					//Hard code voted to false at first
					//This voted property is not saved in Firebase and it will be populated differently for each user
					groupItem.voted = false;

					angular.forEach(groupItem.voters, function(voter, key) {
					  if(user_email == voter.email) {
					  	groupItem.voted = true;
					  }
					});

					$scope.listOfAllGroupItems.push(groupItem);
				}

				//Stop the ion-refresher from spinning
				$scope.$broadcast('scroll.refreshComplete');
			});


    	//$scope.listOfAllGroupItems = snapshot.val();
		//$scope.$broadcast('scroll.refreshComplete');

        }, function (errorObject) {
        console.log("The read failed: " + errorObject.code);
      });
    };

	$scope.save = function(item) {
		if(item) {
			if(item.name) {
				//To save the new item
				groupRef = fb.child("groups").child(group_key).child("group_item");

				groupRef = groupRef.push({
					name: item.name,
					votes: 0
				});

				//Get the unique key created by push method
				var newGroupItemKey = groupRef.key();

				//To insert the newly generated unique key to the group entity
				groupRef = fb.child("groups").child(group_key).child("group_item").child(newGroupItemKey);
				groupRef.update({
					group_item_key: newGroupItemKey
				});

				$scope.closeModal(1);
			}
		}
	}

	$scope.vote = function(grpItem_key) {
		var groupItemRef = fb.child("groups").child(group_key).child("group_item").child(grpItem_key);

		for(var i=0; i<$scope.listOfAllGroupItems.length; i++) {
			if($scope.listOfAllGroupItems[i].group_item_key == grpItem_key) {
				//If user has already voted
				if($scope.listOfAllGroupItems[i].voted) {
					//To deduct the vote by 1 locally if the user has already voted
					$scope.listOfAllGroupItems[i].votes = $scope.listOfAllGroupItems[i].votes - 1;

					//Update the new vote to the Firebase
					groupItemRef.update({
						votes: $scope.listOfAllGroupItems[i].votes
					});

					//If the user has already voted, it will be removed from the firebase
					angular.forEach($scope.listOfAllGroupItems[i].voters, function(voter, key) {
					  if(user_email == voter.email) {
  							groupItemRef = fb.child("groups").child(group_key).child("group_item").child(grpItem_key).child("voters").child(key);
							groupItemRef.remove();
					  }
					});
				}
				else {
					//Increase the votes of the selected item by 1 locally
					$scope.listOfAllGroupItems[i].votes = $scope.listOfAllGroupItems[i].votes + 1;
					//Update the votes to Firebase
					groupItemRef.update({
						votes: $scope.listOfAllGroupItems[i].votes
					});

					//Insert the voter's email for that particular item
					groupItemRef = fb.child("groups").child(group_key).child("group_item").child(grpItem_key).child("voters");
					groupItemRef.push({'email': user_email});
				}


				$scope.refreshWithoutTimeout();

				break;
			}
		}
	}

	$scope.invite = function() {
		$scope.group = {}

		// An elaborate, custom popup
		var myPopup = $ionicPopup.show({
			template: '<input type="email" ng-model="group.new_member_email">',
			title: 'Add Group Member',
			subTitle: 'Please enter e-mail',
			scope: $scope,
			buttons: [
				{ 
					text: 'Cancel', 
					onTap: function(e) {
						return false;
					}
				},
				{
					text: '<b>Save</b>',
					type: 'button-positive',
					onTap: function(e) {
						if (!$scope.group.new_member_email) {
							//don't allow the user to close unless he enters wifi password
							e.preventDefault();
						} else {
							return $scope.group.new_member_email;
						}
					}
				}
			]
		});

		myPopup.then(function(new_member_email) {
			if(new_member_email) {
				var chkValidUser = false;
				var user_key = "";
				var user_name = "";
				var userRef = fb.child("users");

				//To check if the user is a valid user to be added to the group
				userRef.once("value", function(snapshot) {
					if(user_email != new_member_email) {
						snapshot.forEach(function(childSnapShot) {
							var user = childSnapShot.val();

							//Check if the user entered email is a valid email
							if(new_member_email == user.email) {
								user_key = childSnapShot.key();
								user_name = user.name;
								chkValidUser = true;
							}
						});
					}

					//If user is a valid user
					if(chkValidUser) {
						var chk_is_member = false;
						var group_member_count = 0;
						var groupRef = fb.child("groups").child(group_key);
						var groupMemberRef = fb.child("groups").child(group_key).child("group_member");
						var userGroupRef = fb.child("users").child(user_key).child("group_list");

						//Check if user has already been added to the group
						groupMemberRef.once("value", function(snapshot) {
							snapshot.forEach(function(childSnapShot) {
								var member = childSnapShot.val();
								if(new_member_email == member.email)
									chk_is_member = true;
							});
							
							//If user hasn't been added to the group
							if(!chk_is_member) {
								// Add the user to the group entity
								groupRef.once("value", function(snapshot) {
									var group = snapshot.val();
									group_member_count = group.group_member_count;

									groupRef.update({
										group_member_count: group_member_count + 1
									});

									groupMemberRef.push({
										'key': user_key,
										'name': user_name, 
										'email': new_member_email,
										'group_admin': false
									});

									userGroupRef.push({'group_key': group_key});

									$scope.showAlert("User has been added successfully");
								});

								// Include the group's key in the user entity for dashboard filtering purposes

							}
							else {
								$scope.showAlert("This user has already joined this group");
							}
						});

					}
					else {
						//This clause is for invalid user email / user key the email that he has logged in with
						$scope.showAlert("Invalid User");
					}
				}, function (errorObject) {
					console.log("The read failed: " + errorObject.code);
				});
			}		
		});

	};

	$ionicModal.fromTemplateUrl('create_item.html', function(modal) {
	    $scope.itemModal = modal;
	}, {
		scope: $scope
	});

  // $scope.new    = function() {
  //    	$scope.modal.show();
  //   };
  //
	// $scope.close  = function() {
	// 	$scope.modal.hide();
	// };

  // show group info
  $ionicModal.fromTemplateUrl('group_info.html', function(modal) {
	    $scope.groupInfoModal = modal;
	}, {
		  scope: $scope
	});

  // handle modal for both create new item and group info
  $scope.openModal = function(index){
      if(index == 1){
          $scope.itemModal.show();
      }
      else {
          $scope.groupInfoModal.show();
      }
  }

  $scope.closeModal = function(index){
    if(index == 1){
        $scope.itemModal.hide();
    }
    else {
        $scope.groupInfoModal.hide();
    }
  }

    // An alert dialog - Saved Sucessfully
    $scope.showAlert = function(message) {
     var alertPopup = $ionicPopup.alert({
       title: 'Clicker',
       template: message
     });
     /*alertPopup.then(function(res) {
       console.log('Saved Successfully');
     });*/
    };

})

// QR Code Encoding

 // QR Code Decoding
