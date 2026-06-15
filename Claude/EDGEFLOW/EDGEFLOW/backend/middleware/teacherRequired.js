module.exports = (req, res, next) => {
  const user = req.user;
  if (!user) return res.status(401).json({ error: 'Авторизация обязательна' });
  if (user.role !== 'teacher') {
    return res.status(403).json({ error: 'Доступно только для учителей' });
  }
  if (!user.teacherProfile || !user.teacherProfile.isComplete) {
    return res.status(403).json({ error: 'Сначала заполните анкету учителя' });
  }
  next();
};
