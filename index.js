const express = require("express");
const app = express();
const http = require("http");
const { Server } = require("socket.io");
const cors = require("cors");

app.use(cors());

const server = http.createServer(app);

const io = new Server(server, {
  cors: {
    origin: "http://localhost:3000",
    methods: ["GET", "POST"],
  },
});

const rooms = {};

io.on("connection", (socket) => {
  console.log(`User Connected: ${socket.id}`);
socket.on("disconnect", () => {
    console.log("A client disconnected");
  });

  socket.on('createGame', () => {
        const roomUniqueId = makeid(6);
        rooms[roomUniqueId] = {};
        socket.join(roomUniqueId);
        socket.emit("newGame", {roomUniqueId: roomUniqueId})
        console.log('newGame-->'+roomUniqueId);
    });

    socket.on('joinGame', (data) => {
        if(rooms[data.roomUniqueId] != null) {
            socket.join(data.roomUniqueId);
            socket.to(data.roomUniqueId).emit("playersConnected", {});
            socket.emit("playersConnected");
            console.log('playersConnected-->'+data.roomUniqueId);
        }
    })

    socket.on("p1Choice",(data)=>{
        console.log('p1Choice-->'+JSON.stringify(data));
        let spsValue = data.spsValue;
        rooms[data.roomUniqueId]['p1Choice'] = spsValue;
        socket.to(data.roomUniqueId).emit("p1Choice",{spsValue : data.spsValue});
        if(rooms[data.roomUniqueId].p2Choice != null) {
            declareWinner(data.roomUniqueId);
        }

    });

    socket.on("p2Choice",(data)=>{
        console.log('p2Choice-->'+JSON.stringify(data));
        let spsValue = data.spsValue;
        rooms[data.roomUniqueId].p2Choice = spsValue;
        socket.to(data.roomUniqueId).emit("p2Choice",{spsValue : data.spsValue});
        if(rooms[data.roomUniqueId].p1Choice != null) {
            declareWinner(data.roomUniqueId);
        }
    });

});

server.listen(3001, () => {
  console.log("SERVER IS RUNNING");
});

function declareWinner(roomUniqueId) {
    let p1Choice = rooms[roomUniqueId].p1Choice;
    let p2Choice = rooms[roomUniqueId].p2Choice;
    let winner = null;
    if (p1Choice === p2Choice) {
        winner = "d";
    } else if (p1Choice == "paper") {
        if (p2Choice == "scissors") {
            winner = "p2Choice";
        } else {
            winner = "p1Choice";
        }
    } else if (p1Choice == "stone") {
        if (p2Choice == "paper") {
            winner = "p2Choice";
        } else {
            winner = "p1Choice";
        }
    } else if (p1Choice == "scissors") {
        if (p2Choice == "stone") {
            winner = "p2Choice";
        } else {
            winner = "p1Choice";
        }
    }
    io.sockets.to(roomUniqueId).emit("result", {
        winner: winner
    });
    rooms[roomUniqueId].p1Choice = null;
    rooms[roomUniqueId].p2Choice = null;
}


function makeid(length) {
    var result           = '';
    var characters       = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    var charactersLength = characters.length;
    for ( var i = 0; i < length; i++ ) {
        result += characters.charAt(Math.floor(Math.random() * charactersLength));
    }
    return result;
}