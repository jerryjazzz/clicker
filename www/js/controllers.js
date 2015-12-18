angular.module('app.controllers', [])

.controller('loginController', function($scope, $rootScope, $state, $http, Popup, Users, $ionicHistory) {
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
	        Users.setUserName(authData.uid);

	      	// disable back button
            $ionicHistory.nextViewOptions({
				disableBack: true
			});

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
	        Users.setUserName(authData.uid);

		    $rootScope.hide();

		    // disable back button
            $ionicHistory.nextViewOptions({
				disableBack: true
			});

	        $state.go("grouplist");
		  }
		}, {
		  scope: "email,user_likes,user_friends"
		});
	};

	//User login via Google Plus
	$scope.loginWithGoogle = function() {
		$rootScope.show('Loading...');
		fb.authWithOAuthPopup("google", function(error, authData) {
			if (error) {
				$rootScope.hide();
				console.log("Login Failed!", error);
				$scope.loginErrorMessages(error);
			} else {
				console.log("Authenticated successfully with payload:", authData);

				Users.newUser(authData.uid, authData.google.displayName, authData.google.email);

				//To save the user's email in the factory which will later be used for group filtering
				Users.setEmail(authData.google.email);
				//Save Firebase user key
				Users.setUserKey(authData.uid);
				//Save Firebase user name
				Users.setUserName(authData.uid);

				$rootScope.hide();

				// disable back button
				$ionicHistory.nextViewOptions({
					disableBack: true
				});

				$state.go("grouplist");
			}
		  }, {
		  scope: "email"
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

.controller('signupController', function($scope, $rootScope, $state, Popup, Users, $ionicHistory) {

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
				//$scope.setUserName(userData.uid);
				Users.setUserName(userData.uid);

	            $rootScope.hide();
	            console.log("Authenticated successfully with payload:", authData);

	            // disable back button
	            $ionicHistory.nextViewOptions({
				 disableBack: true
				});
	            $state.go("grouplist");
	          }
	        });
	        //End
	      }
	    });
	};
})

