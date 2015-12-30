angular.module('app.members', [])

.controller('groupListMemberController', function($scope, $stateParams,	$ionicPopup, Users, $ionicActionSheet, $cordovaCamera) {
	var group_key = $stateParams.grp_key;
	$scope.group_name = $stateParams.grp_name;
	$scope.group_desc = $stateParams.grp_desc;
	$scope.group_img = $stateParams.grp_img;
	$scope.listOfAllGroupMembers = [];

	//Firebase references
	var groupMembersRef_get;
	
	groupMembersRef_get = fb.child("group_members").child(group_key);
	groupMembersRef_get.on("value", function(snapshot) {
		$scope.listOfAllGroupMembers = [];

		snapshot.forEach(function(childSnapShot) {
			var groupMember = childSnapShot.val();
			groupMember.member_key = childSnapShot.key();

			$scope.listOfAllGroupMembers.push(groupMember);
		});
	});

	$scope.removeGroupMember = function(member_key, user_key) {
		//Firebase references
		var usersRef_del;
		var groupMembersRef_del;
		var groupsRef_set;

		var chkIsGroupAdmin = false;
		var loginUserKey = Users.getUserKey();

		for(var i=0; i<$scope.listOfAllGroupMembers.length; i++)
		{
			if(loginUserKey == $scope.listOfAllGroupMembers[i].user_key)
			{
				if($scope.listOfAllGroupMembers[i].group_admin) {
					chkIsGroupAdmin = true;
				}
			}
		}

		if(chkIsGroupAdmin) {
			// To check if the user has accidentally deleted him/herself
			if(loginUserKey != user_key) {

				var confirmPopup = $ionicPopup.confirm({
					title: 'Clicker',
					template: 'Are you sure you want to delete this user from the group?'
				});

				confirmPopup.then(function(confirm) {
					// If user confirm to drop the user from the group
					if(confirm)
					{
						// Remove group from user entity
						usersRef_del = fb.child("users").child(user_key).child("group_list").child(group_key);
						usersRef_del.remove();

						//Remove member from group_members entity
						groupMembersRef_del = fb.child("group_members").child(group_key).child(member_key);
						groupMembersRef_del.remove();

						//Deduct member count
						groupsRef_set = fb.child("groups").child(group_key);
						groupsRef_set.once("value", function(snapshot) {
							var group = snapshot.val();

							groupsRef_set.update({
								group_member_count: group.group_member_count - 1
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

	$scope.showAlert = function(message) {
		var alertPopup = $ionicPopup.alert({
			title: 'Clicker',
			template: message
		});
	};

	$scope.inviteFriends = function() {
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
				var user_email = Users.getEmail();

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
									var userGroupListObj = {};
									userGroupListObj[group_key] = true;
									usersRef_set = fb.child("users").child(user_key).child("group_list");
									usersRef_set.update(userGroupListObj);

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

  $scope.showActionSheet = function()	{
		$ionicActionSheet.show({
		    buttons: [
		       { text: '<div class="button-block text-center">Take Photo</div>' },
		       { text: '<div class="button-block text-center">Choose from Photos</div>'},
					 { text: '<div class="button-block text-center">Edit Description</div>'}
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
					case 2 :
						$scope.updateDescription();
						return true;
				}
				return true;
		    }
	   });
  };

	$scope.takePic = function() {
		var groupsRef_set;

		var options =   {
			quality : 75,
			destinationType : Camera.DestinationType.DATA_URL,
			sourceType : Camera.PictureSourceType.CAMERA,
			allowEdit : true,
			encodingType: Camera.EncodingType.JPEG,
			popoverOptions: CameraPopoverOptions,
			targetWidth: 500,
			targetHeight: 500,
			saveToPhotoAlbum: false
		};

		$cordovaCamera.getPicture(options).then(function(imageData) {
			$scope.group_img = imageData;

			//Save the captured image to the firebase
			groupsRef_set = fb.child("groups").child(group_key); 
			groupsRef_set.update({
				group_img: imageData
			});

		}, function(err) {
			alert('Error taking photo: ' + err);
		});
	};

	$scope.choosefrmGallery = function() {
		var options =   {
			quality : 75,
			destinationType : Camera.DestinationType.DATA_URL,
			sourceType : Camera.PictureSourceType.PHOTOLIBRARY,
			allowEdit : true,
			encodingType: Camera.EncodingType.JPEG,
			popoverOptions: CameraPopoverOptions,
			targetWidth: 500,
			targetHeight: 500,
			saveToPhotoAlbum: false
		};

		$cordovaCamera.getPicture(options).then(function(imageData) {
			$scope.group_img = imageData;

			//Save the captured image to the firebase
			groupsRef_set = fb.child("groups").child(group_key); 
			groupsRef_set.update({
				group_img: imageData
			});

		}, function(err) {
			alert('Error choosing photo: ' + err);
		});
	};

	$scope.updateDescription = function() {
		//Firebase references
		var groupsRef_set;

		$scope.new_group_desc = {};
		$scope.new_group_desc.group_desc = $scope.group_desc;

		// An elaborate, custom popup
		var myPopup = $ionicPopup.show({
			template: '<input type="text" ng-model="new_group_desc.group_desc">',
			title: 'New Topic Description',
			subTitle: 'Please enter new description',
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
						if (!$scope.new_group_desc.group_desc) {
							e.preventDefault();
						} else {
							return $scope.new_group_desc.group_desc;
						}
					}
				}
			]
		});

		myPopup.then(function(new_group_desc) {
			if(new_group_desc) {
				//Reflect the new group desc to the screen
				$scope.group_desc = new_group_desc;

				//Update it to the firebase
				groupsRef_set = fb.child("groups").child(group_key);
				groupsRef_set.update({
					group_desc: new_group_desc
				});
			}
		});
	};
})
