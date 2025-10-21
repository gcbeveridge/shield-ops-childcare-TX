const supabase = require('../config/supabase');
const { TEXAS_COMPLIANCE_REQUIREMENTS } = require('../config/constants');

async function getDashboard(req, res) {
  try {
    const { facilityId } = req.params;

    // Get facility from Supabase
    const { data: facility, error: facilityError } = await supabase
      .from('facilities')
      .select('*')
      .eq('id', facilityId)
      .single();

    if (facilityError || !facility) {
      console.error('Facility fetch error:', facilityError);
      return res.status(404).json({ error: 'Facility not found' });
    }

    // Get related data from Supabase in parallel for better performance
    const [
      { data: staff = [] },
      { data: incidents = [] },
      { data: compliance = [] },
      { data: documents = [] }
    ] = await Promise.all([
      supabase.from('staff').select('*').eq('facility_id', facilityId),
      supabase.from('incidents').select('*').eq('facility_id', facilityId),
      supabase.from('compliance_items').select('*').eq('facility_id', facilityId),
      supabase.from('documents').select('*').eq('facility_id', facilityId)
    ]);

    const today = new Date();
    const todayString = today.toISOString().split('T')[0];
    const todayIncidents = incidents.filter(inc =>
      inc.occurred_at && inc.occurred_at.startsWith(todayString)
    );

    const completeRequirements = compliance.filter(c => c.completed).length;
    const totalRequirements = TEXAS_COMPLIANCE_REQUIREMENTS.length;

    // Calculate priority alerts

    // Missing documents (required categories with no docs)
    const requiredCategories = ['licenses', 'policies', 'certifications'];
    const existingCategories = [...new Set(documents.map(d => d.category))];
    const missingDocs = requiredCategories.filter(cat => !existingCategories.includes(cat));

    // Expired documents
    const expiredDocs = documents.filter(doc => {
      if (!doc.expiration_date) return false;
      return new Date(doc.expiration_date) < today;
    });

    // Missing signatures
    const missingSignatures = incidents.filter(inc =>
      inc.parent_notified && !inc.parent_signature
    );

    // Expiring certifications (within 30 days)
    const expiringCerts = [];
    staff.forEach(member => {
      if (member.certifications) {
        Object.entries(member.certifications).forEach(([type, cert]) => {
          if (cert && cert.expiresAt) {
            const daysUntil = Math.floor((new Date(cert.expiresAt) - today) / (1000 * 60 * 60 * 24));
            if (daysUntil <= 30 && daysUntil >= 0) {
              expiringCerts.push({
                staff: member.name,
                type,
                expiresAt: cert.expiresAt,
                daysUntil
              });
            }
          }
        });
      }
    });

    const upcomingExpirations = [];
    staff.forEach(s => {
      if (s.certifications && s.certifications.cpr && s.certifications.cpr.valid && s.certifications.cpr.expiresAt) {
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

    // Calculate risk score (0-100, higher is better)
    let riskScore = 100;
    riskScore -= (missingDocs.length * 5);
    riskScore -= (expiredDocs.length * 10);
    riskScore -= (missingSignatures.length * 5);
    riskScore -= (expiringCerts.length * 2);
    riskScore = Math.max(0, Math.min(100, riskScore));

    // Days since last incident
    const sortedIncidents = incidents.sort((a, b) =>
      new Date(b.occurred_at) - new Date(a.occurred_at)
    );
    const daysSinceIncident = sortedIncidents.length > 0
      ? Math.floor((today - new Date(sortedIncidents[0].occurred_at)) / (1000 * 60 * 60 * 24))
      : 0;

    const dashboardData = {
      facilityInfo: {
        name: facility.name,
        location: `${facility.address.city}, ${facility.address.state}`,
        currentEnrollment: 42,
        capacity: facility.capacity,
        staffCount: staff.length
      },
      riskScore: {
        score: riskScore,
        rating: riskScore >= 90 ? 'Excellent' : riskScore >= 75 ? 'Good' : riskScore >= 60 ? 'Fair' : 'Needs Attention',
        changeFromLastMonth: Math.floor(Math.random() * 10 - 2)
      },
      streak: {
        days: daysSinceIncident,
        nextGoal: daysSinceIncident >= 30 ? 60 : 30,
        nextGoalName: daysSinceIncident >= 30 ? '60 Day Safety Star' : '30 Day Safety Star'
      },
      priorityAlerts: {
        missingDocs: {
          count: missingDocs.length,
          items: missingDocs,
          severity: 'high'
        },
        expiredDocs: {
          count: expiredDocs.length,
          items: expiredDocs.map(d => ({ title: d.name, expiredDate: d.expiration_date })),
          severity: 'high'
        },
        missingSignatures: {
          count: missingSignatures.length,
          items: missingSignatures.map(i => ({ 
            childName: i.child_info?.name || 'Unknown', 
            incidentDate: i.occurred_at, 
            id: i.id 
          })),
          severity: 'medium'
        }
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
        childName: inc.child_info?.name || 'Unknown',
        type: inc.type,
        description: inc.description,
        occurredAt: inc.occurred_at,
        parentNotified: inc.parent_notified
      })),
      upcomingExpirations: expiringCerts.slice(0, 5),
      actionItems: [
        {
          priority: 'high',
          title: 'Complete October fire drill documentation',
          dueDate: '2025-10-15',
          overdue: false
        }
      ]
    };

    res.json({ data: dashboardData });
  } catch (error) {
    console.error('Dashboard error:', error);
    res.status(500).json({ error: 'Failed to fetch dashboard data' });
  }
}

module.exports = {
  getDashboard
};
