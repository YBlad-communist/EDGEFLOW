import request from "supertest";
import express from "express";
import authRoutes from "../routes/auth.js";

const app = express();
app.use(express.json());
app.use("/api/auth", authRoutes);

describe("POST /api/auth/register", () => {
  it("should register a student", async () => {
    const res = await request(app).post("/api/auth/register").send({
      email: "student@test.com",
      password: "1234",
      role: "student",
    });
    expect(res.status).toBe(201);
    expect(res.body.user).toBeDefined();
    expect(res.body.user.role).toBe("student");
    expect(res.body.token).toBeDefined();
  });

  it("should register a teacher", async () => {
    const res = await request(app).post("/api/auth/register").send({
      email: "teacher@test.com",
      password: "1234",
      role: "teacher",
    });
    expect(res.status).toBe(201);
    expect(res.body.user.mode).toBe("learn_and_teach");
  });

  it("should reject duplicate email", async () => {
    await request(app).post("/api/auth/register").send({ email: "dup@test.com", password: "1234" });
    const res = await request(app).post("/api/auth/register").send({ email: "dup@test.com", password: "1234" });
    expect(res.status).toBe(409);
  });

  it("should reject invalid email", async () => {
    const res = await request(app).post("/api/auth/register").send({ email: "bad", password: "1234" });
    expect(res.status).toBe(400);
  });
});

describe("POST /api/auth/login", () => {
  beforeEach(async () => {
    await request(app).post("/api/auth/register").send({ email: "login@test.com", password: "1234" });
  });

  it("should login with correct credentials", async () => {
    const res = await request(app).post("/api/auth/login").send({ email: "login@test.com", password: "1234" });
    expect(res.status).toBe(200);
    expect(res.body.token).toBeDefined();
  });

  it("should reject wrong password", async () => {
    const res = await request(app).post("/api/auth/login").send({ email: "login@test.com", password: "wrong" });
    expect(res.status).toBe(401);
  });
});
