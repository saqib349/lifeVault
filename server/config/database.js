import mongoose from "mongoose"

export async function connectDB(){
    try{
        await mongoose.connect(process.env.DBURL)
        console.log("database is connected")
    }
    catch(err){
        console.log(err.message)
    }
}