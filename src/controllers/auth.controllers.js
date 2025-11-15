import generateToken from "../config/token.js";
import User from "../models/user.model.js";
import bcrypt from "bcrypt";

export const signUp = async (req, res) => {
  try {
    const { firstName, lastName, email, password, userName } = req.body;
    if (!firstName || !lastName || !email || !password || !userName) {
      return res.status(400).json({ message: "send all details" });
    }
    let existsUser = await User.findOne({ email });
    if (existsUser) {
      return res.status(400).json({ message: "User already exist" });
    }
    const hashedPassword = await bcrypt.hash(password, 10);

    const newUser = await User.create({
      firstName,
      lastName,
      email,
      password: hashedPassword,
      userName,
    });
    
      let token;
      try{
        token = generateToken(newUser._id)

      }catch(error){
        console.log(error);
      }

    res.cookie("token", token,{
      httpOnly:true,
      secure:process.env.NODE_ENVIRONMRNT == "production",
      samesite:"strict",
      maxAge:7*24*60*60*1000
    })


    return res.status(201).json({
     user:newUser
    });
  } catch (error) {
    console.error("SIGNUP ERROR:", error);  
    return res.status(500).json({ message: "internal server error" });
  }
};

export const  logIn = async (req, res)=>{
  try{
    const {email, password} = req.body;
    let existUser = await User.findOne({email})
    if(!existUser){
      return res.status(400).json({message:"User does not exist"})
    }
    let match = await bcrypt.compare(password, existUser.password)
    if(!match){
      return res.status(400).json({message:"Incorrect Password"})
    }
    let token;
      try{
        token = generateToken(existUser._id)

      }catch(error){
        console.log(error);
      }

    res.cookie("token", token,{
      httpOnly:"true",
      secure:process.env.NODE_ENVIRONMRNT == "production",
      samesite:"strict",
      maxAge:7*24*60*60*1000
    })

    return res.status(200).json({user:{
      firstName:existUser.firstName,
      lastName:existUser.lastName,
      email:existUser.email,
      userName:existUser.userName,
    }})

  }catch(error){
    return res.status(500).json(error)
  }

   

}

export const logOut = async (req, res)=>{
  try {
    res.clearCookie("token")
    res.status(200).json({message:"logout successfully"})
  } catch (error) {
    res.status(500).json(error)
  }
}