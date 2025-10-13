const Anthropic = require('@anthropic-ai/sdk');
const supabase = require('../config/supabase');

// Reference: blueprint:javascript_anthropic
// Model: claude-sonnet-4-20250514 (latest)
const DEFAULT_MODEL = "claude-sonnet-4-20250514";

if (!process.env.ANTHROPIC_API_KEY) {
  console.warn('⚠️  ANTHROPIC_API_KEY not set - AI features will be disabled');
}

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

// Helper function to search for relevant regulations in Supabase
async function getRelevantRegulations(query) {
  try {
    // Search for regulations matching the query
    // Sanitize query to prevent breaking the filter
    const sanitizedQuery = query.replace(/[,]/g, ' ').substring(0, 100);
    
    // Build search query - search in title, full_text, and category
    const { data, error } = await supabase
      .from('regulation_sections')
      .select('*')
      .eq('state_code', 'TX')
      .or(`title.ilike.%${sanitizedQuery}%,full_text.ilike.%${sanitizedQuery}%,category.ilike.%${sanitizedQuery}%`)
      .limit(10);
    
    if (error) {
      console.error('Regulation search error:', error);
      return [];
    }
    
    return data || [];
  } catch (error) {
    console.error('Error fetching regulations:', error);
    return [];
  }
}

// Fallback knowledge base (in case Supabase query fails)
const FALLBACK_KNOWLEDGE = `You are Shield AI, an expert Texas DFPS (Department of Family and Protective Services) child care compliance assistant.

Your role is to help child care facility directors, owners, and staff understand and comply with Texas child care regulations.

INTERACTION STYLE:
- Be professional, clear, and supportive
- Cite specific Texas regulation numbers when applicable
- Provide actionable guidance
- Acknowledge when you're not certain and recommend contacting DFPS directly
- Use examples when helpful
- Be empathetic to the challenges of compliance`;

async function askComplianceQuestion(question, context = {}) {
  try {
    if (!process.env.ANTHROPIC_API_KEY) {
      throw new Error('Anthropic API key not configured');
    }

    // Search Supabase for relevant regulations
    const regulations = await getRelevantRegulations(question);
    
    let systemPrompt;
    let sources = [];
    
    if (regulations && regulations.length > 0) {
      // Build context from database results
      const regulationContext = regulations.map(reg => 
        `${reg.code_section} - ${reg.title}\n${reg.full_text}`
      ).join('\n\n---\n\n');
      
      sources = regulations.map(r => ({ 
        code: r.code_section, 
        title: r.title,
        category: r.category
      }));
      
      systemPrompt = `You are Shield AI, an expert Texas DFPS (Department of Family and Protective Services) child care compliance assistant.

Here are the relevant Texas regulations for this question:

${regulationContext}

Based on these regulations, provide a comprehensive answer that includes:
1. The relevant Texas regulations with specific code citations (use the exact codes provided above)
2. Plain English explanation
3. Practical guidance for implementation
4. Any required actions or next steps

INTERACTION STYLE:
- Be professional, clear, and supportive
- Cite specific Texas regulation codes from the regulations provided above
- Provide actionable guidance
- Use examples when helpful
- Be empathetic to the challenges of compliance`;
    } else {
      // Fall back to basic knowledge if no regulations found
      systemPrompt = FALLBACK_KNOWLEDGE;
    }

    const userMessage = context.facilityName 
      ? `Context: I work at ${context.facilityName}, a child care facility in Texas.\n\nQuestion: ${question}`
      : question;

    const response = await anthropic.messages.create({
      model: DEFAULT_MODEL,
      max_tokens: 2048,
      system: systemPrompt,
      messages: [
        { role: 'user', content: userMessage }
      ],
    });

    return {
      answer: response.content[0].text,
      sources: sources,
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
    // Search for incident-related regulations
    const regulations = await getRelevantRegulations(`incident reporting ${incident.type}`);
    
    let regulationContext = '';
    let sources = [];
    
    if (regulations && regulations.length > 0) {
      regulationContext = '\n\nRelevant Texas Regulations:\n\n' + 
        regulations.map(reg => 
          `${reg.code_section} - ${reg.title}\n${reg.summary || reg.full_text.substring(0, 300)}`
        ).join('\n\n---\n\n');
        
      sources = regulations.map(r => ({ 
        code: r.code_section, 
        title: r.title 
      }));
    }
    
    const systemPrompt = FALLBACK_KNOWLEDGE + regulationContext;
    
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
      system: systemPrompt,
      messages: [
        { role: 'user', content: prompt }
      ],
    });

    return {
      analysis: response.content[0].text,
      sources: sources,
      complianceScore: null
    };
  } catch (error) {
    console.error('Incident Analysis Error:', error);
    throw new Error(`Failed to analyze incident: ${error.message}`);
  }
}

async function suggestTrainingTopics(staffRole, completedModules = []) {
  try {
    // Search for training-related regulations
    const regulations = await getRelevantRegulations('staff training requirements');
    
    let regulationContext = '';
    let sources = [];
    
    if (regulations && regulations.length > 0) {
      regulationContext = '\n\nRelevant Texas Training Regulations:\n\n' +
        regulations.map(reg => 
          `${reg.code_section} - ${reg.title}\n${reg.summary || reg.full_text.substring(0, 200)}`
        ).join('\n\n');
        
      sources = regulations.map(r => ({ 
        code: r.code_section, 
        title: r.title 
      }));
    }
    
    const systemPrompt = FALLBACK_KNOWLEDGE + regulationContext;
    
    const prompt = `I'm a ${staffRole} at a Texas child care facility. I've completed training on: ${completedModules.join(', ') || 'none yet'}.

Based on Texas DFPS requirements, what training topics should I prioritize next? Please suggest 3-5 specific topics with brief explanations of why they're important.`;

    const response = await anthropic.messages.create({
      model: DEFAULT_MODEL,
      max_tokens: 1024,
      system: systemPrompt,
      messages: [
        { role: 'user', content: prompt }
      ],
    });

    return {
      suggestions: response.content[0].text,
      sources: sources
    };
  } catch (error) {
    console.error('Training Suggestions Error:', error);
    throw new Error(`Failed to suggest training: ${error.message}`);
  }
}

module.exports = {
  askComplianceQuestion,
  analyzeIncidentCompliance,
  suggestTrainingTopics,
  getRelevantRegulations
};
