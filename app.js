const express = require('express');
const mongoose = require('mongoose');
const cron = require('node-cron');
const cronController= require('./controllers/cron-controllers');

const app = express();
mongoose.set('useNewUrlParser', true);
mongoose.set('useFindAndModify', false);
mongoose.set('useCreateIndex', true);
mongoose.set('useUnifiedTopology', true);

mongoose.connection.on('open', function() {
  console.log("database is ready now");
  //cron.schedule('* * * * *', function() {
    cronController.syncProducts();
  //});
});

mongoose
  .connect(
    `mongodb://AdminSammy:Mn87be3i@localhost:27017/virtus?authSource=admin&retryWrites=true&w=majority`
  )
  .then(() => {
    app.listen(5000);
  })
  .catch(err => {
    console.log(err);
  });
