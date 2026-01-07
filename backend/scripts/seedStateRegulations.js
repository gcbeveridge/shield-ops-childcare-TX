const pool = require('../config/db');
const { v4: uuidv4 } = require('uuid');

const STATE_REGULATIONS = [
    // TEXAS
    { state_code: 'TX', state_name: 'Texas', regulation_category: 'Staff Ratios', requirement_text: 'Infant (0-12 months): 1:4 staff-to-child ratio required', violation_weight: 'high', citation_reference: 'TX Admin Code §746.1301', inspection_frequency: 'annual' },
    { state_code: 'TX', state_name: 'Texas', regulation_category: 'Staff Ratios', requirement_text: 'Toddler (13-17 months): 1:5 staff-to-child ratio required', violation_weight: 'high', citation_reference: 'TX Admin Code §746.1301', inspection_frequency: 'annual' },
    { state_code: 'TX', state_name: 'Texas', regulation_category: 'Staff Ratios', requirement_text: 'Toddler (18-23 months): 1:9 staff-to-child ratio required', violation_weight: 'high', citation_reference: 'TX Admin Code §746.1301', inspection_frequency: 'annual' },
    { state_code: 'TX', state_name: 'Texas', regulation_category: 'Staff Ratios', requirement_text: 'Preschool (2 years): 1:11 staff-to-child ratio required', violation_weight: 'high', citation_reference: 'TX Admin Code §746.1301', inspection_frequency: 'annual' },
    { state_code: 'TX', state_name: 'Texas', regulation_category: 'Staff Ratios', requirement_text: 'Preschool (3 years): 1:15 staff-to-child ratio required', violation_weight: 'high', citation_reference: 'TX Admin Code §746.1301', inspection_frequency: 'annual' },
    { state_code: 'TX', state_name: 'Texas', regulation_category: 'Staff Ratios', requirement_text: 'Preschool (4 years): 1:18 staff-to-child ratio required', violation_weight: 'high', citation_reference: 'TX Admin Code §746.1301', inspection_frequency: 'annual' },
    { state_code: 'TX', state_name: 'Texas', regulation_category: 'Staff Ratios', requirement_text: 'School Age (5-13 years): 1:26 staff-to-child ratio required', violation_weight: 'high', citation_reference: 'TX Admin Code §746.1301', inspection_frequency: 'annual' },
    { state_code: 'TX', state_name: 'Texas', regulation_category: 'Background Checks', requirement_text: 'All caregivers must have FBI fingerprint-based background check', violation_weight: 'high', citation_reference: 'TX Admin Code §745.615', inspection_frequency: 'annual' },
    { state_code: 'TX', state_name: 'Texas', regulation_category: 'Background Checks', requirement_text: 'Name-based criminal history check required for all employees', violation_weight: 'high', citation_reference: 'TX Admin Code §745.611', inspection_frequency: 'annual' },
    { state_code: 'TX', state_name: 'Texas', regulation_category: 'Background Checks', requirement_text: 'Central registry check (abuse/neglect) required', violation_weight: 'high', citation_reference: 'TX Admin Code §745.609', inspection_frequency: 'annual' },
    { state_code: 'TX', state_name: 'Texas', regulation_category: 'Training Requirements', requirement_text: '24 hours pre-service training required before working alone with children', violation_weight: 'medium-high', citation_reference: 'TX Admin Code §746.1309', inspection_frequency: 'annual' },
    { state_code: 'TX', state_name: 'Texas', regulation_category: 'Training Requirements', requirement_text: '30 hours annual training required for all caregivers', violation_weight: 'medium', citation_reference: 'TX Admin Code §746.1315', inspection_frequency: 'annual' },
    { state_code: 'TX', state_name: 'Texas', regulation_category: 'Training Requirements', requirement_text: 'CPR and First Aid certification required for all caregivers', violation_weight: 'high', citation_reference: 'TX Admin Code §746.1317', inspection_frequency: 'annual' },
    { state_code: 'TX', state_name: 'Texas', regulation_category: 'Health & Safety', requirement_text: 'Daily health checks required for all children upon arrival', violation_weight: 'medium', citation_reference: 'TX Admin Code §746.3601', inspection_frequency: 'annual' },
    { state_code: 'TX', state_name: 'Texas', regulation_category: 'Health & Safety', requirement_text: 'Immunization records must be current for all children', violation_weight: 'medium-high', citation_reference: 'TX Admin Code §746.3501', inspection_frequency: 'annual' },
    { state_code: 'TX', state_name: 'Texas', regulation_category: 'Health & Safety', requirement_text: 'Hand washing required before meals and after diaper changes', violation_weight: 'medium', citation_reference: 'TX Admin Code §746.3403', inspection_frequency: 'annual' },
    { state_code: 'TX', state_name: 'Texas', regulation_category: 'Medication Administration', requirement_text: 'Written parental authorization required for all medications', violation_weight: 'high', citation_reference: 'TX Admin Code §746.3801', inspection_frequency: 'annual' },
    { state_code: 'TX', state_name: 'Texas', regulation_category: 'Medication Administration', requirement_text: 'Medication must be in original container with child name', violation_weight: 'medium', citation_reference: 'TX Admin Code §746.3803', inspection_frequency: 'annual' },
    { state_code: 'TX', state_name: 'Texas', regulation_category: 'Physical Environment', requirement_text: 'Minimum 30 square feet indoor space per child', violation_weight: 'medium-high', citation_reference: 'TX Admin Code §746.4301', inspection_frequency: 'annual' },
    { state_code: 'TX', state_name: 'Texas', regulation_category: 'Physical Environment', requirement_text: 'Minimum 80 square feet outdoor space per child', violation_weight: 'medium', citation_reference: 'TX Admin Code §746.4501', inspection_frequency: 'annual' },
    { state_code: 'TX', state_name: 'Texas', regulation_category: 'Physical Environment', requirement_text: 'Fencing minimum 4 feet high for outdoor play areas', violation_weight: 'medium-high', citation_reference: 'TX Admin Code §746.4503', inspection_frequency: 'annual' },
    { state_code: 'TX', state_name: 'Texas', regulation_category: 'Documentation', requirement_text: 'Daily attendance records must be maintained', violation_weight: 'medium', citation_reference: 'TX Admin Code §746.501', inspection_frequency: 'annual' },
    { state_code: 'TX', state_name: 'Texas', regulation_category: 'Documentation', requirement_text: 'Incident reports required within 48 hours', violation_weight: 'medium-high', citation_reference: 'TX Admin Code §746.503', inspection_frequency: 'annual' },
    { state_code: 'TX', state_name: 'Texas', regulation_category: 'Emergency Preparedness', requirement_text: 'Written emergency evacuation plan required', violation_weight: 'high', citation_reference: 'TX Admin Code §746.5201', inspection_frequency: 'annual' },
    { state_code: 'TX', state_name: 'Texas', regulation_category: 'Emergency Preparedness', requirement_text: 'Monthly fire drills required', violation_weight: 'medium-high', citation_reference: 'TX Admin Code §746.5203', inspection_frequency: 'annual' },
    
    // CALIFORNIA
    { state_code: 'CA', state_name: 'California', regulation_category: 'Staff Ratios', requirement_text: 'Infant (0-24 months): 1:4 staff-to-child ratio required', violation_weight: 'high', citation_reference: 'CA Health & Safety Code §1597.05', inspection_frequency: 'annual' },
    { state_code: 'CA', state_name: 'California', regulation_category: 'Staff Ratios', requirement_text: 'Toddler (24-30 months): 1:6 staff-to-child ratio required', violation_weight: 'high', citation_reference: 'CA Health & Safety Code §1597.05', inspection_frequency: 'annual' },
    { state_code: 'CA', state_name: 'California', regulation_category: 'Staff Ratios', requirement_text: 'Preschool (30 months-5 years): 1:12 staff-to-child ratio required', violation_weight: 'high', citation_reference: 'CA Health & Safety Code §1597.05', inspection_frequency: 'annual' },
    { state_code: 'CA', state_name: 'California', regulation_category: 'Staff Ratios', requirement_text: 'School Age: 1:14 staff-to-child ratio required', violation_weight: 'high', citation_reference: 'CA Health & Safety Code §1597.05', inspection_frequency: 'annual' },
    { state_code: 'CA', state_name: 'California', regulation_category: 'Background Checks', requirement_text: 'LiveScan fingerprint background check required for all staff', violation_weight: 'high', citation_reference: 'CA Health & Safety Code §1596.871', inspection_frequency: 'annual' },
    { state_code: 'CA', state_name: 'California', regulation_category: 'Background Checks', requirement_text: 'Child Abuse Central Index (CACI) check required', violation_weight: 'high', citation_reference: 'CA Health & Safety Code §1596.871', inspection_frequency: 'annual' },
    { state_code: 'CA', state_name: 'California', regulation_category: 'Training Requirements', requirement_text: '15 hours orientation training required within first 90 days', violation_weight: 'medium-high', citation_reference: 'CA CCR Title 22 §101216.1', inspection_frequency: 'annual' },
    { state_code: 'CA', state_name: 'California', regulation_category: 'Training Requirements', requirement_text: '16 hours annual training required for all staff', violation_weight: 'medium', citation_reference: 'CA CCR Title 22 §101216.2', inspection_frequency: 'annual' },
    { state_code: 'CA', state_name: 'California', regulation_category: 'Training Requirements', requirement_text: 'Pediatric CPR and First Aid certification required', violation_weight: 'high', citation_reference: 'CA CCR Title 22 §101216', inspection_frequency: 'annual' },
    { state_code: 'CA', state_name: 'California', regulation_category: 'Health & Safety', requirement_text: 'Tuberculosis (TB) clearance required for all staff', violation_weight: 'high', citation_reference: 'CA Health & Safety Code §121525', inspection_frequency: 'annual' },
    { state_code: 'CA', state_name: 'California', regulation_category: 'Health & Safety', requirement_text: 'Immunization requirements per California schedule', violation_weight: 'medium-high', citation_reference: 'CA Health & Safety Code §120335', inspection_frequency: 'annual' },
    { state_code: 'CA', state_name: 'California', regulation_category: 'Physical Environment', requirement_text: 'Minimum 35 square feet indoor space per child', violation_weight: 'medium-high', citation_reference: 'CA CCR Title 22 §101438.1', inspection_frequency: 'annual' },
    { state_code: 'CA', state_name: 'California', regulation_category: 'Physical Environment', requirement_text: 'Minimum 75 square feet outdoor space per child', violation_weight: 'medium', citation_reference: 'CA CCR Title 22 §101438.2', inspection_frequency: 'annual' },
    { state_code: 'CA', state_name: 'California', regulation_category: 'Documentation', requirement_text: 'Unusual Incident Reports (UIR) required for serious incidents', violation_weight: 'high', citation_reference: 'CA CCR Title 22 §101212', inspection_frequency: 'annual' },
    { state_code: 'CA', state_name: 'California', regulation_category: 'Emergency Preparedness', requirement_text: 'Disaster and mass casualty plan required', violation_weight: 'high', citation_reference: 'CA CCR Title 22 §101174', inspection_frequency: 'annual' },
    
    // FLORIDA
    { state_code: 'FL', state_name: 'Florida', regulation_category: 'Staff Ratios', requirement_text: 'Infant (0-12 months): 1:4 staff-to-child ratio required', violation_weight: 'high', citation_reference: 'FL Stat §402.305', inspection_frequency: 'biannual' },
    { state_code: 'FL', state_name: 'Florida', regulation_category: 'Staff Ratios', requirement_text: 'Toddler (1-2 years): 1:6 staff-to-child ratio required', violation_weight: 'high', citation_reference: 'FL Stat §402.305', inspection_frequency: 'biannual' },
    { state_code: 'FL', state_name: 'Florida', regulation_category: 'Staff Ratios', requirement_text: 'Preschool (2-3 years): 1:11 staff-to-child ratio required', violation_weight: 'high', citation_reference: 'FL Stat §402.305', inspection_frequency: 'biannual' },
    { state_code: 'FL', state_name: 'Florida', regulation_category: 'Staff Ratios', requirement_text: 'Preschool (3-4 years): 1:15 staff-to-child ratio required', violation_weight: 'high', citation_reference: 'FL Stat §402.305', inspection_frequency: 'biannual' },
    { state_code: 'FL', state_name: 'Florida', regulation_category: 'Staff Ratios', requirement_text: 'Preschool (4-5 years): 1:20 staff-to-child ratio required', violation_weight: 'high', citation_reference: 'FL Stat §402.305', inspection_frequency: 'biannual' },
    { state_code: 'FL', state_name: 'Florida', regulation_category: 'Staff Ratios', requirement_text: 'School Age (5+ years): 1:25 staff-to-child ratio required', violation_weight: 'high', citation_reference: 'FL Stat §402.305', inspection_frequency: 'biannual' },
    { state_code: 'FL', state_name: 'Florida', regulation_category: 'Background Checks', requirement_text: 'Level 2 background screening (FBI fingerprints) required', violation_weight: 'high', citation_reference: 'FL Stat §402.305(2)', inspection_frequency: 'biannual' },
    { state_code: 'FL', state_name: 'Florida', regulation_category: 'Background Checks', requirement_text: 'Background rescreening every 5 years required', violation_weight: 'medium-high', citation_reference: 'FL Stat §402.305(2)', inspection_frequency: 'biannual' },
    { state_code: 'FL', state_name: 'Florida', regulation_category: 'Training Requirements', requirement_text: '45 hours introductory child care training required', violation_weight: 'medium-high', citation_reference: 'FL Admin Code 65C-22.001', inspection_frequency: 'biannual' },
    { state_code: 'FL', state_name: 'Florida', regulation_category: 'Training Requirements', requirement_text: '10 hours annual in-service training required', violation_weight: 'medium', citation_reference: 'FL Admin Code 65C-22.001', inspection_frequency: 'biannual' },
    { state_code: 'FL', state_name: 'Florida', regulation_category: 'Training Requirements', requirement_text: 'Staff Credential (Director, VPK Instructor) per role', violation_weight: 'medium-high', citation_reference: 'FL Admin Code 65C-22.003', inspection_frequency: 'biannual' },
    { state_code: 'FL', state_name: 'Florida', regulation_category: 'Health & Safety', requirement_text: 'Daily health observation required upon arrival', violation_weight: 'medium', citation_reference: 'FL Admin Code 65C-22.004', inspection_frequency: 'biannual' },
    { state_code: 'FL', state_name: 'Florida', regulation_category: 'Physical Environment', requirement_text: 'Minimum 35 square feet indoor space per child', violation_weight: 'medium-high', citation_reference: 'FL Stat §402.305', inspection_frequency: 'biannual' },
    { state_code: 'FL', state_name: 'Florida', regulation_category: 'Physical Environment', requirement_text: 'Minimum 45 square feet outdoor space per child', violation_weight: 'medium', citation_reference: 'FL Stat §402.305', inspection_frequency: 'biannual' },
    { state_code: 'FL', state_name: 'Florida', regulation_category: 'Emergency Preparedness', requirement_text: 'Emergency preparedness plan for natural disasters required', violation_weight: 'high', citation_reference: 'FL Admin Code 65C-22.008', inspection_frequency: 'biannual' },
    
    // NEW YORK
    { state_code: 'NY', state_name: 'New York', regulation_category: 'Staff Ratios', requirement_text: 'Infant (0-6 months): 1:3 staff-to-child ratio required', violation_weight: 'high', citation_reference: 'NY OCFS Regulations §418-1.8', inspection_frequency: 'annual' },
    { state_code: 'NY', state_name: 'New York', regulation_category: 'Staff Ratios', requirement_text: 'Infant (6-18 months): 1:4 staff-to-child ratio required', violation_weight: 'high', citation_reference: 'NY OCFS Regulations §418-1.8', inspection_frequency: 'annual' },
    { state_code: 'NY', state_name: 'New York', regulation_category: 'Staff Ratios', requirement_text: 'Toddler (18-36 months): 1:5 staff-to-child ratio required', violation_weight: 'high', citation_reference: 'NY OCFS Regulations §418-1.8', inspection_frequency: 'annual' },
    { state_code: 'NY', state_name: 'New York', regulation_category: 'Staff Ratios', requirement_text: 'Preschool (3-5 years): 1:7 staff-to-child ratio required', violation_weight: 'high', citation_reference: 'NY OCFS Regulations §418-1.8', inspection_frequency: 'annual' },
    { state_code: 'NY', state_name: 'New York', regulation_category: 'Staff Ratios', requirement_text: 'School Age (5+ years): 1:10 staff-to-child ratio required', violation_weight: 'high', citation_reference: 'NY OCFS Regulations §418-1.8', inspection_frequency: 'annual' },
    { state_code: 'NY', state_name: 'New York', regulation_category: 'Background Checks', requirement_text: 'Statewide Central Register (SCR) check required', violation_weight: 'high', citation_reference: 'NY OCFS Regulations §418-1.13', inspection_frequency: 'annual' },
    { state_code: 'NY', state_name: 'New York', regulation_category: 'Background Checks', requirement_text: 'FBI fingerprint background check required', violation_weight: 'high', citation_reference: 'NY OCFS Regulations §418-1.13', inspection_frequency: 'annual' },
    { state_code: 'NY', state_name: 'New York', regulation_category: 'Training Requirements', requirement_text: '15 hours pre-service health and safety training required', violation_weight: 'medium-high', citation_reference: 'NY OCFS Regulations §418-1.14', inspection_frequency: 'annual' },
    { state_code: 'NY', state_name: 'New York', regulation_category: 'Training Requirements', requirement_text: '30 hours annual training required for all staff', violation_weight: 'medium', citation_reference: 'NY OCFS Regulations §418-1.14', inspection_frequency: 'annual' },
    { state_code: 'NY', state_name: 'New York', regulation_category: 'Training Requirements', requirement_text: 'Pediatric CPR and First Aid certification required', violation_weight: 'high', citation_reference: 'NY OCFS Regulations §418-1.14', inspection_frequency: 'annual' },
    { state_code: 'NY', state_name: 'New York', regulation_category: 'Health & Safety', requirement_text: 'Health care consultant required for licensed programs', violation_weight: 'medium-high', citation_reference: 'NY OCFS Regulations §418-1.11', inspection_frequency: 'annual' },
    { state_code: 'NY', state_name: 'New York', regulation_category: 'Health & Safety', requirement_text: 'Physical examination required for all staff', violation_weight: 'medium', citation_reference: 'NY OCFS Regulations §418-1.13', inspection_frequency: 'annual' },
    { state_code: 'NY', state_name: 'New York', regulation_category: 'Physical Environment', requirement_text: 'Minimum 35 square feet indoor space per child', violation_weight: 'medium-high', citation_reference: 'NY OCFS Regulations §418-1.5', inspection_frequency: 'annual' },
    { state_code: 'NY', state_name: 'New York', regulation_category: 'Physical Environment', requirement_text: 'Lead paint inspection required for facilities', violation_weight: 'high', citation_reference: 'NY OCFS Regulations §418-1.5', inspection_frequency: 'annual' },
    { state_code: 'NY', state_name: 'New York', regulation_category: 'Documentation', requirement_text: 'Individual child files with emergency contacts required', violation_weight: 'medium', citation_reference: 'NY OCFS Regulations §418-1.15', inspection_frequency: 'annual' },
    { state_code: 'NY', state_name: 'New York', regulation_category: 'Emergency Preparedness', requirement_text: 'Written emergency and evacuation plan required', violation_weight: 'high', citation_reference: 'NY OCFS Regulations §418-1.6', inspection_frequency: 'annual' },
    
    // PENNSYLVANIA
    { state_code: 'PA', state_name: 'Pennsylvania', regulation_category: 'Staff Ratios', requirement_text: 'Infant (0-12 months): 1:4 staff-to-child ratio required', violation_weight: 'high', citation_reference: '55 Pa. Code §3270.51', inspection_frequency: 'annual' },
    { state_code: 'PA', state_name: 'Pennsylvania', regulation_category: 'Staff Ratios', requirement_text: 'Young Toddler (1-2 years): 1:5 staff-to-child ratio required', violation_weight: 'high', citation_reference: '55 Pa. Code §3270.51', inspection_frequency: 'annual' },
    { state_code: 'PA', state_name: 'Pennsylvania', regulation_category: 'Staff Ratios', requirement_text: 'Older Toddler (2-3 years): 1:6 staff-to-child ratio required', violation_weight: 'high', citation_reference: '55 Pa. Code §3270.51', inspection_frequency: 'annual' },
    { state_code: 'PA', state_name: 'Pennsylvania', regulation_category: 'Staff Ratios', requirement_text: 'Preschool (3-4 years): 1:10 staff-to-child ratio required', violation_weight: 'high', citation_reference: '55 Pa. Code §3270.51', inspection_frequency: 'annual' },
    { state_code: 'PA', state_name: 'Pennsylvania', regulation_category: 'Background Checks', requirement_text: 'FBI criminal history clearance required', violation_weight: 'high', citation_reference: '23 Pa. C.S. §6344', inspection_frequency: 'annual' },
    { state_code: 'PA', state_name: 'Pennsylvania', regulation_category: 'Background Checks', requirement_text: 'Child Abuse History Clearance required', violation_weight: 'high', citation_reference: '23 Pa. C.S. §6344', inspection_frequency: 'annual' },
    { state_code: 'PA', state_name: 'Pennsylvania', regulation_category: 'Training Requirements', requirement_text: '6 hours annual training required for all staff', violation_weight: 'medium', citation_reference: '55 Pa. Code §3270.31', inspection_frequency: 'annual' },
    
    // ILLINOIS
    { state_code: 'IL', state_name: 'Illinois', regulation_category: 'Staff Ratios', requirement_text: 'Infant (6 weeks-14 months): 1:4 staff-to-child ratio required', violation_weight: 'high', citation_reference: '89 Ill. Admin. Code 407.190', inspection_frequency: 'annual' },
    { state_code: 'IL', state_name: 'Illinois', regulation_category: 'Staff Ratios', requirement_text: 'Toddler (15-23 months): 1:5 staff-to-child ratio required', violation_weight: 'high', citation_reference: '89 Ill. Admin. Code 407.190', inspection_frequency: 'annual' },
    { state_code: 'IL', state_name: 'Illinois', regulation_category: 'Staff Ratios', requirement_text: 'Preschool (2-3 years): 1:8 staff-to-child ratio required', violation_weight: 'high', citation_reference: '89 Ill. Admin. Code 407.190', inspection_frequency: 'annual' },
    { state_code: 'IL', state_name: 'Illinois', regulation_category: 'Background Checks', requirement_text: 'CANTS (child abuse) and LEADS (criminal) checks required', violation_weight: 'high', citation_reference: '225 ILCS 10/4.1', inspection_frequency: 'annual' },
    { state_code: 'IL', state_name: 'Illinois', regulation_category: 'Training Requirements', requirement_text: '15 hours annual training required for all staff', violation_weight: 'medium', citation_reference: '89 Ill. Admin. Code 407.310', inspection_frequency: 'annual' },
    
    // OHIO
    { state_code: 'OH', state_name: 'Ohio', regulation_category: 'Staff Ratios', requirement_text: 'Infant (0-12 months): 1:5 staff-to-child ratio required', violation_weight: 'high', citation_reference: 'OAC 5101:2-12-19', inspection_frequency: 'annual' },
    { state_code: 'OH', state_name: 'Ohio', regulation_category: 'Staff Ratios', requirement_text: 'Toddler (12-18 months): 1:6 staff-to-child ratio required', violation_weight: 'high', citation_reference: 'OAC 5101:2-12-19', inspection_frequency: 'annual' },
    { state_code: 'OH', state_name: 'Ohio', regulation_category: 'Staff Ratios', requirement_text: 'Preschool (3-4 years): 1:12 staff-to-child ratio required', violation_weight: 'high', citation_reference: 'OAC 5101:2-12-19', inspection_frequency: 'annual' },
    { state_code: 'OH', state_name: 'Ohio', regulation_category: 'Background Checks', requirement_text: 'BCI&I and FBI background checks required', violation_weight: 'high', citation_reference: 'ORC 5104.013', inspection_frequency: 'annual' },
    
    // GEORGIA
    { state_code: 'GA', state_name: 'Georgia', regulation_category: 'Staff Ratios', requirement_text: 'Infant (0-12 months): 1:6 staff-to-child ratio required', violation_weight: 'high', citation_reference: 'GA Rules 591-1-1-.09', inspection_frequency: 'annual' },
    { state_code: 'GA', state_name: 'Georgia', regulation_category: 'Staff Ratios', requirement_text: 'Toddler (13-24 months): 1:8 staff-to-child ratio required', violation_weight: 'high', citation_reference: 'GA Rules 591-1-1-.09', inspection_frequency: 'annual' },
    { state_code: 'GA', state_name: 'Georgia', regulation_category: 'Staff Ratios', requirement_text: 'Preschool (3-4 years): 1:15 staff-to-child ratio required', violation_weight: 'high', citation_reference: 'GA Rules 591-1-1-.09', inspection_frequency: 'annual' },
    { state_code: 'GA', state_name: 'Georgia', regulation_category: 'Background Checks', requirement_text: 'Georgia Crime Information Center (GCIC) check required', violation_weight: 'high', citation_reference: 'O.C.G.A. §20-1A-30', inspection_frequency: 'annual' },
    
    // NORTH CAROLINA
    { state_code: 'NC', state_name: 'North Carolina', regulation_category: 'Staff Ratios', requirement_text: 'Infant (0-12 months): 1:5 staff-to-child ratio required', violation_weight: 'high', citation_reference: '10A NCAC 09 .0604', inspection_frequency: 'annual' },
    { state_code: 'NC', state_name: 'North Carolina', regulation_category: 'Staff Ratios', requirement_text: 'Toddler (12-24 months): 1:6 staff-to-child ratio required', violation_weight: 'high', citation_reference: '10A NCAC 09 .0604', inspection_frequency: 'annual' },
    { state_code: 'NC', state_name: 'North Carolina', regulation_category: 'Background Checks', requirement_text: 'Criminal background check required for all staff', violation_weight: 'high', citation_reference: 'G.S. 110-90.2', inspection_frequency: 'annual' },
    
    // MICHIGAN
    { state_code: 'MI', state_name: 'Michigan', regulation_category: 'Staff Ratios', requirement_text: 'Infant (0-30 months): 1:4 staff-to-child ratio required', violation_weight: 'high', citation_reference: 'Mich. Admin. Code R 400.8125', inspection_frequency: 'annual' },
    { state_code: 'MI', state_name: 'Michigan', regulation_category: 'Staff Ratios', requirement_text: 'Preschool (30-60 months): 1:10 staff-to-child ratio required', violation_weight: 'high', citation_reference: 'Mich. Admin. Code R 400.8125', inspection_frequency: 'annual' },
    { state_code: 'MI', state_name: 'Michigan', regulation_category: 'Background Checks', requirement_text: 'ICHAT and FBI fingerprint checks required', violation_weight: 'high', citation_reference: 'MCL 722.115b', inspection_frequency: 'annual' }
];

