console.log("🔥 THIS FILE IS RUNNING");
const express = require('express');
const cors = require('cors');
const admin = require('firebase-admin');
const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT);

const app = express();

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
});

const db = admin.firestore();

// 🔐 AUTH MIDDLEWARE
const verifyToken = async (req, res, next) => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'No token provided' });
  }

  const token = authHeader.split('Bearer ')[1];

  try {
    const decodedToken = await admin.auth().verifyIdToken(token);
    req.user = decodedToken;
    next();
  } catch (error) {
    return res.status(401).json({ error: 'Invalid or expired token' });
  }
};

app.use(cors());
app.use(express.json());

app.get('/', (req, res) => {
  res.send('Backend is running 🚀');
});
app.post('/rides', verifyToken, async (req, res) => {
  const {
    from,
    to,
    date,
    timeRange,
    mode,
    totalSeats,
    genderPreference
  } = req.body;

  const ride = {
    postedBy: req.user.uid,   // 🔥 comes from middleware
    from,
    to,
    date,
    timeRange,
    mode,
    totalSeats,
    seatsLeft: totalSeats,
    genderPreference,
    interestedUsers: [],
    confirmedUsers: [],
    status: 'active',
    createdAt: admin.firestore.FieldValue.serverTimestamp(),
  };

  const ref = await db.collection('rides').add(ride);
  res.json({ rideId: ref.id });
});
// 🚕 GET RIDES WITH FILTERS
app.get('/rides', verifyToken, async (req, res) => {
  const { date, gender, from, to } = req.query;

  let query = db
    .collection('rides')
    .where('status', '==', 'active')
    .where('seatsLeft', '>', 0);

  if (date) {
    query = query.where('date', '==', date);
  }

  if (gender) {
    query = query.where('genderPreference', 'in', [gender, 'any']);
  }

  const snapshot = await query.get();
  const rides = snapshot.docs.map(doc => ({
    id: doc.id,
    ...doc.data(),
  }));

  res.json(rides);
});
/* ❤️ Express Interest */
app.post('/rides/:rideId/interest', verifyToken, async (req, res) => {
  const rideRef = db.collection('rides').doc(req.params.rideId);
  const rideSnap = await rideRef.get();

  if (!rideSnap.exists) {
    return res.status(404).json({ error: 'Ride not found' });
  }

  await rideRef.update({
    interestedUsers: admin.firestore.FieldValue.arrayUnion(req.user.uid),
  });

  res.json({ success: true });
});
console.log("✅ Confirm route registered");
// ✅ CONFIRM USER (move from interested → confirmed)
app.post('/rides/:rideId/confirm', verifyToken, async (req, res) => {
  const { userId } = req.body;
  
  const rideRef = db.collection('rides').doc(req.params.rideId);
  const rideSnap = await rideRef.get();

  if (!rideSnap.exists) {
    return res.status(404).json({ error: 'Ride not found' });
  }

  const ride = rideSnap.data();

  // 🔒 Only ride owner can confirm
  if (ride.postedBy !== req.user.uid) {
    return res.status(403).json({ error: 'Not authorized' });
  }

  // ❌ User must be in interestedUsers
  //if (!ride.interestedUsers.includes(userId)) {
    //return res.status(400).json({ error: 'User not interested' });
 // }

  // 🚀 Update ride
  await rideRef.update({
    interestedUsers: admin.firestore.FieldValue.arrayRemove(userId),
    confirmedUsers: admin.firestore.FieldValue.arrayUnion(userId),
    seatsLeft: ride.seatsLeft - 1,
  });

  res.json({ success: true });
});
// 🚀 START SERVER
const PORT = process.env.PORT || 5050;

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});