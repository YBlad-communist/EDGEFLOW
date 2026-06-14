import { jest } from "@jest/globals";

describe("Auth Routes", () => {
  test("POST /api/auth/register - should create user", async () => {
    const email = `test_${Date.now()}@test.com`;
    const res = await fetch("http://localhost:3001/api/auth/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password: "1234", role: "student" }),
    });
    const data = await res.json();
    expect(res.status).toBe(201);
    expect(data.user).toBeDefined();
    expect(data.token).toBeDefined();
    expect(data.user.email).toBe(email);
  });

  test("POST /api/auth/login - should authenticate", async () => {
    const res = await fetch("http://localhost:3001/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: "student@demo.com", password: "student123" }),
    });
    const data = await res.json();
    expect(res.status).toBe(200);
    expect(data.token).toBeDefined();
  });

  test("POST /api/auth/login - wrong password should 401", async () => {
    const res = await fetch("http://localhost:3001/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: "student@demo.com", password: "wrong" }),
    });
    expect(res.status).toBe(401);
  });
});
