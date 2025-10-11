const express = require('express');
const cors = require('cors');

const authRoutes = require('./routes/auth');
const dashboardRoutes = require('./routes/dashboard');
const seedRoutes = require('./routes/seed');
const staffRoutes = require('./routes/staff');
const incidentRoutes = require('./routes/incidents');
const medicationRoutes = require('./routes/medications');
const complianceRoutes = require('./routes/compliance');

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
app.use('/api', staffRoutes);
app.use('/api', incidentRoutes);
app.use('/api', medicationRoutes);
app.use('/api', complianceRoutes);

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
  console.log(`\n  🔐 Authentication:`);
  console.log(`   POST   /api/auth/signup`);
  console.log(`   POST   /api/auth/login`);
  console.log(`   GET    /api/auth/me`);
  console.log(`\n  📊 Dashboard:`);
  console.log(`   GET    /api/facilities/:id/dashboard`);
  console.log(`\n  👥 Staff Management:`);
  console.log(`   GET    /api/facilities/:id/staff`);
  console.log(`   POST   /api/facilities/:id/staff`);
  console.log(`   GET    /api/staff/:id`);
  console.log(`   PUT    /api/staff/:id`);
  console.log(`   PUT    /api/staff/:id/certifications`);
  console.log(`\n  📝 Incident Reporting:`);
  console.log(`   GET    /api/facilities/:id/incidents`);
  console.log(`   POST   /api/facilities/:id/incidents`);
  console.log(`   GET    /api/incidents/:id`);
  console.log(`   PUT    /api/incidents/:id/parent-signature`);
  console.log(`\n  💊 Medication Tracking:`);
  console.log(`   GET    /api/facilities/:id/medications`);
  console.log(`   POST   /api/facilities/:id/medications`);
  console.log(`   POST   /api/medications/:id/administer`);
  console.log(`   GET    /api/medications/:id`);
  console.log(`\n  ✅ Compliance Management:`);
  console.log(`   GET    /api/facilities/:id/compliance`);
  console.log(`   POST   /api/facilities/:id/compliance/:reqId/complete`);
  console.log(`\n  🌱 Testing:`);
  console.log(`   POST   /api/seed - Seed database with test data`);
  console.log(`\n✅ Phase 1 + Phase 2 Backend Ready!\n`);
});
