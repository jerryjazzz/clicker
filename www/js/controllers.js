angular.module('app.controllers', [])
  
.controller('loginController', function($scope) {

	$scope.login = function() {
		alert("login");
	};

})
   
.controller('signupController', function($scope) {

	$scope.signup = function() {
		alert("signup");
	};

})
   
.controller('groupListController', function($scope, $ionicModal) {

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
	$scope.save   = function(group) {
		// save the group and close the modal;
		alert("Saving " + group.name);
		$scope.close();
	};

	$scope.delete = function(index) {
	// remove groups
		alert("remove group");
		$scope.refresh();
    };

    $scope.refresh = function() {
    	// refresh the groups by retrieving from db
    };

})
   
.controller('groupController', function($scope) {

})

 