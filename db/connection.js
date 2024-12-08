const mongoose = require('mongoose');


const stablishConnection = () => {
  mongoose.connect(process.env.MONGODB_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true
  })
  .then(() => {
    process.stdout.write('MongoDB connected successfully\n');
  })
  .catch(err => {
    console.error('MongoDB connection failed:', err);
    process.exit(1);
  });
}

module.exports = stablishConnection;