const pool = require('../config/db');

async function seedJanuaryContent() {
    try {
        const moduleResult = await pool.query(`
            SELECT id FROM training_modules_new WHERE month = 1 AND year = 2026
        `);
        
        if (moduleResult.rows.length === 0) {
            console.log('January module not found');
            return;
        }
        
        const moduleId = moduleResult.rows[0].id;
        
        const existingContent = await pool.query(
            'SELECT id FROM training_champion_content WHERE module_id = $1 LIMIT 1',
            [moduleId]
        );
        
        if (existingContent.rows.length > 0) {
            console.log('January content already exists, skipping...');
            return;
        }
        
        const championSections = [
            {
                section_number: 1,
                section_title: 'Monthly Theme: New Year Safety Goals & Facility Assessment',
                section_content: `January represents fresh beginnings and systematic excellence in safety management. Professional goal-setting and comprehensive facility assessment create the foundation for year-long safety achievement and continuous improvement in child protection.

This month's training establishes a proactive, systematic approach to safety excellence—moving beyond reactive compliance to building a culture where safety is embedded in every decision, every day.

Why Goal-Setting Matters: Clear, measurable safety goals transform abstract intentions into concrete actions. When your entire team understands not just what to do, but why it matters and how success is measured, you create ownership and accountability. This month, you'll learn to set goals that are ambitious yet achievable, specific yet flexible enough to adapt to your facility's unique needs.`
            },
            {
                section_number: 2,
                section_title: 'The SMART SAFETY Method for Goal Excellence',
                section_content: `The SMART SAFETY method expands on traditional goal-setting: Specific, Measurable, Achievable, Relevant, Time-Bound, plus Safety Culture Integration, Assessment cycles, Facility Excellence, Emergency Preparedness, Training, and Yearly Planning.

**Specific:** Your goals must be crystal clear. Instead of "improve safety," define exactly what you're improving: "Reduce playground incidents by implementing daily equipment inspections and quarterly deep safety audits."

**Measurable:** Quantify success. How will you know you've achieved your goal? "Zero medication errors for six consecutive months" or "100% staff completion of CPR recertification by March 31st."

**Achievable:** Set ambitious goals that stretch your team without breaking them. Consider your resources, staff capacity, and realistic timelines. A goal to "achieve perfect attendance" might be unrealistic; "reduce unexpected staff absences by 25%" is challenging yet attainable.

**Relevant:** Every goal must tie directly to protecting children and supporting staff. Ask: "Will this goal make children safer or staff more effective?" If the answer isn't a clear yes, reconsider.

**Time-Bound:** Assign specific deadlines. Break annual goals into quarterly milestones and monthly check-ins. "Update all emergency procedures" becomes "Review fire evacuation plan by Jan 31, update medical emergency protocols by Feb 28, refresh lockdown procedures by March 31."

**Safety Culture Integration:** Your goals must reinforce a culture where safety is everyone's responsibility—not just the director's job, but woven into how every staff member thinks and acts daily.`
            },
            {
                section_number: 3,
                section_title: 'Comprehensive Facility Assessment Framework',
                section_content: `A thorough assessment is critical. This includes evaluating the Physical Environment (structure, lighting, equipment), Safety Systems (emergency gear, fire safety, first aid), and a deep review of Policies and Procedures for adequacy and consistent implementation.

**Physical Environment Assessment:**
Walk through every space as if seeing it for the first time. Check for trip hazards, loose fixtures, adequate lighting, proper temperature control, and clean, functional restrooms. Examine outdoor play areas for surface condition, equipment stability, and appropriate fall zones.

**Safety Systems Review:**
Test smoke detectors, fire extinguishers, AED functionality. Verify emergency contact information is current. Ensure all required safety equipment is accessible, properly maintained, and staff know how to use it.

**Policy & Procedure Audit:**
When did you last review your policies? Are they current with regulations? More importantly—are staff actually following them? The best policy on paper is worthless if it's not consistently implemented. This assessment helps you identify gaps between policy and practice.

**Staff Competency Assessment:**
Do all staff members know emergency procedures? Can they confidently handle a medical emergency? Have certifications expired? This assessment isn't about blaming—it's about identifying training needs before an emergency exposes them.`
            },
            {
                section_number: 4,
                section_title: 'Goal Implementation and Progress Tracking',
                section_content: `Break annual goals into manageable monthly objectives. Create accountability systems with regular progress reviews, and use transparent reporting systems to build confidence and engagement with your team and families.

**Monthly Objectives:** Don't let annual goals become abstract New Year's resolutions. Break them into 12 monthly milestones. If your annual goal is "implement comprehensive staff wellness program," January might focus on "survey staff needs," February on "select wellness initiatives," and so on.

**Accountability Systems:** Assign clear ownership. Who's responsible for each goal? How often will you check progress? What support do they need? Regular progress reviews (we recommend weekly 15-minute check-ins) keep goals alive and obstacles visible before they become crises.

**Transparent Reporting:** Share progress with your team. Celebrate wins publicly. When you fall short, discuss it openly—what can you learn? What needs to change? This transparency builds trust and collective ownership.

**Using Shield Ops to Track Progress:** This platform is your accountability partner. Log assessments, track training completion, monitor incident trends. Over time, you'll see patterns that inform smarter goal-setting and more effective interventions.`
            }
        ];
        
        for (const section of championSections) {
            await pool.query(`
                INSERT INTO training_champion_content 
                (module_id, section_number, section_title, section_content, weight_percentage)
                VALUES ($1, $2, $3, $4, 25)
            `, [moduleId, section.section_number, section.section_title, section.section_content]);
        }
        
        await pool.query(`
            INSERT INTO training_team_messages 
            (module_id, message_title, message_content, customization_tips, weight_percentage)
            VALUES ($1, $2, $3, $4, 20)
        `, [
            moduleId,
            'January: New Year Safety Goals Team Message',
            `Hey Team!

Welcome to January 2026! This month we're setting the foundation for an amazing year of safety excellence and creating systematic approaches to continuous safety improvement and professional development.

This Month's Focus: SMART SAFETY goal-setting, facility assessment, and creating systematic approaches to safety improvement.

What This Means for You:
- Participate actively in setting meaningful, achievable safety goals for our facility
- Contribute to comprehensive facility assessment with your observations and insights
- Embrace systematic approaches to safety improvement and professional development
- Celebrate progress milestones and achievements as we build excellence together
- Take ownership of facility safety goals and support team-wide success

Quick Reminder: Strong safety foundations built through systematic goal-setting create the framework for everything we'll achieve this year in child protection and facility excellence.

Let's make 2026 our best year yet! Your input and commitment make all the difference.`,
            'Replace [Team] with your team name. Adjust tone to match your facility culture. Consider adding a specific example of a safety goal your facility is pursuing this month.'
        ]);
        
        console.log('January content seeded successfully');
        
    } catch (error) {
        console.error('Error seeding January content:', error);
    }
}

module.exports = { seedJanuaryContent };

if (require.main === module) {
    seedJanuaryContent().then(() => process.exit(0)).catch(err => {
        console.error(err);
        process.exit(1);
    });
}
