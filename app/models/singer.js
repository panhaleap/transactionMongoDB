const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const SingerSchema = new Schema({
    firstName:  String,
    lastName :  String,
    gender    : String,
    isActive  : 
              {
                type: Boolean,
                required: true,
                default: true
              }
});

module.exports = mongoose.model('dlSinger', SingerSchema);