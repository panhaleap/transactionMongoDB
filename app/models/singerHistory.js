const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const historySchema = new Schema({
  singer: { type: Schema.Types.ObjectId, ref: 'dlSinger', required: true },
  hisStatus: {
    old: Boolean,
    new: Boolean,
  },
  isActive: {
    type: Boolean,
    required: true,
    default: true
  }
}, { collection: 'dlSingerHistory' }, { timestamps: {} });

module.exports = mongoose.model('dlSingerHistory', historySchema);

