# Bulk Upload Pupils - User Guide 📤

## Overview

The Bulk Upload feature allows administrators to register multiple pupils at once using a CSV (Comma-Separated Values) file. This is ideal for:
- New school year enrollments
- Transferring pupils from another system
- Mass data entry tasks

---

## Features ✨

### 1. **CSV Template**
- Download a pre-formatted template with sample data
- Includes all required fields and format examples

### 2. **Smart Validation**
- Validates data format before upload
- Checks for duplicate admission numbers
- Verifies class names exist
- Validates email formats and date formats
- Provides warnings for unusual data (e.g., age out of range)

### 3. **Preview & Review**
- Preview first 5 records before uploading
- See validation errors and warnings
- Review counts and summary statistics

### 4. **Detailed Results**
- Shows success/failure count
- Lists any failed records with specific errors
- Allows retry with failed records

---

## Step-by-Step Instructions

### Step 1: Access Bulk Upload

1. **Navigate to Pupils page**
   - Click "Pupils" in the sidebar

2. **Click "Bulk Upload" button**
   - Located next to "Register pupil" button
   - Only visible to admins and super admins

### Step 2: Download Template

1. **Click "Download CSV Template"**
   - Template saves as `pupils_upload_template_[timestamp].csv`

2. **Open the template** in:
   - Microsoft Excel
   - Google Sheets
   - LibreOffice Calc
   - Any spreadsheet software

### Step 3: Fill in Pupil Data

#### Required Columns:

| Column | Format | Example | Notes |
|--------|--------|---------|-------|
| `admissionNo` | Text | P001 | Must be unique |
| `firstName` | Text | John | Student's first name |
| `lastName` | Text | Doe | Student's last name |
| `gender` | M or F | M | Single letter only |
| `dob` | YYYY-MM-DD | 2018-05-15 | Date of birth |
| `className` | Text | Nursery A | Must match existing class |
| `parentName` | Text | Jane Doe | Parent/guardian name |
| `parentPhone` | Text | +254712345678 | Include country code |
| `parentEmail` | Email | jane@example.com | Valid email format |
| `parentRelationship` | Text | Mother | e.g., Mother, Father, Guardian |

#### Important Notes:

- **Admission numbers** must be unique across the entire school
- **Class names** must exactly match existing classes (case-sensitive)
- **Dates** must use YYYY-MM-DD format (e.g., 2018-03-22)
- **Phone numbers** should include country code (e.g., +254...)
- **Email addresses** must be valid format
- **Gender** must be exactly "M" or "F"

### Step 4: Upload File

1. **Click "Select CSV File"** or drag-and-drop your file
2. **Wait for validation** (usually takes 1-2 seconds)

### Step 5: Review Validation Results

The system will show:

#### ✅ Success Case:
- Total records count
- "0 Errors" badge
- Preview of first 5 records
- "Upload X Pupils" button enabled

#### ❌ Error Case:
- Specific error messages with row numbers
- Field names that failed validation
- Reasons for failure
- "Upload" button disabled

#### ⚠️ Warnings:
- Non-critical issues (e.g., age out of typical range)
- Phone numbers without country code
- Can proceed with upload despite warnings

### Step 6: Upload

1. **Review the preview** to ensure data is correct
2. **Click "Upload X Pupils"**
3. **Wait for processing** (progress bar shown)

### Step 7: Check Results

After upload completes:

- **Success count**: Pupils successfully added
- **Failure count**: Pupils that failed to add
- **Failed records table**: Shows which pupils failed and why

---

## Common Errors & Solutions

### Error: "Admission number already exists"
**Cause:** The admission number is already used by another pupil  
**Solution:** Use a unique admission number

### Error: "Class 'Nursery A' not found"
**Cause:** Class name doesn't match any existing class  
**Solution:** 
- Check class names in Classes page
- Ensure exact spelling and capitalization
- Create the class first if it doesn't exist

### Error: "Date must be in YYYY-MM-DD format"
**Cause:** Date is in wrong format (e.g., DD/MM/YYYY)  
**Solution:** Change date format to YYYY-MM-DD (e.g., 2018-03-22)

### Error: "Invalid email format"
**Cause:** Email address is not valid  
**Solution:** Use proper email format (e.g., name@domain.com)

### Error: "Gender must be M or F"
**Cause:** Gender column has invalid value  
**Solution:** Use only "M" for Male or "F" for Female

### Error: "Parent details are incomplete"
**Cause:** Missing required parent information  
**Solution:** Fill in all parent fields (name, phone, email, relationship)

---

## Tips & Best Practices 💡

### 1. **Start Small**
- Test with 5-10 pupils first
- Verify data looks correct
- Then upload larger batches

