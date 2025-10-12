const UserDB = require('../models/UserDB');
const FacilityDB = require('../models/FacilityDB');
const { generateToken } = require('../middleware/auth');
const { v4: uuidv4 } = require('uuid');

async function signup(req, res) {
  try {
    const { email, password, name, facilityName, facilityAddress, phone } = req.body;

    if (!email || !password || !name || !facilityName) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    const existingUser = await UserDB.findByEmail(email);
    if (existingUser) {
      return res.status(400).json({ error: 'Email already registered' });
    }

    const facilityId = uuidv4();
    const userId = uuidv4();

    const facility = await FacilityDB.create({
      id: facilityId,
      name: facilityName,
      address: facilityAddress,
      phone,
      email,
      ownerId: userId
    });

    const user = await UserDB.create({
      id: userId,
      email,
      password,
      name,
      role: 'owner',
      facilityId: facility.id
    });

    const token = generateToken({ userId: user.id });

    res.status(201).json({
      token,
      user: UserDB.toJSON(user),
      facility
    });
  } catch (error) {
    console.error('Signup error:', error);
    res.status(500).json({ error: 'Failed to create account' });
  }
}

async function login(req, res) {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password required' });
    }

    const user = await UserDB.findByEmail(email);
    if (!user) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const validPassword = await UserDB.verifyPassword(user, password);
    if (!validPassword) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const facility = await FacilityDB.findById(user.facilityId);

    const token = generateToken({ userId: user.id });

    res.json({
      token,
      user: UserDB.toJSON(user),
      facility
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Login failed' });
  }
}

async function getMe(req, res) {
  try {
    const user = await UserDB.findById(req.user.userId);

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    const facility = await FacilityDB.findById(user.facilityId);

    res.json({
      user: UserDB.toJSON(user),
      facility
    });
  } catch (error) {
    console.error('Get me error:', error);
    res.status(500).json({ error: 'Failed to fetch user data' });
  }
}

module.exports = {
  signup,
  login,
  getMe
};
