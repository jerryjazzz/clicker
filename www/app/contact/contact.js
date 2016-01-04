angular.module('app.contact', [])

.controller('contactController', function($scope, $stateParams ,Users, $timeout, $ionicPopup,$ionicLoading,$cordovaContacts) {
  var grp_key = $stateParams.grp_key;
  var grp_name= $stateParams.group_name;

  // added members
  $scope.contacts;
  $scope.addedContacts = [];
  $scope.email;

  // loading screen

  $scope.$on('$ionicView.enter', function(){
			console.log('load contacts');
      $ionicLoading.show({
        content: 'Loading',
        animation: 'fade-in',
        showBackdrop: true,
        maxWidth: 200,
        showDelay: 0
      });

      $timeout(function(){
        //$scope.getAllContact($cordovaContacts);
        $scope.getDummyContact();
        $ionicLoading.hide();

      },1000);
	});

  $scope.$on('$ionicView.beforeLeave', function(){
     console.log('Saving added new members');

  });

  //dummy contacts function for webview testing usage
  $scope.getDummyContact = function(){
    console.log('Loading dummy contacts');
    $scope.contacts=[
      {id:"1", name:"dummy1", displayName:"dummy1",emails:[{value:"dummy1@email.com"}]},
      {id:"2", name:"dummy2", displayName:"dummy2",emails:[{value:"dummy2@email.com"}]},
      {id:"3", name:"dummy3", displayName:"dummy3",emails:[{value:"dummy3@email.com"}]},
      {id:"4", name:"dummy4", displayName:"dummy4",emails:[{value:"dummy4@email.com"}]},
      {id:"5", name:"dummy5", displayName:"dummy5",emails:[{value:"dummy5@email.com"}]},
      {id:"6", name:"dummy6", displayName:"dummy6",emails:[{value:"dummy6@email.com"}]},
      {id:"7", name:"dummy7", displayName:"dummy7",emails:[]},
    ];

  }

  $scope.getAllContact = function($cordovaContacts){
    console.log('Loading actual contacts from phone');
    var opts = {
      filter : "",
      multiple: true,
      fields:  [ 'id','name','displayName','emails' ]
    };

    $cordovaContacts.find(opts).then(function(result){
      $scope.contacts = result;
      //console.log(JSON.stringify(result));
    },function(error){
      console.log("ERROR:"+error);
    });
  }

  // add / remove member ------------------------------------------------------
  $scope.addMember = function(contact){


    // add member
    if(contact.checked == true)
    {
      //if(contact.emails[0].value != undefined || )
    //  $scope.showAlert("add");
      //console.log("add");

      var id = contact.id;
      var name = contact.displayName;
      var email;

      if( contact.emails ==  null || contact.emails.length== 0 || contact.emails == undefined)
      {
        //console.log("CANNOT ADD|" + email);

        var message = 'This contact doesn\'t have valid email. Do you want to add email?';
        // get user to confirm
        var confirmPopup = $ionicPopup.confirm({
            title : 'Clicker',
            template: message
        });

        confirmPopup.then(function(res) {
          if(res) {
            console.log('OK to add email manually');
            $scope.new_contact= {};

            var Popup =$ionicPopup.show({
              template: '<input ng-model="new_contact.email" type="email" placeholder="Email">',
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
                      //console.log($scope.new_contact.email);
                      id = contact.id;
                      email =$scope.new_contact.email;
                      name = contact.displayName;
                      console.log("ADD|"+name + "|" + email);
                      $scope.addedContacts.push({
                        'id': id,
                        'name': name,
                        'email': email
                      });

                      console.log("Total contacts added:" + $scope.addedContacts.length);

                  }
                },
              ]
              });

          } else {
            console.log('Cancel');
            contact.checked = false;

          }
        });

      }
      else {
        email = contact.emails[0].value;

        // handle on emtpy name
        if(name == "")
        {
          name = email;
        }

        console.log("ADD|"+name + "|" + email);

        $scope.addedContacts.push({
          'id': id,
          'name': name,
          'email': email
        });

        console.log("Total contacts added:" + $scope.addedContacts.length);
        console.log(JSON.stringify($scope.addedContacts));
      }
    }
    else // remove member
    {
      //console.log("remove");
      var i = 0;
      var cont = true;
      var outputContacts = {};
      var contactsArrayA = {};
      var contactsArrayB = {};
      var total = $scope.addedContacts.length;
      while(i < $scope.addedContacts.length && cont == true)
      {
          if($scope.addedContacts[i].id == contact.id)
          {
            //delete $scope.addedContacts[i];
            contactsArrayA = $scope.addedContacts.slice(0,i+1);
            contactsArrayA.pop();
            if (i != total)
            {
              contactsArrayB = $scope.addedContacts.slice(i+1, total);
            }

            $scope.addedContacts = {};
            $scope.addedContacts = contactsArrayA.concat(contactsArrayB);


            //console.log(JSON.stringify(contactsArrayA));
            //console.log(JSON.stringify(contactsArrayB));
            cont = false;

            console.log("Total contacts:" + $scope.addedContacts.length);
            console.log(JSON.stringify($scope.addedContacts));
          }

          i++;
      }
    }
  };

  // alert ---------------------------------------------------------------
  $scope.showAlert = function(message) {
		var alertPopup = $ionicPopup.alert({
			title: 'Clicker',
			template: message
		});
	};

})
