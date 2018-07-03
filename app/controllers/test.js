var MongoClient = require('mongodb').MongoClient;
var url = "mongodb://jason:12345678@35.229.111.221:27017/";

MongoClient.connect(url, function(err, db) {
  if (err) throw err;
  var dbo = db.db("tenh_products");
  var myobj = { name: "Company Inc", address: "Highway 37" };
  dbo.collection("dlCustomerTest").insertOne(myobj, function(err, res) {
    if (err) throw err;
    console.log("1 document inserted");
    db.close();
  });
});