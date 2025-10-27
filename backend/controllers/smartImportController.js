const supabase = require('../config/supabase');
const Anthropic = require('@anthropic-ai/sdk');
const XLSX = require('xlsx');
const Papa = require('papaparse');
const pdf = require('pdf-parse');

// Initialize Anthropic client
const anthropic = new Anthropic({
    apiKey: process.env.ANTHROPIC_API_KEY
});

/**
 * Smart Import Controller
 * Uses Claude AI to parse any file format and extract structured data
 */

async function parseFileWithAI(req, res) {
    try {
        const { facilityId, importType } = req.params; // 'staff' or 'medications'

        if (!req.file) {
            return res.status(400).json({
                success: false,
                message: 'No file uploaded'
            });
        }

        console.log('🤖 Smart Import started:', {
            type: importType,
            fileName: req.file.originalname,
            mimeType: req.file.mimetype,
            size: req.file.size
        });

        let extractedText = '';
        let rawData = null;

        // Step 1: Extract data based on file type
        const fileExt = req.file.originalname.split('.').pop().toLowerCase();

        try {
            if (fileExt === 'csv') {
                // Parse CSV
                const csvText = req.file.buffer.toString('utf-8');
                const parsed = Papa.parse(csvText, {
                    header: true,
                    skipEmptyLines: true,
                    transformHeader: (header) => header.trim()
                });
                rawData = parsed.data.filter(row => Object.values(row).some(val => val && val.toString().trim().length > 0));
                extractedText = JSON.stringify(rawData, null, 2);
                console.log('📊 CSV parsed:', rawData.length, 'rows');

            } else if (fileExt === 'xlsx' || fileExt === 'xls') {
                // Parse Excel
                const workbook = XLSX.read(req.file.buffer, { type: 'buffer' });
                const sheetName = workbook.SheetNames[0];
                const worksheet = workbook.Sheets[sheetName];
                rawData = XLSX.utils.sheet_to_json(worksheet, { defval: '' });
                rawData = rawData.filter(row => Object.values(row).some(val => val && val.toString().trim().length > 0));
                extractedText = JSON.stringify(rawData, null, 2);
                console.log('📊 Excel parsed:', rawData.length, 'rows');

            } else if (fileExt === 'pdf') {
                // Parse PDF
                const pdfData = await pdf(req.file.buffer);
                extractedText = pdfData.text;
                console.log('📄 PDF parsed:', extractedText.length, 'characters');

            } else if (fileExt === 'txt') {
                // Plain text
                extractedText = req.file.buffer.toString('utf-8');
                console.log('📝 Text file parsed:', extractedText.length, 'characters');

            } else if (req.file.mimetype.startsWith('image/')) {
                return res.status(400).json({
                    success: false,
                    message: 'Image parsing not yet implemented. Please use CSV, Excel, PDF, or TXT files.'
                });
            } else {
                return res.status(400).json({
                    success: false,
                    message: 'Unsupported file format. Please use CSV, Excel, PDF, or TXT files.'
                });
            }

            // Validate we have some content
            if (!extractedText || extractedText.trim().length === 0) {
                return res.status(400).json({
                    success: false,
                    message: 'The file appears to be empty or could not be read. Please check the file and try again.'
                });
            }

            if (rawData && rawData.length === 0) {
                return res.status(400).json({
                    success: false,
                    message: 'No data rows found in the file. Please ensure the file contains data with headers.'
                });
            }

        } catch (fileParseError) {
            console.error('❌ File parsing error:', fileParseError);
            return res.status(500).json({
                success: false,
                message: 'Failed to read the file. The file may be corrupted or in an unexpected format.',
                error: fileParseError.message
            });
        }

        // Step 2: Build AI prompt based on import type
        let systemPrompt = '';
        let userPrompt = '';

        if (importType === 'staff') {
            systemPrompt = `You are an expert data extraction AI for childcare facilities. Extract staff information from the provided data and return a JSON array.

Each staff member object should have these fields:
- name (string, required): Full name
- role (string, required): Job title/role (e.g., "Lead Teacher", "Director", "Assistant")
- email (string, optional): Email address
- phone (string, optional): Phone number
- certifications (array of strings, optional): Any certifications mentioned
- hireDate (string, optional): Hire date in YYYY-MM-DD format
- status (string): "active" or "inactive"

Return ONLY a valid JSON array. No markdown, no explanation, just the array.`;

            userPrompt = `Extract all staff members from this data:\n\n${extractedText}\n\nReturn a JSON array of staff objects.`;

        } else if (importType === 'medications') {
            systemPrompt = `You are an expert data extraction AI for childcare medication tracking. Extract medication authorization information and return a JSON array.

Each medication object should have these fields:
- childName (string, required): Child's full name
- medicationName (string, required): Name of medication
- dosage (string, required): Dosage amount (e.g., "5mg", "1 tsp")
- route (string, required): Administration route (e.g., "oral", "topical", "inhaled")
- frequency (string, required): How often (e.g., "twice daily", "as needed", "every 4 hours")
- startDate (string, optional): Start date in YYYY-MM-DD format
- endDate (string, optional): End date in YYYY-MM-DD format
- prescribedBy (string, optional): Prescriber name
- specialInstructions (string, optional): Any special instructions

Return ONLY a valid JSON array. No markdown, no explanation, just the array.`;

            userPrompt = `Extract all medication authorizations from this data:\n\n${extractedText}\n\nReturn a JSON array of medication objects.`;

        } else if (importType === 'incidents') {
            systemPrompt = `You are an expert data extraction AI for childcare incident reporting. Extract incident report information and return a JSON array.

Each incident object should have these fields:
- childName (string, required): Child's full name
- childAge (number, optional): Child's age
- type (string, required): Incident type - must be one of: "injury", "illness", "behavior", "other"
- severity (string, required): Severity level - must be one of: "minor", "moderate", "major", "critical"
- date (string, optional): Incident date in YYYY-MM-DD format (default to today)
- time (string, optional): Time in HH:MM format (24-hour)
- location (string, optional): Where incident occurred
- description (string, required): What happened
- actionTaken (string, optional): Actions taken in response
- witnesses (array of strings, optional): Names of witnesses
- staffInvolved (array of strings, optional): Names of staff involved

Return ONLY a valid JSON array. No markdown, no explanation, just the array.`;

            userPrompt = `Extract all incident reports from this data:\n\n${extractedText}\n\nReturn a JSON array of incident objects.`;
        }

        // Step 3: Call Claude API
        console.log('🤖 Calling Claude API for parsing...');

        let aiResponse;
        try {
            const message = await anthropic.messages.create({
                model: 'claude-sonnet-4-20250514',
                max_tokens: 4096,
                temperature: 0,
                system: systemPrompt,
                messages: [
                    {
                        role: 'user',
                        content: userPrompt
                    }
                ]
            });

            aiResponse = message.content[0].text;
            console.log('🤖 Claude response received:', aiResponse.substring(0, 200) + '...');

        } catch (apiError) {
            console.error('❌ Claude API error:', apiError);

            // If API fails but we have structured raw data, try to use it directly
            if (rawData && Array.isArray(rawData) && rawData.length > 0) {
                console.log('⚠️ API failed, falling back to direct data extraction');
                // Continue to parsing section which will handle raw data fallback
                aiResponse = '[]'; // Empty response to trigger fallback
            } else {
                return res.status(500).json({
                    success: false,
                    message: 'AI service temporarily unavailable. Please try again or use a CSV file with clear headers.',
                    error: apiError.message
                });
            }
        }

        // Step 4: Parse AI response with robust error handling
        let parsedData;
        try {
            // Remove markdown code blocks if present
            let cleanedResponse = aiResponse.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();

            // Try to extract JSON array if wrapped in text
            const jsonArrayMatch = cleanedResponse.match(/\[[\s\S]*\]/);
            if (jsonArrayMatch) {
                cleanedResponse = jsonArrayMatch[0];
            }

            parsedData = JSON.parse(cleanedResponse);

            if (!Array.isArray(parsedData)) {
                // If it's a single object, wrap it in an array
                parsedData = [parsedData];
            }

            // Filter out invalid/empty records
            parsedData = parsedData.filter(record => {
                if (!record || typeof record !== 'object') return false;

                if (importType === 'staff') {
                    return record.name && record.name.trim().length > 0;
                } else if (importType === 'medications') {
                    return record.childName && record.medicationName &&
                        record.childName.trim().length > 0 &&
                        record.medicationName.trim().length > 0;
                } else if (importType === 'incidents') {
                    return record.childName && record.description &&
                        record.childName.trim().length > 0 &&
                        record.description.trim().length > 0;
                }
                return true;
            });

            // If no valid records found, try to extract from raw data
            if (parsedData.length === 0 && rawData && Array.isArray(rawData)) {
                console.log('⚠️ AI parsing returned empty, attempting direct extraction from raw data');
                parsedData = rawData.map(row => {
                    if (importType === 'staff') {
                        return {
                            name: row['Name'] || row['name'] || row['Employee Name'] || row['Full Name'] || '',
                            role: row['Role'] || row['role'] || row['Position'] || row['Job Title'] || '',
                            email: row['Email'] || row['email'] || row['E-mail'] || '',
                            phone: row['Phone'] || row['phone'] || row['Phone Number'] || row['Contact'] || '',
                            status: 'active'
                        };
                    } else if (importType === 'medications') {
                        return {
                            childName: row['Child Name'] || row['Child'] || row['Student'] || '',
                            medicationName: row['Medication'] || row['Medication Name'] || row['Drug'] || '',
                            dosage: row['Dosage'] || row['Dose'] || row['Amount'] || '',
                            frequency: row['Frequency'] || row['Schedule'] || row['How Often'] || 'as directed',
                            route: row['Route'] || 'oral',
                            specialInstructions: row['Instructions'] || row['Notes'] || ''
                        };
                    } else if (importType === 'incidents') {
                        return {
                            childName: row['Child Name'] || row['Child'] || row['Student'] || '',
                            childAge: row['Age'] || row['Child Age'] || null,
                            type: row['Type'] || row['Incident Type'] || 'other',
                            severity: row['Severity'] || row['Severity Level'] || 'minor',
                            date: row['Date'] || row['Incident Date'] || null,
                            time: row['Time'] || row['Incident Time'] || null,
                            location: row['Location'] || row['Where'] || '',
                            description: row['Description'] || row['What Happened'] || row['Details'] || '',
                            actionTaken: row['Action Taken'] || row['Response'] || row['Actions'] || '',
                            witnesses: row['Witnesses'] ? row['Witnesses'].split(',').map(w => w.trim()) : [],
                            staffInvolved: row['Staff Involved'] || row['Staff'] ? (row['Staff Involved'] || row['Staff']).split(',').map(s => s.trim()) : []
                        };
                    }
                    return null;
                }).filter(record => record && Object.values(record).some(v => v && v.toString().trim().length > 0));
            }

            // Ensure all records have required fields with defaults
            parsedData = parsedData.map(record => {
                if (importType === 'staff') {
                    return {
                        name: record.name || 'Unknown',
                        role: record.role || 'Staff',
                        email: record.email || '',
                        phone: record.phone || '',
                        certifications: Array.isArray(record.certifications) ? record.certifications : [],
                        hireDate: record.hireDate || null,
                        status: record.status || 'active'
                    };
                } else if (importType === 'medications') {
                    return {
                        childName: record.childName || 'Unknown',
                        medicationName: record.medicationName || 'Unknown',
                        dosage: record.dosage || 'As prescribed',
                        route: record.route || 'oral',
                        frequency: record.frequency || 'as directed',
                        startDate: record.startDate || null,
                        endDate: record.endDate || null,
                        prescribedBy: record.prescribedBy || '',
                        specialInstructions: record.specialInstructions || ''
                    };
                } else if (importType === 'incidents') {
                    return {
                        childName: record.childName || 'Unknown',
                        childAge: record.childAge || null,
                        type: record.type || 'other',
                        severity: record.severity || 'minor',
                        date: record.date || null,
                        time: record.time || null,
                        location: record.location || 'Facility',
                        description: record.description || 'No description provided',
                        actionTaken: record.actionTaken || 'Documented',
                        witnesses: Array.isArray(record.witnesses) ? record.witnesses : [],
                        staffInvolved: Array.isArray(record.staffInvolved) ? record.staffInvolved : []
                    };
                }
                return record;
            });

            if (parsedData.length === 0) {
                console.log('⚠️ No valid records found after parsing');
                return res.status(400).json({
                    success: false,
                    message: 'No valid data found in the file. Please check the file format and try again.',
                    hint: 'The file should contain recognizable column names like "Name", "Email", "Child Name", "Medication", etc.'
                });
            }

            console.log('✅ Successfully parsed', parsedData.length, 'records');

        } catch (parseError) {
            console.error('❌ Failed to parse AI response:', parseError);

            // Last resort: try to extract from raw data if available
            if (rawData && Array.isArray(rawData) && rawData.length > 0) {
                console.log('⚠️ Falling back to direct raw data extraction');
                try {
                    parsedData = rawData.map(row => {
                        if (importType === 'staff') {
                            const name = Object.values(row).find(v => v && typeof v === 'string' && v.length > 2) || 'Unknown';
                            return {
                                name: name,
                                role: row['Role'] || row['Position'] || 'Staff',
                                email: row['Email'] || '',
                                phone: row['Phone'] || '',
                                status: 'active'
                            };
                        } else if (importType === 'medications') {
                            const values = Object.values(row).filter(v => v && typeof v === 'string' && v.trim().length > 0);
                            return {
                                childName: values[0] || 'Unknown',
                                medicationName: values[1] || 'Unknown',
                                dosage: values[2] || 'As prescribed',
                                frequency: values[3] || 'as directed',
                                route: 'oral'
                            };
                        }
                        return null;
                    }).filter(r => r);

                    if (parsedData.length > 0) {
                        console.log('✅ Extracted', parsedData.length, 'records from raw data');
                    }
                } catch (fallbackError) {
                    console.error('❌ Fallback extraction also failed:', fallbackError);
                }
            }

            if (!parsedData || parsedData.length === 0) {
                return res.status(500).json({
                    success: false,
                    message: 'Could not parse the file. Please ensure the file contains valid data with clear column headers.',
                    error: parseError.message,
                    suggestion: 'Try using a CSV file with headers like: Name, Role, Email, Phone (for staff) or Child Name, Medication, Dosage, Frequency (for medications)'
                });
            }
        }

        // Step 5: Return parsed data for verification
        res.json({
            success: true,
            message: `Parsed ${parsedData.length} ${importType} records`,
            data: parsedData,
            metadata: {
                fileName: req.file.originalname,
                fileType: fileExt,
                recordCount: parsedData.length,
                importType
            }
        });

    } catch (error) {
        console.error('❌ Smart import error:', error);
        res.status(500).json({
            success: false,
            message: 'Error processing file',
            error: error.message
        });
    }
}

