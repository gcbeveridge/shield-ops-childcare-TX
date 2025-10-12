const Anthropic = require('@anthropic-ai/sdk');

// Reference: blueprint:javascript_anthropic
// Model: claude-sonnet-4-20250514 (latest)
const DEFAULT_MODEL = "claude-sonnet-4-20250514";

if (!process.env.ANTHROPIC_API_KEY) {
  console.warn('⚠️  ANTHROPIC_API_KEY not set - AI features will be disabled');
}

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

// Texas DFPS compliance knowledge base
const TEXAS_DFPS_KNOWLEDGE = `You are Shield AI, an expert Texas DFPS (Department of Family and Protective Services) child care compliance assistant.

Your role is to help child care facility directors, owners, and staff understand and comply with Texas child care regulations.

CORE KNOWLEDGE BASE:

1. STAFF REQUIREMENTS (Texas Minimum Standards §746.1301-746.1401):
   - Director qualifications: Must be 21+ with high school diploma/GED
   - Staff-to-child ratios vary by age group
   - Annual training: 24 hours minimum for directors, 24 hours for caregivers
   - CPR & First Aid: At least one staff member with current certification must be present at all times
   - Background checks: Required for all staff, valid 5 years
   - TB screening: Required within 7 days of hire

2. MEDICATION ADMINISTRATION (Texas §746.2655):
   - Written parent authorization required
   - Must be in original prescription container
   - Dual-staff verification required for administration
   - Documentation must include: child's name, medication name, dosage, time, administering staff signature
   - Medication must be stored out of children's reach

3. INCIDENT REPORTING (Texas §746.3701):
   - Report immediately to parents for: injuries requiring medical attention, illness requiring isolation, behavioral incidents
   - Document all incidents within 24 hours
   - Include: date, time, description, staff present, actions taken, parent notification
   - Serious incidents must be reported to DFPS within required timeframe

4. DAILY HEALTH & SAFETY (Texas §746.2301-746.2401):
   - Daily health checks required
   - Sick child exclusion policies must be followed
   - Hand washing requirements before meals and after diaper changes
   - Sleep supervision for infants (visual check every 15 minutes)

5. PHYSICAL ENVIRONMENT (Texas §746.3201-746.3401):
   - Indoor space: 35 square feet per child minimum
   - Outdoor space: 75 square feet per child
   - Safety inspections: fire marshal, health department
   - Emergency evacuation plans required
   - First aid supplies readily accessible

6. NUTRITION (Texas §746.2701):
   - Meals and snacks meeting USDA guidelines
   - Menus posted in advance
   - Accommodations for dietary restrictions/allergies
   - Safe food storage and preparation

7. DOCUMENTATION REQUIREMENTS:
   - Child enrollment records
   - Staff personnel files
   - Attendance records (daily)
   - Incident/accident reports
   - Medication logs
   - Fire drill logs (monthly)
   - Training records

8. INSPECTIONS:
   - Unannounced DFPS inspections
   - Minimum once per year
   - Violations categorized by severity (High, Medium-High, Medium, Medium-Low, Low)
   - Correction deadlines based on violation severity

INTERACTION STYLE:
- Be professional, clear, and supportive
- Cite specific Texas regulation numbers when applicable
- Provide actionable guidance
- Acknowledge when you're not certain and recommend contacting DFPS directly
- Use examples when helpful
- Be empathetic to the challenges of compliance

When answering questions:
1. Identify which compliance area the question relates to
2. Provide the specific Texas regulation reference
3. Explain the requirement clearly
4. Offer practical implementation advice
5. Note any deadlines or timeframes
6. Suggest related best practices when relevant`;

async function askComplianceQuestion(question, context = {}) {
  try {
    if (!process.env.ANTHROPIC_API_KEY) {
      throw new Error('Anthropic API key not configured');
    }

    const userMessage = context.facilityName 
      ? `Context: I work at ${context.facilityName}, a child care facility in Texas.\n\nQuestion: ${question}`
      : question;

    const response = await anthropic.messages.create({
      model: DEFAULT_MODEL,
      max_tokens: 2048,
      system: TEXAS_DFPS_KNOWLEDGE,
      messages: [
        { role: 'user', content: userMessage }
      ],
    });

    return {
      answer: response.content[0].text,
      model: DEFAULT_MODEL,
      usage: {
        inputTokens: response.usage.input_tokens,
        outputTokens: response.usage.output_tokens
      }
    };
  } catch (error) {
    console.error('AI Service Error:', error);
    throw new Error(`Failed to get AI response: ${error.message}`);
  }
}

async function analyzeIncidentCompliance(incident) {
  try {
    const prompt = `Analyze this incident report for Texas DFPS compliance:

Type: ${incident.type}
Severity: ${incident.severity}
Description: ${incident.description}
Location: ${incident.location || 'Not specified'}
Immediate Actions: ${incident.immediateActions || 'None documented'}
Parent Notified: ${incident.parentNotified ? 'Yes' : 'No'}

Questions:
1. Does this incident meet Texas reporting requirements?
2. What documentation is required?
3. Are there any compliance gaps?
4. What follow-up actions are recommended?`;

    const response = await anthropic.messages.create({
      model: DEFAULT_MODEL,
      max_tokens: 1500,
      system: TEXAS_DFPS_KNOWLEDGE,
      messages: [
        { role: 'user', content: prompt }
      ],
    });

    return {
      analysis: response.content[0].text,
      complianceScore: null // Could be enhanced with structured output
    };
  } catch (error) {
    console.error('Incident Analysis Error:', error);
    throw new Error(`Failed to analyze incident: ${error.message}`);
  }
}

async function suggestTrainingTopics(staffRole, completedModules = []) {
  try {
    const prompt = `I'm a ${staffRole} at a Texas child care facility. I've completed training on: ${completedModules.join(', ') || 'none yet'}.

Based on Texas DFPS requirements, what training topics should I prioritize next? Please suggest 3-5 specific topics with brief explanations of why they're important.`;

    const response = await anthropic.messages.create({
      model: DEFAULT_MODEL,
      max_tokens: 1024,
      system: TEXAS_DFPS_KNOWLEDGE,
      messages: [
        { role: 'user', content: prompt }
      ],
    });

    return {
      suggestions: response.content[0].text
    };
  } catch (error) {
    console.error('Training Suggestions Error:', error);
    throw new Error(`Failed to suggest training: ${error.message}`);
  }
}

module.exports = {
  askComplianceQuestion,
  analyzeIncidentCompliance,
  suggestTrainingTopics
};
