require('dotenv').config();
const { Pool } = require('pg');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
});

const dayOneContent = [
  {
    section_order: 1,
    section_title: "Welcome & Facility Tour",
    section_duration_minutes: 15,
    champion_script: "Welcome to [Facility Name]! We're so glad you're here. Today is all about keeping our kids safe and helping you feel confident on Day One. We're going to cover the must-knows, show you around, and make sure you know exactly what to do in any situation. Ready? Let's go!",
    texas_statute_reference: "§744.1303",
    content_json: {
      preparation_checklist: [
        "Orientation checklist (digital or printed)",
        "Emergency evacuation map",
        "Fire extinguisher locations marked",
        "First aid kit stocked and accessible",
        "Emergency contact phone list",
        "Facility policies handbook",
        "Child release authorization list",
        "Allergy list for current children",
        "Medication administration logs (if applicable)"
      ],
      tour_items: [
        { item: "Emergency exits", detail: "Point out ALL exits, including alternate routes" },
        { item: "Fire extinguisher locations", detail: "Show how to use: PASS method" },
        { item: "First aid kit", detail: "Location and contents" },
        { item: "Emergency phone", detail: "Landline location if available" },
        { item: "Severe weather shelter", detail: "Tornado safe room/interior hallway" },
        { item: "Outdoor play areas", detail: "Boundaries, hazards, sight lines" },
        { item: "Bathrooms", detail: "Child and adult" },
        { item: "Kitchen/food prep area", detail: "If applicable" },
        { item: "Medication storage", detail: "Locked, refrigerated if needed" },
        { item: "Sign-in/out area", detail: "Parent pickup procedures" },
        { item: "Staff break room", detail: "Personal belongings storage" },
        { item: "Lost and found", detail: "Location" }
      ]
    },
    verification_questions: [
      {
        question: "Can you point out the nearest exit from where we're standing right now?",
        acceptable_answer: "New hire identifies correct emergency exit",
        signoff_criteria: "Champion confirms: New hire can identify emergency exits"
      }
    ]
  },
  {
    section_order: 2,
    section_title: "Emergency Protocols - PRIORITY",
    section_duration_minutes: 25,
    champion_script: "Safety is our #1 job. These protocols could save a life, so let's make sure you've got them down solid. We use the OUT model for active threats, but let's start with the most common emergencies first.",
    texas_statute_reference: "§744.1303",
    content_json: {
      fire_evacuation: {
        protocol_steps: [
          "Sound the alarm - Pull nearest fire alarm",
          "Get kids out FAST - Don't stop for belongings",
          "Use nearest safe exit - If blocked, use alternate route",
          "Meeting point - [Specify location: e.g., 'Parking lot light post']",
          "Count heads - Account for every child",
          "Call 911 - Once everyone is safe outside",
          "DON'T go back inside - Wait for fire department all-clear"
        ],
        practice_items: [
          "Walk the evacuation route RIGHT NOW",
          "Show alternate routes",
          "Point out meeting spot"
        ]
      },
      severe_weather: {
        protocol_steps: [
          "Move to shelter area - [Specify location: e.g., 'Interior hallway, away from windows']",
          "Get children low - Sit against interior wall, heads down",
          "Cover heads - Use hands, blankets, anything available",
          "Count heads - Account for every child",
          "Stay put - Until all-clear is given",
          "No cell phones during - May attract lightning (if thunderstorm)"
        ],
        avoid_locations: [
          "Near windows",
          "Large open rooms",
          "Gymnasiums/cafeterias with wide spans",
          "Outdoor areas"
        ]
      },
      medical_emergency: {
        protocol_steps: [
          "Stay calm - Children watch your reaction",
          "Assess the situation - Is child breathing? Conscious? Bleeding?",
          "Call for help - Get another staff member IMMEDIATELY",
          "Don't move child - Unless in immediate danger",
          "Get first aid kit - Apply appropriate first aid",
          "Call 911 if needed",
          "Call parent - As soon as emergency is stabilized",
          "Document everything - Incident report required"
        ],
        call_911_if: [
          "Child is unconscious",
          "Difficulty breathing",
          "Heavy bleeding",
          "Head injury",
          "Suspected broken bone",
          "Allergic reaction signs",
          "Seizure lasting >5 minutes"
        ]
      },
      allergic_reaction: {
        critical_note: "Some children have life-threatening allergies!",
        severe_reaction_signs: [
          "Difficulty breathing / wheezing",
          "Swelling of face, lips, tongue",
          "Hives or rash spreading rapidly",
          "Vomiting or diarrhea",
          "Dizziness or fainting",
          "Feeling of 'impending doom'"
        ],
        protocol_steps: [
          "Call 911 IMMEDIATELY - Don't wait to see if it gets worse",
          "Get EpiPen - [Specify location of emergency medications]",
          "Administer if trained - Follow EpiPen instructions",
          "Call parent - While waiting for ambulance",
          "Stay with child - Monitor breathing constantly",
          "Have second staff member meet ambulance - Direct them to child"
        ]
      },
      active_threat_out_model: {
        description: "If there's ever an active threat - a dangerous person with a weapon, or someone trying to hurt people - we use the OUT model.",
        get_out: {
          title: "GET OUT",
          steps: [
            "If safe exit is available, RUN with children",
            "Leave belongings behind",
            "Don't wait for others if they won't come",
            "Call 911 once safe"
          ]
        },
        lock_out: {
          title: "LOCK OUT (If you can't get out)",
          steps: [
            "Lock classroom door",
            "Barricade door with furniture",
            "Turn off lights",
            "Get children away from door and windows",
            "Keep children QUIET and LOW",
            "Silence all phones",
            "DO NOT open door for anyone (police will have keys)"
          ]
        },
        take_out: {
          title: "TAKE OUT (Last resort only)",
          steps: [
            "If attacker enters your room",
            "Throw anything you can - books, chairs, toys",
            "Be loud, be aggressive, fight for your life and the children's lives",
            "Aim for eyes, throat, groin"
          ]
        }
      },
      missing_child: {
        protocol_steps: [
          "Don't panic - They're usually hiding or in bathroom",
          "Quick search - Check bathrooms, closets, under tables (2 minutes)",
          "Alert all staff - 'Code Yellow - [child name]'",
          "Assign search zones - Each staff searches assigned area",
          "Lock all exits - No one leaves building",
          "Check sign-out sheet - Verify parent didn't pick up",
          "Call police if not found in 5 minutes - Don't wait longer",
          "Call parent - After police are notified"
        ]
      }
    },
    verification_questions: [
      {
        question: "If you smell smoke in the Blue Room, which exit do you use and where do you take the children?",
        acceptable_answer: "Primary exit and alternate route identified, meeting point specified",
        signoff_criteria: "Champion confirms: New hire knows primary AND alternate evacuation routes"
      },
      {
        question: "The weather radio just announced a tornado warning. What do you do right now?",
        acceptable_answer: "Move to interior shelter location, get children low with heads covered",
        signoff_criteria: "Champion confirms: New hire knows shelter location and procedure"
      },
      {
        question: "A child falls and hits their head on the playground. They're crying but conscious. Walk me through what you do.",
        acceptable_answer: "Stay calm, assess, call for help, don't move child, get first aid kit, call 911 if serious, call parent, document",
        signoff_criteria: "Champion confirms: New hire knows when to call 911 and basic response steps"
      },
      {
        question: "Which children in our current enrollment have severe allergies, and where is their emergency medication?",
        acceptable_answer: "Names allergic children and correctly identifies medication storage location",
        signoff_criteria: "Champion confirms: New hire knows allergy children and medication locations"
      },
      {
        question: "You hear gunshots in the building. Your classroom door doesn't have a clear path to an exit. What do you do?",
        acceptable_answer: "Lock OUT - lock door, barricade, lights off, children quiet and low, don't open for anyone",
        signoff_criteria: "Champion confirms: New hire understands OUT model and lockdown procedures"
      },
      {
        question: "You count 12 children but should have 13. Marcus is missing. What are your first three steps?",
        acceptable_answer: "Quick search (2 min), alert all staff (Code Yellow), assign search zones",
        signoff_criteria: "Champion confirms: New hire knows immediate response for missing child"
      }
    ]
  },
  {
    section_order: 3,
    section_title: "Child Safety Essentials",
    section_duration_minutes: 20,
    champion_script: "Emergency protocols are for the rare scary stuff. But these daily safety practices? These are what keep kids safe every single day. This is 99% of your job.",
    texas_statute_reference: "§744.1203, §744.2101",
    content_json: {
      active_supervision: {
        what_it_means: [
          "Eyes on children AT ALL TIMES",
          "Scan the room every 30 seconds",
          "Position yourself to see all children",
          "Be within arm's reach of water/climbing activities",
          "Interact and engage (not just watching)"
        ],
        what_it_is_not: [
          "Sitting at a desk on your phone",
          "Talking to other adults with back to children",
          "'Watching' from another room",
          "Being distracted by paperwork"
        ],
        champion_tip: "Think of it like this: If a child falls, could you catch them? If not, you're too far away."
      },
      ratios: {
        texas_requirements: {
          "5_years_and_older": "15 children to 1 caregiver",
          "school_age_programs": "May vary by license"
        },
        rules: [
          "Ratios must be maintained AT ALL TIMES",
          "Count includes all children present (even if just arriving/leaving)",
          "If ratio is exceeded, immediately get another staff member"
        ]
      },
      child_release_procedures: {
        critical_rule: "Only release children to authorized adults!",
        protocol_steps: [
          "Check authorization list - Every single time",
          "See photo ID - Even if you 'know' them",
          "Match name on ID to authorization list - Must be exact match",
          "Sign child out - Date, time, name of person picking up"
        ],
        if_not_authorized: [
          "Politely say: 'I need to call the parent to get authorization'",
          "Call parent to verify",
          "Get verbal authorization",
          "Add to authorization list immediately",
          "Still require ID"
        ],
        never_release_to: [
          "Unauthorized person (even grandma if not on list)",
          "Anyone who appears intoxicated or impaired",
          "Anyone without ID",
          "Minor (under 18 unless authorized parent)"
        ],
        if_impaired: [
          "Politely delay: 'Let me get [child's] artwork/backpack'",
          "Get director/manager immediately",
          "Offer to call someone else on authorization list",
          "If they insist on taking child, call police non-emergency line",
          "Document everything"
        ]
      },
      hazard_identification: {
        scan_before_children_enter: [
          "Choking hazards (small toys, coins, food)",
          "Sharp objects (scissors, staples, broken toys)",
          "Toxic substances (cleaning supplies, medications, plants)",
          "Electrical hazards (exposed outlets, frayed cords)",
          "Trip hazards (toys on floor, loose rugs)",
          "Doors/gates (should be closed/locked as required)",
          "Water hazards (buckets, sinks, pools)"
        ],
        daily_safety_check: [
          "Morning: Walk through all areas before children arrive",
          "Throughout day: Continuous scanning",
          "Report ANY hazards immediately to director"
        ]
      }
    },
    verification_questions: [
      {
        question: "You need to use the bathroom. What do you do?",
        acceptable_answer: "Get another staff member to cover BEFORE leaving. Never leave children unsupervised.",
        signoff_criteria: "Champion confirms: New hire understands active supervision"
      },
      {
        question: "You have 14 five-year-olds in your group. Another child arrives for drop-off, making 15. Can you still supervise alone?",
        acceptable_answer: "Yes, 15:1 is the limit. At 16 children, need a second staff member.",
        signoff_criteria: "Champion confirms: New hire knows facility ratios"
      },
      {
        question: "A grandmother you've never met arrives to pick up Sophia. She knows Sophia's full name and says she's on the list. What do you do?",
        acceptable_answer: "Check authorization list, see her ID, verify name matches list exactly, then sign out.",
        signoff_criteria: "Champion confirms: New hire understands release procedures"
      },
      {
        question: "You notice a power cord is frayed on the floor lamp. What do you do?",
        acceptable_answer: "Remove lamp from use immediately, report to director, put 'DO NOT USE' sign on it.",
        signoff_criteria: "Champion confirms: New hire knows to identify and report hazards"
      }
    ]
  },
  {
    section_order: 4,
    section_title: "Health & Safety Basics",
    section_duration_minutes: 15,
    champion_script: "I know, handwashing seems basic. But it's literally the single most important thing we do to prevent illness. Let's make sure you've got it perfect.",
    texas_statute_reference: "§744.2575",
    content_json: {
      handwashing: {
        when_required: [
          "Arriving at work",
          "Before preparing/serving food",
          "Before and after eating",
          "After bathroom use (yours or helping child)",
          "After diaper changing",
          "After contact with bodily fluids (blood, vomit, runny nose)",
          "After outdoor play",
          "After handling garbage",
          "Before and after administering medication",
          "After glove use"
        ],
        proper_technique: [
          "Wet hands with clean running water",
          "Apply soap",
          "Lather for AT LEAST 20 seconds (sing 'Happy Birthday' twice)",
          "Get between fingers, under nails, backs of hands",
          "Rinse thoroughly",
          "Dry with paper towel or clean cloth",
          "Turn off faucet with paper towel (don't recontaminate!)"
        ],
        practice_note: "Have new hire demonstrate proper handwashing RIGHT NOW"
      },
      glove_requirements: {
        must_wear_when: [
          "Contact with blood or bodily fluids containing blood",
          "Cleaning up vomit or diarrhea",
          "Treating wounds (even small cuts)",
          "Diaper changing (if applicable to your program)"
        ],
        proper_use: [
          "Put on clean gloves",
          "Perform task",
          "Remove carefully (don't touch outside of glove)",
          "Dispose in trash immediately",
          "WASH HANDS - Gloves don't replace handwashing!"
        ]
      },
      recognizing_illness: {
        send_home_if: [
          "Fever of 100°F or higher",
          "Vomiting (even once)",
          "Diarrhea (2+ watery stools)",
          "Pink/red eyes with discharge (possible pink eye)",
          "Rash with fever",
          "Difficulty breathing",
          "Child too ill to participate comfortably",
          "Uncontrolled runny nose (green/yellow discharge)"
        ],
        response_steps: [
          "Separate child to quiet area (but maintain supervision!)",
          "Call parent immediately",
          "Keep child comfortable",
          "Document symptoms",
          "Sanitize area after child leaves"
        ],
        texas_exclusion_policy: "Children with contagious conditions must be excluded until no longer contagious."
      },
      medication_administration: {
        basic_rules: [
          "NEVER give medication without parent authorization form",
          "NEVER give medication without prescription label (if prescription)",
          "Check '5 Rights' EVERY TIME",
          "Two staff must verify and sign (Texas dual verification requirement!)",
          "Log it immediately after giving",
          "Store all medications locked",
          "Refrigerate if required"
        ],
        five_rights: [
          "Right child",
          "Right medication",
          "Right dose",
          "Right time",
          "Right route (mouth, nose, etc.)"
        ],
        emergency_medications_note: "These are for IMMEDIATE use in emergencies. Still follow dual verification when possible."
      }
    },
    verification_questions: [
      {
        question: "Demonstrate proper handwashing technique.",
        acceptable_answer: "Wet, soap, lather 20+ seconds (between fingers, under nails), rinse, dry, turn off with towel",
        signoff_criteria: "Champion confirms: New hire demonstrates proper handwashing technique"
      },
      {
        question: "A child has a nosebleed. Walk me through what you do including glove use.",
        acceptable_answer: "Put on gloves, apply pressure with clean tissue, keep child calm and sitting upright, have another staff get first aid kit, wash hands after removing gloves.",
        signoff_criteria: "Champion confirms: New hire knows when to use gloves and proper procedure"
      },
      {
        question: "Marcus says his tummy hurts and then throws up on the carpet. What are your next steps?",
        acceptable_answer: "Separate Marcus to quiet area, call parent immediately, keep him comfortable, document, clean/sanitize area after he leaves.",
        signoff_criteria: "Champion confirms: New hire knows illness response procedure"
      },
      {
        question: "Emma's EpiPen authorization says give if she has trouble breathing after eating. She just finished snack and starts wheezing. What do you do?",
        acceptable_answer: "Call 911 first, then get EpiPen, have another staff verify it's Emma's, administer per instructions, call parent, document.",
        signoff_criteria: "Champion confirms: New hire understands medication safety"
      }
    ]
  },
  {
    section_order: 5,
    section_title: "Child Maltreatment Recognition & Reporting",
    section_duration_minutes: 20,
    champion_script: "This is the hardest part of the orientation, but it's also the most important. As a childcare provider in Texas, you are a MANDATORY REPORTER. That means if you suspect abuse or neglect, you are REQUIRED BY LAW to report it. We're going to make sure you know what to look for and what to do.",
    texas_statute_reference: "§744.1303(3)",
    content_json: {
      types_of_maltreatment: {
        physical_abuse: {
          signs: [
            "Unexplained bruises, welts, or burns",
            "Bruises in unusual patterns (handprints, belt marks)",
            "Injuries in various stages of healing",
            "Injuries on babies (who aren't mobile yet)",
            "Child flinches when adults raise hands",
            "Child seems afraid of parents/caregivers",
            "Child says they were hit/hurt"
          ]
        },
        sexual_abuse: {
          signs: [
            "Age-inappropriate sexual knowledge",
            "Sexual behavior with toys or other children",
            "Unexplained fear of certain people or places",
            "Nightmares or sleep problems",
            "Reluctance to go home",
            "Pain or bleeding in genital/anal area",
            "Child says someone touched them inappropriately"
          ]
        },
        neglect: {
          signs: [
            "Consistently dirty, severe body odor",
            "Inappropriately dressed for weather",
            "Always hungry or hoarding food",
            "Lacking needed medical/dental care",
            "Frequently absent or late",
            "Left in care of inappropriate person",
            "Unsupervised for long periods"
          ]
        },
        emotional_abuse: {
          signs: [
            "Extreme behaviors (very aggressive or very withdrawn)",
            "Developmental delays",
            "Low self-esteem ('I'm bad, I'm stupid')",
            "Adult-like behavior (overly mature)",
            "Suicide talk (even in young children)"
          ]
        }
      },
      risk_factors: [
        "Very young children (under 4)",
        "Children with disabilities",
        "Premature babies",
        "Children with behavior problems",
        "Children in homes with domestic violence",
        "Children whose parents have substance abuse issues"
      ],
      risk_factors_note: "This doesn't mean abuse IS happening, just means increased vigilance needed.",
      mandatory_reporter_duty: {
        what_it_means: [
          "If you SUSPECT abuse or neglect, you MUST report",
          "You don't need PROOF - reasonable suspicion is enough",
          "You report even if you think someone else already did",
          "You are LEGALLY PROTECTED from retaliation",
          "You can be held liable if you DON'T report"
        ],
        texas_law: "Failure to report suspected abuse/neglect is a Class A misdemeanor (up to 1 year in jail, $4,000 fine)."
      },
      how_to_report: {
        internal_first: [
          "Tell your director/manager IMMEDIATELY",
          "Write down what you observed (facts only, no opinions)",
          "Include dates, times, direct quotes from child"
        ],
        external_required: {
          hotline_phone: "1-800-252-5400",
          hotline_web: "www.txabusehotline.org",
          timeline: "Report within 48 hours of suspicion",
          information_needed: [
            "Your name and contact info",
            "Child's name, age, address",
            "Parent/caregiver names",
            "What you observed (facts)",
            "Any immediate danger?"
          ]
        },
        after_reporting: [
          "Continue to document observations",
          "Maintain confidentiality (don't discuss with other staff/parents)",
          "Continue to treat family professionally",
          "Cooperate with any investigation"
        ]
      },
      what_happens_after: {
        investigation: "CPS will investigate (may include interviews with child, parents, staff)",
        your_role: "Answer questions honestly, provide documentation if requested",
        confidentiality: "Information about investigation is confidential",
        protection: "You cannot be fired or retaliated against for reporting in good faith"
      },
      facility_prevention: [
        "Background checks on all staff",
        "Never leaving children alone with one adult",
        "Open-door policy (parents can observe anytime)",
        "Teaching children body autonomy",
        "Creating culture where children feel safe to speak up"
      ]
    },
    verification_questions: [
      {
        question: "You notice that 4-year-old Emma has bruises on both upper arms that look like finger marks. She says 'Mommy squeezed me.' What do you do?",
        acceptable_answer: "Tell director immediately, write down exactly what Emma said and what you observed, director will report to Texas Abuse Hotline within 48 hours. Continue to treat Emma and family professionally.",
        signoff_criteria: "Champion confirms: New hire understands mandatory reporting duty and procedures"
      }
    ]
  },
  {
    section_order: 6,
    section_title: "Positive Guidance & Discipline",
    section_duration_minutes: 10,
    champion_script: "Let's end on a happier note! This is about creating a positive environment where kids WANT to behave well. We don't use punishment here - we use teaching and guidance.",
    texas_statute_reference: "§744.2101",
    content_json: {
      philosophy: [
        "Children are learning how to behave",
        "Misbehavior is a teaching opportunity",
        "We focus on what TO do, not just what NOT to do",
        "We respect children's dignity always"
      ],
      positive_strategies: [
        "Clear, consistent expectations",
        "Praise specific behaviors ('I love how you shared that toy!')",
        "Redirect before problems escalate",
        "Natural consequences when safe",
        "Problem-solving with children",
        "Time-in (stay with child) vs time-out"
      ],
      never_allowed: {
        warning: "NEVER - Violation = criminal offense + license revocation",
        prohibited_actions: [
          "Hitting, spanking, shaking, or any physical punishment",
          "Yelling or harsh language",
          "Humiliation or shame",
          "Withholding food",
          "Forcing child to remain in one position",
          "Mechanical restraints",
          "Locked rooms"
        ]
      },
      responding_to_challenging_behavior: {
        step_1: {
          title: "Stay Calm",
          details: ["Take a breath", "Kids feed off your energy", "Model the calm you want to see"]
        },
        step_2: {
          title: "Ensure Safety",
          details: ["If child is dangerous to self/others, prioritize safety", "Remove other children if needed", "Stay close to child having difficulty"]
        },
        step_3: {
          title: "Acknowledge Feelings",
          details: ["'I can see you're really frustrated'", "Feelings are always okay; actions may not be"]
        },
        step_4: {
          title: "Set Clear Limits",
          details: ["'I can't let you hit. Hitting hurts.'", "State what IS allowed: 'You can hit this pillow or squeeze this ball'"]
        },
        step_5: {
          title: "Teach Alternative",
          details: ["'When you're angry, use your words: \"I'm mad!\"'", "Practice the better behavior"]
        },
        step_6: {
          title: "Follow Up",
          details: ["Once child is calm, briefly review what happened", "Encourage them: 'Next time you'll remember to use words'", "Move on - don't hold grudges"]
        }
      },
      when_to_get_help: [
        "Child is aggressive toward other children repeatedly",
        "You feel overwhelmed or frustrated",
        "Child's behavior is beyond your experience level",
        "Parent needs to be called about behavior"
      ],
      help_reminder: "Asking for help is GOOD, not weakness!"
    },
    verification_questions: [
      {
        question: "Two children are fighting over a toy truck. It's escalating quickly and one child pushes the other. What do you do?",
        acceptable_answer: "Calmly step between them, ensure both are safe, acknowledge feelings ('You both really wanted that truck!'), set limits ('We don't push. Pushing can hurt.'), problem-solve ('Let's figure out how you can both get a turn'), teach alternative behavior.",
        signoff_criteria: "Champion confirms: New hire understands positive guidance approach"
      }
    ]
  },
  {
    section_order: 7,
    section_title: "Day One Completion & Sign-Off",
    section_duration_minutes: 5,
    champion_script: "You did it! That was A LOT of information, and you handled it great. Let's review the most important things, and then we'll both sign off that you're ready to start.",
    texas_statute_reference: "§744.1303 completion",
    content_json: {
      quick_review_questions: [
        { q: "Where are the emergency exits?", a: "Identifies all exits" },
        { q: "Where's the first aid kit?", a: "Points to location" },
        { q: "What do you do if you hear the fire alarm?", a: "Evacuate, meeting point, count heads" },
        { q: "Can you ever leave children unsupervised, even for a minute?", a: "Never!" },
        { q: "What's the phone number for reporting suspected abuse?", a: "1-800-252-5400" },
        { q: "If a child has an allergic reaction, what do you do first?", a: "Call 911" },
        { q: "Can you release a child to someone not on the authorization list?", a: "No" },
        { q: "When must you wash your hands?", a: "Multiple correct answers" }
      ],
      final_champion_message: "Here's what I want you to remember most: You're not alone. Ever. If you have ANY question, ANY concern, ANY doubt about what to do - ASK. That's not bugging me, that's exactly what you should do. We're a team, and we keep kids safe together. You're going to do great. The first few days will feel overwhelming, but I promise it gets easier. And every single person on our team has been exactly where you are right now. Welcome to [Facility Name]. We're lucky to have you!",
      topics_covered: [
        "Facility tour & emergency equipment locations",
        "Emergency protocols (fire, weather, medical, allergic reaction, active threat, missing child)",
        "Active supervision & child safety essentials",
        "Child release procedures",
        "Health & safety basics (handwashing, illness, gloves, medication)",
        "Child maltreatment recognition & reporting requirements",
        "Positive guidance & discipline policy"
      ],
      verification_completed: [
        "Can identify emergency exits",
        "Knows first aid kit location",
        "Understands OUT model",
        "Demonstrated proper handwashing",
        "Knows mandatory reporting duty",
        "Understands never-alone-with-children policy",
        "Reviewed authorization list procedures",
        "Understands positive discipline approach"
      ],
      materials_to_provide: [
        "Facility policies handbook",
        "Emergency procedures quick reference card (laminated)",
        "Child release authorization list (updated)",
        "Allergy list (current children)",
        "Texas Abuse Hotline number card (wallet-sized)",
        "Pre-service training schedule (next 90 days)",
        "CPR/First Aid class information"
      ],
      next_step: "Week One daily check-ins (Days 2-7)",
      compliance_status: "AUTHORIZED TO WORK WITH SUPERVISION"
    },
    verification_questions: []
  }
];