async function seedStateRegulations() {
    try {
        console.log('🌱 Seeding state regulations...');
        
        const checkQuery = 'SELECT COUNT(*) as count FROM state_regulations';
        const checkResult = await pool.query(checkQuery);
        
        if (parseInt(checkResult.rows[0].count) > 0) {
            console.log('ℹ️  State regulations already seeded, skipping...');
            return;
        }
        
        for (const reg of STATE_REGULATIONS) {
            const insertQuery = `
                INSERT INTO state_regulations (id, state_code, state_name, regulation_category, requirement_text, violation_weight, citation_reference, inspection_frequency)
                VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
            `;
            await pool.query(insertQuery, [
                uuidv4(),
                reg.state_code,
                reg.state_name,
                reg.regulation_category,
                reg.requirement_text,
                reg.violation_weight,
                reg.citation_reference,
                reg.inspection_frequency
            ]);
        }
        
        console.log(`✅ Seeded ${STATE_REGULATIONS.length} state regulations across 10 states`);
    } catch (error) {
        console.error('❌ Failed to seed state regulations:', error.message);
        throw error;
    }
}

if (require.main === module) {
    seedStateRegulations()
        .then(() => process.exit(0))
        .catch(() => process.exit(1));
}

module.exports = seedStateRegulations;
