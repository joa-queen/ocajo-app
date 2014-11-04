(function(){ 
var app = angular.module('Dashboard', ['ui.bootstrap', 'ui.router', 'ngCookies', 'ngResource']);
app.constant('apiUrl', 'http://local.api.ocajo.com/');
app.value('sessid', null);

app.service('ProjectsProvider', ['$resource', 'apiUrl', '$rootScope', function($resource, apiUrl, $rootScope) {
    $rootScope.projects = [];

    this.info = $resource(
        apiUrl + 'projects/:projectId',
        { projectId: '@projectId' },
        {
            'list' : { method: 'GET', isArray: true },
            'read' : { method: 'GET' },
            'edit' : { method: 'PUT' }
        }
    );

    this.reports = $resource(
        apiUrl + 'projects/:projectId/reports',
        { projectId: '@projectId' },
        {
            'list' : { method: 'GET', isArray: true },
            'read' : { method: 'GET' },
            'edit' : { method: 'PUT' }
        }
    );

    this.refresh = function() {
        $rootScope.projects = this.info.list();
    };

    return this;
}]);

app.service('ReportsProvider', ['$resource', 'apiUrl', function($resource, apiUrl) {
    this.index = $resource(
        apiUrl + 'reports/:reportId',
        { reportId: '@reportId' },
        {
            'read' : { method: 'GET' },
        }
    );

    this.errors = $resource(
        apiUrl + 'reports/:reportId/errors/:errorId',
        { reportId: '@reportId', errorId: '@errorId' },
        {
            'read' : { method: 'GET' },
        }
    );

    return this;
}]);
'use strict';

/**
 * Route configuration for the Dashboard module.
 */
angular.module('Dashboard').config(['$stateProvider', '$urlRouterProvider', 
    function($stateProvider, $urlRouterProvider) {

    // For unmatched routes
    $urlRouterProvider.otherwise('/');

    // Application routes
    $stateProvider
        .state('login', {
            url: '/',
            templateUrl: 'login.html'
        })
        .state('index', {
            url: '/home',
            templateUrl: 'home.html'
        })
        .state('project', {
            url: '/projects/:projectId',
            templateUrl: 'dashboard.html',
            controller: 'ProjectCtrl'
        })
        .state('report', {
            url: '/reports/:reportId',
            templateUrl: 'report.html',
            controller: 'ReportCtrl'
        });
}]);

/**
 * Master Controller
 */
angular.module('Dashboard')
    .controller('MasterCtrl', ['$scope', '$cookieStore', '$rootScope', MasterCtrl]);

function MasterCtrl($scope, $cookieStore, $rootScope) {
    
    $rootScope.loggedin = false;

    /**
     * Sidebar Toggle & Cookie Control
     *
     */
    var mobileView = 992;

    $scope.getWidth = function() { return window.innerWidth; };

    $scope.$watch($scope.getWidth, function(newValue, oldValue)
    {
        if(newValue >= mobileView)
        {
            if(angular.isDefined($cookieStore.get('toggle')))
            {
                if($cookieStore.get('toggle') == false)
                {
                    $scope.toggle = false;
                }            
                else
                {
                    $scope.toggle = true;
                }
            }
            else 
            {
                $scope.toggle = true;
            }
        }
        else
        {
            $scope.toggle = false;
        }

    });

    $scope.toggleSidebar = function() 
    {
        $scope.toggle = ! $scope.toggle;

        $cookieStore.put('toggle', $scope.toggle);
    };

    window.onresize = function() { $scope.$apply(); };
}

/**
 * Alerts Controller
 */
angular.module('Dashboard').controller('AlertsCtrl', ['$scope', AlertsCtrl]);

function AlertsCtrl($scope) {
    /*$scope.alerts = [
        { type: 'success', msg: 'Thanks for visiting! Feel free to create pull requests to improve the dashboard!' },
        { type: 'danger', msg: 'Found a bug? Create an issue with as many details as you can.' }
    ];

    $scope.addAlert = function() {
        $scope.alerts.push({msg: 'Another alert!'});
    };

    $scope.closeAlert = function(index) {
        $scope.alerts.splice(index, 1);
    };*/
}
/**
 * Login Controller
 */
angular.module('Dashboard').controller('LoginCtrl', ['$scope', '$rootScope', '$http', 'apiUrl', 'sessid', '$state', 'ProjectsProvider', LoginCtrl]);

function LoginCtrl($scope, $rootScope, $http, apiUrl, sessid, $state, Projects) {
    $scope.faillogin = false;

    $scope.login = function(email, password) {
        $http.post(apiUrl + 'users/login',  {
                'email': email,
                'password': password
        }).success(function(data, status, headers, config) {
            if (typeof data.error == 'undefined') {
                $scope.faillogin = false;
                sessid = data.sessid;
                userid = data.userid;
                localStorage.setItem('email', email);
                localStorage.setItem('password', password);

                $rootScope.loggedin = true;

                $http.defaults.headers.common.SESSID = sessid;
                $http.defaults.headers.common.Api = 'v1';

                Projects.refresh();

                $state.go('index');
            } else {
                $scope.faillogin = true;
                $scope.password = '';
            }
        });
    };

    if (localStorage.getItem('email') && localStorage.getItem('password')) {
        $scope.login(localStorage.getItem('email'), localStorage.getItem('password'));
    }
}
/**
 * Home Controller
 */
angular.module('Dashboard').controller('HomeCtrl', ['$scope', HomeCtrl]);

function HomeCtrl($scope) {
    
}
/**
 * Project Controller
 */
angular.module('Dashboard').controller('ProjectCtrl', ['$scope', '$stateParams', 'ProjectsProvider', ProjectCtrl]);

function ProjectCtrl($scope, $stateParams, Projects) {
    $scope.project = Projects.info.read({ projectId: $stateParams.projectId }, function() {
        $scope.reports = Projects.reports.list({ projectId: $stateParams.projectId });
    });
}
/**
 * Home Controller
 */
angular.module('Dashboard').controller('ReportCtrl', ['$scope', '$stateParams', 'ReportsProvider', ReportCtrl]);

function ReportCtrl($scope, $stateParams, ReportsProvider) {
    $scope.report = ReportsProvider.index.read({'reportId': $stateParams.reportId}, function(data) {
        $scope.error = ReportsProvider.errors.read({'reportId': data.id, 'errorId': data.last_error_id});
    });

    $scope.toggledserver = false;
    $scope.toggledpost = false;
    $scope.toggledget = false;
    $scope.toggledsession = false;
    $scope.toggledcontext = false;

    $scope.toggleServer = function() {
        $scope.toggledserver = !$scope.toggledserver;
    };
    $scope.togglePost = function() {
        $scope.toggledpost = !$scope.toggledpost;
    };
    $scope.toggleGet = function() {
        $scope.toggledget = !$scope.toggledget;
    };
    $scope.toggleSession = function() {
        $scope.toggledsession = !$scope.toggledsession;
    };
    $scope.toggleContext = function() {
        $scope.toggledcontext = !$scope.toggledcontext;
    };
}
/**
 * Loading Directive
 * @see http://tobiasahlin.com/spinkit/
 */
angular.module('Dashboard').directive('rdLoading', rdLoading);

function rdLoading () {
    var directive = {
        restrict: 'AE',
        template: '<div class="loading"><div class="double-bounce1"></div><div class="double-bounce2"></div></div>'
    };
    return directive;
};
})();