.controller('groupListController', function($scope, Users, $timeout, $ionicPopup, $cordovaBarcodeScanner, $timeout,  $ionicActionSheet) {
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
		// save the group
		if(group) {
			if(group.name && group.description) {
				//Insert the new group in the firebase
				var user_email = Users.getEmail();
				var user_key = Users.getUserKey();
				var user_name = Users.getUserName();

				var newGroupRef = fb.child("groups");
				newGroupRef = newGroupRef.push({
					group_name: group.name,
					group_desc: group.description,
					group_creator: user_email,
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
					'user_key': user_key,
					'user_name': user_name,
					'user_email': user_email,
					'group_admin': true
				});

				//To insert the group into user's entity
				var userRef = fb.child("users").child(user_key).child("group_list");
				userRef.push({group_key: newGroupKey});
				group.name = ""; // clear cache
				$scope.refresh();
			}
		}
	};

	$scope.enableDelete = function(){
		$scope.isRemovable = true;
	}

	$scope.disableDelete = function(){
		$scope.isRemovable = false;
	}

	$scope.removeGroup = function(group_key) {
	    var isGroupAdmin = false;
	    var user_email = Users.getEmail();
	    var all_group_members = [];

	    for(var i=0; i<$scope.listOfAllGroups.length; i++) {
	      if($scope.listOfAllGroups[i].group_key == group_key) {
	      	angular.forEach($scope.listOfAllGroups[i].group_member, function(groupMember, key) {
				//Store all the members of that group in an array which will be used later upon removing the group
		      	all_group_members.push(groupMember);
		      	//End
				if(groupMember.user_email == user_email) {
					if(groupMember.group_admin) {
						isGroupAdmin = true;
					}
				}
			});
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
					//Remove group from user entity (for all the group members)
					angular.forEach(all_group_members, function(member, key) {
						var userGroupRef = fb.child("users").child(member.user_key).child("group_list");
						userGroupRef.once("value", function(snapshot) {
							//var userGroupList = snapshot.val();
							snapshot.forEach(function(childSnapShot) {
								var userGroup = childSnapShot.val();
								if(userGroup.group_key == group_key) {
									var userDelGroupRef = fb.child("users").child(member.user_key).child("group_list").child(childSnapShot.key());
									userDelGroupRef.remove();
								}
							});
						});
					});

					//Remove group from group entity
					var groupRef = fb.child("groups").child(group_key);
					groupRef.remove();
					$scope.refresh();
				}
			});
	    }
	    else {
	    	$scope.showAlert('Opps only admin can delete group!');
	    }
	    $scope.isRemovable = false;

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

    $scope.addNewGroup    = function() {
     	$scope.newGroup = {};

 		var myPopup = $ionicPopup.show({
			// template: '<input type="text" ng-model="newGroup.name">',
			template: '<label class="item item-input"><input type="text" placeholder="Enter group name" ng-model="newGroup.name"></label><label class="item item-input"><input type="text" placeholder="Question" ng-model="newGroup.description"></label>',
			title: 'New Group',
			// subTitle: 'Please enter group name',
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
						if (!$scope.newGroup.name || !$scope.newGroup.description) {
							//don't allow the user to close unless he enters wifi password
							e.preventDefault();
						} else {
							return $scope.newGroup;
						}
					}
				}
			]
		});

     	myPopup.then(function(newGroup) {
     		$scope.save(newGroup);
		});
    };

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
    //End

		// scan QR code
		$scope.showMsg = function(msg){
			var alertPopup = $ionicPopup.alert({
				title : 'Clicker',
				template: msg
			})
		}

		$scope.scanQR = function(){
			$cordovaBarcodeScanner.scan().then(function(imageData) {
          //alert(imageData.text);

					var scanGrp_key = imageData.text;

					var user_email = Users.getEmail();
					var user_key = Users.getUserKey();
					var user_name = Users.getUserName();

		    	var userRef = fb.child("users").child(user_key).child("group_list");
		    	var allGroupsRef = fb.child("groups");
					var group_member_count = 0;

					var IsUserGroup = false;
					var IsGroupValid = false;

					// check if group is valid
					allGroupsRef.once("value",function(snapshot){
							snapshot.forEach(function(childSnapShot){
								var group = childSnapShot.val();

								if(group.group_key == scanGrp_key)
								{
									IsGroupValid = true;
									group_member_count = group.group_member_count;
								}


							});
					});

					// check if user already assigned to the group
					if(IsGroupValid){
						userRef.once("value",function(snapshot){
							snapshot.forEach(function(childSnapShot){
								var grpKey = childSnapShot.val();

								if(grpKey == scanGrp_key)
									IsUserGroup = true;
							});
						});
					}else {
						$scope.showMsg("Invalid Group Info");
						return;
					}

					// if user not assigned and group valid - proceed to add
					if(!IsUserGroup && IsGroupValid){
						//var group_member_count = 0;
						var groupRef = fb.child("groups").child(scanGrp_key);
						var groupMemberRef = fb.child("groups").child(scanGrp_key).child("group_member");
						var userGroupRef = fb.child("users").child(user_key).child("group_list");


						// get group member count

						groupRef.update({
							group_member_count: group_member_count + 1
						});

						groupMemberRef.push({
							'user_key': user_key,
							'user_name': user_name,
							'user_email': user_email,
							'group_admin': false
						});

						userGroupRef.push({'group_key': scanGrp_key});

						$scope.showMsg("User has been added successfully");
						$scope.refresh();

					}else{
						$scope.showMsg("Group is added already");
						return;
					}

          console.log("Barcode Format -> " + imageData.format);
          console.log("Cancelled -> " + imageData.cancelled);
      }, function(error) {
          console.log("An error happened -> " + error);
      });
		};

		$scope.showActionSheet = function (){
			$ionicActionSheet.show({
		    buttons: [
		       { text: '<div class="button-block text-center">New Clicker Topic</div>' },
		       { text: '<div class="button-block text-center">Delete Clicker Topic</div>'}
		    ],
		    cancelText: '<div class="button-block text-center assertive">Cancel</div>',
		    cancel: function() {
			},
		    buttonClicked: function(index) {
		     	switch (index)
		     	{
					case 0 :
						$scope.addNewGroup();
						return true;
					case 1 :
						$scope.enableDelete();
						return true;
				}
				return true;
		    }
		   });
    };
})

