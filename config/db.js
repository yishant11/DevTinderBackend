const mongoose = require('mongoose');


const connectDB =  async ()=>{
    try{
        await mongoose.connect("mongodb+srv://ishantyadav914078_db_user:H1ZSgrlEL2JIjqcu@cluster0.ss2v3r1.mongodb.net/DevTinder");
        console.log("Database connected successfully");
    }
    catch(error){
        console.log(error);
    }
}

module.exports = connectDB;
