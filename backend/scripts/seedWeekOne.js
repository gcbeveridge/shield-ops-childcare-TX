require('dotenv').config();
const { Pool } = require('pg');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
});

const weekOneContent = [
  {
    day_number: 2,
    title: "Emergency Exits & Evacuation Routes",
    duration_minutes: 7,
    champion_approach: "Good morning! How was Day One - information overload, right? Today we're going to make sure the emergency stuff is solid. Let's do a quick walk-through.",
    activities_json: {
      spot_check_activities: [
        {
          name: "Pop Quiz Walk",
          description: "Walk to 3 different locations in the facility. At each location, ask: 'Fire alarm goes off right now - which way do you go?' New hire must identify correct exit AND alternate route."
        },
        {
          name: "Meeting Point Verification",
          description: "'Okay, we're outside. Where's our meeting spot?' New hire points out exact location. 'How do you account for all the kids?' Answer should include: count heads, match to attendance list, report to director."
        },
        {
          name: "When NOT to Evacuate",
          description: "'Tornado warning - do we go outside?' Answer: No! Interior shelter location. Have them show you the shelter spot."
        }
      ],
      quick_verification_questions: [
        {
          q: "The Blue Room exit is blocked by smoke. What do you do?",
          correct_answer: "Use alternate exit, count heads at meeting point"
        },
        {
          q: "You evacuate with 8 kids but your attendance shows 9. What's your next step?",
          correct_answer: "Report missing child immediately, initiate missing child protocol"
        },
        {
          q: "Parents are arriving during an evacuation. Can they take their kids from the meeting point?",
          correct_answer: "No - headcount/accountability first, then organized reunification"
        }
      ]
    },
    signoff_criteria: [
      "Can identify exits from any room",
      "Knows alternate routes if primary is blocked",
      "Understands meeting point and accountability",
      "Distinguishes between evacuation and shelter-in-place"
    ],
    champion_signoff_criteria: [
      "Can identify exits from any room",
      "Knows alternate routes if primary is blocked",
      "Understands meeting point and accountability",
      "Distinguishes between evacuation and shelter-in-place"
    ]
  },
  {
    day_number: 3,
    title: "Handwashing & Hygiene Spot Checks",
    duration_minutes: 5,
    champion_approach: "Hey! Let's talk clean hands. Sounds boring, but it's the #1 way we prevent illness outbreaks. I'm going to watch you do it, and then we'll talk about when.",
    activities_json: {
      spot_check_activities: [
        {
          name: "Live Handwashing Demo",
          description: "New hire washes hands while you observe. Check: 20 seconds minimum, between fingers, under nails, proper drying, turn off faucet with towel."
        },
        {
          name: "When Do You Wash?",
          description: "Rapid-fire scenarios: 'You just wiped a runny nose - wash?' (YES). 'You're about to serve snack - wash?' (YES). 'You just came inside from playground - wash?' (YES). 'Child used bathroom - you help them wash, then what?' (YOU wash too!)."
        }
      ],
      quick_verification_questions: [
        {
          q: "You put on gloves to clean up a small amount of blood. After you dispose of the gloves, what do you do?",
          correct_answer: "Wash hands - gloves don't replace handwashing"
        },
        {
          q: "A child sneezes directly into your face. What's your first step?",
          correct_answer: "Wash face and hands immediately, then continue supervision"
        }
      ]
    },
    signoff_criteria: [
      "Demonstrates proper handwashing technique",
      "Knows when handwashing is required",
      "Understands gloves don't replace handwashing"
    ],
    champion_signoff_criteria: [
      "Demonstrates proper handwashing technique",
      "Knows when handwashing is required",
      "Understands gloves don't replace handwashing"
    ]
  },
  {
    day_number: 4,
    title: "Supervision & Ratios",
    duration_minutes: 6,
    champion_approach: "Today's all about eyes on kids. Active supervision isn't just 'being in the room' - it's strategic positioning and constant awareness. Let me show you what I mean.",
    activities_json: {
      spot_check_activities: [
        {
          name: "Positioning Exercise",
          description: "Stand in a spot where you can't see all children. Ask: 'Can you supervise from here?' (NO). Move to better position. Ask: 'Why is this spot better?' (Can see all children, scan room, positioned near highest-risk activity)."
        },
        {
          name: "Ratio Reality Check",
          description: "Count current children in the room. Identify ratio. 'If one more child arrives, are we still good?' Do the math together. 'What do you do if we exceed ratio?' (Get another staff member IMMEDIATELY)."
        },
        {
          name: "Bathroom Break Scenario",
          description: "'You really need to use the bathroom. There are 12 kids in the room and you're the only staff. What do you do?' Correct answer: Get another staff to cover FIRST, then go. Never leave children alone."
        }
      ],
      quick_verification_questions: [
        {
          q: "You're supervising outdoor play. Where should you position yourself?",
          correct_answer: "Where you can see all children, near highest-risk equipment, scanning constantly"
        },
        {
          q: "You're talking to a parent at pickup. The other 14 children are in the room behind you. Is this okay?",
          correct_answer: "No - position yourself where you can see children while talking to parent, or get another staff to supervise"
        }
      ]
    },
    signoff_criteria: [
      "Understands active supervision principles",
      "Knows facility ratios",
      "Positions themselves to see all children",
      "Knows to never leave children unsupervised"
    ],
    champion_signoff_criteria: [
      "Understands active supervision principles",
      "Knows facility ratios",
      "Positions themselves to see all children",
      "Knows to never leave children unsupervised"
    ]
  },
  {
    day_number: 5,
    title: "Positive Behavior Guidance in Action",
    duration_minutes: 8,
    champion_approach: "You've seen some challenging behavior this week, right? Let's talk through what you saw and practice responding effectively. Remember - we teach, we don't punish.",
    activities_json: {
      spot_check_activities: [
        {
          name: "Real Scenario Debrief",
          description: "Ask about a challenging behavior situation they witnessed this week. Walk through what happened. 'What did the staff member do?' 'Why do you think that worked (or didn't work)?' 'What would you have done?'"
        },
        {
          name: "Role Play: Fighting Over Toy",
          description: "Set up scenario: Two kids are pulling on the same toy, both crying. 'Show me what you'd do.' Look for: staying calm, getting to their level, acknowledging feelings, problem-solving WITH the kids."
        },
        {
          name: "Never Allowed Review",
          description: "Quick quiz: 'Can you ever yell at a child?' (NO). 'Can you make a child sit in timeout for 10 minutes?' (NO - time-in, not time-out). 'Can you withhold snack as punishment?' (NEVER)."
        }
      ],
      quick_verification_questions: [
        {
          q: "A child throws a block at another child. It doesn't hit anyone. What do you do?",
          correct_answer: "Stay calm, ensure safety, acknowledge feelings, set clear limit ('I can't let you throw blocks - that can hurt'), teach alternative ('When you're frustrated, use your words or ask for help'), follow up when calm"
        },
        {
          q: "What's the difference between timeout and time-in?",
          correct_answer: "Time-in: adult stays with child, helps them calm down, teaches coping skills. Time-out: child isolated alone (not allowed in Texas childcare)."
        }
      ]
    },
    signoff_criteria: [
      "Can describe positive guidance approach",
      "Knows prohibited discipline methods",
      "Stays calm during challenging behavior",
      "Teaches alternatives rather than just saying 'no'"
    ],
    champion_signoff_criteria: [
      "Can describe positive guidance approach",
      "Knows prohibited discipline methods",
      "Stays calm during challenging behavior",
      "Teaches alternatives rather than just saying 'no'"
    ]
  },
  {
    day_number: 6,
    title: "Medication & Allergy Awareness",
    duration_minutes: 7,
    champion_approach: "Let's talk about medication. This is serious stuff - one mistake could be life-threatening. I'm going to walk you through our exact process.",
    activities_json: {
      spot_check_activities: [
        {
          name: "Medication Location Tour",
          description: "Show where medications are stored. Point out: locked storage, refrigerated medications (if any), emergency medications (EpiPens, inhalers). 'Why is this locked?' (Prevent children from accessing). 'Why refrigerate?' (Some medications require it)."
        },
        {
          name: "Five Rights Check",
          description: "Pick up a sample medication (can be empty container). Walk through: 'Right child - how do you verify?' (Check name on bottle, ask child's name, verify with another staff). Continue through all 5 Rights. Emphasize: NEVER skip this, NEVER rush."
        },
        {
          name: "Allergy List Review",
          description: "Pull out allergy list. 'Name every child with a severe allergy in your group.' 'Where are their emergency medications?' 'What are the signs of a severe allergic reaction?' 'What do you do FIRST if you suspect allergic reaction?' (Call 911)."
        }
      ],
      quick_verification_questions: [
        {
          q: "You're about to give Zoe her allergy medication. Another child is crying and needs attention. What do you do?",
          correct_answer: "Get another staff member to comfort the crying child. NEVER rush medication administration. Complete all 5 Rights checks first."
        },
        {
          q: "After giving medication, when do you log it?",
          correct_answer: "Immediately after administration, while details are fresh. Include: child name, medication, dose, time, your signature, second staff signature."
        },
        {
          q: "A child at lunch says their mouth feels 'weird' and 'itchy' after eating. What do you do?",
          correct_answer: "Call 911 immediately (possible allergic reaction), get emergency medication if prescribed, call parent, stay with child and monitor breathing."
        }
      ]
    },
    signoff_criteria: [
      "Knows medication storage location",
      "Can recite 5 Rights of medication administration",
      "Knows which children have severe allergies",
      "Knows emergency medication locations",
      "Understands to call 911 first for severe reactions"
    ],
    champion_signoff_criteria: [
      "Knows medication storage location",
      "Can recite 5 Rights of medication administration",
      "Knows which children have severe allergies",
      "Knows emergency medication locations",
      "Understands to call 911 first for severe reactions"
    ]
  },
  {
    day_number: 7,
    title: "Week One Completion & Certification",
    duration_minutes: 10,
    champion_approach: "You made it through Week One! Seriously, this is huge. You've learned SO MUCH in just 7 days. Let's do a final check to make sure you're ready to work independently with senior staff supervision. Then we'll celebrate - you've earned it!",
    activities_json: {
      spot_check_activities: [
        {
          name: "Walk-Through Assessment",
          description: "Walk through facility together. At random spots, rapid-fire ask: 'Nearest exit?' 'First aid kit?' 'Fire extinguisher?' 'Tornado shelter?' New hire should answer quickly and accurately."
        },
        {
          name: "Scenario Lightning Round",
          description: "Rapid-fire scenarios (pick 5-7): 1) Fire alarm sounds. 2) Child vomits. 3) You need bathroom break. 4) Unauthorized person tries to pick up child. 5) Child has severe nosebleed. 6) You're alone and ratio is about to be exceeded. 7) Child discloses possible abuse. New hire responds to each. Assess: speed, accuracy, confidence."
        },
        {
          name: "Confidence Check",
          description: "Ask: 'On a scale of 1-10, how confident do you feel?' (Anything above 5 is normal for Week One!). 'What are you MOST comfortable with?' 'What do you still feel unsure about?' Address concerns. Reassure: asking questions is ALWAYS okay."
        },
        {
          name: "Strengths Recognition",
          description: "Share specific observations: 'I noticed you [specific positive behavior]. That was great because [reason].' Give at least 3 genuine, specific compliments. Build confidence."
        }
      ],
      quick_verification_questions: [
        {
          q: "Quick - name the 3 parts of the OUT model.",
          correct_answer: "Get OUT, Lock OUT, Take OUT"
        },
        {
          q: "What's the single most important thing you learned this week?",
          correct_answer: "Any reasonable answer that shows engagement and learning"
        }
      ]
    },
    signoff_criteria: [
      "Demonstrates competency in all required areas",
      "Ready for independent work with senior staff supervision",
      "Understands when to ask for help",
      "Displays positive attitude and willingness to learn",
      "Follows facility policies consistently"
    ],
    champion_signoff_criteria: [
      "Demonstrates competency in all required areas",
      "Ready for independent work with senior staff supervision",
      "Understands when to ask for help",
      "Displays positive attitude and willingness to learn",
      "Follows facility policies consistently"
    ]
  }
];

