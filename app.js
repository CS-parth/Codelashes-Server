const express = require("express");
const path = require("path");
const app = express();
const cors = require('cors');
const cookieParser = require('cookie-parser');
const dotenv = require('dotenv');
app.use(cors());
app.use(cookieParser());
const numCPUs = require('os').cpus().length;
// .evn congif
dotenv.config();

// Express Configuration
const port = process.env.PORT ||  7700;
app.use(express.urlencoded({ extended: false }));
app.use(express.json());

// importing modals


// importing Routes
const mongoose = require("mongoose");
const stablishConnection = require("./db/connection");
const authRoutes = require("./routes/authRoutes");
const judgeRoutes = require("./routes/judgeRoutes");
// importing Middlewares
app.use('/api/auth',authRoutes);
app.use('/api/judge',judgeRoutes);
// Establishing the mongoose connection
stablishConnection();


app.listen(port,()=>{
    // console.log(numCPUs)
    console.log("Server is up and running on the port", port);
});