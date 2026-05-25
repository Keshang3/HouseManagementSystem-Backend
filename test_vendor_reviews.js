import mongoose from 'mongoose';
import Review from './src/models/review.model.js';
import User from './src/models/user.model.js'; 

mongoose.connect('mongodb+srv://Keshang:Manang%23123@cluster0.lrcsogd.mongodb.net/test')
  .then(async () => {
    const reviews = await Review.find().populate('userId', 'fullName userName profileImage').limit(5);
    console.log(JSON.stringify(reviews, null, 2));
    process.exit(0);
  })
  .catch(err => {
    console.error(err);
    process.exit(1);
  });
