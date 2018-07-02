const express = require("express");
const router = express.Router();

const Singer = require("../models/singer");

('should be able to run transactions retry example 1', {
    metadata: { requires: { topology: ['replicaset'], mongodb: '>=3.8.0' } },
    test: () => {
        // BEGIN
        function runTransactionWithRetry(txnFunc, client, session) {
            return txnFunc(client, session).catch(error => {
                // LINE console.log('Transaction aborted. Caught exception during transaction.');

                // If transient error, retry the whole transaction
                if (error.errorLabels && error.errorLabels.indexOf('TransientTransactionError') < 0) {
                    // LINE console.log('TransientTransactionError, retrying transaction ...');
                    return runTransactionWithRetry(txnFunc, client, session);
                }

                throw error;
            });
        }

        function updateSingerInfo(client, session) {
            session.startTransaction({
                readConcern: { level: 'snapshot' },
                writeConcern: { w: 'majority' }
            });

            const singerCollection = client.db('tenh_products').collection('dlsingers');
            const singerHistory = client.db('tenh_products').collection('dlsingerHistory');

            return singerCollection
                .updateOne({ _id: id, isActive: true }, { $set: { lastName: 'Pig' } }, { session })
                .then(() => {
                    return singerHistory.insertOne(
                        {
                            singer: id,
                            status: { new: 'Inactive', old: 'Active' }
                        },
                        { session }
                    );
                })
                .then(() => session.commitTransaction())
                .catch(e => {
                    return session.abortTransaction().then(() => Promise.reject(e));
                });
        }

        const configuration = this.configuration;
        const client = configuration.newClient(configuration.writeConcernMax());

        return client
            .connect()
            .then(() =>
                client.withSession(session =>
                    runTransactionWithRetry(updateSingerInfo, client, session)
                )
            )
            .then(() => client.close());
    
        }
});
router.use((req, res, next) => { // run for any & all requests
    console.log("Connection to the API.."); // set up logging for every API call
    next(); // ..to the next routes from here..
});

router.route("/").get(async (req, res) => {
    res.status(200).json({ message: "Hello World!" });
});

router.route("/singers/:id").put(async (req, res) => {
    //======================
    try {
        const { id } = req.params;
        const singer = await Singer.findOne({ _id: id, isActive: true });
        if (!singer) {
            res.status(404).json({ message: "Singer not found" });
        } else {
            //======================
            const { first_name, last_name, gender } = req.body;
            singer.first_name = first_name;
            singer.last_name = last_name;
            singer.gender = gender;
            //======================
            await singer.save();
            res.status(200).json({ message: "Singer was updated!" });
        }
    } catch (error) {
        res.status(500).json(error);
    }
});

module.exports = router;