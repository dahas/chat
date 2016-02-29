
var ClientManager = {};

ClientManager = function(socket) {
    this.socket = socket;
};

ClientManager.prototype.testFunc = function() {
    console.log(this.socket);
}

ClientManager.prototype.addClient = function(clientID, roomID) {
    clientNames.push(clientID);
    var client = {"roomID": roomID, "clientID": clientID};
    this.clients.push(client);
};

ClientManager.prototype.getClients = function(room) {
    var cNames = [];
    var clientsInRoom = this.clients.filter(function(c){return c.roomID == room});
    for (var i = 0; i < clientsInRoom.length; i++) {
        cNames.push(clientsInRoom[i].clientID);
    }
    return cNames;
}

ClientManager.prototype.removeClient = function(clientID)
{
    for (var i = 0; i < this.clients.length; i++) {
        if (this.clients[i].clientID == clientID)
            delete this.clients[i]
    }
    this.clients = this.clients.filter(function(n){ return n != undefined });
    clientNames = removeFromArray(clientNames, clientID);
}

ClientManager.prototype.changeClientRoom = function(clientID, roomID)
{
    for (var i = 0; i < this.clients.length; i++) {
        if (this.clients[i].clientID == clientID)
            this.clients[i].roomID = roomID;
    }
}

ClientManager.prototype.changeClientName = function(oldClientID, newClientID)
{
    for (var i = 0; i < this.clients.length; i++) {
        if (this.clients[i].clientID == oldClientID)
            this.clients[i].clientID = newClientID;
    }
}

module.exports = ClientManager;