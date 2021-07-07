const mongoose = require('mongoose');
const uniqueValidator = require('mongoose-unique-validator');

const Schema = mongoose.Schema;

const userSchema = new Schema({
  Name: { type: String, required: true },
  Price: { type: String, required: true, unique: true },
  Description: { type: String, required: true, minlength: 6 },
});

userSchema.plugin(uniqueValidator);

module.exports = mongoose.model('Product', userSchema);
