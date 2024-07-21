const express = require("express");
const path = require("path");
const app = express();
const cookieParser = require('cookie-parser');
const dotenv = require('dotenv');
const numCPUs = require('os').cpus().length;
const cluster = require('cluster');
const mongoose = require("mongoose");

const http = require('http');
const cors = require('cors');
const {Server} = require('socket.io');
// .env config
dotenv.config();

// importing Routes
const authRoutes = require("./routes/authRoutes");
const judgeRoutes = require("./routes/judgeRoutes");
const problemRoutes = require("./routes/problemRoutes");
const contestRoutes = require("./routes/contestRoutes");
const submissionnRoutes = require("./routes/submissionRoutes");
const userRoutes = require('./routes/userRoutes');
// establishing the mongoose connection
const stablishConnection = require("./db/connection");
//Stablising the connection
stablishConnection();

// if (cluster.isPrimary) {

//   console.log(`Primary ${process.pid} is running`);
//   for (let i = 0; i < numCPUs; i++) {
//     cluster.fork();
//   }

//   cluster.on('exit', (worker, code, signal) => {
//     console.log(`Worker ${worker.process.pid} died`);
//     cluster.fork();
//   });
// } else {
  // Express Configuration
  app.use(require('express-status-monitor')());
  const port = process.env.PORT || 7700;
  app.use(cors({
    origin: ["http://localhost:5173","http://localhost:5174"],
    credentials: true
  }));
  app.use(cookieParser());
  app.use(express.urlencoded({ extended: false }));
  app.use(express.json());
  
  const server = http.createServer(app);
  const { socketConnection, sendMessage, getRooms, emitMessage } = require('./utils/socket-io');
  const io = socketConnection(server);

  // JS 
  // importing Middlewares
  app.use('/api/auth', authRoutes);
  app.use('/api/judge', judgeRoutes);
  app.use('/api/problem', problemRoutes);
  app.use('/api/contest', contestRoutes);
  app.use('/api/submission', submissionnRoutes);
  app.use('/api/user', userRoutes);
  // console.log(`Worker ${process.pid} started`);
  app.post("/test",(req,res)=>{
    console.log(req);
    try{
      res.cookie("test","value"); // From Server End there is no error
      res.status(201).json({message: "Cookie Created Successfully"});
    }catch(err){
      res.status(500).send(err);
    }
  })
  server.listen(port, () => {
    process.stdout.write(`Server is up and running on ${port}\n`);
  });
// }
