import User from "../models/User.js";

export function teacherRequired(req, res, next) {
  if (req.userRole !== "teacher") {
    return res.status(403).json({ error: "Только учителя могут выполнять это действие" });
  }
  next();
}

export async function teacherProfileRequired(req, res, next) {
  try {
    if (req.userRole !== "teacher") {
      return res.status(403).json({ error: "Только учителя могут выполнять это действие" });
    }
    const user = await User.findById(req.userId).lean();
    if (!user?.teacherProfile?.isComplete) {
      return res.status(403).json({ error: "Сначала заполните анкету учителя в профиле" });
    }
    req.teacherProfile = user.teacherProfile;
    next();
  } catch (err) {
    next(err);
  }
}
