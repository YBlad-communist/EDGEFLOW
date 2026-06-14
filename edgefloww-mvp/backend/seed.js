import "dotenv/config";
import bcrypt from "bcryptjs";
import { connectDB } from "./models/index.js";
import User from "./models/User.js";
import Course from "./models/Course.js";

async function seed() {
  await connectDB();

  const existing = await User.countDocuments();
  if (existing > 0) { console.log("DB already has data"); process.exit(0); }

  const admin = await User.create({
    email: "admin@demo.com",
    passwordHash: await bcrypt.hash("admin123", 10),
    role: "author",
    username: "Admin",
    displayName: "Администратор",
    balance: 9999,
    isAdmin: true,
  });

  const author = await User.create({
    email: "author@demo.com",
    passwordHash: await bcrypt.hash("author123", 10),
    role: "author",
    username: "CryptoCoach",
    displayName: "Крипто-коуч",
    bio: "Блокчейн-разработчик",
    walletAddress: "0x0000000000000000000000000000000000000001",
    balance: 100,
  });

  await User.create({
    email: "student@demo.com",
    passwordHash: await bcrypt.hash("student123", 10),
    role: "student",
    username: "CryptoLearner",
    displayName: "Ученик крипто-школы",
    balance: 50,
  });

  await Course.create({
    authorId: author._id,
    title: "Web3 для начинающих",
    description: "Полный курс по блокчейну, смарт-контрактам и DeFi. Научитесь работать с криптокошельками и создавать свои токены.",
    priceUSDT: 15,
    category: "blockchain",
    lessons: [
      { title: "Введение в блокчейн", description: "Что такое блокчейн, как он работает, основные концепции", sortOrder: 0 },
      { title: "Криптокошельки и безопасность", description: "Как создать кошелёк, хранить ключи, не потерять монеты", sortOrder: 1 },
    ],
  });

  console.log("Seed data created successfully");
  console.log("Admin: admin@demo.com / admin123");
  console.log("Author: author@demo.com / author123");
  console.log("Student: student@demo.com / student123");
  process.exit(0);
}

seed().catch(err => { console.error(err); process.exit(1); });
