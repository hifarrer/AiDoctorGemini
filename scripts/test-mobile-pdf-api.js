/**
 * Test script for the mobile PDF extraction API
 * Usage: node scripts/test-mobile-pdf-api.js
 */

const fs = require('fs');
const path = require('path');
const FormData = require('form-data');

async function testMobilePDFAPI() {
  try {
    console.log('🧪 Testing Mobile PDF Extraction API...\n');

    // Check if we have a test PDF file
    const testPdfPath = path.join(__dirname, '..', 'public', 'test.pdf');
    
    if (!fs.existsSync(testPdfPath)) {
      console.log('❌ No test PDF found. Please place a test.pdf file in the public directory.');
      console.log('   You can use any PDF file for testing.');
      return;
    }

    // Create form data
    const formData = new FormData();
    formData.append('file', fs.createReadStream(testPdfPath));

    // Make request to the API
    const response = await fetch('http://localhost:3000/api/mobile/pdf-extract', {
      method: 'POST',
      body: formData,
      headers: {
        // Note: Don't set Content-Type header, let FormData set it with boundary
        'Authorization': 'Bearer your-test-token' // You'll need to replace this with actual auth
      }
    });

    const result = await response.json();

    if (response.ok) {
      console.log('✅ API Response:');
      console.log(`   Filename: ${result.filename}`);
      console.log(`   File Size: ${result.fileSize} bytes`);
      console.log(`   Page Count: ${result.pageCount}`);
      console.log(`   Character Count: ${result.characterCount}`);
      console.log(`   Text Preview: ${result.extractedText.substring(0, 200)}...`);
      
      if (result.pageTexts && result.pageTexts.length > 0) {
        console.log(`   Pages Extracted: ${result.pageTexts.length}`);
      }
    } else {
      console.log('❌ API Error:');
      console.log(`   Status: ${response.status}`);
      console.log(`   Error: ${result.error}`);
      if (result.details) {
        console.log(`   Details: ${result.details}`);
      }
    }

  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
}

// Run the test
testMobilePDFAPI();
