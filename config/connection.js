const mongoClient = require('mongodb').MongoClient;
const state = {
    db: null
};

module.exports.connect = async function(done) {
    try {
        const url = 'mongodb://localhost:27017';
        const dbname = 'shopping';

        const client = await mongoClient.connect(url);
        state.db = client.db(dbname);
        done();
    } catch (err) {
        done(err);
    }
};

module.exports.get = function() {
    return state.db;
};
 