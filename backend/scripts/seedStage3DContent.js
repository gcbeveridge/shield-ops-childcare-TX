const pool = require('../config/db');

async function seedJanuaryAuditQuestions() {
    try {
        const moduleResult = await pool.query(`
            SELECT id FROM training_modules_new WHERE month = 1 AND year = 2026
        `);
        
        if (moduleResult.rows.length === 0) {
            console.log('January module not found');
            return;
        }
        
        const moduleId = moduleResult.rows[0].id;
        
        const existingQuestions = await pool.query(
            'SELECT id FROM training_audit_questions WHERE module_id = $1 LIMIT 1',
            [moduleId]
        );
        
        if (existingQuestions.rows.length > 0) {
            console.log('January audit questions already exist, skipping...');
            return;
        }
        
        const questions = [
            {
                question_number: 1,
                question_text: 'Are emergency equipment and systems current, functional, and accessible with staff demonstrating familiarity and proper usage procedures?',
                question_category: 'Emergency Preparedness'
            },
            {
                question_number: 2,
                question_text: 'Is facility infrastructure (lighting, heating, structural elements) in good condition with maintenance schedules current and documented?',
                question_category: 'Physical Environment'
            },
            {
                question_number: 3,
                question_text: 'Are safety policies and procedures current, clearly understood by staff, and consistently implemented across all facility operations?',
                question_category: 'Policy & Procedures'
            },
            {
                question_number: 4,
                question_text: 'Is goal-setting documentation complete with clear objectives, timelines, and progress tracking systems established for the year?',
                question_category: 'Goal Planning'
            }
        ];
        
        for (const q of questions) {
            await pool.query(`
                INSERT INTO training_audit_questions 
                (module_id, question_number, question_text, question_category, weight_percentage)
                VALUES ($1, $2, $3, $4, 15)
            `, [moduleId, q.question_number, q.question_text, q.question_category]);
        }
        
        console.log('January audit questions seeded successfully');
        
    } catch (error) {
        console.error('Error seeding audit questions:', error);
    }
}

async function seedJanuarySafeGrowthContent() {
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
            'SELECT id FROM training_social_content WHERE module_id = $1 LIMIT 1',
            [moduleId]
        );
        
        if (existingContent.rows.length > 0) {
            console.log('January SafeGrowth content already exists, skipping...');
            return;
        }
        
        const weeks = [
            {
                week_number: 1,
                week_title: 'New Year Safety Commitment',
                week_theme: 'Goal announcement',
                visual_idea: '"2026 Safety Goals" - Visual presentation of facility safety commitments and objectives. Photo idea: Staff gathered around displayed goals poster or whiteboard showing annual safety targets.',
                sample_caption: 'Starting 2026 strong! 💪 Our team is committed to SMART SAFETY goal-setting: Specific safety improvements, Measurable outcomes, and Achievable targets that keep our children safe every single day. This month we\'re conducting comprehensive facility assessments and creating systematic approaches to continuous safety improvement. Safety isn\'t just a priority—it\'s who we are. #ChildCareSafety #SafetyGoals2026 #QualityChildCare #SafetyFirst #ChildCareExcellence #ProfessionalDevelopment',
                hashtags: '#ChildCareSafety #SafetyGoals2026 #QualityChildCare #SafetyFirst #ChildCareExcellence #ProfessionalDevelopment'
            },
            {
                week_number: 2,
                week_title: 'Comprehensive Assessment Process',
                week_theme: 'Behind-the-scenes assessment',
                visual_idea: '"Facility Assessment Excellence" - Staff conducting thorough safety assessments and equipment checks. Photo idea: Staff member with checklist inspecting emergency equipment, or team reviewing safety systems together.',
                sample_caption: 'Behind the scenes: Our comprehensive facility assessment in action! 🔍 We\'re evaluating our Physical Environment (structure, lighting, equipment), Safety Systems (emergency gear, fire safety, first aid), and Policies & Procedures for adequacy and consistent implementation. Systematic assessments help us identify opportunities for improvement BEFORE they become issues. That\'s proactive safety management! #SafetyAssessment #ChildCareSafety #ProactiveSafety #QualityStandards #ChildCareExcellence',
                hashtags: '#SafetyAssessment #ChildCareSafety #ProactiveSafety #QualityStandards #ChildCareExcellence'
            },
            {
                week_number: 3,
                week_title: 'Goal Progress and Team Engagement',
                week_theme: 'Team collaboration',
                visual_idea: '"Team Goal Achievement" - Staff working together on safety goal implementation and progress tracking. Photo idea: Team meeting discussing progress, or staff engaged in training related to January goals.',
                sample_caption: 'Week 3 progress check! 📊 Our entire team is engaged in safety goal implementation and progress tracking. From comprehensive facility assessments to staff competency development, we\'re building a culture where safety is everyone\'s responsibility—not just management\'s job, but woven into how every team member thinks and acts daily. Transparent reporting builds confidence with families and accountability within our team. #TeamWork #SafetyCulture #ChildCareSafety #StaffEngagement #ContinuousImprovement',
                hashtags: '#TeamWork #SafetyCulture #ChildCareSafety #StaffEngagement #ContinuousImprovement'
            },
            {
                week_number: 4,
                week_title: 'Foundation for Excellence',
                week_theme: 'Success showcase',
                visual_idea: '"Strong Safety Foundation" - Visual representation of systematic safety management and goal achievement. Photo idea: Completed assessment checklist, safety equipment properly organized, or team celebrating milestone completion.',
                sample_caption: 'January wrap-up: Foundation built! 🏆 Comprehensive facility assessment? ✓ SMART safety goals established? ✓ Team trained and engaged? ✓ Systematic approaches to safety improvement? ✓ This is how we create year-long safety achievement. When families choose us, they\'re choosing a facility where safety isn\'t reactive—it\'s systematic, measurable, and continuously improving. Here\'s to an incredible 2026! #SafetyExcellence #ChildCareSafety #QualityChildCare #ParentTrust #ChildCareLeadership #ProfessionalStandards',
                hashtags: '#SafetyExcellence #ChildCareSafety #QualityChildCare #ParentTrust #ChildCareLeadership #ProfessionalStandards'
            }
        ];
        
        for (const week of weeks) {
            await pool.query(`
                INSERT INTO training_social_content 
                (module_id, week_number, week_title, week_theme, visual_idea, sample_caption, hashtags, weight_percentage)
                VALUES ($1, $2, $3, $4, $5, $6, $7, 15)
            `, [moduleId, week.week_number, week.week_title, week.week_theme, week.visual_idea, week.sample_caption, week.hashtags]);
        }
        
        console.log('January SafeGrowth content seeded successfully');
        
    } catch (error) {
        console.error('Error seeding SafeGrowth content:', error);
    }
}

async function seedAll() {
    await seedJanuaryAuditQuestions();
    await seedJanuarySafeGrowthContent();
}

module.exports = { seedJanuaryAuditQuestions, seedJanuarySafeGrowthContent, seedAll };

if (require.main === module) {
    seedAll().then(() => process.exit(0)).catch(err => {
        console.error(err);
        process.exit(1);
    });
}
