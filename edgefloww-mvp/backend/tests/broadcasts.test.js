import request from "supertest";
import express from "express";
import mongoose from "mongoose";
import { signToken } from "../middleware/auth.js";
import User from "../models/User.js";
import broadcastRoutes from "../routes/broadcasts.js";
import profileRoutes from "../routes/profile.js";

const app = express();
app.use(express.json());
app.use("/api/profile", profileRoutes);
app.use("/api/broadcasts", broadcastRoutes);

let teacherToken;
let teacherId;
let studentToken;

beforeEach(async () => {
  const teacher = await User.create({
    email: "teacher@test.com",
    passwordHash: "hash",
    role: "teacher",
    mode: "learn_and_teach",
    username: "Teacher1",
    teacherProfile: {
      fullName: "Test Teacher",
      education: "MSc",
      specialization: "Math",
      isComplete: true,
    },
  });
  teacherId = teacher._id.toString();
  teacherToken = signToken(teacherId, "teacher");
  const student = await User.create({
    email: "student@test.com",
    passwordHash: "hash",
    role: "student",
    username: "Student1",
  });
  studentToken = signToken(student._id.toString(), "student");
});

describe("POST /api/broadcasts/create", () => {
  it("should create broadcast as teacher with profile", async () => {
    const res = await request(app)
      .post("/api/broadcasts/create")
      .set("Authorization", `Bearer ${teacherToken}`)
      .send({ title: "Test Broadcast" });
    expect(res.status).toBe(201);
    expect(res.body.streamKey).toBeDefined();
  });

  it("should reject create for student", async () => {
    const res = await request(app)
      .post("/api/broadcasts/create")
      .set("Authorization", `Bearer ${studentToken}`)
      .send({ title: "Test" });
    expect(res.status).toBe(403);
  });
});
