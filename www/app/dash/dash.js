angular.module('app.dash', [])

.controller('groupListController', function($scope, Users, $timeout, $ionicPopup,
	$cordovaBarcodeScanner, $timeout,  $ionicActionSheet, $ionicModal) {

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
		//Firebase references
		var groupMembersRef_ins;
		var groupsRef_ins;
		var groupsRef_set;
		var usersRef_ins;

		// save the group
		if(group) {
			$scope.closeModal();
			if(group.name && group.description) {
				//Insert the new group in the firebase
				var user_email = Users.getEmail();
				var user_key = Users.getUserKey();
				var user_name = Users.getUserName();

				//To push group data to groups entitiy
				groupsRef_ins = fb.child("groups");
				groupsRef_ins = groupsRef_ins.push({
					group_name: group.name,
					group_desc: group.description,
					group_creator: user_email,
					created_dt: Date.now()
				});

				//Get the unique key created by push method
				var newGroupKey = groupsRef_ins.key();

				//To insert the newly generated unique key to the groups entity
				groupsRef_set = fb.child("groups").child(newGroupKey);
				groupsRef_set.update({
					group_key: newGroupKey,
					group_member_count: 1
				});

				//To insert group admin as member in group_members entity
				groupMembersRef_ins = fb.child("group_members").child(newGroupKey);
				groupMembersRef_ins.push({
					'user_key': user_key,
					'user_name': user_name,
					'user_email': user_email,
					'group_admin': true
				});

				//To insert the group into users entity
				usersRef_ins = fb.child("users").child(user_key).child("group_list");
				usersRef_ins.push({group_key: newGroupKey});

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
		//Firebase references
		var groupsRef_del;
		var usersRef_get;
		var usersRef_del;
		var groupItemsRef_del;
		var groupMembersRef_del;

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
						usersRef_get = fb.child("users").child(member.user_key).child("group_list");
						usersRef_get.once("value", function(snapshot) {
							//var userGroupList = snapshot.val();
							snapshot.forEach(function(childSnapShot) {
								var userGroup = childSnapShot.val();
								if(userGroup.group_key == group_key) {
									usersRef_del = fb.child("users").child(member.user_key).child("group_list").child(childSnapShot.key());
									usersRef_del.remove();
								}
							});
						});
					});

					//Remove group item and voters
					groupItemsRef_del = fb.child("group_items").child(group_key);
					groupItemsRef_del.remove();

					//Remove group member
					groupMembersRef_del = fb.child("group_members").child(group_key);
					groupMembersRef_del.remove();

					//Remove group from group entity
					groupsRef_del = fb.child("groups").child(group_key);
					groupsRef_del.remove();

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

    	// refresh the groups by retrieving from db
	    $timeout( function() {
	    	var user_group_list = [];
	    	var user_key = Users.getUserKey();

	    	usersRef_get = fb.child("users").child(user_key).child("group_list");
	    	groupsRef_get = fb.child("groups");

	    	//To get a list of groups that are relevant to the user
	    	usersRef_get.on("value", function(snapshot) {
	    		snapshot.forEach(function(childSnapShot) {
	    			var userGroup = childSnapShot.val();
	    			user_group_list.push(userGroup.group_key);
	    		});

				//To get a list of relevant groups to be shown in dashbaord
				groupsRef_get.on("value", function(snapshot) {
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
	$ionicPopup, Users, $ionicActionSheet) {

	var user_email = Users.getEmail();
	var user_name = Users.getUserName();
	var group_key = $stateParams.grp_key;
	$scope.group_name = $stateParams.grp_name;
	$scope.grp_key = group_key;

	$scope.$on('$ionicView.enter', function(){
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
							if(voter.email == user_email)
								groupItem.voted = true;
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
    	//Firebase references
    	var groupItemsRef_get;

    	// refresh the groups by retrieving from db
		groupItemsRef_get = fb.child("group_items").child(group_key);
		groupItemsRef_get.on("value", function(snapshot) {
			$scope.listOfAllGroupItems = [];
			snapshot.forEach(function(childSnapShot) {
				var groupItem = childSnapShot.val();
				groupItem.group_item_key = childSnapShot.key();
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
						if(voter.email == user_email)
							groupItem.voted = true;
					});

					$scope.listOfAllGroupItems.push(groupItem);
				}

				//Stop the ion-refresher from spinning
				$scope.$broadcast('scroll.refreshComplete');
			});
	    }, function (errorObject) {
	    	console.log("The read failed: " + errorObject.code);
	  	});
    };

	$scope.addNewItem = function() {
		//Firebase references
		var groupItemsRef_ins;

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
					groupItemsRef_ins = fb.child("group_items").child(group_key);
					groupItemsRef_ins.push({
						name: item.name,
						author: user_name,
						votes: 0
					});
				}
			}
		});
	}

	$scope.vote = function(grpItem_key) {
		//Firebase references
		var groupItemsRef_ins;
		var groupItemsRef_set;
		var groupItemsRef_del;

		for(var i=0; i<$scope.listOfAllGroupItems.length; i++) {
			if($scope.listOfAllGroupItems[i].group_item_key == grpItem_key) {
				//If user has already voted
				if($scope.listOfAllGroupItems[i].voted) {
					//To deduct the vote by 1 locally if the user has already voted
					$scope.listOfAllGroupItems[i].votes = $scope.listOfAllGroupItems[i].votes - 1;

					//Update the new vote to the Firebase
					groupItemsRef_set = fb.child("group_items").child(group_key).child(grpItem_key);
					groupItemsRef_set.update({
						votes: $scope.listOfAllGroupItems[i].votes
					});

					//If the user has already voted, it will be removed from the firebase
					groupItemsRef_del = fb.child("group_items").child(group_key).child(grpItem_key).child("voters");
					angular.forEach($scope.listOfAllGroupItems[i].voters, function(voter, key) {
						if(user_email == voter.email) {
							groupItemsRef_del = groupItemsRef_del.child(key);
							groupItemsRef_del.remove();
						}
					});
				}
				else {
					//Increase the votes of the selected item by 1 locally
					$scope.listOfAllGroupItems[i].votes = $scope.listOfAllGroupItems[i].votes + 1;

					//Update the votes to Firebase
					groupItemsRef_set = fb.child("group_items").child(group_key).child(grpItem_key);

					groupItemsRef_set.update({
						votes: $scope.listOfAllGroupItems[i].votes
					});

					//Insert the voter's email for that particular item
					groupItemsRef_ins = fb.child("group_items").child(group_key).child(grpItem_key).child("voters");
					groupItemsRef_ins.push({'email': user_email});
				}

				$scope.refreshWithoutTimeout();

				break;
			}
		}
	}

	$scope.invite = function() {
		//Firebase references
		var usersRef_get;
		var usersRef_ins;
		var groupMembersRef_get;
		var groupMembersRef_ins;
		var groupsRef_set;

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
				//var userRef = fb.child("users");

				//To check if the user is a valid user to be added to the group
				usersRef_get = fb.child("users");
				usersRef_get.once("value", function(snapshot) {
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

						//Check if user has already been added to the group
						groupMembersRef_get = fb.child("group_members").child(group_key);
						groupMembersRef_get.once("value", function(snapshot) {
							snapshot.forEach(function(childSnapShot) {
								var member = childSnapShot.val();
								if(new_member_email == member.user_email)
									chk_is_member = true;
							});

							//If user hasn't been added to the group
							if(!chk_is_member) {
								// Add the user to the group members entity
								groupsRef_set = fb.child("groups").child(group_key);
								groupsRef_set.once("value", function(snapshot) {
									var group = snapshot.val();
									group_member_count = group.group_member_count;

									groupsRef_set.update({
										group_member_count: group_member_count + 1
									});

									groupMembersRef_ins = fb.child("group_members").child(group_key);
									groupMembersRef_ins.push({
										'user_key': user_key,
										'user_name': user_name,
										'user_email': new_member_email,
										'group_admin': false
									});

									// Include the group's key in the user entity for dashboard filtering purposes
									usersRef_ins = fb.child("users").child(user_key).child("group_list");
									usersRef_ins.push({'group_key': group_key});

									$scope.showAlert("User has been added successfully");
								});



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
   /*alertPopup.then(function(res) {
     console.log('Saved Successfully');
   });*/
  };


	$scope.showActionSheet = function (){
		$ionicActionSheet.show({
			buttons: [
				 { text: '<div class="button-block text-center">Create Post</div>' },
				 { text: '<div class="button-block text-center">Invite Friends</div>'}
			],
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

})
