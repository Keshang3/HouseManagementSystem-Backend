import mongoose from 'mongoose';
import dotenv from 'dotenv';
dotenv.config();

const checkData = async () => {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        const Vendor = mongoose.model('Vendor', new mongoose.Schema({ email: String, status: String }));
        const User = mongoose.model('User', new mongoose.Schema({ email: String }));
        
        const vendors = await Vendor.find({});
        const users = await User.find({});
        
        console.log('Vendors:', vendors.map(v => ({ email: v.email, status: v.status })));
        console.log('Users:', users.map(u => ({ email: u.email })));
        
        process.exit(0);
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
};

checkData();
