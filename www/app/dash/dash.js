angular.module('app.dash', [])

.controller('groupListController', function($scope, Users, $timeout, $ionicPopup,
	$cordovaBarcodeScanner, $timeout,  $ionicActionSheet, $ionicModal, $rootScope, Groups, Group_members, Group_items, Users, Popup) {
	//
	// $scope.$on('$ionicView.loaded', function(){
	// 	$rootScope.show();
	// 	$scope.refresh();
	// });

	//Load all the groups from local storage (if any) to improve performance
	// if (!angular.isUndefined(window.localStorage['dash_group'])){
	// 	var ls_dashGroup = window.localStorage.getItem("dash_group");
	// 	$scope.listOfAllGroups = JSON.parse(ls_dashGroup);
	// }
	//End

	$scope.save = function(group) {
		// if(group)
		// {
			if(group.name && group.description)
			{
				if(!group.publicPost) {
					group.publicPost = false;
				}

				//Insert the new group in the firebase
				var user_email = Users.getEmail();
				var user_key = Users.getUserKey();
				var user_name = Users.getUserName();

				//To push group data to groups entitiy
				groupsRef_ins = Groups.newGroup(user_email, group);

				//Get the unique key created by push method
				var newGroupKey = groupsRef_ins.key();

				//To insert group admin as member in group_members entity
				var group_admin = true;
				Group_members.newGroupMember(newGroupKey, user_key, user_name, user_email, group_admin);

				//To insert the group into users entity
				var userGroupListObj = {};
				userGroupListObj[newGroupKey] = true;
				Users.updateUserGroup(user_key, userGroupListObj);

				//clear group data for next adding
				group.name = "";
				group.description = "";

				$scope.refresh();
			}

			$scope.closeModal();
		// }
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
						Users.removeUserGroup(member.user_key, group_key);
					});

					//Remove group item and voters
					Group_items.removeAllGroupItems(group_key);

					//Remove group member
					Group_members.removeAllGroupMembers(group_key);

					//Remove group from group entity
					Groups.removeGroup(group_key);

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
		//Firebase references
		var groupsRef_get;
		var usersRef_get;
		var groupMembersRef_get;

    	// Get all the relevant user groups by retrieving from firebase
	    $timeout( function() {
	    	var user_group_list = [];
	    	var user_key = Users.getUserKey();

	    	usersRef_get = fb.child("users").child(user_key).child("group_list");
	    	groupsRef_get = fb.child("groups");

	    	//To get a list of groups that are relevant to the user
	    	usersRef_get.on("value", function(snapshot) {
	    		var userGroupList = snapshot.val();

	    		//Populate userGroupList with all the user's groups
	    		angular.forEach(userGroupList, function(value, groupKey) {
					user_group_list.push(groupKey);
				});

				//To get a list of relevant groups to be shown in dashbaord
				groupsRef_get.on("value", function(snapshot) {
					$scope.listOfAllGroups = [];
					snapshot.forEach(function(childSnapShot) {
						var group = childSnapShot.val();

						var chkIsUserGroup = false;
						group.group_key = childSnapShot.key();

						//Check the visibility of this group to the user
						//As long as the user is a member of the group, chkIsUserGroup will be set to true
						for(var i=0; i<user_group_list.length; i++) {
							if(group.group_key == user_group_list[i]) {
								chkIsUserGroup = true;
							}
						}

						//Private Groups
						if(chkIsUserGroup) {
							//if this is user's group, get the group members from group_member entity
							group.group_member = [];
							groupMembersRef_get = fb.child("group_members").child(group.group_key);
							groupMembersRef_get.on("value", function(snapshot) {
								snapshot.forEach(function(childSnapShot) {
									var group_member = childSnapShot.val();
									group.group_member.push(group_member);
								});
							});

							$scope.listOfAllGroups.push(group);
						}
						//Public Groups
						else if(group.public_group) {
							group.group_member = [];
							groupMembersRef_get = fb.child("group_members").child(group.group_key);
							groupMembersRef_get.on("value", function(snapshot) {
								snapshot.forEach(function(childSnapShot) {
									var group_member = childSnapShot.val();
									group.group_member.push(group_member);
								});
							});

							$scope.listOfAllGroups.push(group);
						}
					});

			  		//Copy all the groups to the local storage after refreshed
					window.localStorage.setItem("dash_group", JSON.stringify($scope.listOfAllGroups));

					//Stop the ion-refresher from spinning
					$scope.$broadcast('scroll.refreshComplete');
					$rootScope.hide();

				}, function (errorObject) {
					console.log("The read failed: " + errorObject.code);
				});
	    	});
		}, 1000);
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
						$scope.openModal();
						return true;
					case 1 :
						$scope.enableDelete();
						return true;
				}
				return true;
		    }
		   });
    };

		$ionicModal.fromTemplateUrl('new.html', function(modal) {
				$scope.newModal = modal;
		}, {
				scope: $scope
		});

		$scope.openModal = function(){
			$scope.newModal.show();
		};

		$scope.closeModal = function(){
			$scope.newModal.hide();
		};

})

