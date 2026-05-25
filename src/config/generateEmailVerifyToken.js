import jwt from "jsonwebtoken"

 const generateEmailVerifyToken = (userId)=>{
  return jwt.sign({_id:userId, purpose:"email_verify"}, process.env.JWT_EMAIL_SECRET, {expiresIn: "10m"});
}

export default generateEmailVerifyToken;