async function seedWeekOne() {
  const client = await pool.connect();
  
  try {
    console.log('🌱 Starting Week One content seeding...');
    
    // Check if content already exists
    const checkQuery = 'SELECT COUNT(*) FROM week_one_checkins_content';
    const checkResult = await client.query(checkQuery);
    const existingCount = parseInt(checkResult.rows[0].count);
    
    if (existingCount > 0) {
      console.log(`⚠️  Found ${existingCount} existing Week One records. Clearing table...`);
      await client.query('DELETE FROM week_one_checkins_content');
    }
    
    // Insert each day
    for (const day of weekOneContent) {
      const query = `
        INSERT INTO week_one_checkins_content (
          day_number,
          title,
          duration_minutes,
          champion_approach,
          activities_json,
          signoff_criteria,
          champion_signoff_criteria
        ) VALUES ($1, $2, $3, $4, $5, $6, $7)
      `;
      
      await client.query(query, [
        day.day_number,
        day.title,
        day.duration_minutes,
        day.champion_approach,
        JSON.stringify(day.activities_json),
        JSON.stringify(day.signoff_criteria),
        JSON.stringify(day.champion_signoff_criteria)
      ]);
      
      console.log(`✅ Inserted Day ${day.day_number}: ${day.title}`);
    }
    
    console.log(`\n🎉 Successfully seeded ${weekOneContent.length} Week One days!`);
    
  } catch (error) {
    console.error('❌ Error seeding Week One content:', error);
    throw error;
  } finally {
    client.release();
  }
}

// Run if called directly
if (require.main === module) {
  seedWeekOne()
    .then(() => {
      console.log('✅ Week One seeding complete!');
      process.exit(0);
    })
    .catch(err => {
      console.error('❌ Week One seeding failed:', err);
      process.exit(1);
    });
}

module.exports = seedWeekOne;
