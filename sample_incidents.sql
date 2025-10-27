-- Sample Incident Data for Supabase
-- Run this SQL in your Supabase SQL Editor to populate the incidents table
-- Make sure to replace 'your-facility-id-here' with your actual facility UUID

-- Incident 1: Minor Playground Fall
INSERT INTO incidents (
  facility_id,
  type,
  severity,
  child_info,
  location,
  description,
  immediate_actions,
  occurred_at,
  reported_by,
  parent_notified,
  created_at,
  updated_at
) VALUES (
  'your-facility-id-here',
  'Injury',
  'minor',
  '{"name": "Emma Rodriguez", "age": "4 years", "classroom": "Preschool Room B"}'::jsonb,
  'Outdoor Playground',
  'Emma was running on the playground during outdoor time and tripped over a jump rope that was on the ground. She fell forward and scraped her right knee and left palm on the rubber safety surface.',
  'Brought Emma inside immediately. Cleaned both wounds with soap and water. Applied antibiotic ointment to knee and palm. Covered knee with adhesive bandage. Gave Emma ice pack wrapped in paper towel. Comforted child and observed for 15 minutes. No signs of serious injury, child returned to activities. Witnesses: Michael Chen (Assistant Teacher), 3 children in playground area. Parent Notification: Phone call at 10:45 AM. Mother notified, will pick up early to check on Emma. Follow-up: Monitor for next 24 hours, parent to check for infection.',
  '2025-10-27 10:30:00',
  'Sarah Johnson, Lead Teacher',
  true,
  NOW(),
  NOW()
);

-- Incident 2: Allergic Reaction to Snack
INSERT INTO incidents (
  facility_id,
  type,
  severity,
  child_info,
  location,
  description,
  immediate_actions,
  occurred_at,
  reported_by,
  parent_notified,
  created_at,
  updated_at
) VALUES (
  'your-facility-id-here',
  'Medical',
  'critical',
  '{"name": "Marcus Thompson", "age": "3 years", "classroom": "Toddler Room A", "allergies": "wheat"}'::jsonb,
  'Classroom - Snack Area',
  'During afternoon snack, Marcus was given graham crackers. Within 5 minutes, he developed hives on his face and arms. Child has known wheat allergy that was not properly communicated during snack preparation.',
  'Removed child from snack area immediately. Called 911 per facility protocol for allergic reactions. Director retrieved EpiPen from child emergency supplies. Administered EpiPen to left thigh at 2:18 PM. Called parent (mother) at 2:19 PM. Paramedics arrived at 2:27 PM. Child transported to Children Memorial Hospital with mother. Incident report filed with licensing. Witnesses: Karen Williams (Director), Jessica Martinez (Assistant Teacher), 8 children present. Parent Notification: Phone call at 2:19 PM + In-person. Mother arrived within 10 minutes, accompanied child to hospital. Follow-up: Medical clearance required before return, review allergy protocols with all staff, update allergy posting in kitchen.',
  '2025-10-26 14:15:00',
  'Jessica Martinez, Assistant Teacher',
  true,
  NOW(),
  NOW()
);

-- Incident 3: Behavioral Incident - Biting
INSERT INTO incidents (
  facility_id,
  type,
  severity,
  child_info,
  location,
  description,
  immediate_actions,
  occurred_at,
  reported_by,
  parent_notified,
  created_at,
  updated_at
) VALUES (
  'your-facility-id-here',
  'Behavioral',
  'moderate',
  '{"name": "Aiden Lee", "age": "2 years", "classroom": "Toddler Room B"}'::jsonb,
  'Classroom - Block Play Area',
  'Aiden and another child (Sophia) were both reaching for the same toy truck. Aiden became frustrated when Sophia grabbed it first and bit her on the right forearm, leaving visible teeth marks.',
  'Immediately separated both children. Cleaned bite mark on Sophia arm with soap and water. Applied cold compress for 10 minutes. Examined wound - no broken skin, moderate redness. Applied antibiotic ointment as precaution. Redirected Aiden to different activity. Comforted both children. Documented incident for both children files. Witnesses: Rachel Foster (Lead Teacher), Amanda Brooks (Floating Staff). Parent Notification: Phone call to both sets of parents at 10:00 AM. Both parents notified. Aiden parents to meet with director tomorrow to discuss behavior plan. Follow-up: Behavior intervention plan for Aiden, shadow staff assigned for 1 week, parent meeting scheduled for 10/28.',
  '2025-10-25 09:45:00',
  'Rachel Foster, Lead Teacher',
  true,
  NOW(),
  NOW()
);

