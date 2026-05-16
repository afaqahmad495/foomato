const mongoose = require('mongoose');
const { createDummyModel } = require('../db/dummy-db');

if (process.env.DUMMY_DB === '1') {
  module.exports = createDummyModel('User');
} else {
  const userSchema = new mongoose.Schema({
  username: {
    type: String,
    required: true,
    unique: true,
    
  },
  email: {
    type: String,
    required: true,
    unique: true,
    
  },
  password: {
    type: String,
  },
  passwordResetToken: {
    type: String,
  },
  passwordResetExpires: {
    type: Date,
  },
  phone: {
    type: String
  }
  }, {
    timestamps: true
  });

  module.exports = mongoose.model('User', userSchema);
}


