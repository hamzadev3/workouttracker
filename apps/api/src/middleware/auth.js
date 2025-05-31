function requireUser(req, res, next) {
  const headerUid = req.header('x-user-id');
  if (!headerUid) return res.status(401).json({ error: "Missing x-user-id header" });

  if (['POST','DELETE'].includes(req.method)) {
    const bodyUid = req.body?.userId ?? headerUid;
    if (bodyUid !== headerUid) return res.status(403).json({ error: "User mismatch" });
  }
  req.userId = headerUid;
  next();
}
module.exports = { requireUser };
