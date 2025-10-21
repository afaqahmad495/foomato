const mongoose = require('mongoose');
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