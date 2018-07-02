const mongodb= require('mongodb');
const MongoClient= mongodb.MongoClient;
const URL = 'mongodb://127.0.0.1:27017/transaction';

let db;
let error;
let waiting = []; // Callbacks waiting for the connection to be made

MongoClient.connect(URL,function(err,database){
  error = err;
  db = database;

  waiting.forEach(function(callback) {
    callback(err, database);
  });
});

module.exports = function(callback) {
  if (db || error) {
    callback(error, db);
  } else {
    waiting.push(callback);
  }
}
