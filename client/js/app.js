
angular.module('Chat', ['Services']);

// Create the chat app and define routes
angular.module('Chat').config(function ($routeProvider) {
    $routeProvider.when('/chat_client', {
        templateUrl: 'partials/chat_client.html',
        controller: 'chatClient'
    });
    $routeProvider.otherwise({redirectTo: '/chat_client'});
});

// Frontpage Controller
angular.module('Chat').controller('chatClient', function($scope, Socket) {
    $scope.loading = true;
    $scope.clients = [];
    $scope.messages = [];
    $scope.activeRoomID = "default";
    $scope.activeRoomName = "Flur";
    $scope.rooms = [
        {value: 'default', label: 'Flur'},
        {value: 'kitchen', label: 'Küche'},
        {value: 'sleep', label: 'Schlafzimmer'},
        {value: 'bath', label: 'Badezimmer'},
        {value: 'office', label: 'Büro'}
    ];
    $scope.room = $scope.rooms[0];  // Set default/Flur as selected

    /********** Event handling *********/
    Socket.on('launch', function(data) {
        $scope.clientID = data.clientID;
        $scope.user = data.clientID;
        $scope.room = $scope.rooms[0];
        $scope.loading = false;
    });

    Socket.on('refreshClientsCount', function(data) {
        $scope.connections = data.count;
    });

    Socket.on('refreshClientNames', function(data) {
        $scope.clients = data.clients;
    });

    Socket.on('refreshOwnName', function(data) {
        $scope.user = data.name;
    });

    /**
     * msg = JSON Object!
     */
    Socket.on('receive', function(data) {
        $scope.messages.unshift(data);
    });

    /********** Methods *********/
    $scope.changeName = function() {
        Socket.emit('changeName', {
            roomID: $scope.activeRoomID,
            name: $scope.user
        });
    };

    // LEAVING AND ENTERING A ROOM //
    $scope.changeRoom = function() {
        var leaveData = {
            roomID: $scope.activeRoomID,
            roomName: $scope.activeRoomName,
            message: $scope.user + " hat hat den Raum '"+$scope.activeRoomName+"' verlassen",
            msgColor: "red"
        };
        Socket.emit('leaveRoom', leaveData);
        // Frontend
        leaveData.message = "Du hast hat den Raum '"+$scope.activeRoomName+"' verlassen"
        $scope.messages.unshift(leaveData);

        var enterData = {
            roomID: $scope.room.value,
            roomName: $scope.room.label,
            message: $scope.user + " hat hat den Raum '"+$scope.room.label+"' betreten",
            msgColor: "green"
        };
        Socket.emit('joinRoom', enterData);
        // Frontend
        enterData.message = "Du hast hat den Raum '"+$scope.room.label+"' betreten"
        $scope.messages.unshift(enterData);

        // Update active room
        $scope.activeRoomID = $scope.room.value;
        $scope.activeRoomName = $scope.room.label;
    };

    // SENDING A MESSAGE
    $scope.sendMessage = function() {
        var time = new Date().toTimeString();
        var tArr = time;
        var data = {
            roomID: $scope.activeRoomID,
            roomName: $scope.activeRoomName,
            message: tArr.substr(0,8) + " " + $scope.user + "> " + $scope.msg,
            msgColor: 'silver'
        };
        Socket.emit('send', data);
        // Frontend
        data.msgColor = "grey";
        $scope.messages.unshift(data);
        $scope.msg = "";
    };

});


angular.module('Services', []).
    factory('Socket', function($rootScope) {
        var socket = io("/chat").connect();
        return {
            on: function(eventName, callback) {
                socket.on(eventName, function() {
                    var args = arguments;
                    $rootScope.$apply(function() {
                        callback.apply(socket, args);
                    });
                });
            },
            emit: function(eventName, data, callback) {
                if(typeof data == 'function') {
                    callback = data;
                    data = {};
                }
                socket.emit(eventName, data, function() {
                    var args = arguments;
                    $rootScope.$apply(function() {
                        if(callback) {
                            callback.apply(socket, args);
                        }
                    });
                });
            },
            emitAndListen: function(eventName, data, callback) {
                this.emit(eventName, data, callback);
                this.on(eventName, callback);
            }
        };
    });