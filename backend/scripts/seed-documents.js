require('dotenv').config();
const supabase = require('../config/supabase');

async function seedDocuments() {
  console.log('🌱 Seeding sample documents...\n');

  const facilityId = '00000000-0000-0000-0000-000000000001';

  const sampleDocuments = [
    // Licensing & Permits
    {
      facility_id: facilityId,
      name: 'Child Care License',
      category: 'Licensing & Permits',
      description: 'Current state childcare operating license',
      file_name: 'childcare-license-2025.pdf',
      file_path: '/uploads/sample/childcare-license-2025.pdf',
      file_size: 245678,
      mime_type: 'application/pdf',
      uploaded_by: 'Jennifer Martinez',
      expiration_date: '2025-12-31',
      tags: ['license', 'required', 'state'],
      form_number: 'PRS-2002'
    },
    {
      facility_id: facilityId,
      name: 'Fire Safety Inspection',
      category: 'Facility & Inspections',
      description: 'Annual fire safety inspection report',
      file_name: 'fire-inspection-2025.pdf',
      file_path: '/uploads/sample/fire-inspection-2025.pdf',
      file_size: 156789,
      mime_type: 'application/pdf',
      uploaded_by: 'Jennifer Martinez',
      expiration_date: '2025-11-15',
      tags: ['fire-safety', 'inspection', 'required'],
      form_number: null
    },
    {
      facility_id: facilityId,
      name: 'Building Occupancy Permit',
      category: 'Licensing & Permits',
      description: 'Certificate of occupancy for facility',
      file_name: 'occupancy-permit.pdf',
      file_path: '/uploads/sample/occupancy-permit.pdf',
      file_size: 123456,
      mime_type: 'application/pdf',
      uploaded_by: 'Jennifer Martinez',
      expiration_date: '2026-06-30',
      tags: ['permit', 'building'],
      form_number: null
    },

    // Staff Records
    {
      facility_id: facilityId,
      name: 'Emily Rodriguez - CPR Certification',
      category: 'Staff Records',
      description: 'CPR certification for Lead Teacher',
      file_name: 'emily-rodriguez-cpr-cert.pdf',
      file_path: '/uploads/sample/emily-cpr.pdf',
      file_size: 89234,
      mime_type: 'application/pdf',
      uploaded_by: 'Jennifer Martinez',
      expiration_date: '2025-11-15',
      tags: ['cpr', 'certification', 'staff'],
      form_number: null
    },
    {
      facility_id: facilityId,
      name: 'David Martinez - Background Check',
      category: 'Staff Records',
      description: 'Criminal background check clearance',
      file_name: 'david-martinez-background.pdf',
      file_path: '/uploads/sample/david-background.pdf',
      file_size: 234567,
      mime_type: 'application/pdf',
      uploaded_by: 'Jennifer Martinez',
      expiration_date: '2026-03-10',
      tags: ['background-check', 'staff', 'required'],
      form_number: null
    },
    {
      facility_id: facilityId,
      name: 'Sarah Johnson - First Aid Certificate',
      category: 'Staff Records',
      description: 'Current first aid certification',
      file_name: 'sarah-first-aid.pdf',
      file_path: '/uploads/sample/sarah-first-aid.pdf',
      file_size: 91234,
      mime_type: 'application/pdf',
      uploaded_by: 'Jennifer Martinez',
      expiration_date: '2025-11-28',
      tags: ['first-aid', 'certification', 'staff'],
      form_number: null
    },

    // Health & Safety
    {
      facility_id: facilityId,
      name: 'Health & Safety Plan',
      category: 'Health & Safety',
      description: 'Facility health and safety procedures',
      file_name: 'health-safety-plan-2025.pdf',
      file_path: '/uploads/sample/health-safety-plan.pdf',
      file_size: 567890,
      mime_type: 'application/pdf',
      uploaded_by: 'Jennifer Martinez',
      expiration_date: null,
      tags: ['health', 'safety', 'procedures'],
      form_number: 'PRS-3004'
    },
    {
      facility_id: facilityId,
      name: 'Emergency Evacuation Plan',
      category: 'Health & Safety',
      description: 'Emergency evacuation procedures and routes',
      file_name: 'evacuation-plan.pdf',
      file_path: '/uploads/sample/evacuation-plan.pdf',
      file_size: 445678,
      mime_type: 'application/pdf',
      uploaded_by: 'Jennifer Martinez',
      expiration_date: null,
      tags: ['emergency', 'evacuation', 'safety'],
      form_number: 'PRS-3023'
    },

    // Insurance
    {
      facility_id: facilityId,
      name: 'General Liability Insurance',
      category: 'Insurance',
      description: 'Current general liability insurance policy',
      file_name: 'liability-insurance-2025.pdf',
      file_path: '/uploads/sample/liability-insurance.pdf',
      file_size: 334567,
      mime_type: 'application/pdf',
      uploaded_by: 'Jennifer Martinez',
      expiration_date: '2025-12-31',
      tags: ['insurance', 'liability', 'required'],
      form_number: null
    },
    {
      facility_id: facilityId,
      name: 'Property Insurance',
      category: 'Insurance',
      description: 'Building and property insurance coverage',
      file_name: 'property-insurance-2025.pdf',
      file_path: '/uploads/sample/property-insurance.pdf',
      file_size: 298765,
      mime_type: 'application/pdf',
      uploaded_by: 'Jennifer Martinez',
      expiration_date: '2026-01-15',
      tags: ['insurance', 'property'],
      form_number: null
    },

    // Children
    {
      facility_id: facilityId,
      name: 'Enrollment Agreement Template',
      category: 'Children',
      description: 'Standard parent enrollment agreement form',
      file_name: 'enrollment-agreement-template.pdf',
      file_path: '/uploads/sample/enrollment-template.pdf',
      file_size: 189234,
      mime_type: 'application/pdf',
      uploaded_by: 'Jennifer Martinez',
      expiration_date: null,
      tags: ['enrollment', 'template', 'children'],
      form_number: 'PRS-2105'
    },
    {
      facility_id: facilityId,
      name: 'Immunization Policy',
      category: 'Children',
      description: 'Required immunization policy and tracking procedures',
      file_name: 'immunization-policy.pdf',
      file_path: '/uploads/sample/immunization-policy.pdf',
      file_size: 145678,
      mime_type: 'application/pdf',
      uploaded_by: 'Jennifer Martinez',
      expiration_date: null,
      tags: ['immunization', 'health', 'policy'],
      form_number: 'PRS-2301'
    }
  ];

  try {
    console.log(`Inserting ${sampleDocuments.length} sample documents...\n`);
    
    const { data, error } = await supabase
      .from('documents')
      .insert(sampleDocuments)
      .select();

    if (error) {
      console.error('❌ Error inserting documents:', error);
      
      // Check if the table needs columns added
      if (error.message.includes('column') && error.message.includes('does not exist')) {
        console.log('\n⚠️  The documents table is missing some columns.');
        console.log('📝 Run this SQL in your Supabase SQL Editor:\n');
        console.log(`
ALTER TABLE documents 
ADD COLUMN IF NOT EXISTS description TEXT,
ADD COLUMN IF NOT EXISTS file_size BIGINT,
ADD COLUMN IF NOT EXISTS mime_type VARCHAR(100),
ADD COLUMN IF NOT EXISTS tags JSONB DEFAULT '[]'::jsonb,
ADD COLUMN IF NOT EXISTS form_number VARCHAR(50);
        `);
      }
      
      process.exit(1);
    }

    console.log(`✅ Successfully inserted ${data.length} documents!\n`);
    console.log('📋 Sample documents by category:');
    
    const byCategory = sampleDocuments.reduce((acc, doc) => {
      if (!acc[doc.category]) acc[doc.category] = 0;
      acc[doc.category]++;
      return acc;
    }, {});

    Object.entries(byCategory).forEach(([category, count]) => {
      console.log(`   ${category}: ${count} document${count > 1 ? 's' : ''}`);
    });

    console.log('\n✅ Document seeding complete! Refresh your Document Vault page.\n');
  } catch (error) {
    console.error('❌ Unexpected error:', error);
    process.exit(1);
  }
}

seedDocuments();
