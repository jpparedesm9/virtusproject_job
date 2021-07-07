const express = require('express');
const mongoose = require('mongoose');
const cron = require('node-cron');
const cronController= require('./controllers/cron-controllers');

const app = express();

mongoose.connection.on('open', function() {
  console.log("database is ready now");
  cron.schedule('* * * * *', function() {
    cronController.syncProducts();
  });
});

mongoose
  .connect(
    `mongodb://localhost:27017/virtus?retryWrites=true&w=majority`
  )
  .then(() => {
    app.listen(5000);
  })
  .catch(err => {
    console.log(err);
  });
