import express from "express"
const app = express();
import dotenv from "dotenv"
import connectDB from './config/db.js';
import cors from 'cors'
import authRouter from "./routes/auth.routes.js";
import cookieParser from 'cookie-parser';

app.use(cors());

dotenv.config()


const PORT = process.env.PORT ;

app.use(express.json());
app.use(cookieParser())
app.use("/api",authRouter);





app.listen(PORT, ()=>{
  console.log(`Server is running on ${PORT} `);
  
})

connectDB();
































/*
import express from 'express'
const app =express();

( async () => {
  try{
    await mongoose.connect(`${process.env.MONGODB_URI}/${DB_NAME}`)
    app.on("error", (error)=>{
      console.log(error);
      throw error
      
    })

    app.listen(process.env.PORT, ()=>{
      console.log(`App is listening on port ${process.env.PORT}`);
      
    })

  }catch(error){
    console.error
  }

})()
  */