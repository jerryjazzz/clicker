angular.module('app.members', [])

.controller('groupListMemberController', function($scope, $stateParams,	$ionicPopup, Users, $ionicActionSheet, $cordovaCamera) {
	var group_key = $stateParams.grp_key;
	$scope.group_name = $stateParams.grp_name;
	$scope.listOfAllGroupMembers = [];

	//Firebase references
	var groupMembers_GroupKey_Ref = fb.child("group_members").child(group_key);
	var groupMembers_GrpKey_MemberKey_Ref;

	groupMembers_GroupKey_Ref.on("value", function(snapshot) {
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
						var userRef = fb.child("users").child(user_key).child("group_list");
						userRef.once("value", function(snapshot) {
							snapshot.forEach(function(childSnapShot) {
								var userGroupList = childSnapShot.val();

								if(group_key == userGroupList.group_key)
								{
									var userGroupListRef = fb.child("users").child(user_key).child("group_list").child(childSnapShot.key());
									userGroupListRef.remove();

									//Remove member from group_members entity
									groupMembers_GrpKey_MemberKey_Ref = groupMembers_GroupKey_Ref.child(member_key);
									groupMembers_GrpKey_MemberKey_Ref.remove();

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

  $scope.showAlert = function(message) {
		var alertPopup = $ionicPopup.alert({
			title: 'Clicker',
			template: message
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
		var options =   {
			quality : 75,
			destinationType : Camera.DestinationType.DATA_URL,
			sourceType : Camera.PictureSourceType.CAMERA,
			allowEdit : true,
			encodingType: Camera.EncodingType.JPEG,
			popoverOptions: CameraPopoverOptions,
			targetWidth: 150,
			targetHeight: 150,
			saveToPhotoAlbum: false
		};

		$cordovaCamera.getPicture(options).then(function(imageData) {
			$scope.imgURI = "data:image/jpeg;base64," + imageData;
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
			targetWidth: 150,
			targetHeight: 150,
			saveToPhotoAlbum: false
		};

		$cordovaCamera.getPicture(options).then(function(imageData) {
			$scope.imgURI = "data:image/jpeg;base64," + imageData;
		}, function(err) {
			alert('Error choosing photo: ' + err);
		});
	};

	$scope.updateDescription = function() {
		alert('edit description');
	};
})
