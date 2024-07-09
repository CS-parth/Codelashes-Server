const { Server } = require('socket.io');
let io;

const socketConnection = (server) => {
    io = new Server(server, {
        cors: {
            origin: "http://localhost:5173",
            methods: ["GET","POST"]
        }
    });

    io.listen(4000);
      
    io.on('connection', (socket) => {
        console.log(`⚡: ${socket.id} user just connected!`);
        socket.on('join',(roomId)=>{
            socket.join(roomId);
            process.stdout.write(`${socket.id} added to room : ${roomId}\n`);
        })
        socket.on('disconnect', () => {
            console.log('🔥: A user disconnected');
        });
    });

    return io; // Return io for use in other parts of your application if needed
};

const sendMessage = (roomId, key, message) => io.to(roomId).emit(key, message);

const getRooms = () => io.sockets.adapter.rooms;

const emitMessage = (key, message) => io.sockets.emit(key, message);

module.exports = {
    socketConnection,
    sendMessage,
    getRooms,
    emitMessage
};