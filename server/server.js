/**
 *
 * CHAT
 *
 * Requires:
 * npm install connect@2.x.x
 * npm install forever -g
 * npm install socket.io
 */
var connect = require('connect');
var ClientManager = require('./ClientManager.js');

var server = connect().
    use(connect.static(__dirname + '/../client')).
    listen(8080);

var socketIO = require('socket.io');

var io = socketIO.listen(server);

var defaultRoom = "default";

var clientNames = [];
var clientsCount = 0;

var clients = [];

var nsp = io.of("/chat");

nsp.on('connection', function (socket) {
    //var CM = new ClientManager(socket);
    //CM.testFunc();

    clientNames = getClients();
    socket.client.id = unifyArray(clientNames, "Gast");   // Create a unique readable ID
    clientNames = addClient(socket.client.id, defaultRoom); // Assign clients to the default room

    socket.leave(socket.id);    // Every new user leaves his own room
    socket.join(defaultRoom);   // ... and joins the default room

    clientsCount++;


    // Provide data to the socket when it connects
    socket.emit('launch', {
        clientID: socket.client.id
    });

    // Send amount of connections to all clients including sender
    nsp.emit('refreshClientsCount', {
        count: clientsCount
    });

    nsp.to(defaultRoom).emit('refreshClientNames', {
        clients: clientNames
    });

    // Send event to all connected clients excluding sender
    socket.on('disconnect', function () {
        clientsCount--;
        var roomID = getClientRoom(socket.client.id);
        clientNames = removeClient(socket.client.id);
        socket.broadcast.emit('refreshClientsCount', {
            count: clientsCount
        });

        socket.broadcast.to(roomID).emit('refreshClientNames', {
            clients: clientNames
        });
        socket.broadcast.emit('receive', {
            message: socket.client.id + " hat den Chat beendet"
        });
    });

    // Regular event for sending a message
    socket.on('send', function (data) {
        socket.broadcast.to(data.roomID).emit('receive', data);   // Trigger the receive event on client side
    });

    // User changes his name
    socket.on('changeName', function (data) {
        var currName = socket.client.id;
        var newName = unifyArray(clientNames, data.name); // Make name unique if it isn´t already
        socket.client.id = newName; // Update current clientId on server-side ...
        clientNames = changeClientName(currName, newName);
        socket.emit('refreshOwnName', {
            name: newName
        });
        nsp.to(data.roomID).emit('refreshClientNames', {
            clients: clientNames
        });
    });

    // User leaves a room
    socket.on('leaveRoom', function (data) {
        socket.broadcast.to(data.roomID).emit('receive', data);
        socket.leave(data.roomID);
        clientNames = removeClient(socket.client.id);
        nsp.to(data.roomID).emit('refreshClientNames', {
            clients: clientNames
        });
    });

    // User joins a room
    socket.on('joinRoom', function (data) {
        socket.broadcast.to(data.roomID).emit('receive', data);
        socket.join(data.roomID);
        clientNames = addClient(socket.client.id, data.roomID);
        nsp.to(data.roomID).emit('refreshClientNames', {
            clients: clientNames
        });
    });

    // Error handler
    socket.on('error', function (error) {
        console.log("ERROR >>> " + error)
    })

    /**
     * Functions to manage the clients
     */
    function addClient(clientID, roomID) {
        clientNames.push(clientID);
        var client = {"roomID": roomID, "clientID": clientID};
        clients.push(client);
        return getClients(roomID);
    }

    function getClients(room) {
        var cNames = [];
        var clientsInRoom = room ? clients.filter(function(clients){return clients.roomID == room}) : clients;
        for (var i = 0; i < clientsInRoom.length; i++) {
            cNames.push(clientsInRoom[i].clientID);
        }
        return cNames ;
    }

    function removeClient(clientID)
    {
        var roomID;
        for (var i = 0; i < clients.length; i++) {
            if (clients[i].clientID == clientID) {
                roomID = clients[i].roomID;
                delete clients[i];
            }
        }
        clients = clients.filter(function(n){ return n != undefined });
        return getClients(roomID);
    }

    function getClientRoom(clientID)
    {
        for (var i = 0; i < clients.length; i++) {
            if (clients[i].clientID == clientID)
                return clients[i].roomID;
        }
    }

    function changeClientName(oldClientID, newClientID)
    {
        var roomID;
        for (var i = 0; i < clients.length; i++) {
            if (clients[i].clientID == oldClientID) {
                clients[i].clientID = newClientID;
                roomID = clients[i].roomID;
            }
        }
        return getClients(roomID);
    }

});

console.log("SUCCESS >>> Server started @ " + new Date().toLocaleString() + ". Running on localhost:8080")


//////////////// Helper functions //////////////////

/**
 *
 * @param   array  Non-associative array
 * @param   item   The elment to search for inside the array
 * @returns {*}
 */
function unifyArray(array, item) {
    var index = array.indexOf(item);
    var unique = index >= 0 ? false : true;
    var x = 0;
    while (unique == false) {
        if (item.indexOf("_") >= 0) {
            var nArr = item.split("_");
            if (isNaN(nArr[nArr.length - 1]) == false) {
                x = nArr[nArr.length - 1];
                nArr.pop();
            }
            item = nArr.join("_");
        }
        x++;
        item = item + "_" + x;
        return unifyArray(array, item);
    }
    return item;
}

function removeFromArray(array, item) {
    var newArray = [];
    var x = 0;
    for (var i = 0; i < array.length; i++) {
        if (array[i] != item) {
            newArray[x++] = array[i];
        }
    }
    return newArray;
}