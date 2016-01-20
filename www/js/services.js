angular.module('app.services', [])

.factory('BlankFactory', [function(){

}])

.service('BlankService', [function(){

}])

//Authentication Factory
.factory('Auth', function($firebaseAuth) {
    var endPoint = "https://clickerprj.firebaseio.com/";
    var usersRef = new Firebase(endPoint);
    return $firebaseAuth(usersRef);
})

// use session data to login
.factory('SessionAuth',function(){
  return{
    isLoggedIn: function () {
      var user_key = JSON.parse(window.localStorage.getItem("user_key"));
          if(user_key == null || user_key == undefined || user_key == ""){
            return false;
          }else {
            return true;
          }
         //return _user ? true : false;
      }
  }


})

//Users Factory
.factory('Users', function() {
  return {
    setEmail: function(email) {
      window.localStorage.setItem("user_email", JSON.stringify(email));
    },
    getEmail: function() {
      var user_email = window.localStorage.getItem("user_email");
      return JSON.parse(user_email);
    },
    setUserKey: function(user_key) {
      window.localStorage.setItem("user_key", JSON.stringify(user_key));
    },
    getUserKey: function() {
      var user_key = window.localStorage.getItem("user_key");
      return JSON.parse(user_key);
    },
    setUserName: function(user_key) {
      var usersRef_get = fb.child("users").child(user_key);

      usersRef_get.once("value", function(snapshot) {
        var user = snapshot.val();
        window.localStorage.setItem("user_name", JSON.stringify(user.name));
      });
    },
    getUserName: function() {
      var user_name = window.localStorage.getItem("user_name");
      return JSON.parse(user_name);
    },
    newUser: function(uid, name, email, provider) {
      var usersRef_set = fb.child("users").child(uid);
      usersRef_set.update({
        "name": name,
        "email": email,
        "provider": provider
      });
    },
    updateUserGroup: function(user_key, userGroupListObj) {
      var usersRef_set;

      usersRef_set = fb.child("users").child(user_key).child("group_list");
      usersRef_set.update(userGroupListObj);
    },
    removeUserGroup: function(user_key, group_key) {
      var usersRef_del;

      usersRef_del = fb.child("users").child(user_key).child("group_list").child(group_key);
      usersRef_del.remove();
    }
  };
})

//groups Factory
.factory('Groups', function() {
  return {
    newGroup: function(user_email, group) {
      var groupsRef_ins;

      groupsRef_ins = fb.child("groups");
      groupsRef_ins = groupsRef_ins.push({
        group_name: group.name,
        group_desc: group.description,
        group_creator: user_email,
        group_member_count: 1,
        created_dt: Date.now()
      });

      return groupsRef_ins;
    },
    removeGroup: function(group_key) {
      var groupsRef_del;

      groupsRef_del = fb.child("groups").child(group_key);
      groupsRef_del.remove();
    }
  };
})

//group_members Factory
.factory('Group_members', function($q) {
  return {
    newGroupMember: function(new_group_key, user_key, user_name, user_email, group_admin) {
      var groupMembersRef_ins;

      groupMembersRef_ins = fb.child("group_members").child(new_group_key);
      groupMembersRef_ins.push({
        'user_key': user_key,
        'user_name': user_name,
        'user_email': user_email,
        'group_admin': group_admin
      });

      return groupMembersRef_ins;
    },
    removeAllGroupMembers: function(group_key) {
      var groupMembersRef_del;

      groupMembersRef_del = fb.child("group_members").child(group_key);
      groupMembersRef_del.remove();
    },
    inviteGroupMember: function(new_member_email, user_email, group_key) {
      //To create a deffered object
      var defer = $q.defer();

      //Firebase references
      var usersRef_get;
      var groupMembersRef_get;
      var groupMembersRef_ins;
      var groupsRef_set;

      var chkValidUser = false;
      var user_key = "";
      var user_name = "";
      
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

                defer.resolve("User has been added successfully");
              });
            }
            else {
              defer.resolve("This user has already joined this group");
            }
          });
        }
        else {
          //This clause is for invalid user email / user key the email that he has logged in with
          defer.resolve("Invalid User");
        }
      });

      return defer.promise;
    }
  };
})

//group_items Factory
.factory('Group_items', function() {
  return {
    newGroupItem: function(group_key, item_name, user_name) {
      var groupItemsRef_ins;

      groupItemsRef_ins = fb.child("group_items").child(group_key);
      groupItemsRef_ins.push({
        name: item_name,
        author: user_name,
        votes: 0
      });

    },
    removeAllGroupItems: function(group_key) {
      var groupItemsRef_del;

      groupItemsRef_del = fb.child("group_items").child(group_key);
      groupItemsRef_del.remove();

    },
    newGroupItemVoter: function(group_key, grpItem_key, voter_email) {
      var groupItemsRef_ins;

      groupItemsRef_ins = fb.child("group_items").child(group_key).child(grpItem_key).child("voters");
      groupItemsRef_ins.push({'email': voter_email});
    },
    updateGroupItemVoteCount: function(group_key, grpItem_key, vote_count) {
      var groupItemsRef_set;

      groupItemsRef_set = fb.child("group_items").child(group_key).child(grpItem_key);
      groupItemsRef_set.update({
        votes: vote_count
      });

    },
    removeGroupItemVoter: function(group_key, grpItem_key, voter_key) {
      var groupItemsRef_set;

      groupItemsRef_del = fb.child("group_items").child(group_key).child(grpItem_key).child("voters").child(voter_key);
      groupItemsRef_del.remove();
    }    
  };
})

.factory('Popup', function ($firebase, $rootScope, $ionicPopup, $ionicLoading, $q) {

  var currentData = {
    //currentUser: false,
    //currentHouse: false,
    idadmin: false
  };

  $rootScope.notify = function (title, text) {
    var alertPopup = $ionicPopup.alert({
      title: title ? title : 'Error',
      template: text
    });
  };

  $rootScope.show = function () {
    $rootScope.loading = $ionicLoading.show({
      template: '<ion-spinner></ion-spinner>',
      animation: 'fade-in',
      showBackdrop: true,
      maxWidth: 200,
      showDelay: 0
    });
  };

  $rootScope.hide = function () {
    $ionicLoading.hide();
  };

  return null;

});