async function seedDayOne() {
  const client = await pool.connect();
  
  try {
    console.log('🌱 Starting Day One content seeding...');
    
    // Check if content already exists
    const checkQuery = 'SELECT COUNT(*) FROM day_one_orientation_content';
    const checkResult = await client.query(checkQuery);
    const existingCount = parseInt(checkResult.rows[0].count);
    
    if (existingCount > 0) {
      console.log(`⚠️  Found ${existingCount} existing Day One records. Clearing table...`);
      await client.query('DELETE FROM day_one_orientation_content');
    }
    
    // Insert each section
    for (const section of dayOneContent) {
      const query = `
        INSERT INTO day_one_orientation_content (
          section_order,
          section_title,
          section_duration_minutes,
          champion_script,
          texas_statute_reference,
          content_json,
          verification_questions
        ) VALUES ($1, $2, $3, $4, $5, $6, $7)
      `;
      
      await client.query(query, [
        section.section_order,
        section.section_title,
        section.section_duration_minutes,
        section.champion_script,
        section.texas_statute_reference,
        JSON.stringify(section.content_json),
        JSON.stringify(section.verification_questions)
      ]);
      
      console.log(`✅ Inserted section ${section.section_order}: ${section.section_title}`);
    }
    
    console.log(`\n🎉 Successfully seeded ${dayOneContent.length} Day One sections!`);
    
  } catch (error) {
    console.error('❌ Error seeding Day One content:', error);
    throw error;
  } finally {
    client.release();
  }
}

// Run if called directly
if (require.main === module) {
  seedDayOne()
    .then(() => {
      console.log('✅ Day One seeding complete!');
      process.exit(0);
    })
    .catch(err => {
      console.error('❌ Day One seeding failed:', err);
      process.exit(1);
    });
}

module.exports = seedDayOne;
