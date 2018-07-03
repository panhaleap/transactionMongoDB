const express = require("express");
const mongodb = require("mongodb");
const assert = require("assert");
const MongoClient = mongodb.MongoClient;
const router = express.Router();
let db, client;
const url = 'mongodb://jason:12345678@35.229.111.221:27017/tenh_products';
const dbName = 'tenh_products';
MongoClient.connect(url, { useNewUrlParser: true }, async (err, clientDB) => {
  console.log('terertttss', err);
  // assert.equal(null, err);
  console.log("Connected successfully to server");
  client = clientDB;
  db = client.db(dbName);
  // const collection = db.collection('documents');
  // await collection.insert({name: 'test'});
  // client.close();
});


// db = mongodb.startSession({retryWrites: true, causalConsistency: true}).getDatabase(db.getName());
function runTransactionWithRetry(txnFunc, session) {
  while (true) {
    try {
      txnFunc(session); // performs transaction
      break;
    } catch (error) {
      // If transient error, retry the whole transaction
      if (
        error.hasOwnProperty("errorLabels") &&
        error.errorLabels.includes("TransientTransactionError")
      ) {
        console.log("TransientTransactionError, retrying transaction ...");
        continue;
      } else {
        throw error;
      }
    }
  }
}

// Retries commit if UnknownTransactionCommitResult encountered

function commitWithRetry(session) {
  while (true) {
    try {
      session.commitTransaction(); // Uses write concern set at transaction start.
      console.log("Transaction committed.");
      break;
    } catch (error) {
      // Can retry commit
      if (
        error.hasOwnProperty("errorLabels") &&
        error.errorLabels.includes("UnknownTransactionCommitResult")
      ) {
        console.log("UnknownTransactionCommitResult, retrying commit operation ...");
        continue;
      } else {
        console.log("Error during commit ...");
        throw error;
      }
    }
  }
}

// Updates two collections in a transactions

async function updateSingerInfo (session) {
  const cDoc = db.collection('documents');
  const cTransaction = db.collection('transaction');

  // singerCollection = session.getDatabase("transaction").dlSinger;
  // singerHistoryCollection = session.getDatabase("transaction").dlSingerHistory;
  
  session.startTransaction({
    readConcern: { level: "snapshot" },
    writeConcern: { w: "majority" }
  });
  // const singerId = "5b30687c3d862b1148d1c3b5";

  try {
    console.log('terst');
    await cDoc.insertOne({name: 'dara'}, {session});
    await cTransaction.insertOne({ name: 'kaka'}, {session});
    console.log('terst2222');
  } catch (error) {
    // console.log("Caught exception during transaction, aborting.");
    session.abortTransaction();
    throw error;
  }
  //
  // try {
  //   employeesCollection.updateOne({ employee: 3 },{ $set: { status: "Inactive" } });
  //   eventsCollection.insertOne({employee: 3,status: { new: "Inactive", old: "Active" }});
  // } catch (error) {
  //   console.log("Caught exception during transaction, aborting.");
  //   session.abortTransaction();
  //   throw error;
  // }
  //

  commitWithRetry(session);
}



router.route("/").get(async (req, res) => {
  console.log('rout session start');
  const session = client.startSession({ mode: "primary" });
  try {
    await runTransactionWithRetry(updateSingerInfo, session);
  } catch (error) {
    console.log('test ', error);
    // Do something with error
  } finally {
    session.endSession();
  }
  res.status(200).json({ message: "Hello World!" });
});

///


// var url =  "mongodb://jason:12345678@35.229.111.221:27017/";//"mongodb://localhost:27017/";

// MongoClient.connect(url, function(err, db) {
//   if (err) throw err;
//   var dbo = db.db("tenh_products");
//   // Start a session.
//   session = db.getMongo().startSession( { mode: "primary" } );
//   return console.log(session);

//   try {
//     runTransactionWithRetry(updateSingerInfo, session);
//   } catch (error) {
//     // Do something with error
//   } finally {
//     session.endSession();
//   }
// });

///

module.exports = router;
