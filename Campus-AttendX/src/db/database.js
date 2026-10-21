const mongoose = require('mongoose');
const User = require("../models/User"); // <-- Ye line add ki gayi hai

async function mongoDB(){
     try{
         await mongoose.connect(process.env.MONGO_CONNECTION_STRING);
         console.log("DB connect successfully");
         
         await User.syncIndexes(); // Ab ye bina error ke chalega
         console.log("Indexes synced");
     }catch(err){
        console.log("DB Error: ", err.message);
     } 
}
module.exports = mongoDB;