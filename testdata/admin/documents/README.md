# Test Documents for KYC Upload

This directory contains sample test documents used for KYC (Know Your Customer) file uploads during automated testing.

## Files Required

1. **pan-sample.jpg** - Sample PAN card document
   - Used for: `TEST_PAN_CARD_PATH` and `UAT_PAN_CARD_PATH` in `.env`
   - Format: JPG/JPEG, PNG, or PDF
   - Purpose: Uploaded during KYC form in the "PAN Card" step

2. **aadhaar-sample.png** - Sample Aadhaar document
   - Used for: `TEST_AADHAAR_PATH` and `UAT_AADHAAR_PATH` in `.env`
   - Format: PNG, JPG/JPEG, or PDF
   - Purpose: Uploaded during "Address and Identity" step in KYC

3. **signature-sample.pdf** - Sample signature document
   - Used for: `TEST_SIGNATURE_PATH` and `UAT_SIGNATURE_PATH` in `.env`
   - Format: PDF, JPG/JPEG, or PNG
   - Purpose: Uploaded during "Personal Details" step in KYC

## Supported File Formats

- **JPG/JPEG** - Recommended for photo documents (PAN, Aadhaar)
- **PNG** - Good for images with transparency
- **PDF** - For scanned documents or signatures

## Setup Instructions

### Option 1: Create Image Files Using Python (Recommended)

```python
from PIL import Image, ImageDraw
import os

os.makedirs('testdata/admin/documents', exist_ok=True)

# Create PAN Card sample (JPG)
img = Image.new('RGB', (400, 250), color='white')
d = ImageDraw.Draw(img)
d.text((50, 50), "SAMPLE PAN CARD", fill='black')
d.text((50, 100), "For Testing Only", fill='gray')
img.save('testdata/admin/documents/pan-sample.jpg')

# Create Aadhaar sample (PNG)
img = Image.new('RGB', (400, 250), color='lightyellow')
d = ImageDraw.Draw(img)
d.text((50, 50), "SAMPLE AADHAAR", fill='black')
d.text((50, 100), "For Testing Only", fill='gray')
img.save('testdata/admin/documents/aadhaar-sample.png')

# Create Signature sample (PDF)
from reportlab.pdfgen import canvas
c = canvas.Canvas('testdata/admin/documents/signature-sample.pdf')
c.drawString(100, 750, "SIGNATURE")
c.drawString(100, 700, "For Testing Only")
c.save()

print("✓ Test documents created successfully!")
```

### Option 2: Manual Creation

1. **Using Online Tools:**
   - Go to any online image creator (e.g., Canva, Pixlr, etc.)
   - Create a simple image with text "SAMPLE PAN CARD" or similar
   - Download as JPG/PNG and save to this directory

2. **Using Office Tools:**
   - Create a document in Word/Google Docs
   - Add text like "Sample PAN Card"
   - Export as PDF

3. **Using ImageMagick (command line):**
   ```bash
   # Create PAN card
   convert -size 400x250 xc:white \
     -pointsize 20 -fill black -annotate +50+50 "SAMPLE PAN CARD" \
     -annotate +50+100 "For Testing Only" \
     pan-sample.jpg
   ```

### Option 3: Copy Existing Images

If you have existing KYC documents, simply copy them to this directory:
```bash
cp /path/to/your/pan.jpg testdata/admin/documents/pan-sample.jpg
cp /path/to/your/aadhaar.png testdata/admin/documents/aadhaar-sample.png
cp /path/to/your/signature.pdf testdata/admin/documents/signature-sample.pdf
```

## Setup Steps

1. **Create the directory:**
   ```bash
   mkdir -p testdata/admin/documents
   ```

2. **Create sample files** (using Python method above or manual method)

3. **Verify paths in `.env`:**
   ```env
   TEST_PAN_CARD_PATH=testdata/admin/documents/pan-sample.jpg
   TEST_AADHAAR_PATH=testdata/admin/documents/aadhaar-sample.png
   TEST_SIGNATURE_PATH=testdata/admin/documents/signature-sample.pdf
   
   UAT_PAN_CARD_PATH=testdata/admin/documents/pan-sample.jpg
   UAT_AADHAAR_PATH=testdata/admin/documents/aadhaar-sample.png
   UAT_SIGNATURE_PATH=testdata/admin/documents/signature-sample.pdf
   ```

## File Upload Behavior

- If file paths are **configured** in `.env`, Playwright will upload them during tests
- If file paths are **missing** in `.env`, uploads are **skipped** (test continues without error)
- If file paths point to **non-existent files**, a warning is logged and upload is skipped
- Path resolution is relative to project root

## Error Handling

The test now includes proper error handling:
- ✓ Checks if files exist before attempting upload
- ✓ Logs descriptive messages about upload status
- ✓ Skips uploads gracefully if files are missing
- ✓ Reports errors with file paths for easy debugging

## Testing with Files

Run tests with file uploads:

```powershell
# PowerShell
$env:TARGET_ENV='uat'; $env:HEADLESS='false'; npx playwright test --project=admin

# Or use npm script
npm run test:admin:uat
```

Check console logs for upload status:
- `↗ Uploading PAN card:` - File upload started
- `✓ PAN card uploaded successfully` - Upload succeeded
- `⚠ PAN card file not found:` - File missing (upload skipped)
- `⊘ PAN card upload skipped` - No path configured

## Troubleshooting

### "File not found" Error
```
⚠ PAN card file not found: C:\project\testdata\admin\documents\pan-sample.jpg
```
**Solution:** Create the file using one of the methods above, or update the path in `.env`

### "File input not found on page" Error
```
⚠ PAN card file input not found on page (selector: xpath=//input[@type='file'])
```
**Solution:** The file input element may have moved on the page. Check with browser DevTools.

### Upload Timeout
If upload takes too long, the test may timeout. Increase timeout in test:
```typescript
test.setTimeout(20 * 60_000); // 20 minutes
```

## Supported File Sizes

- Recommended: < 5MB per file
- Maximum: Depends on server configuration (typically 10-50MB)
- Very large files may cause timeout issues

## File Format Notes

- **JPG** files have smaller file sizes (good for testing)
- **PNG** files preserve quality without compression
- **PDF** files work best for scanned documents
- Test which format works best with your application

