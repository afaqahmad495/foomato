const mongoose = require('mongoose');

function connectDB(){
    if (process.env.DUMMY_DB === '1') {
        console.log('DUMMY_DB=1: skipping MongoDB connection');
        return;
    }
    mongoose.connect(process.env.MONGODB_URI)
    .then(()=>{
        console.log("mongodb connected")
    })
    .catch((err)=>{
        console.log("mongodb connection error", err)
    }) 
} 

module.exports = connectDB;
