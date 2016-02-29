
# crm

Client and room manager for chat applications with socket.io

## How to use

// Install via console
npm install crm@1.x.x

// Include in your serverside JS
var crm = require('crm');

// Namespace
var nsp = io.of("/chat");

nsp.on('connection', function (socket) {
    // Create a readable unique ID
    uClientID = crm.createUniqueClientID("Guest");

    // Assign a client to the manager
    crm.addClient(uClientID, "DefaultRoom");

    // Get number of connected clients in a namespace.
    crm.amountOfConnectedClients(null);

    // Get number of connected clients in a room.
    crm.amountOfConnectedClients("RoomName");

    // Get connected clients in a namespace
    crm.getClients(null);

    // Get connected clients in a room
    crm.getClients("RoomName");

    // Remove a client from the manager
    crm.removeClient(uClientID);

    // Change a client ID (new one will be unique)
    uClientID = crm.changeClientID(uClientID, "NewID");
}

## License

MIT
