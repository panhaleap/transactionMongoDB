const express = require("express");
const mongodb = require("mongodb");
const router = express.Router();
// const db = require('./database');
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
        print("TransientTransactionError, retrying transaction ...");
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
      print("Transaction committed.");
      break;
    } catch (error) {
      // Can retry commit
      if (
        error.hasOwnProperty("errorLabels") &&
        error.errorLabels.includes("UnknownTransactionCommitResult")
      ) {
        print("UnknownTransactionCommitResult, retrying commit operation ...");
        continue;
      } else {
        print("Error during commit ...");
        throw error;
      }
    }
  }
}

// Updates two collections in a transactions

function updateSingerInfo(session) {
  singerCollection = session.getDatabase("transaction").dlSinger;
  singerHistoryCollection = session.getDatabase("transaction").dlSingerHistory;

  session.startTransaction({
    readConcern: { level: "snapshot" },
    writeConcern: { w: "majority" }
  });
  const singerId = "5b30687c3d862b1148d1c3b5";

  try {
    singerCollection.updateOne(
      { _id: ObjectId(singerId), isActive: true },
      { $set: { isActive: false } }
    );
    employeesCollection.updateOne(
      { employee: 3 },
      { $set: { status: "Inactive" } }
    );
    eventsCollection.insertOne({
      singer: singerId,
      hisStatus: { new: false, old: true }
    });
  } catch (error) {
    print("Caught exception during transaction, aborting.");
    session.abortTransaction();
    throw error;
  }
  //
  try {
    employeesCollection.updateOne(
      { employee: 3 },
      { $set: { status: "Inactive" } }
    );
    eventsCollection.insertOne({
      employee: 3,
      status: { new: "Inactive", old: "Active" }
    });
  } catch (error) {
    print("Caught exception during transaction, aborting.");
    session.abortTransaction();
    throw error;
  }
  //

  commitWithRetry(session);
}

// Start a session.
session = express.session({ mode: "primary" });

try {
  runTransactionWithRetry(updateSingerInfo, session);
} catch (error) {
  // Do something with error
} finally {
  session.endSession();
}

router.route("/").get(async (req, res) => {
  res.status(200).json({ message: "Hello World!" });
});

///

// router.post('/',function(req,res,next){
//   username=req.body.username;
//   password=req.body.password;

//   db.conn(function(err, database) {
//     if (err) {
//       res.sendStatus(500);
//       console.log(err);
//       return;
//     }

//     database.collection('users').findOne({'username':username, 'password':password}, function(err, docs){
//       //do something
//     });
//   });
// });

///

module.exports = router;
