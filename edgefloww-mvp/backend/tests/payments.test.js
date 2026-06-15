import request from "supertest";
import express from "express";
import { signToken } from "../middleware/auth.js";
import User from "../models/User.js";
import paymentRoutes from "../routes/payments.js";

const app = express();
app.use(express.json());
app.use("/api/payments", paymentRoutes);

let token;
let userId;

beforeEach(async () => {
  const user = await User.create({
    email: "pay@test.com",
    passwordHash: "hash",
    role: "student",
    username: "PayUser",
    balanceRub: 1000,
  });
  userId = user._id.toString();
  token = signToken(userId, "student");
});

describe("POST /api/payments/topup", () => {
  it("should topup balance directly when YooKassa not configured", async () => {
    const res = await request(app)
      .post("/api/payments/topup")
      .set("Authorization", `Bearer ${token}`)
      .send({ amount: 500 });
    expect(res.status).toBe(200);
    expect(res.body.balanceRub).toBe(1500);
  });

  it("should reject zero or negative amount", async () => {
    const res = await request(app)
      .post("/api/payments/topup")
      .set("Authorization", `Bearer ${token}`)
      .send({ amount: 0 });
    expect(res.status).toBe(400);
  });
});
