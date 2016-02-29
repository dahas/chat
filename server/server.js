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
var CM = require('./ClientManager.js');

var server = connect().
    use(connect.static(__dirname + '/../client')).
    listen(8080);

var socketIO = require('socket.io');

var io = socketIO.listen(server);

var defaultRoom = "default";

var nsp = io.of("/chat");   // Namespace

nsp.on('connection', function (socket) {
    // Every client joins the default room
    socket.join(defaultRoom);

    // Create a readable unique ID
    socket.client.id = CM.createUniqueClientID("Gast");

    // Assign the client to the manager
    CM.addClient(socket.client.id, defaultRoom);

    // Provide data to the frontend when client connects
    socket.emit('launch', {
        clientID: socket.client.id
    });

    // Send amount of connections to the namespace
    nsp.emit('refreshClientsCount', {
        count: CM.amountOfConnectedClients(null)
    });

    nsp.to(defaultRoom).emit('refreshClientNames', {
        clients: CM.getClients(defaultRoom)
    });

    // Send event to the namespace excluding sender
    socket.on('disconnect', function () {
        CM.removeClient(socket.client.id);

        socket.broadcast.emit('refreshClientsCount', {
            count: CM.amountOfConnectedClients(null)
        });

        var roomID = CM.getClientRoom(socket.client.id);
        socket.broadcast.to(roomID).emit('refreshClientNames', {
            clients: CM.getClients(roomID)
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
        socket.client.id = CM.changeClientID(socket.client.id, data.name);
        socket.emit('refreshOwnName', {
            name: socket.client.id
        });
        nsp.to(data.roomID).emit('refreshClientNames', {
            clients: CM.getClients(data.roomID)
        });
    });

    // User leaves a room
    socket.on('leaveRoom', function (data) {
        socket.broadcast.to(data.roomID).emit('receive', data);
        socket.leave(data.roomID);
        CM.removeClient(socket.client.id);
        nsp.to(data.roomID).emit('refreshClientNames', {
            clients: CM.getClients(data.roomID)
        });
    });

    // User joins a room
    socket.on('joinRoom', function (data) {
        socket.broadcast.to(data.roomID).emit('receive', data);
        socket.join(data.roomID);
        CM.addClient(socket.client.id, data.roomID);
        nsp.to(data.roomID).emit('refreshClientNames', {
            clients: CM.getClients(data.roomID)
        });
    });

    // Error handler
    socket.on('error', function (error) {
        console.log("ERROR >>> " + error)
    });

});

console.log("SUCCESS >>> Server started @ " + new Date().toLocaleString() + ". Running on localhost:8080")