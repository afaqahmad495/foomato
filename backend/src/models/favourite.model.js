const mongoose = require('mongoose');
const { createDummyModel } = require('../db/dummy-db');

if (process.env.DUMMY_DB === '1') {
    module.exports = createDummyModel('FavouriteFood');
} else {
    const Schema = mongoose.Schema;
    const ObjectId = Schema.Types.ObjectId;

    const favouriteFoodSchema = new Schema({
        userId: {
            type: ObjectId,
            ref: 'User',
        },
        foodId: {
            type: ObjectId,
            ref: 'Food',
        },
    }, { timestamps: true });

    module.exports = mongoose.model('FavouriteFood', favouriteFoodSchema);
}
