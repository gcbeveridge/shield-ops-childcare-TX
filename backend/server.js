const express = require('express');
const cors = require('cors');

const authRoutes = require('./routes/auth');
const dashboardRoutes = require('./routes/dashboard');
const seedRoutes = require('./routes/seed');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors({
  origin: true,
  credentials: true
}));

app.use(express.json());

app.use((req, res, next) => {
  console.log(`${req.method} ${req.path}`);
  next();
});

app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    service: 'Shield Ops Backend',
    version: '1.0.0'
  });
});

app.use('/api/auth', authRoutes);
app.use('/api', dashboardRoutes);
app.use('/api', seedRoutes);

app.use((req, res) => {
  res.status(404).json({ error: 'Endpoint not found' });
});

app.use((err, req, res, next) => {
  console.error('Error:', err);
  res.status(500).json({ error: 'Internal server error' });
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`\n🚀 Shield Ops Backend Server Running!`);
  console.log(`📍 Port: ${PORT}`);
  console.log(`🌐 Health Check: http://localhost:${PORT}/api/health`);
  console.log(`\n📚 Available Endpoints:`);
  console.log(`   POST   /api/seed              - Seed database with test data`);
  console.log(`   POST   /api/auth/signup       - Create new account`);
  console.log(`   POST   /api/auth/login        - Login`);
  console.log(`   GET    /api/auth/me           - Get current user (requires token)`);
  console.log(`   GET    /api/facilities/:id/dashboard - Get dashboard data (requires token)`);
  console.log(`\n✅ Phase 1 Backend Ready!\n`);
});
