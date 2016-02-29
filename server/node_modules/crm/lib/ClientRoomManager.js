var ClientRoomManager = {};

ClientRoomManager = function () {
    this.clients = [];
};

/**
 * Create a unique and readable client ID
 * @param   String  Name of the client. If it´s already in use, it´ll be extended by an increasing number.
 * @return  String  New Unique client ID
 */
ClientRoomManager.prototype.createUniqueClientID = function (name) {
    return this.unifyArray(this.getClients(null), name);
}

/**
 * Add a client
 * @param   String -> ID of the client
 * @param   String -> ID of the room that the client should join initially
 */
ClientRoomManager.prototype.addClient = function (clientID, roomID) {
    var client = {"roomID": roomID, "clientID": clientID};
    this.clients.push(client);
};

/**
 * Get all clients, either in a room or in the global namespace
 * @param   String  ID of the room
 * @return  Array   Client IDs
 */
ClientRoomManager.prototype.getClients = function (roomID) {
    var cNames = [];
    var clientsInRoom = roomID ? this.clients.filter(function (clients) {
        return clients.roomID == roomID
    }) : this.clients;
    for (var i = 0; i < clientsInRoom.length; i++) {
        cNames.push(clientsInRoom[i].clientID);
    }
    return cNames;
}

/**
 * Number of connected clients, either in a room or in the global namespace
 * @param   String  ID of the room
 * @return  Integer Amount of clients
 */
ClientRoomManager.prototype.amountOfConnectedClients = function (roomID) {
    var cNames = this.getClients(roomID);
    return parseInt(cNames.length);
}

/**
 * Remove a client
 * @param   String  ID of the client
 */
ClientRoomManager.prototype.removeClient = function (clientID) {
    for (var i = 0; i < this.clients.length; i++) {
        if (this.clients[i].clientID == clientID) {
            delete this.clients[i];
        }
    }
    this.clients = this.clients.filter(function (n) {
        return n != undefined
    });
}

/**
 * Client changes the room
 * @param   String  ID of the client
 * @param   String  ID if the room
 */
ClientRoomManager.prototype.changeClientRoom = function (clientID, roomID) {
    for (var i = 0; i < this.clients.length; i++) {
        if (this.clients[i].clientID == clientID)
            this.clients[i].roomID = roomID;
    }
}

/**
 * Room the client is in
 * @param   String  ID of the client
 * @return  String  ID of the room
 */
ClientRoomManager.prototype.getClientRoom = function (clientID) {
    for (var i = 0; i < this.clients.length; i++) {
        if (this.clients[i].clientID == clientID)
            return this.clients[i].roomID;
    }
}

/**
 * Change the ID of a client
 * @param   String  Old ID of the client
 * @param   String  New client ID
 * @return  String  Unique client ID
 */
ClientRoomManager.prototype.changeClientID = function (oldClientID, newClientID) {
    var uniqueClientID = this.createUniqueClientID(newClientID)
    for (var i = 0; i < this.clients.length; i++) {
        if (this.clients[i].clientID == oldClientID)
            this.clients[i].clientID = uniqueClientID;
    }
    return uniqueClientID;
}

/**
 * Checks for the existence of an element in an array and returns it unique if neccessary
 * @param   Array   Haystack (Indexed array, non associative)
 * @param   String  Needle (The element to search for)
 */
ClientRoomManager.prototype.unifyArray = function (array, item) {
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
        return this.unifyArray(array, item);
    }
    return item;
}

module.exports = new ClientRoomManager;