import User from "../models/User.js";
import Broadcast from "../models/Broadcast.js";
import Purchase from "../models/Purchase.js";
import ChatMessage from "../models/ChatMessage.js";
import "./setup.js";

describe("Broadcast Model", () => {
  it("creates a broadcast with streamKey", async () => {
    const user = await User.create({ email: "author@test.com", passwordHash: "hash", username: "Author1", role: "author" });
    const b = await Broadcast.create({ title: "Test Stream", authorId: user._id, streamKey: "abc123", rtmpUrl: "rtmp://localhost/live/abc123", hlsUrl: "http://localhost:8080/live/abc123.m3u8" });
    expect(b.title).toBe("Test Stream");
    expect(b.streamKey).toBe("abc123");
    expect(b.isLive).toBe(false);
  });
});

describe("ChatMessage Model", () => {
  it("creates and retrieves messages ordered by time", async () => {
    const user = await User.create({ email: "u@t.com", passwordHash: "hash", username: "User1" });
    const b = await Broadcast.create({ title: "Chat Test", authorId: user._id, streamKey: "key1", rtmpUrl: "rtmp://x/y", hlsUrl: "http://x/y.m3u8" });
    await ChatMessage.create({ broadcastId: b._id, userId: user._id, username: "User1", message: "Hello" });
    await ChatMessage.create({ broadcastId: b._id, userId: user._id, username: "User1", message: "World" });
    const msgs = await ChatMessage.find({ broadcastId: b._id }).sort({ createdAt: 1 }).lean();
    expect(msgs).toHaveLength(2);
    expect(msgs[0].message).toBe("Hello");
    expect(msgs[1].message).toBe("World");
  });
});

describe("Purchase Model with broadcastId", () => {
  it("allows purchase of broadcast", async () => {
    const student = await User.create({ email: "s@t.com", passwordHash: "hash", username: "Student1", balanceRub: 100 });
    const author = await User.create({ email: "a@t.com", passwordHash: "hash", username: "Author2", role: "author" });
    const b = await Broadcast.create({ title: "Paid Stream", authorId: author._id, price: 50, streamKey: "key2", rtmpUrl: "rtmp://x/y", hlsUrl: "http://x/y.m3u8" });
    const p = await Purchase.create({ broadcastId: b._id, studentId: student._id, amount: 50, status: "completed" });
    expect(p.broadcastId.toString()).toBe(b._id.toString());
    expect(p.amount).toBe(50);
  });
});