.controller('groupListMemberController', function($scope, $stateParams, $ionicPopup, Users, $ionicActionSheet) {
	$scope.group_name = $stateParams.grp_name;
	var group_key = $stateParams.grp_key;
	$scope.listOfAllGroupMembers = [];

	var groupMemberRef = fb.child("groups").child(group_key).child("group_member");

	groupMemberRef.on("value", function(snapshot) {
		$scope.listOfAllGroupMembers = [];

		snapshot.forEach(function(childSnapShot) {
			var groupMember = childSnapShot.val();
			groupMember.member_key = childSnapShot.key();

			$scope.listOfAllGroupMembers.push(groupMember);
		});
	});

	$scope.removeGroupMember = function(member_key, user_key) {
		var chkIsGroupAdmin = false;
		var loginUserKey = Users.getUserKey();

		for(var i=0; i<$scope.listOfAllGroupMembers.length; i++) {
			if(loginUserKey == $scope.listOfAllGroupMembers[i].user_key) {
				if($scope.listOfAllGroupMembers[i].group_admin) {
					chkIsGroupAdmin = true;
				}
			}
		}

		if(chkIsGroupAdmin) {
			//To check if the user has accidentally deleted him/herself
			if(loginUserKey != user_key) {

				var confirmPopup = $ionicPopup.confirm({
					title: 'Clicker',
					template: 'Are you sure you want to delete this user from the group?'
				});

				confirmPopup.then(function(confirm) {
					//If user confirm to drop the user from the group
					if(confirm) {
						//Remove group from user entity
						var userRef = fb.child("users").child(user_key).child("group_list");
						userRef.once("value", function(snapshot) {
							snapshot.forEach(function(childSnapShot) {
								var userGroupList = childSnapShot.val();

								if(group_key == userGroupList.group_key) {
									var userGroupListRef = fb.child("users").child(user_key).child("group_list").child(childSnapShot.key());
									userGroupListRef.remove();

									//Remove member from group entity
									var groupMemberRef = fb.child("groups").child(group_key).child("group_member").child(member_key);
									groupMemberRef.remove();

									//Deduct member count
									var groupRef = fb.child("groups").child(group_key);
									groupRef.once("value", function(snapshot) {
										var group = snapshot.val();

										groupRef.update({
											group_member_count: group.group_member_count - 1
										});

									});
								}
							});
						});
					}
				});
			}
			else {
				$scope.showAlert("Invalid Operation");
			}
		}
		else {
			$scope.showAlert("Opps! Only group admin is allowed to perform this operation.");
		}
	};

	    // An alert dialog - Saved Sucessfully
    $scope.showAlert = function(message) {
		var alertPopup = $ionicPopup.alert({
			title: 'Clicker',
			template: message
		});
    };

    $scope.addProfilePic = function (){
		$ionicActionSheet.show({
		    buttons: [
		       { text: '<div class="button-block text-center">Take Photo</div>' },
		       { text: '<div class="button-block text-center">Choose from Photos</div>'}
		    ],
		    // destructiveText: 'Delete',
		    // titleText: '<div class="text-center">Complete action by</div>',
		    cancelText: '<div class="button-block text-center">Cancel</div>',
		    cancel: function() {
			},
		    buttonClicked: function(index) {
		     	switch (index)
		     	{
					case 0 :
						$scope.takePic();
						return true;
					case 1 :
						$scope.choosefrmGallery();
						return true;
				}
				return true;
		    }
		   });
    };

	$scope.takePic = function() {
		var options =   {
			quality : 80,
			destinationType : Camera.DestinationType.DATA_URL,
			sourceType : Camera.PictureSourceType.CAMERA,
			allowEdit : true,
			encodingType: Camera.EncodingType.PNG,
			popoverOptions: CameraPopoverOptions,
			targetWidth: 500,
			targetHeight: 300,
			saveToPhotoAlbum: false
		};
		navigator.camera.getPicture(function(DATA_URL) {
			console.log(DATA_URL);
			$scope.imgURI= DATA_URL;
			$scope.$digest();
		}, function (e) {
			console.log("On fail " + e);
		},options);
	};

	$scope.choosefrmGallery = function() {
		var options =   {
			quality : 80,
			destinationType : Camera.DestinationType.DATA_URL,
			sourceType : Camera.PictureSourceType.PHOTOLIBRARY,
			allowEdit : true,
			encodingType: Camera.EncodingType.PNG,
			popoverOptions: CameraPopoverOptions,
			targetWidth: 500,
			targetHeight: 300,
			saveToPhotoAlbum: false
		};
		navigator.camera.getPicture(function(DATA_URL) {
			$scope.imgURI= DATA_URL;
			$scope.$digest();
		},function(e) {
			console.log("On fail " + e);
		},options);
	};
})

