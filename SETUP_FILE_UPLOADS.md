# Quick Start: File Upload Setup

This guide will get you up and running with KYC file uploads in 3 steps.

## Step 1: Generate Test Documents (1 minute)

Run this command to create sample images:

```bash
npm run setup:test-docs
```

This creates three test files in `testdata/admin/documents/`:
- `pan-sample.jpg` - Sample PAN card (JPEG)
- `aadhaar-sample.png` - Sample Aadhaar (PNG)  
- `signature-sample.pdf` - Sample signature (PDF)

**What was created:**
- ✓ Valid JPEG file (1x1 pixel, ~600 bytes)
- ✓ Valid PNG file (1x1 pixel, ~68 bytes)
- ✓ Valid PDF file with text (~600 bytes)

These are minimal but valid files that can be uploaded and processed by the application.

## Step 2: Verify Environment Configuration (30 seconds)

Check that `.env` has these paths (should already be configured):

```env
TEST_PAN_CARD_PATH=testdata/admin/documents/pan-sample.jpg
TEST_AADHAAR_PATH=testdata/admin/documents/aadhaar-sample.png
TEST_SIGNATURE_PATH=testdata/admin/documents/signature-sample.pdf

UAT_PAN_CARD_PATH=testdata/admin/documents/pan-sample.jpg
UAT_AADHAAR_PATH=testdata/admin/documents/aadhaar-sample.png
UAT_SIGNATURE_PATH=testdata/admin/documents/signature-sample.pdf
```

If paths are different in your `.env`, update them to match the created files, or update the paths to your actual files.

## Step 3: Run Tests (5-15 minutes)

Run the KYC test with file uploads:

```powershell
# TEST environment (usually localhost/gfat)
npm run test:admin

# UAT environment (remote server)
npm run test:admin:uat
```

**What to expect in console output:**

During KYC steps, you should see upload status messages:

```
↗ Uploading PAN card: d:\project\testdata\admin\documents\pan-sample.jpg
✓ PAN card uploaded successfully

↗ Uploading Aadhaar: d:\project\testdata\admin\documents\aadhaar-sample.png
✓ Aadhaar uploaded successfully

↗ Uploading Signature: d:\project\testdata\admin\documents\signature-sample.pdf
✓ Signature uploaded successfully
```

## Troubleshooting

### Issue: `module not found` or `file doesn't exist`

**Error:**
```
⚠ PAN card file not found: d:\project\testdata\admin\documents\pan-sample.jpg
  Skipping upload.
```

**Solution:**
1. Verify file exists: `dir testdata\admin\documents\`
2. Regenerate: `npm run setup:test-docs`
3. Check `.env` paths match actual files

### Issue: Upload times out

**Error:**
```
Timeout waiting for file upload to complete
```

**Possible causes:**
- Server is slow (try UAT_BASE_URL instead)
- File is too large (keep < 5MB)
- XPath selector is incorrect

**Solution:**
1. Check browser DevTools to inspect file input element
2. Verify the XPath selectors in `pages/admin/kyc.page.ts`
3. Increase test timeout: `test.setTimeout(20 * 60_000)`

### Issue: `File input not found on page`

**Error:**
```
⚠ PAN card file input not found on page (selector: xpath=//input[@type='file'])
```

**Solution:**
1. Open browser DevTools
2. Find the file input element (press F12)
3. Update the XPath in `kyc.page.ts` if selector is wrong

## Using Custom Documents

To use your own KYC documents instead of the generated samples:

1. Prepare your files (JPG, PNG, or PDF)
2. Place them in `testdata/admin/documents/` or another location
3. Update `.env` with the correct paths:
   ```env
   TEST_PAN_CARD_PATH=path/to/your/pan.jpg
   TEST_AADHAAR_PATH=path/to/your/aadhaar.png
   TEST_SIGNATURE_PATH=path/to/your/signature.pdf
   ```
4. Run tests: `npm run test:admin`

## File Upload Architecture

The file upload system includes:

| Component | Purpose |
|-----------|---------|
| `kyc.page.ts` | Page Object with `uploadFileWithValidation()` helper |
| `config/env.ts` | Reads file paths from `.env` |
| `admin.fixture.ts` | Injects `kycFilePaths` fixture into tests |
| `tests/admin/tc01-...spec.ts` | Uses `kycFilePaths` fixture |

## Advanced: Customizing Test Documents

If you want to create custom test images:

### Option A: Use Python
```bash
pip install Pillow reportlab
python testdata/admin/documents/create-test-images.py
```

### Option B: Use Node.js (no dependencies)
```bash
npm run setup:test-docs
```

### Option C: Create manually
- Use Canva, Pixlr, or GIMP to create images
- Export as JPG/PNG/PDF
- Save to `testdata/admin/documents/`

## Performance Notes

- Files are uploaded once per test execution
- Upload happens before form submission (async wait)
- File size < 5MB is recommended
- PNG has smaller file size than JPG for same dimensions
- PDF is text-searchable if needed

## Next Steps

1. ✅ Generate test documents: `npm run setup:test-docs`
2. ✅ Verify `.env` configuration
3. ✅ Run tests: `npm run test:admin:uat`
4. ✅ Check console for upload status messages
5. 📋 View full test report: `npx playwright show-report`

## Support

See `testdata/admin/documents/README.md` for more detailed setup instructions.

For KYC page object reference, see `pages/admin/kyc.page.ts`.

For environment configuration, see `config/env.ts` and `.env.example`.
