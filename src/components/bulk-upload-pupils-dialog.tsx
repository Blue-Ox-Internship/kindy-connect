/**
 * Bulk Upload Pupils Dialog Component
 * Allows uploading multiple pupils via CSV file
 */

import { useState, useRef } from "react";
import { useStore } from "@/lib/store";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Upload,
  Download,
  AlertCircle,
  CheckCircle,
  XCircle,
  FileText,
  AlertTriangle,
} from "lucide-react";
import { toast } from "sonner";
import {
  parseCSVFile,
  downloadCSVTemplate,
  checkDuplicates,
  formatValidationSummary,
  type ParseResult,
  type PupilCSVRow,
} from "@/lib/csv-utils";

interface BulkUploadPupilsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

type UploadStage = "select" | "validate" | "review" | "uploading" | "complete";

export function BulkUploadPupilsDialog({ open, onOpenChange }: BulkUploadPupilsDialogProps) {
  const { pupils, classes, bulkAddPupils, currentUser } = useStore();
  const [stage, setStage] = useState<UploadStage>("select");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [parseResult, setParseResult] = useState<ParseResult | null>(null);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadResult, setUploadResult] = useState<{
    total: number;
    successCount: number;
    failCount: number;
    results: Array<{
      success: boolean;
      pupilId?: string;
      admissionNo: string;
      name: string;
      error?: string;
    }>;
  } | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleDownloadTemplate = () => {
    downloadCSVTemplate();
    toast.success("CSV template downloaded");
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.name.endsWith(".csv")) {
      toast.error("Please select a CSV file");
      return;
    }

    setSelectedFile(file);
    setStage("validate");
    validateFile(file);
  };

  const validateFile = async (file: File) => {
    try {
      const result = await parseCSVFile(file);
      
      // Check for duplicate admission numbers
      const existingAdmissionNos = pupils.map((p) => p.admissionNo);
      const duplicates = checkDuplicates(result.data, existingAdmissionNos);

      if (duplicates.length > 0) {
        duplicates.forEach((dup) => {
          result.errors.push({
            row: dup.row,
            field: "admissionNo",
            message: `Admission number "${dup.admissionNo}" already exists`,
          });
        });
        result.success = false;
      }

      setParseResult(result);
      setStage("review");

      if (result.success) {
        toast.success(formatValidationSummary(result));
      } else {
        toast.error(`Validation failed: ${result.errors.length} errors found`);
      }
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to parse CSV");
      setStage("select");
      setSelectedFile(null);
    }
  };

  const handleUpload = async () => {
    if (!parseResult || !parseResult.success || !currentUser) return;

    setStage("uploading");
    setUploadProgress(0);

    try {
      // Map CSV data to pupils format
      const pupilsToUpload = parseResult.data.map((row: PupilCSVRow) => {
        // Find class by name
        const classRoom = classes.find((c) => c.name === row.className);
        
        if (!classRoom) {
          throw new Error(`Class "${row.className}" not found`);
        }

        return {
          pupil: {
            admissionNo: row.admissionNo,
            firstName: row.firstName,
            lastName: row.lastName,
            gender: row.gender as "M" | "F",
            dob: row.dob,
            classId: classRoom.id,
            schoolId: currentUser.schoolId || classRoom.schoolId,
            parentIds: [],
          },
          parent: {
            name: row.parentName,
            phone: row.parentPhone,
            email: row.parentEmail,
            relationship: row.parentRelationship,
          },
        };
      });

      // Simulate progress (actual upload is fast)
      setUploadProgress(30);
      
      const result = await bulkAddPupils(pupilsToUpload);
      
      setUploadProgress(100);
      setUploadResult(result);
      setStage("complete");

      if (result.successCount > 0) {
        toast.success(`Successfully uploaded ${result.successCount} pupils`);
      }
      if (result.failCount > 0) {
        toast.error(`Failed to upload ${result.failCount} pupils`);
      }
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Upload failed");
      setStage("review");
    }
  };

  const handleReset = () => {
    setStage("select");
    setSelectedFile(null);
    setParseResult(null);
    setUploadProgress(0);
    setUploadResult(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleClose = () => {
    handleReset();
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Bulk Upload Pupils</DialogTitle>
          <DialogDescription>
            Upload multiple pupils at once using a CSV file
          </DialogDescription>
        </DialogHeader>

        {/* Stage: Select File */}
        {stage === "select" && (
          <div className="space-y-6 py-4">
            <Alert>
              <FileText className="h-4 w-4" />
              <AlertDescription>
                Download the CSV template, fill in pupil details, then upload the completed file.
              </AlertDescription>
            </Alert>

            <div className="flex flex-col items-center justify-center border-2 border-dashed rounded-lg p-8 space-y-4">
              <Upload className="h-12 w-12 text-muted-foreground" />
              <div className="text-center space-y-2">
                <p className="text-sm font-medium">Upload CSV File</p>
                <p className="text-xs text-muted-foreground">
                  Click to select or drag and drop your CSV file
                </p>
              </div>
              <input
                ref={fileInputRef}
                type="file"
                accept=".csv"
                onChange={handleFileSelect}
                className="hidden"
                id="csv-upload"
              />
              <label htmlFor="csv-upload">
                <Button variant="outline" as Child asChild>
                  <span>Select CSV File</span>
                </Button>
              </label>
            </div>

            <div className="flex justify-center">
              <Button onClick={handleDownloadTemplate} variant="outline" className="gap-2">
                <Download className="h-4 w-4" />
                Download CSV Template
              </Button>
            </div>

            <div className="space-y-2 text-sm text-muted-foreground">
              <p className="font-medium">CSV Format Requirements:</p>
              <ul className="list-disc list-inside space-y-1 ml-2">
                <li>Admission Number (unique)</li>
                <li>First Name and Last Name</li>
                <li>Gender (M or F)</li>
                <li>Date of Birth (YYYY-MM-DD format)</li>
                <li>Class Name (must match existing class)</li>
                <li>Parent Name, Phone, Email, and Relationship</li>
              </ul>
            </div>
          </div>
        )}

        {/* Stage: Validate */}
        {stage === "validate" && (
          <div className="space-y-4 py-8">
            <div className="flex flex-col items-center justify-center space-y-4">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
              <p className="text-sm text-muted-foreground">Validating CSV file...</p>
            </div>
          </div>
        )}

        {/* Stage: Review */}
        {stage === "review" && parseResult && (
          <div className="space-y-6 py-4">
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <p className="text-sm font-medium">{selectedFile?.name}</p>
                <p className="text-xs text-muted-foreground">
                  {parseResult.data.length} records found
                </p>
              </div>
              <Button variant="outline" size="sm" onClick={handleReset}>
                Select Different File
              </Button>
            </div>

            {/* Validation Summary */}
            <div className="grid grid-cols-3 gap-4">
              <div className="flex items-center gap-2 p-3 border rounded-lg">
                <FileText className="h-5 w-5 text-blue-500" />
                <div>
                  <p className="text-2xl font-bold">{parseResult.data.length}</p>
                  <p className="text-xs text-muted-foreground">Total Records</p>
                </div>
              </div>
              <div className="flex items-center gap-2 p-3 border rounded-lg">
                <XCircle className="h-5 w-5 text-red-500" />
                <div>
                  <p className="text-2xl font-bold">{parseResult.errors.length}</p>
                  <p className="text-xs text-muted-foreground">Errors</p>
                </div>
              </div>
              <div className="flex items-center gap-2 p-3 border rounded-lg">
                <AlertTriangle className="h-5 w-5 text-yellow-500" />
                <div>
                  <p className="text-2xl font-bold">{parseResult.warnings.length}</p>
                  <p className="text-xs text-muted-foreground">Warnings</p>
                </div>
              </div>
            </div>

            {/* Errors */}
            {parseResult.errors.length > 0 && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  <p className="font-medium mb-2">Errors found in CSV:</p>
                  <div className="max-h-48 overflow-y-auto space-y-1">
                    {parseResult.errors.map((error, i) => (
                      <p key={i} className="text-xs">
                        Row {error.row}, {error.field}: {error.message}
                      </p>
                    ))}
                  </div>
                </AlertDescription>
              </Alert>
            )}

            {/* Warnings */}
            {parseResult.warnings.length > 0 && (
              <Alert>
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription>
                  <p className="font-medium mb-2">Warnings:</p>
                  <div className="max-h-32 overflow-y-auto space-y-1">
                    {parseResult.warnings.map((warning, i) => (
                      <p key={i} className="text-xs">
                        Row {warning.row}: {warning.message}
                      </p>
                    ))}
                  </div>
                </AlertDescription>
              </Alert>
            )}

            {/* Preview */}
            {parseResult.success && (
              <div className="space-y-2">
                <p className="text-sm font-medium">Preview (first 5 records):</p>
                <div className="border rounded-lg max-h-64 overflow-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Admission No</TableHead>
                        <TableHead>Name</TableHead>
                        <TableHead>Gender</TableHead>
                        <TableHead>DOB</TableHead>
                        <TableHead>Class</TableHead>
                        <TableHead>Parent</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {parseResult.data.slice(0, 5).map((row, i) => (
                        <TableRow key={i}>
                          <TableCell className="font-mono text-xs">{row.admissionNo}</TableCell>
                          <TableCell>{row.firstName} {row.lastName}</TableCell>
                          <TableCell>{row.gender}</TableCell>
                          <TableCell>{row.dob}</TableCell>
                          <TableCell>{row.className}</TableCell>
                          <TableCell className="text-xs">{row.parentName}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
                {parseResult.data.length > 5 && (
                  <p className="text-xs text-muted-foreground text-center">
                    ... and {parseResult.data.length - 5} more records
                  </p>
                )}
              </div>
            )}
          </div>
        )}

        {/* Stage: Uploading */}
        {stage === "uploading" && (
          <div className="space-y-6 py-8">
            <div className="flex flex-col items-center justify-center space-y-4">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
              <p className="text-sm font-medium">Uploading pupils...</p>
              <Progress value={uploadProgress} className="w-full max-w-md" />
              <p className="text-xs text-muted-foreground">{uploadProgress}%</p>
            </div>
          </div>
        )}

        {/* Stage: Complete */}
        {stage === "complete" && uploadResult && (
          <div className="space-y-6 py-4">
            <div className="flex flex-col items-center justify-center space-y-4 py-6">
              {uploadResult.failCount === 0 ? (
                <CheckCircle className="h-16 w-16 text-green-500" />
              ) : (
                <AlertCircle className="h-16 w-16 text-yellow-500" />
              )}
              <div className="text-center space-y-2">
                <p className="text-lg font-semibold">Upload Complete</p>
                <p className="text-sm text-muted-foreground">
                  {uploadResult.successCount} of {uploadResult.total} pupils uploaded successfully
                </p>
              </div>
            </div>

            {/* Results Summary */}
            <div className="grid grid-cols-2 gap-4">
              <div className="flex items-center gap-2 p-4 border rounded-lg bg-green-50 dark:bg-green-950">
                <CheckCircle className="h-5 w-5 text-green-600" />
                <div>
                  <p className="text-2xl font-bold text-green-600">{uploadResult.successCount}</p>
                  <p className="text-xs text-green-700 dark:text-green-400">Successful</p>
                </div>
              </div>
              <div className="flex items-center gap-2 p-4 border rounded-lg bg-red-50 dark:bg-red-950">
                <XCircle className="h-5 w-5 text-red-600" />
                <div>
                  <p className="text-2xl font-bold text-red-600">{uploadResult.failCount}</p>
                  <p className="text-xs text-red-700 dark:text-red-400">Failed</p>
                </div>
              </div>
            </div>

            {/* Failed Records */}
            {uploadResult.failCount > 0 && (
              <div className="space-y-2">
                <p className="text-sm font-medium">Failed Records:</p>
                <div className="border rounded-lg max-h-48 overflow-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Admission No</TableHead>
                        <TableHead>Name</TableHead>
                        <TableHead>Error</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {uploadResult.results
                        .filter((r) => !r.success)
                        .map((result, i) => (
                          <TableRow key={i}>
                            <TableCell className="font-mono text-xs">{result.admissionNo}</TableCell>
                            <TableCell>{result.name}</TableCell>
                            <TableCell className="text-xs text-red-600">{result.error}</TableCell>
                          </TableRow>
                        ))}
                    </TableBody>
                  </Table>
                </div>
              </div>
            )}
          </div>
        )}

        <DialogFooter>
          {stage === "select" && (
            <Button variant="outline" onClick={handleClose}>
              Cancel
            </Button>
          )}

          {stage === "review" && (
            <>
              <Button variant="outline" onClick={handleReset}>
                Back
              </Button>
              <Button
                onClick={handleUpload}
                disabled={!parseResult?.success}
              >
                Upload {parseResult?.data.length || 0} Pupils
              </Button>
            </>
          )}

          {stage === "complete" && (
            <>
              <Button variant="outline" onClick={handleReset}>
                Upload More
              </Button>
              <Button onClick={handleClose}>
                Done
              </Button>
            </>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