### 2. **Prepare Data in Advance**
- Collect all information before starting
- Standardize formats (dates, phones, names)
- Clean up any duplicate or inconsistent data

### 3. **Use Consistent Naming**
- Class names: Match exactly what's in system
- Relationships: Use consistent terms (Mother, Father, Guardian)
- Phones: Always include country code

### 4. **Double-Check Critical Fields**
- **Admission numbers**: Must be unique
- **Dates of birth**: Check for typos
- **Email addresses**: Verify they're correct
- **Class assignments**: Ensure classes exist

### 5. **Keep Backup**
- Save original CSV file
- Keep record of failed uploads
- Can retry failed records easily

### 6. **Batch Large Uploads**
- For 100+ pupils, split into batches of 50
- Easier to handle errors
- Better performance

---

## Example CSV Format

```csv
admissionNo,firstName,lastName,gender,dob,className,parentName,parentPhone,parentEmail,parentRelationship
"P001","John","Doe","M","2018-05-15","Nursery A","Jane Doe","+254712345678","jane.doe@example.com","Mother"
"P002","Mary","Smith","F","2019-03-22","Pre-K B","Bob Smith","+254723456789","bob.smith@example.com","Father"
"P003","David","Johnson","M","2018-11-08","Primary 1","Sarah Johnson","+254734567890","sarah.j@example.com","Mother"
```

---

## Validation Rules

### Admission Number
- ✅ Required
- ✅ Must be unique
- ✅ Any alphanumeric format allowed

### Names (First & Last)
- ✅ Required
- ✅ At least 1 character
- ✅ Can include spaces, hyphens, apostrophes

### Gender
- ✅ Required
- ✅ Must be exactly "M" or "F"
- ❌ Not case-sensitive (automatically converted)

### Date of Birth
- ✅ Required
- ✅ Must be YYYY-MM-DD format
- ⚠️ Warning if age < 2 or > 7 years
- ✅ Can be any valid past date

### Class Name
- ✅ Required
- ✅ Must exactly match existing class
- ✅ Case-sensitive
- ❌ Cannot upload if class doesn't exist

### Parent Information
All fields required:
- ✅ Name: Any text
- ✅ Phone: Any format (warning if no country code)
- ✅ Email: Must be valid email format (name@domain.com)
- ✅ Relationship: Any text (Mother, Father, Guardian, etc.)

---

## Troubleshooting

### CSV File Won't Open
**Problem:** File appears empty or corrupted  
**Solution:**
- Re-download template
- Use Excel or Google Sheets (not Notepad)
- Ensure file extension is `.csv`

### Upload Button Disabled
**Problem:** Cannot click upload button  
**Solution:**
- Fix all validation errors shown
- Errors must be 0 before upload
- Warnings are okay to proceed

### Slow Upload
**Problem:** Taking too long to process  
**Solution:**
- Normal for 50+ pupils
- Wait for completion
- Split into smaller batches if needed

### Some Pupils Failed
**Problem:** Not all pupils were uploaded  
**Solution:**
1. Check failed records table
2. Note the specific errors
3. Fix those records in CSV
4. Upload again with only failed records

---

## Security & Privacy

- ✅ Only admins and super admins can bulk upload
- ✅ All data is validated before saving
- ✅ Failed uploads don't corrupt database
- ✅ Audit logs track who uploaded data
- ✅ Parent data is linked automatically
- ✅ Row Level Security applies (school isolation)

---

## Frequently Asked Questions

### Q: Can I upload pupils for multiple schools at once?
**A:** No. Super admins must select one school at a time from the dropdown, then upload pupils for that school.

### Q: What happens if I upload the same admission number twice?
**A:** The second upload will fail with "Admission number already exists" error. The first pupil remains unchanged.

### Q: Can I update existing pupils using bulk upload?
**A:** No. Bulk upload is for adding new pupils only. Use the Edit button to update existing pupils.

### Q: Is there a limit on how many pupils I can upload?
**A:** No hard limit, but we recommend batches of 50 pupils for best performance.

### Q: Can I include photos in the CSV?
**A:** No. Photos must be uploaded individually after pupils are created.

### Q: What if a class doesn't exist yet?
**A:** Create the class first in the Classes page, then do the bulk upload.

### Q: Can one pupil have multiple parents?
**A:** Yes, but only one parent per pupil in bulk upload. Add additional parents manually after upload.

### Q: What happens to failed uploads?
**A:** Failed records are NOT added to the database. You can fix the errors and re-upload them.

---

## Support

Need help?
- Check validation error messages (they're specific!)
- Review this guide
- Contact: nobleahimbisibwe5@gmail.com
- Or ask in the School Connect support channel

---

**Happy Bulk Uploading! 🎉**

