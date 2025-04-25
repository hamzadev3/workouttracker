function requireUser(req, res, next) {
  const headerUid = req.header('x-user-id');
  if (!headerUid) return res.status(401).json({ error: "Missing x-user-id header" });

  // For POST /sessions and POST /:id/exercise we check body.userId if present
  if (['POST','DELETE'].includes(req.method)) {
    const bodyUid = req.body?.userId ?? headerUid; // allow omit if header present
    if (bodyUid !== headerUid) return res.status(403).json({ error: "User mismatch" });
    req.userId = headerUid;
    return next();
  }

  req.userId = headerUid;
  next();
}

module.exports = { requireUser };
