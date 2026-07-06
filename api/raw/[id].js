// /api/raw/[id].js
const admin = require("firebase-admin");

if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(
      JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_KEY)
    ),
    databaseURL: "https://zeoxxyz-default-rtdb.firebaseio.com",
  });
}

const db = admin.database();
const FILES_PATH = "sharedFiles";

module.exports = async (req, res) => {
  const { id } = req.query;

  res.setHeader("Cache-Control", "no-store");

  if (!id || typeof id !== "string") {
    res.status(400).setHeader("Content-Type", "text/plain; charset=utf-8");
    res.send("-- Zeox Share: missing id");
    return;
  }

  try {
    const snap = await db.ref(`${FILES_PATH}/${id}`).get();
    const data = snap.val();

    if (!data || typeof data.content !== "string") {
      res.status(404).setHeader("Content-Type", "text/plain; charset=utf-8");
      res.send("-- Zeox Share: file not found");
      return;
    }

    res.status(200);
    res.setHeader("Content-Type", "text/plain; charset=utf-8");
    res.setHeader("X-Content-Type-Options", "nosniff");
    res.send(data.content);
  } catch (err) {
    res.status(500).setHeader("Content-Type", "text/plain; charset=utf-8");
    res.send("-- Zeox Share: error loading file");
  }
};
