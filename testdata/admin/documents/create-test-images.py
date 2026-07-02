#!/usr/bin/env python3
"""
Generate sample KYC test documents (JPG, PNG, PDF).
Run this script from the project root to create test images in testdata/admin/documents/
"""

import os
import sys

def create_test_images():
    """Create sample test images for KYC uploads."""
    
    output_dir = 'testdata/admin/documents'
    os.makedirs(output_dir, exist_ok=True)
    
    # Try PIL/Pillow for image creation
    try:
        from PIL import Image, ImageDraw
        
        # Create PAN Card sample (JPG)
        print("Creating pan-sample.jpg...")
        img = Image.new('RGB', (600, 400), color='white')
        d = ImageDraw.Draw(img)
        d.text((50, 50), "SAMPLE PAN CARD", fill='black')
        d.text((50, 100), "Government of India", fill='black')
        d.text((50, 150), "PERMANENT ACCOUNT NUMBER", fill='gray')
        d.text((50, 200), "FOR TESTING ONLY", fill='red')
        d.rectangle([(40, 40), (560, 360)], outline='black', width=2)
        img.save(f'{output_dir}/pan-sample.jpg', 'JPEG', quality=85)
        print(f"✓ Created {output_dir}/pan-sample.jpg")
        
        # Create Aadhaar sample (PNG)
        print("Creating aadhaar-sample.png...")
        img = Image.new('RGB', (600, 400), color='lightyellow')
        d = ImageDraw.Draw(img)
        d.text((50, 50), "SAMPLE AADHAAR CARD", fill='darkblue')
        d.text((50, 100), "Unique Identity Authority", fill='darkblue')
        d.text((50, 150), "FOR TESTING ONLY", fill='red')
        d.rectangle([(40, 40), (560, 360)], outline='darkblue', width=2)
        img.save(f'{output_dir}/aadhaar-sample.png', 'PNG')
        print(f"✓ Created {output_dir}/aadhaar-sample.png")
        
    except ImportError:
        print("⚠ PIL/Pillow not installed. Install with: pip install Pillow")
        print("  Creating placeholder text files instead...")
        
        # Create text placeholders
        with open(f'{output_dir}/pan-sample.jpg.txt', 'w') as f:
            f.write("SAMPLE PAN CARD\nFor Testing Only\nPlease replace with actual image file")
        with open(f'{output_dir}/aadhaar-sample.png.txt', 'w') as f:
            f.write("SAMPLE AADHAAR\nFor Testing Only\nPlease replace with actual image file")
    
    # Try ReportLab for PDF creation
    try:
        from reportlab.pdfgen import canvas
        
        print("Creating signature-sample.pdf...")
        c = canvas.Canvas(f'{output_dir}/signature-sample.pdf', pagesize=(600, 200))
        c.setFont("Helvetica-Bold", 20)
        c.drawString(50, 150, "SAMPLE SIGNATURE")
        c.setFont("Helvetica", 12)
        c.drawString(50, 100, "For Testing Only")
        c.drawString(50, 50, "____________________")
        c.save()
        print(f"✓ Created {output_dir}/signature-sample.pdf")
        
    except ImportError:
        print("⚠ ReportLab not installed. Install with: pip install reportlab")
        print("  Skipping PDF creation...")
        with open(f'{output_dir}/signature-sample.pdf.txt', 'w') as f:
            f.write("SAMPLE SIGNATURE\nFor Testing Only\nPlease replace with actual PDF file")

if __name__ == '__main__':
    print("Generating test documents for KYC uploads...")
    print()
    
    try:
        create_test_images()
        print()
        print("✓ Test documents created successfully!")
        print()
        print("Next steps:")
        print("1. Verify files exist in testdata/admin/documents/")
        print("2. Update .env if needed with correct file paths")
        print("3. Run tests: npx playwright test --project=admin")
        
    except Exception as e:
        print(f"✗ Error creating test documents: {e}", file=sys.stderr)
        print()
        print("Manual setup:")
        print("1. Create testdata/admin/documents/ directory")
        print("2. Add image/PDF files (pan-sample.jpg, aadhaar-sample.png, signature-sample.pdf)")
        print("3. Update .env with correct paths")
        sys.exit(1)
