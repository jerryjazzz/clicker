angular.module('app.controllers', [])
  
.controller('loginCtrl', function($scope) {

})
   
.controller('signUpCtrl', function($scope) {

})
   
.controller('groupsCtrl', function($scope, $ionicModal) {

	$ionicModal.fromTemplateUrl('new_group.html', function(modal) {
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
	$scope.save   = function() {
		// save the group and close the modal;
		$scope.close();
	};

	$scope.removeGroup = function(index) {
	// remove groups
		alert("remove group");
		$scope.refresh();
    }

    $scope.refresh = function() {
    	// refresh the groups by retrieving from db
    }

})
   
.controller('itemsCtrl', function($scope) {

})
   
.controller('newGroupCtrl', function($scope) {

})
 