#!/usr/bin/env node
/**
 * Generate minimal test images for KYC file uploads.
 * Works without external dependencies - creates valid JPEG/PNG files.
 * 
 * Usage: node create-test-images.js
 */

const fs = require('fs');
const path = require('path');

const OUTPUT_DIR = 'testdata/admin/documents';

/**
 * Minimal valid JPEG (1x1 white pixel)
 * This is a real JPEG file that can be uploaded and processed
 */
const MINIMAL_JPEG_BASE64 = 
  '/9j/4AAQSkZJRgABAQEAYABgAAD/2wBDAAgGBgcGBQgHBwcJCQgKDBQNDAsLDBkSEw8UHRofHh0aHBwgJC4nICIsIxwcKDcpLDAxNDQ0Hyc5PTgyPC4zNDL/2wBDAQkJCQwLDBgNDRgyIRwhMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjL/wAARCAABAAEDASIAAhEBAxEB/8QAFQABAQAAAAAAAAAAAAAAAAAAAAv/xAAhEAACAQMEAgMBAAAAAAAAAAABAgADBBESITFBUWEicYGR/8QAFQEBAQAAAAAAAAAAAAAAAAAAAAX/xAAYEQEBAQEBAAAAAAAAAAAAAAAEAQIR/9oADAMBAAIRAxEAPwCdl//Z';

/**
 * Minimal valid PNG (1x1 white pixel)
 * This is a real PNG file that can be uploaded and processed
 */
const MINIMAL_PNG_BASE64 = 
  'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEBQIAX8jx0gAAAABJRU5ErkJggg==';

/**
 * Minimal valid PDF
 * This is a real PDF file with text "SAMPLE SIGNATURE"
 */
const MINIMAL_PDF_BASE64 = 
  'JVBERi0xLjQKJeLjz9ENDQoxIDAgb2JqCjw8IC9UeXBlIC9DYXRhbG9nIC9QYWdlcyAyIDAgUiA+PgplbmRvYgoyIDAgb2JqCjw8IC9UeXBlIC9QYWdlcyAvS2lkcyBbMyAwIFJdIC9Db3VudCAxID4+CmVuZG9iCjMgMCBvYmoKPDwgL1R5cGUgL1BhZ2UgL1BhcmVudCAyIDAgUiAvUmVzb3VyY2VzIDw8IC9Gb250IDw8IC9GMSA0IDAgUiA+PiA+PiAvTWVkaWFCb3ggWzAgMCA2MTIgNzkyXSAvQ29udGVudHMgNSAwIFIgPj4KZW5kb2JKCjQgMCBvYmoKPDwgL1R5cGUgL0ZvbnQgL1N1YnR5cGUgL1R5cGUxIC9CYXNlRm9udCAvSGVsdmV0aWNhIC9FbmNvZGluZyAvV2luQW5zaUVuY29kaW5nID4+CmVuZG9iCjUgMCBvYmoKPDwgL0xlbmd0aCA1NiA+PgpzdHJlYW0KQlQgL0YxIDEyIFRmIDEwMCA3NTAgVGQgKFNBTVBMRSBTSUdOQVRVUkUpIFRqIEVUCmVuZHN0cmVhbQplbmRvYgp4cmVmCjAgNgowMDAwMDAwMDAwIDY1NTM1IGYgCjAwMDAwMDAwMDkgMDAwMDAgbiAKMDAwMDAwMDA3NyAwMDAwMCBuIAowMDAwMDAwMTM2IDAwMDAwIG4gCjAwMDAwMDAzMzggMDAwMDAgbiAKMDAwMDAwMDQ1MSAwMDAwMCBuIAp0cmFpbGVyCjw8IC9TaXplIDYgL1Jvb3QgMSAwIFIgPj4Kc3RhcnR4cmVmCjU1OQolJUVPRg==';

function decodeBase64(base64, filePath) {
  const buffer = Buffer.from(base64, 'base64');
  fs.writeFileSync(filePath, buffer);
  return filePath;
}

function main() {
  console.log('Generating test documents for KYC file uploads...\n');
  
  // Create directory
  if (!fs.existsSync(OUTPUT_DIR)) {
    fs.mkdirSync(OUTPUT_DIR, { recursive: true });
    console.log(`✓ Created directory: ${OUTPUT_DIR}\n`);
  }
  
  try {
    // Create PAN card JPEG
    const panPath = path.join(OUTPUT_DIR, 'pan-sample.jpg');
    decodeBase64(MINIMAL_JPEG_BASE64, panPath);
    console.log(`✓ Created ${panPath}`);
    
    // Create Aadhaar PNG
    const aadhaarPath = path.join(OUTPUT_DIR, 'aadhaar-sample.png');
    decodeBase64(MINIMAL_PNG_BASE64, aadhaarPath);
    console.log(`✓ Created ${aadhaarPath}`);
    
    // Create Signature PDF
    const signaturePath = path.join(OUTPUT_DIR, 'signature-sample.pdf');
    decodeBase64(MINIMAL_PDF_BASE64, signaturePath);
    console.log(`✓ Created ${signaturePath}`);
    
    console.log('\n✓ All test documents created successfully!');
    console.log('\nNext steps:');
    console.log('1. Verify files exist in testdata/admin/documents/');
    console.log('2. Run tests: npm run test:admin:uat');
    console.log('3. Check console output for upload status:\n');
    console.log('   ↗ Uploading PAN card: ...');
    console.log('   ✓ PAN card uploaded successfully');
    
  } catch (err) {
    console.error(`\n✗ Error creating test documents: ${err.message}`);
    process.exit(1);
  }
}

main();
