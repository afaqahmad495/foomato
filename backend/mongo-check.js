const mongoose = require('mongoose');
const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '.env') });

async function testConnection() {
  try {
    console.log('Testing MongoDB connection...');
    if (!process.env.MONGODB_URI) {
      throw new Error('MONGODB_URI is not set (check backend/.env)');
    }
    console.log('Connection URI:', process.env.MONGODB_URI.replace(/afaq1234/, '***PASSWORD***'));

    await mongoose.connect(process.env.MONGODB_URI, {
      serverSelectionTimeoutMS: 5000, // Timeout after 5s instead of 30s
    });

    console.log('✅ MongoDB connected successfully!');
    await mongoose.connection.close();
    console.log('Connection closed.');
  } catch (error) {
    console.log('❌ MongoDB connection failed:');
    console.log('Error:', error.message);
    console.log('Error code:', error.code);
    console.log('Error name:', error.name);
  }
}

testConnection();
