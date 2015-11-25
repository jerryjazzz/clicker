angular.module('app.controllers', [])
  
.controller('loginController', function($scope, $rootScope, $state, Popup, Users) {

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
	        console.log("Login Failed!", error);
	      } else {
	        $rootScope.hide();
	        console.log("Authenticated successfully with payload:", authData);
	        //To save the user's email in the factory which will later be used for group filtering
	        Users.setEmail(userData.email);
	        $state.go("grouplist");
	      }
	    });
	    //End
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

	            $rootScope.hide();
	            console.log("Authenticated successfully with payload:", authData);
	            $state.go("grouplist");
	          }
	        });
	        //End
	      }
	    });
	};

})
   
.controller('groupListController', function($scope, $ionicModal, Users, $timeout, $ionicPopup) {
	$scope.$on('$ionicView.enter', function(){
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
					email: user_email
				});

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
	      //To get a list of relevant groups to be shown in dashbaord
	      allGroupsRef = fb.child("groups");
	      allGroupsRef.on("value", function(snapshot) {
	        $scope.listOfAllGroups = [];
	        snapshot.forEach(function(childSnapShot) {
	          var group = childSnapShot.val();
	          var checkDupGroup = false;

	          for(var i=0; i<$scope.listOfAllGroups.length; i++) {
	            if(group.group_key == $scope.listOfAllGroups.group_key)
	              checkDupGroup = true;
	          }

	          if(!checkDupGroup) {
	            $scope.listOfAllGroups.push(group);
	          }

	          //Copy all the groups to the local storage after refreshed
	          window.localStorage.setItem("dash_group", JSON.stringify($scope.listOfAllGroups));

	          //Stop the ion-refresher from spinning
	          $scope.$broadcast('scroll.refreshComplete');
	        });
	      }, function (errorObject) {
	        console.log("The read failed: " + errorObject.code);
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
   
.controller('groupController', function($scope, $stateParams, $ionicModal, $timeout) {
	var group_key = $stateParams.grp_key;

	$scope.$on('$ionicView.enter', function(){
		allGroupItemsRef = fb.child("groups").child(group_key).child("group_item");
		allGroupItemsRef.on("value", function(snapshot) {
			$scope.listOfAllGroupItems = snapshot.val();
		}, function (errorObject) {
			console.log("The read failed: " + errorObject.code);
		});
	});

    $scope.refresh = function() {
    	// refresh the groups by retrieving from db
	    $timeout( function() {
	      allGroupItemsRef = fb.child("groups").child(group_key).child("group_item");
	      allGroupItemsRef.on("value", function(snapshot) {
	        	$scope.listOfAllGroupItems = snapshot.val();
				$scope.$broadcast('scroll.refreshComplete');
	        }, function (errorObject) {
	        console.log("The read failed: " + errorObject.code);
	      });
	    }, 500);
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

				$scope.close();
			}
		}
	}

	$scope.vote = function(grpItem_key) {
		$scope.liked = !$scope.liked;
		alert(grpItem_key);
	}

	$ionicModal.fromTemplateUrl('create_item.html', function(modal) {
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



})

 