-- Incident 4: Medication Error
INSERT INTO incidents (
  facility_id,
  type,
  severity,
  child_info,
  location,
  description,
  immediate_actions,
  occurred_at,
  reported_by,
  parent_notified,
  created_at,
  updated_at
) VALUES (
  'your-facility-id-here',
  'Medical',
  'critical',
  '{"name": "Olivia Patterson", "age": "5 years", "classroom": "Pre-K Room A", "medications": ["Ritalin 10mg"]}'::jsonb,
  'Administrative Office',
  'Olivia was scheduled to receive her ADHD medication (Ritalin 10mg) at 12:00 PM. Staff member administered the medication from the wrong child medication box, giving Olivia allergy medication (Zyrtec) belonging to another child instead.',
  'Error discovered immediately when second child medication was being prepared. Called poison control center at 12:08 PM - advised to monitor child. Called Olivia pediatrician at 12:12 PM. Notified parent immediately at 12:15 PM. Monitored child continuously for drowsiness. Child remained in office under director supervision. Completed incident report for licensing. Staff member sent home pending investigation. Witnesses: Karen Williams (Director), Lisa Reynolds (Staff who discovered error). Parent Notification: Phone call + Email with written incident report at 12:15 PM. Father picked up child early at 1:30 PM. Extremely upset. Meeting scheduled with family and management. Follow-up: Staff retraining on medication administration, implement double-check system, licensing notification required within 24 hours, potential staff disciplinary action.',
  '2025-10-24 12:05:00',
  'Karen Williams, Director',
  true,
  NOW(),
  NOW()
);

-- Incident 5: Minor Head Bump
INSERT INTO incidents (
  facility_id,
  type,
  severity,
  child_info,
  location,
  description,
  immediate_actions,
  occurred_at,
  reported_by,
  parent_notified,
  created_at,
  updated_at
) VALUES (
  'your-facility-id-here',
  'Injury',
  'minor',
  '{"name": "Liam Wilson", "age": "18 months", "classroom": "Infant Room"}'::jsonb,
  'Classroom - Soft Play Area',
  'Liam was crawling in the soft play area and pulled himself up using the low shelf. He lost his balance and fell backward, bumping the back of his head on the carpeted floor. No objects were involved in the fall.',
  'Picked up child immediately and comforted. Applied ice pack (wrapped in soft cloth) to back of head for 10 minutes. Checked for bump/swelling - small bump present, no bleeding. Checked pupils - equal and reactive. Observed child for 30 minutes for signs of concussion. Child did not vomit, remained alert and playful. Documented on head injury form. Gave head injury watch instruction sheet to parent at pickup. Witnesses: Monica Garcia (Infant Teacher), Patricia Holmes (Assistant). Parent Notification: In-person at pickup at 5:15 PM + Head injury instruction sheet. Mother informed at pickup. Provided written instructions to monitor overnight for vomiting, unusual sleepiness, or behavior changes. Follow-up: Parent to call if any concerning symptoms develop overnight. Staff to ask about child condition tomorrow morning.',
  '2025-10-27 15:30:00',
  'Monica Garcia, Infant Teacher',
  true,
  NOW(),
  NOW()
);

-- Quick Test Incidents
INSERT INTO incidents (
  facility_id,
  type,
  severity,
  child_info,
  location,
  description,
  immediate_actions,
  occurred_at,
  reported_by,
  parent_notified,
  created_at,
  updated_at
) VALUES 
(
  'your-facility-id-here',
  'Injury',
  'minor',
  '{"name": "Noah Martinez", "age": "4 years", "classroom": "Pre-K A"}'::jsonb,
  'Classroom',
  'Child bumped elbow on table corner during activity transition',
  'Applied ice pack, observed for 10 minutes, no swelling. Parent Notification: Called at pickup, no concerns.',
  '2025-10-27 11:20:00',
  'Staff Member',
  true,
  NOW(),
  NOW()
),
(
  'your-facility-id-here',
  'Behavioral',
  'minor',
  '{"name": "Sophia Chen", "age": "3 years", "classroom": "Preschool B"}'::jsonb,
  'Playground',
  'Child refused to come inside from playground, had tantrum',
  'Gave 2-minute warning, used calm voice, child transitioned successfully after 5 minutes. Parent Notification: Discussed at pickup, no follow-up needed.',
  '2025-10-27 13:45:00',
  'Staff Member',
  true,
  NOW(),
  NOW()
),
(
  'your-facility-id-here',
  'Medical',
  'moderate',
  '{"name": "Isabella Brown", "age": "2 years", "classroom": "Toddler A"}'::jsonb,
  'Classroom',
  'Child vomited once during morning activities',
  'Cleaned child, changed clothes, called parent for pickup. Parent Notification: Mother picked up within 30 minutes. Follow-up: Child must be symptom-free for 24 hours before return.',
  '2025-10-27 10:15:00',
  'Staff Member',
  true,
  NOW(),
  NOW()
);

-- Verify the inserts
SELECT 
  id,
  type,
  severity,
  child_info->>'name' as child_name,
  child_info->>'age' as child_age,
  occurred_at,
  parent_notified,
  created_at
FROM incidents
WHERE facility_id = 'your-facility-id-here'
ORDER BY occurred_at DESC;
