/**
 * CSV Utilities for Bulk Upload
 * Handles CSV parsing, validation, and template generation
 */

import { z } from "zod";

// Validation schema for pupil CSV data
export const pupilCSVSchema = z.object({
  admissionNo: z.string().min(1, "Admission number is required"),
  firstName: z.string().min(1, "First name is required"),
  lastName: z.string().min(1, "Last name is required"),
  gender: z.enum(["M", "F"], { errorMap: () => ({ message: "Gender must be M or F" }) }),
  dob: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Date must be in YYYY-MM-DD format"),
  className: z.string().min(1, "Class name is required"),
  parentName: z.string().min(1, "Parent name is required"),
  parentPhone: z.string().min(1, "Parent phone is required"),
  parentEmail: z.string().email("Invalid email format"),
  parentRelationship: z.string().min(1, "Parent relationship is required"),
});

export type PupilCSVRow = z.infer<typeof pupilCSVSchema>;

export interface ParseResult {
  success: boolean;
  data: PupilCSVRow[];
  errors: Array<{
    row: number;
    field: string;
    message: string;
  }>;
  warnings: Array<{
    row: number;
    message: string;
  }>;
}

/**
 * Generate CSV template with headers and sample data
 */
export function generateCSVTemplate(): string {
  const headers = [
    "admissionNo",
    "firstName",
    "lastName",
    "gender",
    "dob",
    "className",
    "parentName",
    "parentPhone",
    "parentEmail",
    "parentRelationship",
  ];

  const sampleData = [
    [
      "P001",
      "John",
      "Doe",
      "M",
      "2018-05-15",
      "Nursery A",
      "Jane Doe",
      "+254712345678",
      "jane.doe@example.com",
      "Mother",
    ],
    [
      "P002",
      "Mary",
      "Smith",
      "F",
      "2019-03-22",
      "Pre-K B",
      "Bob Smith",
      "+254723456789",
      "bob.smith@example.com",
      "Father",
    ],
    [
      "P003",
      "David",
      "Johnson",
      "M",
      "2018-11-08",
      "Primary 1",
      "Sarah Johnson",
      "+254734567890",
      "sarah.j@example.com",
      "Mother",
    ],
  ];

  const csvContent = [
    headers.join(","),
    ...sampleData.map((row) => row.map((cell) => `"${cell}"`).join(",")),
  ].join("\n");

  return csvContent;
}

/**
 * Download CSV template as file
 */
export function downloadCSVTemplate(): void {
  const csv = generateCSVTemplate();
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const link = document.createElement("a");
  const url = URL.createObjectURL(blob);
  
  link.setAttribute("href", url);
  link.setAttribute("download", `pupils_upload_template_${Date.now()}.csv`);
  link.style.visibility = "hidden";
  
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

/**
 * Parse CSV text to array of objects
 */
function parseCSVText(csvText: string): Record<string, string>[] {
  const lines = csvText.trim().split("\n");
  if (lines.length < 2) {
    throw new Error("CSV file must have at least a header row and one data row");
  }

  // Parse header
  const headers = parseCSVLine(lines[0]);

  // Parse data rows
  const data: Record<string, string>[] = [];
  for (let i = 1; i < lines.length; i++) {
    if (!lines[i].trim()) continue; // Skip empty lines

    const values = parseCSVLine(lines[i]);
    if (values.length !== headers.length) {
      throw new Error(
        `Row ${i + 1} has ${values.length} columns but header has ${headers.length} columns`
      );
    }

    const row: Record<string, string> = {};
    headers.forEach((header, index) => {
      row[header] = values[index];
    });
    data.push(row);
  }

  return data;
}

/**
 * Parse a single CSV line (handles quoted values)
 */
function parseCSVLine(line: string): string[] {
  const result: string[] = [];
  let current = "";
  let inQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    const nextChar = line[i + 1];

    if (char === '"') {
      if (inQuotes && nextChar === '"') {
        // Escaped quote
        current += '"';
        i++; // Skip next quote
      } else {
        // Toggle quotes
        inQuotes = !inQuotes;
      }
    } else if (char === "," && !inQuotes) {
      // End of field
      result.push(current.trim());
      current = "";
    } else {
      current += char;
    }
  }

  // Add last field
  result.push(current.trim());

  return result;
}

