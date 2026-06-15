import { Router } from "express";
import multer from "multer";
import { v4 as uuidv4 } from "uuid";
import { join, dirname } from "path";
import { fileURLToPath } from "url";
import Course from "../models/Course.js";
import Review from "../models/Review.js";
import Purchase from "../models/Purchase.js";
import User from "../models/User.js";
import { authMiddleware, optionalAuth } from "../middleware/auth.js";

const __dirname = dirname(fileURLToPath(import.meta.url));

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const dir = file.fieldname === "video" ? "uploads/videos" : "uploads/covers";
    cb(null, join(__dirname, "..", dir));
  },
  filename: (req, file, cb) => {
    const ext = file.originalname.split(".").pop();
    cb(null, `${uuidv4()}.${ext}`);
  },
});

const upload = multer({
  storage,
  limits: { fileSize: (parseInt(process.env.MAX_FILE_SIZE_MB || "500", 10)) * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    if (file.fieldname === "video" && !file.mimetype.startsWith("video/")) return cb(new Error("Only video files"));
    if (file.fieldname === "cover" && !file.mimetype.startsWith("image/")) return cb(new Error("Only images"));
    cb(null, true);
  },
});

const router = Router();

router.get("/", optionalAuth, async (req, res) => {
  try {
    const { category, search } = req.query;
    const filter = {};
    if (category) filter.category = category;
    if (search) filter.$or = [
      { title: { $regex: search, $options: "i" } },
      { description: { $regex: search, $options: "i" } },
    ];
    const courses = await Course.find(filter)
      .populate("authorId", "username displayName avatar")
      .sort({ createdAt: -1 }).lean();

    const enriched = await Promise.all(courses.map(async (c) => {
      const [avgRating, reviewCount] = await Promise.all([
        Review.aggregate([{ $match: { courseId: c._id } }, { $group: { _id: null, avg: { $avg: "$rating" } } }]),
        Review.countDocuments({ courseId: c._id }),
      ]);
      return {
        ...c,
        author_name: c.authorId?.username,
        author_display_name: c.authorId?.displayName,
        avg_rating: avgRating[0]?.avg || 0,
        review_count: reviewCount,
      };
    }));
    res.json(enriched);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.get("/my", authMiddleware, async (req, res) => {
  try {
    const courses = await Course.find({ authorId: req.userId })
      .sort({ createdAt: -1 }).lean();
    const enriched = await Promise.all(courses.map(async (c) => ({
      ...c,
      lesson_count: c.lessons?.length || 0,
    })));
    res.json(enriched);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.get("/purchased", authMiddleware, async (req, res) => {
  try {
    const purchases = await Purchase.find({ studentId: req.userId, status: "completed" }).lean();
    const courseIds = purchases.map(p => p.courseId);
    const courses = await Course.find({ _id: { $in: courseIds } })
      .populate("authorId", "username displayName")
      .sort({ createdAt: -1 }).lean();
    const enriched = await Promise.all(courses.map(async (c) => {
      const [avgRating] = await Promise.all([
        Review.aggregate([{ $match: { courseId: c._id } }, { $group: { _id: null, avg: { $avg: "$rating" } } }]),
      ]);
      return {
        ...c,
        author_name: c.authorId?.username,
        author_display_name: c.authorId?.displayName,
        avg_rating: avgRating[0]?.avg || 0,
        lesson_count: c.lessons?.length || 0,
      };
    }));
    res.json(enriched);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.get("/:id", optionalAuth, async (req, res) => {
  try {
    const course = await Course.findById(req.params.id)
      .populate("authorId", "username displayName avatar bio")
      .lean();
    if (!course) return res.status(404).json({ error: "Course not found" });

    const [avgRating, reviewCount, reviews, purchase] = await Promise.all([
      Review.aggregate([{ $match: { courseId: course._id } }, { $group: { _id: null, avg: { $avg: "$rating" } } }]),
      Review.countDocuments({ courseId: course._id }),
      Review.find({ courseId: course._id }).populate("userId", "username displayName avatar").sort({ createdAt: -1 }).lean(),
      req.userId ? Purchase.findOne({ courseId: course._id, studentId: req.userId, status: "completed" }).lean() : null,
    ]);

    res.json({
      ...course,
      author_name: course.authorId?.username,
      author_display_name: course.authorId?.displayName,
      author_avatar: course.authorId?.avatar,
      author_bio: course.authorId?.bio,
      avg_rating: avgRating[0]?.avg || 0,
      review_count: reviewCount,
      reviews: reviews.map(r => ({ ...r, username: r.userId?.username, display_name: r.userId?.displayName })),
      purchased: !!purchase,
    });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.post("/", authMiddleware, async (req, res) => {
  try {
    if (req.userRole !== "author") return res.status(403).json({ error: "Only authors can create courses" });
    const { title, description, priceUSDT, category } = req.body;
    if (!title || !priceUSDT) return res.status(400).json({ error: "Title and price required" });
    const course = await Course.create({
      authorId: req.userId, title, description: description || "",
      priceUSDT, category: category || "",
    });
    res.status(201).json(course);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.put("/:id", authMiddleware, async (req, res) => {
  try {
    const course = await Course.findById(req.params.id);
    if (!course) return res.status(404).json({ error: "Course not found" });
    if (course.authorId.toString() !== req.userId) return res.status(403).json({ error: "No permission" });
    const { title, description, priceUSDT, category } = req.body;
    if (title !== undefined) course.title = title;
    if (description !== undefined) course.description = description;
    if (priceUSDT !== undefined) course.priceUSDT = priceUSDT;
    if (category !== undefined) course.category = category;
    await course.save();
    res.json(course);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.delete("/:id", authMiddleware, async (req, res) => {
  try {
    const course = await Course.findById(req.params.id);
    if (!course) return res.status(404).json({ error: "Course not found" });
    if (course.authorId.toString() !== req.userId) return res.status(403).json({ error: "No permission" });
    await Course.deleteOne({ _id: req.params.id });
    res.json({ success: true });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.post("/:id/cover", authMiddleware, upload.single("cover"), async (req, res) => {
  try {
    const course = await Course.findById(req.params.id);
    if (!course || course.authorId.toString() !== req.userId)
      return res.status(404).json({ error: "Course not found" });
    course.cover = `/uploads/covers/${req.file.filename}`;
    await course.save();
    res.json({ cover: course.cover });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.post("/:id/lessons", authMiddleware, upload.single("video"), async (req, res) => {
  try {
    const course = await Course.findById(req.params.id);
    if (!course || course.authorId.toString() !== req.userId)
      return res.status(404).json({ error: "Course not found" });
    const { title, description } = req.body;
    if (!title) return res.status(400).json({ error: "Lesson title required" });
    const sortOrder = course.lessons.length > 0
      ? Math.max(...course.lessons.map(l => l.sortOrder)) + 1 : 0;
    const videoPath = req.file ? `/uploads/videos/${req.file.filename}` : null;
    course.lessons.push({ title, description: description || "", videoPath, sortOrder });
    await course.save();
    const lesson = course.lessons[course.lessons.length - 1];
    res.status(201).json(lesson);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.delete("/:courseId/lessons/:lessonId", authMiddleware, async (req, res) => {
  try {
    const course = await Course.findById(req.params.courseId);
    if (!course || course.authorId.toString() !== req.userId)
      return res.status(404).json({ error: "Course not found" });
    course.lessons.pull({ _id: req.params.lessonId });
    await course.save();
    res.json({ success: true });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.post("/:id/review", authMiddleware, async (req, res) => {
  try {
    const { rating, comment } = req.body;
    if (!rating || rating < 1 || rating > 5) return res.status(400).json({ error: "Rating 1-5" });
    const purchase = await Purchase.findOne({ courseId: req.params.id, studentId: req.userId, status: "completed" });
    if (!purchase) return res.status(403).json({ error: "Only buyers can review" });
    const existing = await Review.findOne({ courseId: req.params.id, userId: req.userId });
    if (existing) return res.status(409).json({ error: "Already reviewed" });
    await Review.create({ courseId: req.params.id, userId: req.userId, rating, comment: comment || "" });
    res.status(201).json({ success: true });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.post("/:id/buy", authMiddleware, async (req, res) => {
  try {
    const course = await Course.findById(req.params.id);
    if (!course) return res.status(404).json({ error: "Course not found" });
    if (course.authorId.toString() === req.userId)
      return res.status(400).json({ error: "Cannot buy your own course" });
    await Purchase.deleteMany({ courseId: course._id, studentId: req.userId });
    const user = await User.findById(req.userId);
    if (!user || user.balanceRub < course.priceUSDT)
      return res.status(400).json({ error: "Недостаточно средств на балансе" });
    user.balanceRub -= course.priceUSDT;
    await user.save();
    const commission = course.priceUSDT * (parseInt(process.env.PLATFORM_COMMISSION_PERCENT) || 5) / 100;
    const authorAmount = course.priceUSDT - commission;
    await User.updateOne({ _id: course.authorId }, { $inc: { balanceRub: authorAmount } });
    const adminUser = await User.findOne({ isAdmin: true });
    if (adminUser) await User.updateOne({ _id: adminUser._id }, { $inc: { balanceRub: commission } });
    await Purchase.create({
      courseId: course._id, studentId: req.userId,
      amount: course.priceUSDT, status: "completed",
      paymentSystem: "balance",
    });
    res.json({ success: true, balanceRub: user.balanceRub, message: "Курс куплен!" });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

export default router;
