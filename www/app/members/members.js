angular.module('app.members', [])

.controller('groupListMemberController', function($scope, $stateParams,	$ionicPopup, Users, $ionicActionSheet, $cordovaCamera, Groups, Group_members) {
	var group_key = $stateParams.grp_key;
	$scope.grp_key = group_key;
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
		Group_members.removeGroupMember(member_key, user_key, group_key, $scope.listOfAllGroupMembers).then(function(message) {
			if(message) {
				$scope.showAlert(message);
			}
		});
	};

	$scope.showAlert = function(message) {
		var alertPopup = $ionicPopup.alert({
			title: 'Clicker',
			template: message
		});
	};

	$scope.inviteFriends = function() {
		$scope.newGroupMember = {};

		// An elaborate, custom popup
		var myPopup = $ionicPopup.show({
			template: '<input type="email" ng-model="newGroupMember.new_member_email">',
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
						if (!$scope.newGroupMember.new_member_email) {
							//don't allow the user to close unless he enters wifi password
							e.preventDefault();
						} else {
							return $scope.newGroupMember.new_member_email;
						}
					}
				}
			]
		});

		myPopup.then(function(new_member_email) {
			if(new_member_email) {
				var user_email = Users.getEmail();

				Group_members.inviteGroupMember(new_member_email, user_email, group_key).then(function(message) {
			      $scope.showAlert(message);
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
			Groups.updateGroupImage(group_key, imageData);

		}, function(err) {
			//alert('Error taking photo: ' + err);
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
			Groups.updateGroupImage(group_key, imageData);

		}, function(err) {
			//alert('Error choosing photo: ' + err);
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
				Groups.updateGroupDescription(group_key, new_group_desc);
			}
		});
	};
})