/**
 * Validate CSV data against schema
 */
export function validatePupilsCSV(data: Record<string, string>[]): ParseResult {
  const errors: ParseResult["errors"] = [];
  const warnings: ParseResult["warnings"] = [];
  const validData: PupilCSVRow[] = [];

  data.forEach((row, index) => {
    const rowNumber = index + 2; // +2 because index is 0-based and row 1 is header

    try {
      // Validate with Zod
      const validated = pupilCSVSchema.parse(row);
      validData.push(validated);

      // Additional warnings
      if (validated.parentPhone && !validated.parentPhone.startsWith("+")) {
        warnings.push({
          row: rowNumber,
          message: "Phone number should include country code (e.g., +254...)",
        });
      }

      // Check age
      const age = calculateAge(validated.dob);
      if (age < 1 || age > 25) {
        warnings.push({
          row: rowNumber,
          message: `Pupil age is ${age} years - please verify date of birth`,
        });
      }
    } catch (err) {
      if (err instanceof z.ZodError) {
        err.errors.forEach((error) => {
          errors.push({
            row: rowNumber,
            field: error.path.join("."),
            message: error.message,
          });
        });
      } else {
        errors.push({
          row: rowNumber,
          field: "unknown",
          message: err instanceof Error ? err.message : "Unknown error",
        });
      }
    }
  });

  return {
    success: errors.length === 0,
    data: validData,
    errors,
    warnings,
  };
}

/**
 * Calculate age from date of birth
 */
function calculateAge(dob: string): number {
  const birthDate = new Date(dob);
  const today = new Date();
  let age = today.getFullYear() - birthDate.getFullYear();
  const monthDiff = today.getMonth() - birthDate.getMonth();
  
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
    age--;
  }
  
  return age;
}

/**
 * Parse CSV file and validate
 */
export async function parseCSVFile(file: File): Promise<ParseResult> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = (e) => {
      try {
        const text = e.target?.result as string;
        const data = parseCSVText(text);
        const result = validatePupilsCSV(data);
        resolve(result);
      } catch (error) {
        reject(error);
      }
    };

    reader.onerror = () => {
      reject(new Error("Failed to read file"));
    };

    reader.readAsText(file);
  });
}

/**
 * Check for duplicate admission numbers
 */
export function checkDuplicates(
  data: PupilCSVRow[],
  existingAdmissionNos: string[]
): Array<{ row: number; admissionNo: string }> {
  const duplicates: Array<{ row: number; admissionNo: string }> = [];
  const seenInFile = new Set<string>();

  data.forEach((row, index) => {
    const admissionNo = row.admissionNo;

    // Check against existing database records
    if (existingAdmissionNos.includes(admissionNo)) {
      duplicates.push({
        row: index + 2,
        admissionNo,
      });
    }

    // Check for duplicates within the file
    if (seenInFile.has(admissionNo)) {
      duplicates.push({
        row: index + 2,
        admissionNo,
      });
    }

    seenInFile.add(admissionNo);
  });

  return duplicates;
}

/**
 * Format validation results for display
 */
export function formatValidationSummary(result: ParseResult): string {
  const parts: string[] = [];

  if (result.success) {
    parts.push(`✅ ${result.data.length} pupils ready to upload`);
  } else {
    parts.push(`❌ ${result.errors.length} errors found`);
  }

  if (result.warnings.length > 0) {
    parts.push(`⚠️ ${result.warnings.length} warnings`);
  }

  return parts.join(" • ");
}
