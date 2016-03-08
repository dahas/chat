/**
 * CHAT
 *
 * Requires:
 * npm install express@4.x.x
 * npm install forever -g
 * npm install socket.io
 *
 * Terminal:
 * 1. cd server
 * 2. forever --watch server.js
 */
var connect = require('express');

var crm = require('crm');

var server = connect().
    use(connect.static(__dirname + '/../client')).
    listen(8080);

var socketIO = require('socket.io');

var io = socketIO.listen(server);

var uClientID = "";
var defaultRoom = "default";

var nsp = io.of("/chat");   // Namespace

nsp.on('connection', function (socket) {
    // Every client joins the default room
    socket.join(defaultRoom);

    // Create a readable unique ID
    uClientID = crm.createUniqueClientID("Gast");

    // Assign the client to the manager
    crm.addClient(uClientID, defaultRoom);

    // Provide data to the frontend when client connects
    socket.emit('launch', {
        clientID: uClientID
    });

    // Send amount of connections to the namespace
    nsp.emit('refreshClientsCount', {
        count: crm.amountOfConnectedClients(null)
    });

    nsp.to(defaultRoom).emit('refreshClientNames', {
        clients: crm.getClients(defaultRoom)
    });

    // Send event to the namespace excluding sender
    socket.on('disconnect', function () {
        crm.removeClient(uClientID);

        socket.broadcast.emit('refreshClientsCount', {
            count: crm.amountOfConnectedClients(null)
        });

        var roomID = crm.getClientRoom(uClientID);
        socket.broadcast.to(roomID).emit('refreshClientNames', {
            clients: crm.getClients(roomID)
        });

        socket.broadcast.emit('receive', {
            message: uClientID + " hat den Chat beendet"
        });
    });

    // Regular event for sending a message
    socket.on('send', function (data) {
        socket.broadcast.to(data.roomID).emit('receive', data);   // Trigger the receive event on client side
    });

    // User changes his name
    socket.on('changeName', function (data) {
        uClientID = crm.changeClientID(uClientID, data.name);
        socket.emit('refreshOwnName', {
            name: uClientID
        });
        nsp.to(data.roomID).emit('refreshClientNames', {
            clients: crm.getClients(data.roomID)
        });
    });

    // User leaves a room
    socket.on('leaveRoom', function (data) {
        socket.broadcast.to(data.roomID).emit('receive', data);
        socket.leave(data.roomID);
        crm.removeClient(uClientID);
        nsp.to(data.roomID).emit('refreshClientNames', {
            clients: crm.getClients(data.roomID)
        });
    });

    // User joins a room
    socket.on('joinRoom', function (data) {
        socket.broadcast.to(data.roomID).emit('receive', data);
        socket.join(data.roomID);
        crm.addClient(uClientID, data.roomID);
        nsp.to(data.roomID).emit('refreshClientNames', {
            clients: crm.getClients(data.roomID)
        });
    });

    // Error handler
    socket.on('error', function (error) {
        console.log("ERROR >>> " + error)
    });

});

console.log("SUCCESS >>> Server started @ " + new Date().toLocaleString() + ". Running on localhost:8080")