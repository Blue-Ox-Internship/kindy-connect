import { createFileRoute } from "@tanstack/react-router";
import { AppShell } from "@/components/app-shell";
import { useStore } from "@/lib/mock-store";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Download, FileSpreadsheet, FileText, GraduationCap, Printer } from "lucide-react";
import { toast } from "sonner";
import { useState, useMemo, useEffect } from "react";
import { downloadCSV } from "@/lib/export-utils";

export const Route = createFileRoute("/app/reports")({
  head: () => ({ meta: [{ title: "Reports - Little Stars" }] }),
  component: ReportsPage,
});

function ReportsPage() {
  const { currentUser, pupils, attendance, classes, marks, schools } = useStore();
  const today = new Date().toISOString().slice(0, 10);
  const todayAtt = attendance.filter((a) => a.date === today);

  // Super Admin School filtering
  const [superSchoolId, setSuperSchoolId] = useState<string>(schools[0]?.id ?? "");

  const filteredClasses = useMemo(() => {
    if (currentUser?.role === "super_admin") {
      return classes.filter((c) => c.schoolId === superSchoolId);
    }
    if (currentUser?.schoolId) {
      return classes.filter((c) => c.schoolId === currentUser.schoolId);
    }
    return classes;
  }, [classes, currentUser, superSchoolId]);

  const [selectedClass, setSelectedClass] = useState<string>("");

  useEffect(() => {
    if (filteredClasses.length > 0) {
      setSelectedClass((curr) => {
        if (!curr || !filteredClasses.some((c) => c.id === curr)) {
          return filteredClasses[0]?.id ?? "";
        }
        return curr;
      });
    } else {
      setSelectedClass("");
    }
  }, [filteredClasses]);

  const [selectedTerm, setSelectedTerm] = useState("Term 2");
  const [selectedYear, setSelectedYear] = useState("2025");
  const [previewDialogOpen, setPreviewDialogOpen] = useState(false);
  const [previewPupil, setPreviewPupil] = useState<any>(null);
  const [marksSheetOpen, setMarksSheetOpen] = useState(false);
  const [sheetDisplayMode, setSheetDisplayMode] = useState<"score" | "percentage" | "grade">("score");

  const subjects = ["Reading", "Math", "Writing", "Art", "Music", "Physical Education", "Science"];
  const currentClassObj = classes.find((c) => c.id === selectedClass);
  const currentSchoolObj = schools.find(
    (s) => s.id === (currentClassObj?.schoolId || currentUser?.schoolId),
  );
  const selectedClassPupils = pupils.filter((p) => p.classId === selectedClass && p.active);

  const broadsheetData = useMemo(() => {
    return selectedClassPupils.map((p) => {
      const pupilMarks = marks.filter(
        (m) => m.pupilId === p.id && m.term === selectedTerm && m.year === selectedYear,
      );

      let totalPct = 0;
      let count = 0;

      const subjectMarks: Record<
        string,
        { score: number; maxScore: number; grade?: string; pct: number } | null
      > = {};

      subjects.forEach((subj) => {
        const m = pupilMarks.find((x) => x.subject === subj);
        if (m) {
          const pct = (m.score / m.maxScore) * 100;
          subjectMarks[subj] = { score: m.score, maxScore: m.maxScore, grade: m.grade, pct };
          totalPct += pct;
          count += 1;
        } else {
          subjectMarks[subj] = null;
        }
      });

      const avgPct = count > 0 ? totalPct / count : null;
      let overallGrade = "N/A";
      if (avgPct !== null) {
        if (avgPct >= 90) overallGrade = "A";
        else if (avgPct >= 80) overallGrade = "B";
        else if (avgPct >= 70) overallGrade = "C";
        else if (avgPct >= 60) overallGrade = "D";
        else overallGrade = "E";
      }

      return {
        pupil: p,
        subjectMarks,
        avgPct,
        overallGrade,
      };
    });
  }, [selectedClassPupils, marks, selectedTerm, selectedYear, subjects]);

  const lateThreshold = "08:00";
  const late = todayAtt.filter((a) => a.arrival && a.arrival > lateThreshold);

  const weeklySummary = useMemo(() => {
    const d = new Date();
    d.setDate(d.getDate() - 7);
    const cutoff = d.toISOString().slice(0, 10);
    const recent = attendance.filter((a) => a.date >= cutoff);

    return pupils.map((p) => {
      const pRecs = recent.filter((a) => a.pupilId === p.id);
      const daysPresent = pRecs.length;
      const lateDays = pRecs.filter((a) => a.arrival && a.arrival > lateThreshold).length;
      const clsName = classes.find((c) => c.id === p.classId)?.name || "-";
      return { pupil: p, className: clsName, daysPresent, lateDays };
    });
  }, [attendance, pupils, classes, lateThreshold]);

  const monthlySummary = useMemo(() => {
    const d = new Date();
    d.setDate(d.getDate() - 30);
    const cutoff = d.toISOString().slice(0, 10);
    const recent = attendance.filter((a) => a.date >= cutoff);

    return pupils.map((p) => {
      const pRecs = recent.filter((a) => a.pupilId === p.id);
      const daysPresent = pRecs.length;
      const lateDays = pRecs.filter((a) => a.arrival && a.arrival > lateThreshold).length;
      const clsName = classes.find((c) => c.id === p.classId)?.name || "-";
      return { pupil: p, className: clsName, daysPresent, lateDays };
    });
  }, [attendance, pupils, classes, lateThreshold]);

  const handleExportDailyPDF = () => {
    window.print();
    toast.success("Daily attendance report sent to print / PDF");
  };

  const handleExportDailyCSV = () => {
    const headers = ["Admission No", "Pupil Name", "Class", "Arrival Time", "Departure Time"];
    const rows = todayAtt.map((a) => {
      const p = pupils.find((x) => x.id === a.pupilId);
      return [
        p?.admissionNo || "-",
        p ? `${p.firstName} ${p.lastName}` : "Unknown",
        classes.find((c) => c.id === p?.classId)?.name || "-",
        a.arrival ?? "-",
        a.departure ?? "-",
      ];
    });
    downloadCSV(`Daily_Attendance_${today}`, headers, rows);
    toast.success("Exported Daily Attendance to CSV / Excel");
  };

  const handleExportWeeklyPDF = () => {
    window.print();
    toast.success("Weekly attendance report sent to print / PDF");
  };

  const handleExportWeeklyCSV = () => {
    const headers = ["Admission No", "Pupil Name", "Class", "Days Present (Last 7 Days)", "Late Arrivals"];
    const rows = weeklySummary.map((item) => [
      item.pupil.admissionNo,
      `${item.pupil.firstName} ${item.pupil.lastName}`,
      item.className,
      item.daysPresent,
      item.lateDays,
    ]);
    downloadCSV(`Weekly_Attendance_Report_${today}`, headers, rows);
    toast.success("Exported Weekly Attendance to CSV / Excel");
  };

  const handleExportMonthlyPDF = () => {
    window.print();
    toast.success("Monthly attendance report sent to print / PDF");
  };

  const handleExportMonthlyCSV = () => {
    const headers = ["Admission No", "Pupil Name", "Class", "Days Present (Last 30 Days)", "Late Arrivals"];
    const rows = monthlySummary.map((item) => [
      item.pupil.admissionNo,
      `${item.pupil.firstName} ${item.pupil.lastName}`,
      item.className,
      item.daysPresent,
      item.lateDays,
    ]);
    downloadCSV(`Monthly_Attendance_Report_${today}`, headers, rows);
    toast.success("Exported Monthly Attendance to CSV / Excel");
  };

  const handleExportLatePDF = () => {
    window.print();
    toast.success("Late arrivals report sent to print / PDF");
  };

  const handleExportLateCSV = () => {
    const headers = ["Admission No", "Pupil Name", "Class", "Arrival Time"];
    const rows = late.map((a) => {
      const p = pupils.find((x) => x.id === a.pupilId);
      return [
        p?.admissionNo || "-",
        p ? `${p.firstName} ${p.lastName}` : "Unknown",
        classes.find((c) => c.id === p?.classId)?.name || "-",
        a.arrival,
      ];
    });
    downloadCSV(`Late_Arrivals_${today}`, headers, rows);
    toast.success("Exported Late Arrivals report to CSV / Excel");
  };

  const terms = ["Term 1", "Term 2", "Term 3"];

  const getGradeColor = (grade: string) => {
    switch (grade) {
      case "A":
        return "bg-green-500";
      case "B":
        return "bg-blue-500";
      case "C":
        return "bg-yellow-500";
      case "D":
        return "bg-orange-500";
      case "E":
        return "bg-red-500";
      default:
        return "bg-gray-500";
    }
  };

  const calculateAverage = (pupilId: string) => {
    const pupilMarks = marks.filter(
      (m) => m.pupilId === pupilId && m.term === selectedTerm && m.year === selectedYear,
    );
    if (pupilMarks.length === 0) return null;

    const totalPercentage = pupilMarks.reduce((sum, m) => sum + (m.score / m.maxScore) * 100, 0);
    return totalPercentage / pupilMarks.length;
  };

  const getOverallGrade = (average: number | null) => {
    if (average === null) return "N/A";
    if (average >= 90) return "A";
    if (average >= 80) return "B";
    if (average >= 70) return "C";
    if (average >= 60) return "D";
    return "E";
  };

  const generateReportCard = (pupilId: string) => {
    const pupil = pupils.find((p) => p.id === pupilId);
    if (!pupil) return;

    const pupilMarks = marks.filter(
      (m) => m.pupilId === pupilId && m.term === selectedTerm && m.year === selectedYear,
    );

    if (pupilMarks.length === 0) {
      toast.error(`No marks found for ${pupil.firstName} ${pupil.lastName}`);
      return;
    }

    setPreviewPupil({ ...pupil, marks: pupilMarks });
    setPreviewDialogOpen(true);
  };

  const generateAllReportCards = () => {
    const classPupils = pupils.filter((p) => p.classId === selectedClass && p.active);
    const pupilsWithMarks = classPupils.filter((p) => {
      const pupilMarks = marks.filter(
        (m) => m.pupilId === p.id && m.term === selectedTerm && m.year === selectedYear,
      );
      return pupilMarks.length > 0;
    });

    if (pupilsWithMarks.length === 0) {
      toast.error("No pupils with marks in this class for the selected term");
      return;
    }

    const first = pupilsWithMarks[0];
    const firstMarks = marks.filter(
      (m) => m.pupilId === first.id && m.term === selectedTerm && m.year === selectedYear,
    );
    setPreviewPupil({ ...first, marks: firstMarks });
    setPreviewDialogOpen(true);
    toast.success(`Generated ${pupilsWithMarks.length} report cards ready for review and printing`);
  };

  const downloadReportCard = () => {
    window.print();
    toast.success(`Report card for ${previewPupil?.firstName || "pupil"} sent to print / PDF download`);
    setPreviewDialogOpen(false);
  };

  return (
    <AppShell title="Reports">
      <Tabs defaultValue="daily">
        <TabsList>
          <TabsTrigger value="daily">Daily</TabsTrigger>
          <TabsTrigger value="weekly">Weekly</TabsTrigger>
          <TabsTrigger value="monthly">Monthly</TabsTrigger>
          <TabsTrigger value="late">Late arrivals</TabsTrigger>
          <TabsTrigger value="report-cards">Report Cards</TabsTrigger>
        </TabsList>

        <TabsContent value="daily" className="mt-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>Today - {today}</CardTitle>
              <div className="flex gap-2">
                <Button size="sm" variant="outline" onClick={handleExportDailyPDF}>
                  <FileText className="h-4 w-4 mr-1" />
                  PDF
                </Button>
                <Button size="sm" variant="outline" onClick={handleExportDailyCSV}>
                  <FileSpreadsheet className="h-4 w-4 mr-1" />
                  Excel
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Pupil</TableHead>
                    <TableHead>Class</TableHead>
                    <TableHead>Arrival</TableHead>
                    <TableHead>Departure</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {todayAtt.map((a) => {
                    const p = pupils.find((x) => x.id === a.pupilId);
                    if (!p) return null;
                    return (
                      <TableRow key={a.id}>
                        <TableCell>
                          {p.firstName} {p.lastName}
                        </TableCell>
                        <TableCell>{classes.find((c) => c.id === p.classId)?.name}</TableCell>
                        <TableCell>{a.arrival ?? "-"}</TableCell>
                        <TableCell>{a.departure ?? "-"}</TableCell>
                      </TableRow>
                    );
                  })}
                  {todayAtt.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={4} className="text-center py-6 text-muted-foreground">
                        No attendance records for today
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="weekly" className="mt-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>Weekly Attendance Summary (Last 7 Days)</CardTitle>
              <div className="flex gap-2">
                <Button size="sm" variant="outline" onClick={handleExportWeeklyPDF}>
                  <FileText className="h-4 w-4 mr-1" />
                  PDF
                </Button>
                <Button size="sm" variant="outline" onClick={handleExportWeeklyCSV}>
                  <FileSpreadsheet className="h-4 w-4 mr-1" />
                  Excel
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Admission No</TableHead>
                    <TableHead>Pupil</TableHead>
                    <TableHead>Class</TableHead>
                    <TableHead>Days Present</TableHead>
                    <TableHead>Late Arrivals</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {weeklySummary.map((item) => (
                    <TableRow key={item.pupil.id}>
                      <TableCell className="font-mono text-xs">{item.pupil.admissionNo}</TableCell>
                      <TableCell>{item.pupil.firstName} {item.pupil.lastName}</TableCell>
                      <TableCell>{item.className}</TableCell>
                      <TableCell>{item.daysPresent}</TableCell>
                      <TableCell>{item.lateDays}</TableCell>
                    </TableRow>
                  ))}
                  {weeklySummary.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={5} className="text-center py-6 text-muted-foreground">
                        No pupils found
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="monthly" className="mt-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>Monthly Attendance Summary (Last 30 Days)</CardTitle>
              <div className="flex gap-2">
                <Button size="sm" variant="outline" onClick={handleExportMonthlyPDF}>
                  <FileText className="h-4 w-4 mr-1" />
                  PDF
                </Button>
                <Button size="sm" variant="outline" onClick={handleExportMonthlyCSV}>
                  <FileSpreadsheet className="h-4 w-4 mr-1" />
                  Excel
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Admission No</TableHead>
                    <TableHead>Pupil</TableHead>
                    <TableHead>Class</TableHead>
                    <TableHead>Days Present</TableHead>
                    <TableHead>Late Arrivals</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {monthlySummary.map((item) => (
                    <TableRow key={item.pupil.id}>
                      <TableCell className="font-mono text-xs">{item.pupil.admissionNo}</TableCell>
                      <TableCell>{item.pupil.firstName} {item.pupil.lastName}</TableCell>
                      <TableCell>{item.className}</TableCell>
                      <TableCell>{item.daysPresent}</TableCell>
                      <TableCell>{item.lateDays}</TableCell>
                    </TableRow>
                  ))}
                  {monthlySummary.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={5} className="text-center py-6 text-muted-foreground">
                        No pupils found
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="late" className="mt-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>Late arrivals (after {lateThreshold})</CardTitle>
              <div className="flex gap-2">
                <Button size="sm" variant="outline" onClick={handleExportLatePDF}>
                  <FileText className="h-4 w-4 mr-1" />
                  PDF
                </Button>
                <Button size="sm" variant="outline" onClick={handleExportLateCSV}>
                  <FileSpreadsheet className="h-4 w-4 mr-1" />
                  Excel
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Pupil</TableHead>
                    <TableHead>Arrival</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {late.map((a) => {
                    const p = pupils.find((x) => x.id === a.pupilId);
                    if (!p) return null;
                    return (
                      <TableRow key={a.id}>
                        <TableCell>
                          {p.firstName} {p.lastName}
                        </TableCell>
                        <TableCell>{a.arrival}</TableCell>
                      </TableRow>
                    );
                  })}
                  {late.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={2} className="text-center py-6 text-muted-foreground">
                        No late arrivals today
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="report-cards" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <GraduationCap className="h-5 w-5" />
                Generate Report Cards
              </CardTitle>
              <CardDescription>
                Generate academic report cards for pupils based on their marks
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex flex-wrap gap-3 items-end">
                  {currentUser?.role === "super_admin" && (
                    <div className="space-y-2">
                      <Label>School</Label>
                      <select
                        value={superSchoolId}
                        onChange={(e) => setSuperSchoolId(e.target.value)}
                        className="flex h-9 rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring md:text-sm"
                      >
                        {schools.map((s) => (
                          <option key={s.id} value={s.id}>
                            {s.name}
                          </option>
                        ))}
                      </select>
                    </div>
                  )}
                  <div className="space-y-2">
                    <Label>Class</Label>
                    <Select value={selectedClass} onValueChange={setSelectedClass}>
                      <SelectTrigger className="w-48">
                        <SelectValue placeholder="Select Class" />
                      </SelectTrigger>
                      <SelectContent>
                        {filteredClasses.map((c) => (
                          <SelectItem key={c.id} value={c.id}>
                            {c.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Term</Label>
                    <Select value={selectedTerm} onValueChange={setSelectedTerm}>
                      <SelectTrigger className="w-32">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {terms.map((t) => (
                          <SelectItem key={t} value={t}>
                            {t}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Year</Label>
                    <Select value={selectedYear} onValueChange={setSelectedYear}>
                      <SelectTrigger className="w-28">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="2024">2024</SelectItem>
                        <SelectItem value="2025">2025</SelectItem>
                        <SelectItem value="2026">2026</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <Button onClick={generateAllReportCards}>
                    <FileText className="h-4 w-4 mr-2" />
                    Generate All Report Cards
                  </Button>
                  <Button variant="outline" onClick={() => setMarksSheetOpen(true)}>
                    <FileSpreadsheet className="h-4 w-4 mr-2" />
                    Preview Marks Sheet
                  </Button>
                </div>

                <div className="border rounded-lg">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Admission No</TableHead>
                        <TableHead>Pupil Name</TableHead>
                        <TableHead>Subjects</TableHead>
                        <TableHead>Average</TableHead>
                        <TableHead>Overall Grade</TableHead>
                        <TableHead className="text-right">Action</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {pupils
                        .filter((p) => p.classId === selectedClass && p.active)
                        .map((p) => {
                          const pupilMarks = marks.filter(
                            (m) =>
                              m.pupilId === p.id &&
                              m.term === selectedTerm &&
                              m.year === selectedYear,
                          );
                          const average = calculateAverage(p.id);
                          const overallGrade = getOverallGrade(average);

                          return (
                            <TableRow key={p.id}>
                              <TableCell>{p.admissionNo}</TableCell>
                              <TableCell className="font-medium">
                                {p.firstName} {p.lastName}
                              </TableCell>
                              <TableCell>{pupilMarks.length} subject(s)</TableCell>
                              <TableCell>
                                {average !== null ? `${average.toFixed(1)}%` : "-"}
                              </TableCell>
                              <TableCell>
                                {overallGrade !== "N/A" ? (
                                  <Badge className={getGradeColor(overallGrade)}>
                                    {overallGrade}
                                  </Badge>
                                ) : (
                                  <Badge variant="secondary">No marks</Badge>
                                )}
                              </TableCell>
                              <TableCell className="text-right">
                                <Button
                                  size="sm"
                                  variant="outline"
                                  disabled={pupilMarks.length === 0}
                                  onClick={() => generateReportCard(p.id)}
                                >
                                  <FileText className="h-3 w-3 mr-1" />
                                  View
                                </Button>
                              </TableCell>
                            </TableRow>
                          );
                        })}
                    </TableBody>
                  </Table>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Report Card Preview Dialog */}
      <Dialog open={previewDialogOpen} onOpenChange={setPreviewDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Report Card Preview</DialogTitle>
          </DialogHeader>
          {previewPupil && (
            <div className="space-y-4 py-4">
              {/* Header */}
              <div className="text-center border-b pb-4">
                <h2 className="text-2xl font-bold">Little Stars Kindergarten</h2>
                <p className="text-muted-foreground">Academic Report Card</p>
              </div>

              {/* Pupil Info */}
              <div className="grid grid-cols-2 gap-4 bg-muted/50 p-4 rounded-lg">
                <div>
                  <Label className="text-muted-foreground">Pupil Name</Label>
                  <p className="font-semibold">
                    {previewPupil.firstName} {previewPupil.lastName}
                  </p>
                </div>
                <div>
                  <Label className="text-muted-foreground">Admission No</Label>
                  <p className="font-semibold">{previewPupil.admissionNo}</p>
                </div>
                <div>
                  <Label className="text-muted-foreground">Class</Label>
                  <p className="font-semibold">
                    {classes.find((c) => c.id === previewPupil.classId)?.name}
                  </p>
                </div>
                <div>
                  <Label className="text-muted-foreground">Term</Label>
                  <p className="font-semibold">
                    {selectedTerm} {selectedYear}
                  </p>
                </div>
              </div>

              {/* Marks Table */}
              <div>
                <h3 className="font-semibold mb-2">Academic Performance</h3>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Subject</TableHead>
                      <TableHead>Score</TableHead>
                      <TableHead>Grade</TableHead>
                      <TableHead>Teacher Comment</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {previewPupil.marks.map((mark: any) => (
                      <TableRow key={mark.id}>
                        <TableCell className="font-medium">{mark.subject}</TableCell>
                        <TableCell>
                          {mark.score}/{mark.maxScore} (
                          {((mark.score / mark.maxScore) * 100).toFixed(0)}%)
                        </TableCell>
                        <TableCell>
                          <Badge className={getGradeColor(mark.grade || "")}>{mark.grade}</Badge>
                        </TableCell>
                        <TableCell className="text-sm">{mark.teacherComment || "-"}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>

              {/* Summary */}
              <div className="bg-primary/10 p-4 rounded-lg">
                <div className="flex items-center justify-between">
                  <div>
                    <Label className="text-muted-foreground">Overall Average</Label>
                    <p className="text-2xl font-bold">
                      {calculateAverage(previewPupil.id)?.toFixed(1)}%
                    </p>
                  </div>
                  <div>
                    <Label className="text-muted-foreground">Overall Grade</Label>
                    <Badge
                      className={`text-xl px-4 py-2 ${getGradeColor(
                        getOverallGrade(calculateAverage(previewPupil.id)),
                      )}`}
                    >
                      {getOverallGrade(calculateAverage(previewPupil.id))}
                    </Badge>
                  </div>
                </div>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setPreviewDialogOpen(false)}>
              Close
            </Button>
            <Button onClick={downloadReportCard}>
              <Download className="h-4 w-4 mr-2" />
              Download PDF
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Pupil Marks Sheet Preview Dialog */}
      <Dialog open={marksSheetOpen} onOpenChange={setMarksSheetOpen}>
        <DialogContent className="max-w-5xl max-h-[90vh] flex flex-col">
          <DialogHeader className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 border-b gap-3">
            <div>
              <DialogTitle className="text-xl font-bold">
                {currentSchoolObj?.name || "Little Stars Kindergarten"} - Pupil Marks Sheet
              </DialogTitle>
              <p className="text-xs text-muted-foreground mt-1">
                Class: <span className="font-semibold text-foreground">{currentClassObj?.name || "All Classes"}</span> | Term: <span className="font-semibold text-foreground">{selectedTerm}</span> | Year: <span className="font-semibold text-foreground">{selectedYear}</span>
              </p>
            </div>
            <div className="flex items-center gap-2">
              <Button size="sm" variant="outline" onClick={() => window.print()}>
                <Printer className="h-4 w-4 mr-1.5" />
                Print Sheet
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={() => {
                  const headers = [
                    "Admission No",
                    "Pupil Name",
                    ...subjects,
                    "Average (%)",
                    "Overall Grade",
                  ];
                  const rows = broadsheetData.map(({ pupil, subjectMarks, avgPct, overallGrade }) => [
                    pupil.admissionNo,
                    `${pupil.firstName} ${pupil.lastName}`,
                    ...subjects.map((s) => {
                      const item = subjectMarks[s];
                      if (!item) return "-";
                      if (sheetDisplayMode === "score") return `${item.score}/${item.maxScore}`;
                      if (sheetDisplayMode === "percentage") return `${item.pct.toFixed(0)}%`;
                      return item.grade || "-";
                    }),
                    avgPct !== null ? `${avgPct.toFixed(1)}%` : "-",
                    overallGrade,
                  ]);
                  const classNameStr = currentClassObj?.name || "All_Classes";
                  downloadCSV(
                    `Marks_Sheet_${classNameStr.replace(/\s+/g, "_")}_${selectedTerm}_${selectedYear}`,
                    headers,
                    rows,
                  );
                  toast.success("Exported Marks Sheet to CSV / Excel");
                }}
              >
                <FileSpreadsheet className="h-4 w-4 mr-1.5" />
                Export Excel
              </Button>
            </div>
          </DialogHeader>

          <div className="py-2 px-3 flex flex-wrap items-center justify-between gap-3 border-b bg-muted/30 rounded-md">
            <div className="flex flex-wrap items-center gap-4">
              <div className="flex items-center gap-2">
                <Label className="text-xs font-semibold">Class:</Label>
                <Select value={selectedClass} onValueChange={setSelectedClass}>
                  <SelectTrigger className="h-8 text-xs w-44 bg-background">
                    <SelectValue placeholder="Select class" />
                  </SelectTrigger>
                  <SelectContent>
                    {filteredClasses.map((c) => (
                      <SelectItem key={c.id} value={c.id} className="text-xs">
                        {c.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="flex items-center gap-2">
                <Label className="text-xs font-semibold">Display Format:</Label>
              <div className="flex bg-background border rounded-lg p-0.5 text-xs font-medium">
                <button
                  type="button"
                  className={`px-3 py-1 rounded-md transition ${
                    sheetDisplayMode === "score"
                      ? "bg-primary text-primary-foreground font-semibold shadow-xs"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                  onClick={() => setSheetDisplayMode("score")}
                >
                  Score (e.g. 85/100)
                </button>
                <button
                  type="button"
                  className={`px-3 py-1 rounded-md transition ${
                    sheetDisplayMode === "percentage"
                      ? "bg-primary text-primary-foreground font-semibold shadow-xs"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                  onClick={() => setSheetDisplayMode("percentage")}
                >
                  Percentage (%)
                </button>
                <button
                  type="button"
                  className={`px-3 py-1 rounded-md transition ${
                    sheetDisplayMode === "grade"
                      ? "bg-primary text-primary-foreground font-semibold shadow-xs"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                  onClick={() => setSheetDisplayMode("grade")}
                >
                  Grade (A-E)
                </button>
              </div>
            </div>
          </div>
          <div className="text-xs text-muted-foreground">
              Total Pupils: <span className="font-semibold text-foreground">{selectedClassPupils.length}</span>
            </div>
          </div>

          <div className="flex-1 overflow-auto py-2">
            <Table className="border text-xs">
              <TableHeader className="bg-muted/70 sticky top-0">
                <TableRow>
                  <TableHead className="w-10 text-center font-bold">#</TableHead>
                  <TableHead className="w-28 font-bold">Admission No</TableHead>
                  <TableHead className="min-w-[140px] font-bold">Pupil Name</TableHead>
                  {subjects.map((s) => (
                    <TableHead key={s} className="text-center min-w-[75px] font-bold">
                      {s}
                    </TableHead>
                  ))}
                  <TableHead className="text-center font-bold bg-muted/90">Average %</TableHead>
                  <TableHead className="text-center font-bold bg-muted/90">Overall Grade</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {broadsheetData.map((row, idx) => (
                  <TableRow key={row.pupil.id} className="hover:bg-muted/40">
                    <TableCell className="text-center font-medium text-muted-foreground">
                      {idx + 1}
                    </TableCell>
                    <TableCell className="font-mono text-xs">{row.pupil.admissionNo}</TableCell>
                    <TableCell className="font-semibold">
                      {row.pupil.firstName} {row.pupil.lastName}
                    </TableCell>
                    {subjects.map((s) => {
                      const m = row.subjectMarks[s];
                      if (!m) {
                        return (
                          <TableCell key={s} className="text-center text-muted-foreground">
                            -
                          </TableCell>
                        );
                      }
                      if (sheetDisplayMode === "score") {
                        return (
                          <TableCell key={s} className="text-center font-medium">
                            {m.score}/{m.maxScore}
                          </TableCell>
                        );
                      }
                      if (sheetDisplayMode === "percentage") {
                        return (
                          <TableCell key={s} className="text-center font-medium">
                            {m.pct.toFixed(0)}%
                          </TableCell>
                        );
                      }
                      return (
                        <TableCell key={s} className="text-center">
                          {m.grade ? (
                            <Badge className={`${getGradeColor(m.grade)} text-[10px] px-1.5 py-0`}>
                              {m.grade}
                            </Badge>
                          ) : (
                            "-"
                          )}
                        </TableCell>
                      );
                    })}
                    <TableCell className="text-center font-bold bg-muted/20">
                      {row.avgPct !== null ? `${row.avgPct.toFixed(1)}%` : "-"}
                    </TableCell>
                    <TableCell className="text-center font-bold bg-muted/20">
                      {row.overallGrade !== "N/A" ? (
                        <Badge
                          className={`${getGradeColor(row.overallGrade)} text-[10px] px-2 py-0.5`}
                        >
                          {row.overallGrade}
                        </Badge>
                      ) : (
                        <Badge variant="secondary" className="text-[10px]">
                          N/A
                        </Badge>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
                {broadsheetData.length === 0 && (
                  <TableRow>
                    <TableCell
                      colSpan={subjects.length + 5}
                      className="text-center py-8 text-muted-foreground"
                    >
                      No active pupils found for this class.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
          <DialogFooter className="pt-2 border-t flex justify-end">
            <Button variant="outline" onClick={() => setMarksSheetOpen(false)}>
              Close Preview
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AppShell>
  );
}
