const express = require("express");
const path = require("path");
const app = express();
const cors = require('cors');
const cookieParser = require('cookie-parser');
const dotenv = require('dotenv');
const numCPUs = require('os').cpus().length;
const cluster = require('cluster');
const mongoose = require("mongoose");

// .env config
dotenv.config();

// importing Routes
const authRoutes = require("./routes/authRoutes");
const judgeRoutes = require("./routes/judgeRoutes");
const problemRoutes = require("./routes/problemRoutes");

// establishing the mongoose connection
const stablishConnection = require("./db/connection");
stablishConnection();

if (cluster.isPrimary) {
  console.log(`Primary ${process.pid} is running`);
  for (let i = 0; i < numCPUs; i++) {
    cluster.fork();
  }

  cluster.on('exit', (worker, code, signal) => {
    console.log(`Worker ${worker.process.pid} died`);
    // cluster.fork();
  });
} else {
  // Express Configuration
  app.use(require('express-status-monitor')());
  const port = process.env.PORT || 7700;
  app.use(cors());
  app.use(cookieParser());
  app.use(express.urlencoded({ extended: false }));
  app.use(express.json());

  // importing Middlewares
  app.use('/api/auth', authRoutes);
  app.use('/api/judge', judgeRoutes);
  app.use('/api/problem', problemRoutes);

  console.log(`Worker ${process.pid} started`);
  app.listen(port, () => {
    process.stdout.write(`Server is up and running on ${port}\n`);
  });
}