async function bulkImportStaff(req, res) {
    try {
        const { facilityId } = req.params;
        const { data: staffData } = req.body;

        if (!staffData || !Array.isArray(staffData)) {
            return res.status(400).json({
                success: false,
                message: 'Invalid data format. Expected array of staff records.'
            });
        }

        console.log(`📥 Bulk importing ${staffData.length} staff members for facility ${facilityId}`);

        const results = {
            success: 0,
            failed: 0,
            errors: []
        };

        // Process each staff member
        for (let i = 0; i < staffData.length; i++) {
            const staff = staffData[i];

            try {
                // Transform to match Supabase schema
                const staffRecord = {
                    facility_id: facilityId,
                    name: staff.name,
                    role: staff.role || 'Staff',
                    email: staff.email || null,
                    phone: staff.phone || null,
                    certifications: staff.certifications || [],
                    hire_date: staff.hireDate || null,
                    status: staff.status || 'active',
                    emergency_contact: staff.emergencyContact || null,
                    notes: staff.notes || null
                };

                // Validate required fields
                if (!staffRecord.name) {
                    throw new Error('Name is required');
                }

                const { error } = await supabase
                    .from('staff')
                    .insert(staffRecord);

                if (error) throw error;

                results.success++;
                console.log(`✅ Imported: ${staff.name}`);

            } catch (error) {
                console.error(`❌ Failed to import row ${i + 1}:`, error.message);
                results.failed++;
                results.errors.push({
                    row: staff.name || `Row ${i + 1}`,
                    error: error.message
                });
            }
        }

        console.log('📊 Bulk staff import complete:', results);

        res.json({
            success: true,
            message: `Imported ${results.success} staff members, ${results.failed} failed`,
            ...results
        });

    } catch (error) {
        console.error('❌ Error in bulk staff import:', error);
        res.status(500).json({
            success: false,
            message: 'Error importing staff',
            error: error.message
        });
    }
}

