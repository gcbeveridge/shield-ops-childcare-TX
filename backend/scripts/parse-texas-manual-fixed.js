const fs = require('fs');
const pdfParse = require('pdf-parse');
const supabase = require('../config/supabase');

async function parseManual() {
  console.log('📖 Reading Texas Minimum Standards PDF...\n');

  try {
    const dataBuffer = fs.readFileSync('../data/texas-minimum-standards.pdf');
    const data = await pdfParse(dataBuffer);
    
    console.log(`📄 Pages: ${data.numpages}`);
    console.log(`📝 Total text length: ${data.text.length} characters\n`);
    
    const text = data.text;
    const sectionPattern = /§\s*746\.(\d+)\s+([^\n]+)/g;
    const matches = [...text.matchAll(sectionPattern)];
    
    console.log(`🔍 Found ${matches.length} regulation matches\n`);
    
    const sections = [];
    const seenCodes = new Set(); // Track which codes we've already added
    
    for (let i = 0; i < matches.length; i++) {
      const match = matches[i];
      const nextMatch = matches[i + 1];
      
      const code = `§746.${match[1]}`;
      const title = match[2].trim();
      
      // Skip if we've already seen this code
      if (seenCodes.has(code)) {
        console.log(`⏭️  Skipping duplicate: ${code}`);
        continue;
      }
      seenCodes.add(code);
      
      const startIndex = match.index;
      const endIndex = nextMatch ? nextMatch.index : text.length;
      const fullText = text.substring(startIndex, endIndex).trim();
      
      const sectionNum = parseInt(match[1]);
      let category = 'General';
      
      if (sectionNum >= 1201 && sectionNum < 1400) category = 'Staff Requirements';
      else if (sectionNum >= 1401 && sectionNum < 1700) category = 'Staff Training';
      else if (sectionNum >= 1701 && sectionNum < 2100) category = 'Child/Staff Ratios';
      else if (sectionNum >= 2101 && sectionNum < 2400) category = 'Health & Safety';
      else if (sectionNum >= 2401 && sectionNum < 2700) category = 'Daily Operations';
      else if (sectionNum >= 2651 && sectionNum < 2700) category = 'Medication Administration';
      else if (sectionNum >= 2701 && sectionNum < 3000) category = 'Nutrition';
      else if (sectionNum >= 3001 && sectionNum < 3500) category = 'Physical Environment';
      else if (sectionNum >= 3701 && sectionNum < 4000) category = 'Incident Reporting';
      
      sections.push({
        state_code: 'TX',
        code_section: code,
        title: title,
        category: category,
        full_text: fullText.substring(0, 5000),
        summary: fullText.substring(0, 200) + '...'
      });
      
      console.log(`✅ ${code}: ${title} (${category})`);
    }
    
    console.log(`\n📦 ${sections.length} unique sections to upload\n`);
    
    // Clear existing TX regulations first
    console.log('🗑️  Clearing existing TX regulations...');
    await supabase
      .from('regulation_sections')
      .delete()
      .eq('state_code', 'TX');
    
    console.log('✅ Cleared. Now uploading...\n');
    
    // Upload in batches of 50
    const batchSize = 50;
    let uploaded = 0;
    let errors = 0;
    
    for (let i = 0; i < sections.length; i += batchSize) {
      const batch = sections.slice(i, i + batchSize);
      
      const { data, error } = await supabase
        .from('regulation_sections')
        .insert(batch);
      
      if (error) {
        console.error(`❌ Batch ${Math.floor(i / batchSize) + 1} error:`, error.message);
        errors += batch.length;
      } else {
        uploaded += batch.length;
        console.log(`✅ Uploaded batch ${Math.floor(i / batchSize) + 1} (${batch.length} sections)`);
      }
    }
    
    console.log(`\n📊 Upload Summary:`);
    console.log(`   ✅ Success: ${uploaded}`);
    console.log(`   ❌ Errors: ${errors}`);
    console.log(`\n✅ Parse complete!`);
    
  } catch (error) {
    console.error('❌ Error:', error.message);
    console.error(error);
    process.exit(1);
  }
  
  process.exit(0);
}

parseManual();
