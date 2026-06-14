import { jest } from "@jest/globals";

describe("Health Check", () => {
  test("should return ok status", async () => {
    const res = await fetch("http://localhost:3001/api/health");
    const data = await res.json();
    expect(data.status).toBe("ok");
  });
});