async function bulkImportMedications(req, res) {
    try {
        const { facilityId } = req.params;
        const { data: medicationData } = req.body;

        if (!medicationData || !Array.isArray(medicationData)) {
            return res.status(400).json({
                success: false,
                message: 'Invalid data format. Expected array of medication records.'
            });
        }

        console.log(`📥 Bulk importing ${medicationData.length} medications for facility ${facilityId}`);

        const results = {
            success: 0,
            failed: 0,
            errors: []
        };

        // Process each medication
        for (let i = 0; i < medicationData.length; i++) {
            const med = medicationData[i];

            try {
                // Transform to match Supabase schema
                const medicationRecord = {
                    facility_id: facilityId,
                    child_name: med.childName,
                    medication_name: med.medicationName,
                    dosage: med.dosage,
                    route: med.route || 'oral',
                    frequency: med.frequency,
                    start_date: med.startDate || null,
                    end_date: med.endDate || null,
                    prescriber_info: med.prescribedBy ? { name: med.prescribedBy } : null,
                    special_instructions: med.specialInstructions || null,
                    parent_authorization: med.parentAuthorization || {
                        signedAt: new Date().toISOString(),
                        signedBy: 'Imported via Smart Import',
                        relationship: 'Authorized'
                    },
                    active: true
                };

                // Validate required fields
                if (!medicationRecord.child_name || !medicationRecord.medication_name || !medicationRecord.dosage) {
                    throw new Error('Child name, medication name, and dosage are required');
                }

                const { error } = await supabase
                    .from('medications')
                    .insert(medicationRecord);

                if (error) throw error;

                results.success++;
                console.log(`✅ Imported: ${med.medicationName} for ${med.childName}`);

            } catch (error) {
                console.error(`❌ Failed to import row ${i + 1}:`, error.message);
                results.failed++;
                results.errors.push({
                    row: med.childName || `Row ${i + 1}`,
                    error: error.message
                });
            }
        }

        console.log('📊 Bulk medication import complete:', results);

        res.json({
            success: true,
            message: `Imported ${results.success} medications, ${results.failed} failed`,
            ...results
        });

    } catch (error) {
        console.error('❌ Error in bulk medication import:', error);
        res.status(500).json({
            success: false,
            message: 'Error importing medications',
            error: error.message
        });
    }
}

