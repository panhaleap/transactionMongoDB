/*
 * Copyright 2018 MongoDB, Inc.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 *
 */
 
import com.mongodb.MongoClient;
import com.mongodb.MongoClientURI;
import com.mongodb.MongoCommandException;
import com.mongodb.MongoException;
import com.mongodb.client.ClientSession;
import com.mongodb.client.MongoCollection;
import com.mongodb.client.model.Filters;
import com.mongodb.client.model.Updates;
import org.bson.Document;
 
public class TransactionExampleTwo {
 
    private MongoClient client;
 
    public TransactionExampleTwo(final MongoClient client) {
        this.client = client;
        createCollection(client, "employees");
        createCollection(client, "events");
    }
 
    private void createCollection(final MongoClient client, final String events) {
        try {
            client.getDatabase("hr").createCollection(events);
        } catch (MongoCommandException e) {
            if (!e.getErrorCodeName().equals("NamespaceExists")) {
                throw e;
            }
        }
    }
 
    // Start Transactions Retry Example 1
    void runTransactionWithRetry(Runnable transactional) {
        while (true) {
            try {
                transactional.run();
                break;
            } catch (MongoException e) {
                System.out.println("Transaction aborted. Caught exception during transaction.");
 
                if (e.hasErrorLabel(MongoException.TRANSIENT_TRANSACTION_ERROR_LABEL)) {
                    System.out.println("TransientTransactionError, aborting transaction and retrying ...");
                    continue;
                } else {
                    throw e;
                }
            }
        }
    }
    // End Transactions Retry Example 1
 
    // Start Transactions Retry Example 2
    void commitWithRetry(ClientSession clientSession) {
        while (true) {
            try {
                clientSession.commitTransaction();
                System.out.println("Transaction committed");
                break;
            } catch (MongoException e) {
                // can retry commit
                if (e.hasErrorLabel(MongoException.UNKNOWN_TRANSACTION_COMMIT_RESULT_LABEL)) {
                    System.out.println("UnknownTransactionCommitResult, retrying commit operation ...");
                    continue;
                } else {
                    System.out.println("Exception during commit ...");
                    throw e;
                }
            }
        }
    }
    // End Transactions Retry Example 2
 
     
    public void updateEmployeeInfo() {
        MongoCollection<Document> employeesCollection = client.getDatabase("hr").getCollection("employees");
        MongoCollection<Document> eventsCollection = client.getDatabase("hr").getCollection("events");
 
        try (ClientSession clientSession = client.startSession()) {
            clientSession.startTransaction();
 
            employeesCollection.updateOne(clientSession,
                    Filters.eq("employee", 3),
                    Updates.set("status", "Inactive"));
            eventsCollection.insertOne(clientSession,
                    new Document("employee", 3).append("status", new Document("new", "Inactive").append("old", "Active")));
 
            commitWithRetry(clientSession);
        }
    }
 
    public void updateEmployeeInfoWithRetry() {
        runTransactionWithRetry(this::updateEmployeeInfo);
    }
 
    public static void main(String[] args) {
        TransactionExampleTwo example = new TransactionExampleTwo(new MongoClient(
                new MongoClientURI("mongodb://localhost,localhost:27018,localhost:27019/?serverSelectionTimeoutMS=5000")));
 
        example.updateEmployeeInfoWithRetry();
    }
}