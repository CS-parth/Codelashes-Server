const express = require("express");
const path = require("path");
const app = express();
const cors = require('cors');
const cookieParser = require('cookie-parser');
const dotenv = require('dotenv');
const numCPUs = require('os').cpus().length;
const cluster = require('node:cluster');

// .evn congif
dotenv.config();

// importing modals

// importing Routes
const mongoose = require("mongoose");
const stablishConnection = require("./db/connection");
const authRoutes = require("./routes/authRoutes");
const judgeRoutes = require("./routes/judgeRoutes");

if (cluster.isPrimary) {
  console.log(`Primary ${process.pid} is running`);
  
  // Fork workers.
  for (let i = 0; i < numCPUs; i++) {
    cluster.fork();
  }
  
  cluster.on('exit', (worker, code, signal) => {
    console.log(`worker ${worker.process.pid} died`);
  });
} else {
    // Express Configuration
    app.use(require('express-status-monitor')());
    const port = process.env.PORT ||  7700;
    app.use(cors());
    app.use(cookieParser());
    app.use(express.urlencoded({ extended: false }));
    app.use(express.json());

    // importing Middlewares
    app.use('/api/auth',authRoutes);
    app.use('/api/judge',judgeRoutes);
    // Establishing the mongoose connection
    stablishConnection();

    console.log(`Worker ${process.pid} started`);
    app.listen(port,()=>{
        // console.log(numCPUs)
        console.log("Server is up and running on the port", port);
    });
  
}