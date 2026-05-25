import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Service from './src/models/service.model.js';

dotenv.config();

const services = [
  // Home Page Featured
  {
    name: "Plumbing",
    description: "Fix leaks, pipes, and drainage.",
    category: "Repair",
    icon: "https://images.unsplash.com/photo-1585704032915-c3400ca199e7?auto=format&fit=crop&w=800&q=80",
    isActive: true
  },
  {
    name: "Electrician",
    description: "Wiring, fitting, and electrical repairs.",
    category: "Repair",
    icon: "https://gacservices.com/wp-content/uploads/2018/01/electrician-working-on-electrical-panel-circuit-breaker-box.jpg",
    isActive: true
  },
  {
    name: "Home Cleaning",
    description: "Deep clean for your entire home.",
    category: "Cleaning",
    icon: "https://images.unsplash.com/photo-1581578731548-c64695cc6952?auto=format&fit=crop&w=800&q=80",
    isActive: true
  },
  {
    name: "Painting",
    description: "Interior and exterior wall painting.",
    category: "Improvement",
    icon: "https://images.unsplash.com/photo-1562259949-e8e7689d7828?w=600",
    isActive: true
  },
  {
    name: "Carpentry",
    description: "Custom woodwork and furniture repair.",
    category: "Repair",
    icon: "https://images.unsplash.com/photo-1533090161767-e6ffed986c88?w=600",
    isActive: true
  },
  {
    name: "Gardening",
    description: "Lawn care and garden maintenance.",
    category: "Outdoor",
    icon: "https://images.unsplash.com/photo-1598908314732-07113901949e?auto=format&fit=crop&w=800&q=80",
    isActive: true
  },

  // Additional Cleaning
  {
    name: "Kitchen Cleaning",
    description: "Deep cleaning for your kitchen appliances and surfaces.",
    category: "Cleaning",
    icon: "https://images.unsplash.com/photo-1556911220-bff31c812dba?w=600",
    isActive: true
  },
  {
    name: "Bathroom Cleaning",
    description: "Thorough sanitization and cleaning of bathrooms.",
    category: "Cleaning",
    icon: "https://images.unsplash.com/photo-1584622650111-993a426fbf0a?w=600",
    isActive: true
  },
  {
    name: "Sofa Cleaning",
    description: "Professional upholstery cleaning for sofas and chairs.",
    category: "Cleaning",
    icon: "https://images.unsplash.com/photo-1555041469-a586c61ea9bc?w=600",
    isActive: true
  },

  // Repairs & Installation
  {
    name: "AC Repair",
    description: "Fast and reliable AC servicing and repair.",
    category: "Repair",
    icon: "https://images.unsplash.com/photo-1581093458791-9f3c3900df4b?w=600",
    isActive: true
  },
  {
    name: "TV Installation",
    description: "Secure wall mounting and setup for your TV.",
    category: "Installation",
    icon: "https://images.unsplash.com/photo-1593784991095-a205069470b6?w=600",
    isActive: true
  },
  {
    name: "CCTV Installation",
    description: "Professional security camera setup and configuration.",
    category: "Installation",
    icon: "https://images.unsplash.com/photo-1557324232-b8917d1d5b29?w=600",
    isActive: true
  },

  // Outdoor & Special
  {
    name: "Pest Control",
    description: "Safe and effective pest control solutions.",
    category: "Outdoor",
    icon: "https://images.unsplash.com/photo-1581578731548-c64695cc6952?w=600",
    isActive: true
  },
  {
    name: "Roof Repair",
    description: "Expert roof leak repair and maintenance.",
    category: "Outdoor",
    icon: "https://images.unsplash.com/photo-1503387762-592deb58ef4e?w=600",
    isActive: true
  },
  {
    name: "Massage Therapy",
    description: "Relaxing massage services at your home.",
    category: "Personal Service",
    icon: "https://images.unsplash.com/photo-1544161515-4ab6ce6db874?w=600",
    isActive: true
  },
  {
    name: "Laptop Repair",
    description: "On-site repair for laptops and computers.",
    category: "Personal Service",
    icon: "https://images.unsplash.com/photo-1517336714731-489689fd1ca8?w=600",
    isActive: true
  }
];

const seedDB = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log("Connected to DB");

    await Service.deleteMany({});
    console.log("Deleted existing services");

    await Service.insertMany(services);
    console.log("Inserted seed services");

    mongoose.connection.close();
    console.log("Connection closed");
  } catch (error) {
    console.error("Error seeding DB:", error);
  }
};

seedDB();
