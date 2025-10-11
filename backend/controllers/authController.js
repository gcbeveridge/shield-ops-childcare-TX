const db = require('../config/database');
const User = require('../models/User');
const Facility = require('../models/Facility');
const { generateToken } = require('../middleware/auth');

async function signup(req, res) {
  try {
    const { email, password, name, facilityName, facilityAddress, phone } = req.body;

    if (!email || !password || !name || !facilityName) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    const existingUsers = await db.getByPrefix('users:');
    const userExists = existingUsers.some(u => u.email === email);

    if (userExists) {
      return res.status(400).json({ error: 'Email already registered' });
    }

    const facility = new Facility({
      name: facilityName,
      address: facilityAddress,
      phone,
      email
    });

    const user = new User({
      email,
      name,
      role: 'owner',
      facilityId: facility.id
    });

    await user.setPassword(password);

    facility.ownerId = user.id;

    await db.set(`facilities:${facility.id}`, facility.toJSON());
    await db.set(`users:${user.id}`, {
      ...user.toJSON(),
      passwordHash: user.passwordHash
    });

    const token = generateToken(user);

    res.status(201).json({
      token,
      user: user.toJSON(),
      facility: facility.toJSON()
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

    const users = await db.getByPrefix('users:');
    const user = users.find(u => u.email === email);

    if (!user) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const userInstance = new User(user);
    const validPassword = await userInstance.verifyPassword(password);

    if (!validPassword) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const facility = await db.get(`facilities:${user.facilityId}`);

    const token = generateToken(user);

    res.json({
      token,
      user: userInstance.toJSON(),
      facility
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Login failed' });
  }
}

async function getMe(req, res) {
  try {
    const user = await db.get(`users:${req.user.userId}`);

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    const facility = await db.get(`facilities:${user.facilityId}`);

    const { passwordHash, ...safeUser } = user;

    res.json({
      user: safeUser,
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
