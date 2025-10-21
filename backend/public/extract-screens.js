// Screen Extraction Utility
// Run with: node extract-screens.js

const fs = require('fs');
const path = require('path');

const indexPath = path.join(__dirname, 'index.html');
const partialsDir = path.join(__dirname, 'partials', 'screens');

// Ensure partials/screens directory exists
if (!fs.existsSync(partialsDir)) {
    fs.mkdirSync(partialsDir, { recursive: true });
}

// Read index.html
const indexContent = fs.readFileSync(indexPath, 'utf-8');

// Define screen patterns to extract
const screens = [
    { id: 'dashboard', file: 'dashboard.html' },
    { id: 'licensing', file: 'compliance.html' },
    { id: 'training', file: 'training.html' },
    { id: 'staff', file: 'staff.html' },
    { id: 'incidents', file: 'incidents.html' },
    { id: 'checklist', file: 'checklist.html' },
    { id: 'documents', file: 'documents.html' },
    { id: 'medication', file: 'medication.html' }
];

console.log('Starting screen extraction...\n');

screens.forEach(({ id, file }) => {
    // Find screen start and end
    const screenRegex = new RegExp(`<div id="${id}" class="screen[^>]*>`, 'g');
    const match = screenRegex.exec(indexContent);
    
    if (!match) {
        console.log(`❌ Screen not found: ${id}`);
        return;
    }

    const startIndex = match.index;
    
    // Find the closing div by counting opening and closing divs
    let depth = 0;
    let endIndex = startIndex;
    let inScreen = false;
    
    for (let i = startIndex; i < indexContent.length; i++) {
        if (indexContent.substr(i, 4) === '<div') {
            depth++;
            inScreen = true;
        } else if (indexContent.substr(i, 6) === '</div>') {
            depth--;
            if (inScreen && depth === 0) {
                endIndex = i + 6;
                break;
            }
        }
    }

    if (endIndex === startIndex) {
        console.log(`❌ Could not find end of screen: ${id}`);
        return;
    }

    // Extract the screen HTML
    const screenHtml = indexContent.substring(startIndex, endIndex);
    
    // Remove the outer wrapper div (we only want the content inside the screen div)
    // Find the first closing > of the opening div tag
    const firstClosingBracket = screenHtml.indexOf('>');
    // Find the last </div> closing tag
    const lastOpeningBracket = screenHtml.lastIndexOf('</div>');
    
    // Extract only the inner content (without the screen wrapper div)
    const innerContent = screenHtml.substring(firstClosingBracket + 1, lastOpeningBracket).trim();
    
    // Write to file
    const outputPath = path.join(partialsDir, file);
    fs.writeFileSync(outputPath, innerContent, 'utf-8');
    
    const lines = innerContent.split('\n').length;
    console.log(`✅ Extracted ${id} → ${file} (${lines} lines)`);
});

console.log('\n🎉 Screen extraction complete!');
console.log(`📁 Files saved to: ${partialsDir}`);
