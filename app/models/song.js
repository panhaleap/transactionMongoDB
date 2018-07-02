const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const songSchema = new Schema({
  name: String,
  genre: [String],
  rating: Number,
  singers: [{
    type: Schema.Types.ObjectId, ref: 'dlSinger', required: true
  }],
  isActive: {
    type: Boolean,
    required: true,
    default: true
  }
});

module.exports = mongoose.model('dlSong', songSchema);