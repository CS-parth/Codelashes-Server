const express = require("express");
const path = require("path");
const app = express();
const cookieParser = require('cookie-parser');
const dotenv = require('dotenv');
const numCPUs = require('os').cpus().length;
const cluster = require('cluster');
const mongoose = require("mongoose");
const {exec} = require('child_process');
const http = require('http');
const cors = require('cors');
const {Server} = require('socket.io');
const schedule = require('node-schedule');
// .env config
dotenv.config();

const ratingSystem = require('./utils/ratingSystem');

// importing Routes
const authRoutes = require("./routes/authRoutes");
const judgeRoutes = require("./routes/judgeRoutes");
const problemRoutes = require("./routes/problemRoutes");
const contestRoutes = require("./routes/contestRoutes");
const submissionnRoutes = require("./routes/submissionRoutes");
const userRoutes = require('./routes/userRoutes');
const blogRoutes = require('./routes/blogRoutes');
const resultRoutes = require('./routes/resultRoutes');
// establishing the mongoose connection
const stablishConnection = require("./db/connection");
const { initializeRedisClient } = require("./db/redis");
//Stablising the connection
stablishConnection();
initializeRedisClient();
// Keeping the Serve warm
app.get("/warm",(req,res)=>{
  res.send("I'm here to keep the server warm");
})
const job = schedule.scheduleJob('* */14 * * * *', function(){ // sending request in every 14 min
  // Send a request 
  if(process.env.NODE_ENV == 'production'){
     exec('./scripts/warm.sh',(err,stdout,stderr)=>{})
  }
});
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
  const port = process.env.PORT || 7700;
  const corsOptions = {
    origin: ['http://localhost:5173', 'http://localhost:5174','https://codelashes-client.vercel.app'],
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    credentials: true,
    optionsSuccessStatus: 204
  };
  
  app.use(cors(corsOptions));
  
  // For preflight requests
  // app.options('*', cors(corsOptions));
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
  app.use('/api/result', resultRoutes);
  app.use('/api/blog',blogRoutes);
  // console.log(`Worker ${process.pid} started`);
  // console.log(new ratingSystem().calculateRatings("66aa8581808c710fef96ecf6"));
  server.listen(port, () => {
    process.stdout.write(`Server is up and running on ${port}\n`);
  });
// }
