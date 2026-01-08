const supabase = require('../config/supabase');
const bcrypt = require('bcryptjs');
const { generateToken } = require('../middleware/auth');
const { v4: uuidv4 } = require('uuid');

async function signup(req, res) {
  try {
    const { email, password, name, facilityName, facilityAddress, phone } = req.body;

    if (!email || !password || !name || !facilityName) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    // Check if user already exists
    const { data: existingUser } = await supabase
      .from('users')
      .select('id')
      .eq('email', email)
      .single();

    if (existingUser) {
      return res.status(400).json({ error: 'Email already registered' });
    }

    const facilityId = uuidv4();
    const userId = uuidv4();

    // Create facility
    const { data: facility, error: facilityError } = await supabase
      .from('facilities')
      .insert({
        id: facilityId,
        name: facilityName,
        address: facilityAddress,
        phone,
        email,
        owner_id: userId
      })
      .select()
      .single();

    if (facilityError) throw facilityError;

    // Hash password
    const passwordHash = await bcrypt.hash(password, 10);

    // Create user
    const { data: user, error: userError } = await supabase
      .from('users')
      .insert({
        id: userId,
        email,
        password_hash: passwordHash,
        name,
        role: 'owner',
        facility_id: facility.id
      })
      .select()
      .single();

    if (userError) throw userError;

    const token = generateToken(user);

    res.status(201).json({
      token,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        facilityId: user.facility_id
      },
      facility: {
        id: facility.id,
        name: facility.name,
        address: facility.address,
        phone: facility.phone,
        email: facility.email
      }
    });
  } catch (error) {
    console.error('Signup error:', error);
    res.status(500).json({ error: 'Failed to create account' });
  }
}

async function login(req, res) {
  try {
    const { email, password } = req.body;

    console.log('Login attempt:', { email });

    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password required' });
    }

    // Find user by email
    const { data: user, error: userError } = await supabase
      .from('users')
      .select('*')
      .eq('email', email)
      .single();

    if (userError || !user) {
      console.log('User not found:', email);
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    console.log('User found:', user.email);

    // Verify password
    const validPassword = await bcrypt.compare(password, user.password_hash);
    if (!validPassword) {
      console.log('Invalid password for:', email);
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    console.log('Password valid, fetching facility...');

    // Get facility
    const { data: facility, error: facilityError } = await supabase
      .from('facilities')
      .select('*')
      .eq('id', user.facility_id)
      .single();

    if (facilityError) {
      console.error('Facility fetch error:', facilityError);
    }

    const token = generateToken(user);

    console.log('Login successful for:', email);

    res.json({
      token,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        facilityId: user.facility_id
      },
      facility: facility ? {
        id: facility.id,
        name: facility.name,
        address: facility.address,
        phone: facility.phone,
        email: facility.email,
        licenseNumber: facility.license_number,
        capacity: facility.capacity
      } : null
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Login failed' });
  }
}

async function getMe(req, res) {
  try {
    const { data: user, error: userError } = await supabase
      .from('users')
      .select('*')
      .eq('id', req.user.userId)
      .single();

    if (userError || !user) {
      return res.status(404).json({ error: 'User not found' });
    }

    const { data: facility } = await supabase
      .from('facilities')
      .select('*')
      .eq('id', user.facility_id)
      .single();

    res.json({
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        facilityId: user.facility_id
      },
      facility: facility ? {
        id: facility.id,
        name: facility.name,
        address: facility.address,
        phone: facility.phone,
        email: facility.email,
        licenseNumber: facility.license_number,
        capacity: facility.capacity
      } : null
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
