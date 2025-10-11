const db = require('../config/database');
const { TEXAS_COMPLIANCE_REQUIREMENTS } = require('../config/constants');

async function getDashboard(req, res) {
  try {
    const { facilityId } = req.params;

    const facility = await db.get(`facilities:${facilityId}`);

    if (!facility) {
      return res.status(404).json({ error: 'Facility not found' });
    }

    const staff = await db.getByPrefix(`staff:${facilityId}:`) || [];
    const incidents = await db.getByPrefix(`incident:${facilityId}:`) || [];
    const compliance = await db.getByPrefix(`compliance:${facilityId}:`) || [];

    const today = new Date().toISOString().split('T')[0];
    const todayIncidents = incidents.filter(inc => 
      inc.occurredAt.startsWith(today)
    );

    const completeRequirements = compliance.filter(c => c.status === 'complete').length;
    const totalRequirements = TEXAS_COMPLIANCE_REQUIREMENTS.length;

    const upcomingExpirations = [];
    staff.forEach(s => {
      if (s.certifications.cpr.valid && s.certifications.cpr.expiresAt) {
        const daysUntilExp = Math.floor(
          (new Date(s.certifications.cpr.expiresAt) - new Date()) / (1000 * 60 * 60 * 24)
        );
        if (daysUntilExp < 90 && daysUntilExp > 0) {
          upcomingExpirations.push({
            type: 'certification',
            item: `CPR - ${s.name}`,
            expiresAt: s.certifications.cpr.expiresAt,
            daysUntilExpiration: daysUntilExp,
            priority: daysUntilExp < 30 ? 'high' : 'medium'
          });
        }
      }
    });

    const dashboardData = {
      facilityInfo: {
        name: facility.name,
        location: `${facility.address.city}, ${facility.address.state}`,
        currentEnrollment: 42,
        capacity: facility.capacity,
        staffCount: staff.length
      },
      complianceStatus: {
        overallPercentage: Math.round((completeRequirements / totalRequirements) * 100),
        completeRequirements,
        totalRequirements,
        pendingRequirements: totalRequirements - completeRequirements,
        overdueRequirements: 0
      },
      todayStats: {
        childrenPresent: 38,
        staffOnDuty: staff.filter(s => s.active).length,
        incidentsToday: todayIncidents.length,
        medicationsGiven: 3,
        checklistCompletion: 90
      },
      recentIncidents: incidents.slice(0, 5).map(inc => ({
        id: inc.id,
        childName: inc.childName,
        type: inc.incidentType,
        description: inc.description,
        occurredAt: inc.occurredAt,
        parentNotified: inc.parentNotified
      })),
      upcomingExpirations,
      actionItems: [
        {
          priority: 'high',
          title: 'Complete October fire drill documentation',
          dueDate: '2025-10-15',
          overdue: false
        }
      ]
    };

    res.json(dashboardData);
  } catch (error) {
    console.error('Dashboard error:', error);
    res.status(500).json({ error: 'Failed to fetch dashboard data' });
  }
}

module.exports = {
  getDashboard
};