async function bulkImportIncidents(req, res) {
    try {
        const { facilityId } = req.params;
        const { data: incidentData } = req.body;

        if (!incidentData || !Array.isArray(incidentData)) {
            return res.status(400).json({
                success: false,
                message: 'Invalid data format. Expected array of incident records.'
            });
        }

        console.log(`📥 Bulk importing ${incidentData.length} incidents for facility ${facilityId}`);

        const results = {
            success: 0,
            failed: 0,
            errors: []
        };

        // Process each incident
        for (let i = 0; i < incidentData.length; i++) {
            const incident = incidentData[i];

            try {
                // Transform to match Supabase schema
                const incidentRecord = {
                    facility_id: facilityId,
                    type: incident.type || 'other',
                    severity: incident.severity || 'minor',
                    child_info: {
                        name: incident.childName,
                        age: incident.childAge || null
                    },
                    location: incident.location || 'Facility',
                    description: incident.description,
                    immediate_actions: incident.actionTaken || 'Incident reported and documented',
                    occurred_at: incident.date && incident.time
                        ? `${incident.date}T${incident.time}:00`
                        : new Date().toISOString(),
                    reported_by: incident.staffInvolved && incident.staffInvolved.length > 0
                        ? incident.staffInvolved[0]
                        : null,
                    parent_notified: incident.parentNotified !== false,
                    parent_signature: incident.parentSignature || null
                };

                // Validate required fields
                if (!incidentRecord.child_info.name || !incidentRecord.description) {
                    throw new Error('Child name and description are required');
                }

                const { error } = await supabase
                    .from('incidents')
                    .insert(incidentRecord);

                if (error) throw error;

                results.success++;
                console.log(`✅ Imported incident: ${incident.type} - ${incident.childName}`);

            } catch (error) {
                console.error(`❌ Failed to import row ${i + 1}:`, error.message);
                results.failed++;
                results.errors.push({
                    row: incident.childName || `Row ${i + 1}`,
                    error: error.message
                });
            }
        }

        console.log('📊 Bulk incident import complete:', results);

        res.json({
            success: true,
            message: `Imported ${results.success} incidents, ${results.failed} failed`,
            ...results
        });

    } catch (error) {
        console.error('❌ Error in bulk incident import:', error);
        res.status(500).json({
            success: false,
            message: 'Error importing incidents',
            error: error.message
        });
    }
}

module.exports = {
    parseFileWithAI,
    bulkImportStaff,
    bulkImportMedications,
    bulkImportIncidents
};
