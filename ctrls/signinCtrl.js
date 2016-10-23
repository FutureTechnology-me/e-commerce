shopApp.controller('signinCtrl', function($scope, $rootScope, $http, $location, $cookies, $anchorScroll) {
	if ($rootScope.loggedIn === 1) {
		$location.path('/account');
	}

	$scope.signin = function() {
		var username = $scope.username;
		var password = $scope.password;
		$http.post(url + 'signin', {
			username: username,
			password: password
		}).then(function success(rspns) {
			if (rspns.data.passFail === 1) {
				var userToken = rspns.data.obj.token;
				$cookies.put('userToken', userToken); 
				$location.path('/');
			} else {
				$scope.failed = 1;
				$scope.failedMessage = rspns.data.status;
				$scope.username = "";
				$scope.password = "";
			}
		}, function fail(rspns) {
			$scope.failed = 1;
			$scope.failedMessage = 'Oops, something went wrong. Please try again.';
			$scope.username = "";
			$scope.password = "";
		});
	}	

});