.controller('groupController', function($scope, $stateParams, $ionicModal, $timeout,
	$ionicPopup, Users, $ionicActionSheet, $rootScope, Popup, Group_items, Group_members) {
	var user_email = Users.getEmail();
	var user_name = Users.getUserName();
	var group_key = $stateParams.grp_key;

	//The emptyPost variable will be used to check if the group has any post, if it doesn't have any, system will ask user to create new post
	$scope.emptyPost = false;
	$scope.group = {};

	$scope.$on('$ionicView.loaded', function(){
		$rootScope.show();
		$scope.refreshWithoutTimeout();
	});

    $scope.refresh = function() {
    	//Firebase references
    	var groupItemsRef_get;

    	// refresh the groups by retrieving from db
	    $timeout( function() {
	    	groupItemsRef_get = fb.child("group_items").child(group_key);
	    	groupItemsRef_get.on("value", function(snapshot) {
	    		$scope.listOfAllGroupItems = [];
				snapshot.forEach(function(childSnapShot) {
					var groupItem = childSnapShot.val();
					groupItem.group_item_key = childSnapShot.key();

					//Hard code voted to false at first
					//This voted property is not saved in Firebase and it will be populated differently for each user
					groupItem.voted = false;

					angular.forEach(groupItem.voters, function(voter, key) {
						if(voter.email == user_email)
							groupItem.voted = true;
					});

					$scope.listOfAllGroupItems.push(groupItem);

					//Stop the ion-refresher from spinning
					$scope.$broadcast('scroll.refreshComplete');

				});
	    	}, function (errorObject) {
	        console.log("The read failed: " + errorObject.code);
	      });
	    }, 500);
    };

    $scope.refreshWithoutTimeout = function() {
    	//Firebase references
    	var groupsRef_get;
    	var groupItemsRef_get;

    	// To get group's info which will be used as parameters when user clicks on the header
    	groupsRef_get = fb.child("groups").child(group_key);
    	groupsRef_get.on("value", function(snapshot) {
			$scope.group = {};
			$scope.group = snapshot.val();
			if($scope.group)
				$scope.group.group_key = snapshot.key();
	    }, function (errorObject) {
	    	console.log("The read failed: " + errorObject.code);
	  	});

    	// refresh the group items by retrieving from db
		groupItemsRef_get = fb.child("group_items").child(group_key);
		groupItemsRef_get.on("value", function(snapshot) {
			$scope.listOfAllGroupItems = [];
			snapshot.forEach(function(childSnapShot) {
				var groupItem = childSnapShot.val();
				groupItem.group_item_key = childSnapShot.key();

				//Hard code voted to false at first
				//This voted property is not saved in Firebase and it will be populated differently for each user
				groupItem.voted = false;

				angular.forEach(groupItem.voters, function(voter, key) {
					if(voter.email == user_email)
						groupItem.voted = true;
				});

				$scope.listOfAllGroupItems.push(groupItem);
			});

			if($scope.listOfAllGroupItems.length <= 0) {
				$scope.emptyPost = true;
			}
			else {
				$scope.emptyPost = false;
			}

			//Stop the ion-refresher from spinning
			$scope.$broadcast('scroll.refreshComplete');
			$rootScope.hide();
	    }, function (errorObject) {
	    	console.log("The read failed: " + errorObject.code);
	  	});
    };

	$scope.addNewItem = function() {
		$scope.groupItem = {};

		// An elaborate, custom popup
		var myPopup = $ionicPopup.show({
			template: '<input type="text" ng-model="groupItem.name">',
			title: 'New Post',
			subTitle: 'What do you say?',
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
					Group_items.newGroupItem(group_key, item.name, user_name);
				}
			}
		});
	}

	$scope.vote = function(grpItem_key) {
		for(var i=0; i<$scope.listOfAllGroupItems.length; i++) {
			if($scope.listOfAllGroupItems[i].group_item_key == grpItem_key) {
				//If user has already voted
				if($scope.listOfAllGroupItems[i].voted) {
					//To deduct the vote by 1 locally if the user has already voted
					$scope.listOfAllGroupItems[i].votes = $scope.listOfAllGroupItems[i].votes - 1;

					//Update the new vote to the Firebase
					Group_items.updateGroupItemVoteCount(group_key, grpItem_key, $scope.listOfAllGroupItems[i].votes);

					//If the user has already voted, it will be removed from the firebase
					//This forEach is to get the voter's key within the group_items entity
					angular.forEach($scope.listOfAllGroupItems[i].voters, function(voter, key) {
						if(user_email == voter.email) {
							Group_items.removeGroupItemVoter(group_key, grpItem_key, key);
						}
					});
				}
				else {
					//Increase the votes of the selected item by 1 locally
					$scope.listOfAllGroupItems[i].votes = $scope.listOfAllGroupItems[i].votes + 1;

					//Update the votes to Firebase
					Group_items.updateGroupItemVoteCount(group_key, grpItem_key, $scope.listOfAllGroupItems[i].votes);

					//Insert the voter's email for that particular item
					Group_items.newGroupItemVoter(group_key, grpItem_key, user_email);
				}

				$scope.refreshWithoutTimeout();

				break;
			}
		}
	}

	$scope.invite = function() {
		//Object to get user's input
		$scope.groupInvite = {};

		// An elaborate, custom popup
		var myPopup = $ionicPopup.show({
			template: '<input type="email" ng-model="groupInvite.new_member_email">',
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
						if (!$scope.groupInvite.new_member_email) {
							//don't allow the user to close unless he enters wifi password
							e.preventDefault();
						} else {
							return $scope.groupInvite.new_member_email;
						}
					}
				}
			]
		});

		myPopup.then(function(new_member_email) {
			if(new_member_email) {
				var login_user_key = Users.getUserKey();

		      	Group_members.inviteGroupMember(new_member_email, user_email, group_key, login_user_key).then(function(message) {
		      		$scope.showAlert(message);
			    });
			}
		});

	};

	$scope.deletePost = function(grpItem_key){
	    var user_email = Users.getEmail();

	    Group_items.removeGroupItem(user_email, group_key, grpItem_key).then(function(message) {
	      //Disable delete button
          $scope.disableDelete();
          $scope.refreshWithoutTimeout();

	      if(message) {
	      	$scope.showAlert(message);
	      }
	    });
	}

  // show group info
  $ionicModal.fromTemplateUrl('group_info.html', function(modal) {
	    $scope.groupInfoModal = modal;
	}, {
		  scope: $scope
	});

  // handle modal for both create new item and group info
  $scope.openModal = function(){
    $scope.groupInfoModal.show();
  };

  $scope.closeModal = function(){
    $scope.groupInfoModal.hide();
  };

	// An alert dialog - Saved Sucessfully
	$scope.showAlert = function(message) {
		var alertPopup = $ionicPopup.alert({
			title: 'Clicker',
			template: message
		});
	};

	$scope.showActionSheet = function (){
		$ionicActionSheet.show({
			buttons: [
				 { text: '<div class="button-block text-center">Create Post</div>' },
				 { text: '<div class="button-block text-center">Invite Friends</div>'}
			],
			destructiveText: '<div class="button-block text-center assertive">Delete</div>',
			destructiveButtonClicked: function() {
				$scope.enableDelete();
				return true;
      },
			cancelText: '<div class="button-block text-center assertive">Cancel</div>',
			cancel: function() {
			},
			buttonClicked: function(index) {
				switch (index)
				{
					case 0 :
						$scope.addNewItem();
						return true;
					case 1 :
						$scope.invite();
						return true;
				}
			return true;
			}
		 });
	};

	$scope.enableDelete = function(){
		$scope.isRemovable = true;
	};

	$scope.disableDelete = function(){
		$scope.isRemovable = false;
	};

})
