import { jest } from "@jest/globals";

describe("Course Routes", () => {
  let token;
  let courseId;

  beforeAll(async () => {
    const res = await fetch("http://localhost:3001/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: "author@demo.com", password: "author123" }),
    });
    const data = await res.json();
    token = data.token;
  });

  test("GET /api/courses - should list courses", async () => {
    const res = await fetch("http://localhost:3001/api/courses", {
      headers: { Authorization: `Bearer ${token}` },
    });
    const data = await res.json();
    expect(res.status).toBe(200);
    expect(Array.isArray(data)).toBe(true);
  });

  test("POST /api/courses - should create course", async () => {
    const res = await fetch("http://localhost:3001/api/courses", {
      method: "POST",
      headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
      body: JSON.stringify({ title: "Test Course", priceUSDT: 10, category: "web3" }),
    });
    const data = await res.json();
    expect(res.status).toBe(201);
    expect(data.title).toBe("Test Course");
    courseId = data._id;
  });
});
