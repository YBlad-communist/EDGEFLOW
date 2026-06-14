import "dotenv/config";
import bcrypt from "bcryptjs";
import { v4 as uuidv4 } from "uuid";
import db, { migrate } from "./models/migrate.js";
migrate();

const existing = db.prepare("SELECT COUNT(*) as c FROM users").get();
if (existing.c > 0) { console.log("DB already has data"); process.exit(0); }

const adminId = uuidv4();
const authorId = uuidv4();
const studentId = uuidv4();

db.prepare("INSERT INTO users (id, email, password_hash, role, username, display_name, balance, created_at) VALUES (?, ?, ?, ?, ?, ?, 9999, ?)").run(adminId, "admin@demo.com", bcrypt.hashSync("admin123", 10), "author", "Admin", "Администратор", new Date().toISOString());
db.prepare("INSERT INTO admins (id, user_id, created_at) VALUES (?, ?, ?)").run(uuidv4(), adminId, new Date().toISOString());

db.prepare("INSERT INTO users (id, email, password_hash, role, username, display_name, bio, wallet_address, balance, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, 100, ?)").run(authorId, "author@demo.com", bcrypt.hashSync("author123", 10), "author", "CryptoCoach", "Крипто-коуч", "Блокчейн-разработчик", "TXYZ123456789", new Date().toISOString());

db.prepare("INSERT INTO users (id, email, password_hash, role, username, display_name, balance, created_at) VALUES (?, ?, ?, ?, ?, ?, 50, ?)").run(studentId, "student@demo.com", bcrypt.hashSync("student123", 10), "student", "CryptoLearner", "Ученик крипто-школы", new Date().toISOString());

const courseId = uuidv4();
const now = new Date().toISOString();
db.prepare("INSERT INTO courses (id, author_id, title, description, price, category, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?)").run(courseId, authorId, "Web3 для начинающих", "Полный курс по блокчейну, смарт-контрактам и DeFi. Научитесь работать с криптокошельками и создавать свои токены.", 15, "blockchain", now, now);

const lesson1Id = uuidv4();
const lesson2Id = uuidv4();
db.prepare("INSERT INTO lessons (id, course_id, title, description, sort_order, created_at) VALUES (?, ?, ?, ?, 0, ?)").run(lesson1Id, courseId, "Введение в блокчейн", "Что такое блокчейн, как он работает, основные концепции", now);
db.prepare("INSERT INTO lessons (id, course_id, title, description, sort_order, created_at) VALUES (?, ?, ?, ?, 1, ?)").run(lesson2Id, courseId, "Криптокошельки и безопасность", "Как создать кошелёк, хранить ключи, не потерять монеты", now);

console.log("Seed data created successfully");
console.log("Admin: admin@demo.com / admin123");
console.log("Author: author@demo.com / author123");
console.log("Student: student@demo.com / student123");
