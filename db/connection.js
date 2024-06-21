const mongoose = require('mongoose');


const stablishConnection = ()=>{
  mongoose.connect('mongodb://localhost:27017/Codelashes?directConnection=true', {
    useNewUrlParser: true,
    useUnifiedTopology: true
  })
  .then(() => {
    console.log('MongoDB connected successfully');
  })
  .catch(err => {
    console.error('MongoDB connection failed:', err);
    process.exit(1);
  });
}

module.exports = stablishConnection;