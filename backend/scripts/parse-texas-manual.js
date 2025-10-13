const fs = require('fs');
const pdf = require('pdf-parse');
const supabase = require('../config/supabase');

async function parseManual() {
  console.log('📖 Reading Texas Minimum Standards PDF...\n');

  try {
    // Read PDF file
    const pdfPath = './data/texas-minimum-standards.pdf';
    
    if (!fs.existsSync(pdfPath)) {
      console.error('❌ PDF file not found at:', pdfPath);
      process.exit(1);
    }
    
    const dataBuffer = fs.readFileSync(pdfPath);
    const data = await pdf(dataBuffer);
    
    console.log(`📄 Pages: ${data.numpages}`);
    console.log(`📝 Total text length: ${data.text.length} characters\n`);
    
    // Split text into sections based on section numbers (§746.xxxx or §744.xxxx)
    const sectionPattern = /§\s*(74[46])\.(\d+)\s+([^\n]+)/g;
    const sections = [];
    
    const text = data.text;
    const matches = [...text.matchAll(sectionPattern)];
    
    console.log(`🔍 Found ${matches.length} regulation sections\n`);
    
    for (let i = 0; i < matches.length; i++) {
      const match = matches[i];
      const nextMatch = matches[i + 1];
      
      const chapter = match[1]; // 744 or 746
      const sectionNum = match[2];
      const code = `§${chapter}.${sectionNum}`;
      const title = match[3].trim();
      
      // Extract text from this section to the next section
      const startIndex = match.index;
      const endIndex = nextMatch ? nextMatch.index : Math.min(startIndex + 5000, text.length);
      const fullText = text.substring(startIndex, endIndex).trim();
      
      // Categorize by section number ranges
      const num = parseInt(sectionNum);
      let category = 'General';
      
      if (chapter === '746') {
        if (num >= 1201 && num < 1400) category = 'Staff Requirements';
        else if (num >= 1401 && num < 1700) category = 'Staff Training';
        else if (num >= 1701 && num < 2100) category = 'Child/Staff Ratios';
        else if (num >= 2101 && num < 2400) category = 'Health & Safety';
        else if (num >= 2401 && num < 2700) category = 'Daily Operations';
        else if (num >= 2651 && num < 2700) category = 'Medication Administration';
        else if (num >= 2701 && num < 3000) category = 'Nutrition';
        else if (num >= 3001 && num < 3500) category = 'Physical Environment';
        else if (num >= 3701 && num < 4000) category = 'Incident Reporting';
      } else if (chapter === '744') {
        // Chapter 744 is also child care regulations
        if (num >= 2650 && num < 2670) category = 'Medication Administration';
        else if (num >= 1000 && num < 1500) category = 'Licensing Requirements';
        else if (num >= 2000 && num < 2500) category = 'Health & Safety';
      }
      
      // Create summary from first paragraph (up to 300 chars)
      const firstParagraph = fullText.split('\n\n')[0] || fullText;
      const summary = firstParagraph.length > 300 
        ? firstParagraph.substring(0, 297) + '...'
        : firstParagraph;
      
      sections.push({
        state_code: 'TX',
        code_section: code,
        title: title,
        category: category,
        full_text: fullText.substring(0, 10000), // Limit to 10k chars
        summary: summary
      });
      
      console.log(`✅ ${code}: ${title} (${category})`);
    }
    
    if (sections.length === 0) {
      console.log('\n⚠️  No sections found. The PDF may use a different format.');
      console.log('Showing first 500 characters of PDF text for debugging:\n');
      console.log(text.substring(0, 500));
      process.exit(1);
    }
    
    console.log(`\n📦 Uploading ${sections.length} sections to Supabase...\n`);
    
    // Upload to Supabase in batches of 50
    const batchSize = 50;
    let uploaded = 0;
    let errors = 0;
    
    for (let i = 0; i < sections.length; i += batchSize) {
      const batch = sections.slice(i, i + batchSize);
      
      const { data, error } = await supabase
        .from('regulation_sections')
        .upsert(batch, { onConflict: 'code_section' });
      
      if (error) {
        console.error(`❌ Batch ${i / batchSize + 1} error:`, error.message);
        errors += batch.length;
      } else {
        uploaded += batch.length;
        console.log(`✅ Uploaded batch ${i / batchSize + 1} (${batch.length} sections)`);
      }
    }
    
    console.log(`\n📊 Upload Summary:`);
    console.log(`   ✅ Success: ${uploaded}`);
    console.log(`   ❌ Errors: ${errors}`);
    console.log(`\n✅ Parse complete!`);
    
  } catch (error) {
    console.error('❌ Error:', error.message);
    console.error(error.stack);
    process.exit(1);
  }
  
  process.exit(0);
}

parseManual();