.controller('groupController', function($scope, $stateParams, $ionicModal, $timeout, $ionicPopup, Users, $ionicPopover) {
	var user_email = Users.getEmail();
	var user_name = Users.getUserName();
	var group_key = $stateParams.grp_key;
	$scope.group_name = $stateParams.grp_name;
	$scope.grp_key = group_key;

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

	$scope.addNewItem = function() {
		$scope.closePopover();
		$scope.groupItem = {};

		// An elaborate, custom popup
		var myPopup = $ionicPopup.show({
			template: '<input type="text" ng-model="groupItem.name">',
			title: 'Add New Item',
			subTitle: 'Please enter the item',
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
						if (!$scope.groupItem.name) {
							//don't allow the user to close unless he enters wifi password
							e.preventDefault();
						} else {
							return $scope.groupItem;
						}
					}
				}
			]
		});

		myPopup.then(function(item) {
			if(item) {
				if(item.name) {
					//To save the new item
					groupRef = fb.child("groups").child(group_key).child("group_item");

					groupRef = groupRef.push({
						name: item.name,
						author: user_name,
						votes: 0
					});

					//Get the unique key created by push method
					var newGroupItemKey = groupRef.key();

					//To insert the newly generated unique key to the group entity
					groupRef = fb.child("groups").child(group_key).child("group_item").child(newGroupItemKey);
					groupRef.update({
						group_item_key: newGroupItemKey
					});
				}
			}
		});
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
		$scope.closePopover();
		$scope.group = {};

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
										'user_key': user_key,
										'user_name': user_name,
										'user_email': new_member_email,
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

  // show group info
  $ionicModal.fromTemplateUrl('group_info.html', function(modal) {
	    $scope.groupInfoModal = modal;
	}, {
		  scope: $scope
	});

  // handle modal for both create new item and group info
  $scope.openModal = function(){
    $scope.groupInfoModal.show();
  }

  $scope.closeModal = function(){
    $scope.groupInfoModal.hide();
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


   $ionicPopover.fromTemplateUrl('popover.html', {
      scope: $scope
   }).then(function(popover) {
      $scope.popover = popover;
   });

   $scope.openPopover = function($event) {
      $scope.popover.show($event);
   };

   $scope.closePopover = function() {
      $scope.popover.hide();
   };

   //Cleanup the popover when we're done with it!
   $scope.$on('$destroy', function() {
      $scope.popover.remove();
   });

   // Execute action on hide popover
   $scope.$on('popover.hidden', function() {
      // Execute action
   });

   // Execute action on remove popover
   $scope.$on('popover.removed', function() {
      // Execute action
   });

})
