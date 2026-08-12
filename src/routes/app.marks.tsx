import { createFileRoute } from "@tanstack/react-router";
import { AppShell } from "@/components/app-shell";
import { useStore } from "@/lib/store";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useState, useMemo, useEffect } from "react";
import { toast } from "sonner";
import { Plus, Pencil, Trash2, FileSpreadsheet, Printer, Search, User, ChevronRight, CheckCircle2 } from "lucide-react";
import { downloadCSV } from "@/lib/export-utils";

export const Route = createFileRoute("/app/marks")({
  head: () => ({ meta: [{ title: "Marks & Grades - School Connect" }] }),
  component: MarksPage,
});

function MarksPage() {
  const { currentUser, pupils, classes, marks, addMark, updateMark, deleteMark, schools } =
    useStore();
  const isTeacher = currentUser?.role === "teacher";
  const isSchoolAdmin = currentUser?.role === "admin";
  const isAdmin = currentUser?.role === "super_admin" || currentUser?.role === "admin";
  const canEditMarks = isTeacher || isSchoolAdmin;

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

  const [classId, setClassId] = useState<string>("");

  useEffect(() => {
    if (filteredClasses.length > 0) {
      const defaultClass = isTeacher
        ? (currentUser?.classId ?? filteredClasses[0]?.id)
        : filteredClasses[0]?.id;
      setClassId((curr) => {
        if (!curr || !filteredClasses.some((c) => c.id === curr)) {
          return defaultClass ?? "";
        }
        return curr;
      });
    } else {
      setClassId("");
    }
  }, [filteredClasses, currentUser, isTeacher]);

  const [term, setTerm] = useState("Term 2");
  const [year, setYear] = useState("2025");
  const [subject, setSubject] = useState("Reading");
  const [addDialogOpen, setAddDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [sheetDialogOpen, setSheetDialogOpen] = useState(false);
  const [sheetDisplayMode, setSheetDisplayMode] = useState<"score" | "percentage" | "grade">("score");
  const [selectedPupilId, setSelectedPupilId] = useState("");
  const [pupilSearch, setPupilSearch] = useState("");
  const [editingMark, setEditingMark] = useState<any>(null);
  const [formData, setFormData] = useState({
    score: "",
    maxScore: "100",
    teacherComment: "",
  });

  const classPupils = pupils.filter((p) => p.classId === classId && p.active);
  const filteredMarks = marks.filter(
    (m) => m.term === term && m.year === year && m.subject === subject,
  );

  const subjects = ["Reading", "Math", "Writing", "Art", "Music", "Physical Education", "Science"];

  // Filter subjects for teachers - they can only see their assigned subjects
  // School admins can see all subjects
  const availableSubjects = useMemo(() => {
    if (isTeacher && currentUser?.subjects && currentUser.subjects.length > 0) {
      return subjects.filter((s) => currentUser.subjects?.includes(s));
    }
    return subjects;
  }, [isTeacher, currentUser]);

  const terms = ["Term 1", "Term 2", "Term 3"];

  const currentClass = classes.find((c) => c.id === classId);
  const currentSchool = schools.find(
    (s) => s.id === (currentClass?.schoolId || currentUser?.schoolId),
  );

  const selectedPupil = useMemo(
    () => classPupils.find((p) => p.id === selectedPupilId),
    [classPupils, selectedPupilId],
  );

  const existingMarkForSelected = useMemo(
    () => filteredMarks.find((m) => m.pupilId === selectedPupilId),
    [filteredMarks, selectedPupilId],
  );

  // Auto select first pupil when opening Add Mark dialog if none selected
  useEffect(() => {
    if (addDialogOpen && classPupils.length > 0) {
      if (!selectedPupilId || !classPupils.some((p) => p.id === selectedPupilId)) {
        selectPupilForEntry(classPupils[0].id);
      } else {
        selectPupilForEntry(selectedPupilId);
      }
    }
  }, [addDialogOpen]);

  const selectPupilForEntry = (pupilId: string) => {
    setSelectedPupilId(pupilId);
    const existingMark = marks.find(
      (m) =>
        m.pupilId === pupilId &&
        m.subject === subject &&
        m.term === term &&
        m.year === year,
    );
    if (existingMark) {
      setEditingMark(existingMark);
      setFormData({
        score: existingMark.score.toString(),
        maxScore: existingMark.maxScore.toString(),
        teacherComment: existingMark.teacherComment || "",
      });
    } else {
      setEditingMark(null);
      setFormData((prev) => ({
        score: "",
        maxScore: prev.maxScore || "100",
        teacherComment: "",
      }));
    }
  };

  // Compute broadsheet marks matrix for the pupil sheet preview
  const broadsheetData = useMemo(() => {
    return classPupils.map((p) => {
      const pupilMarks = marks.filter(
        (m) => m.pupilId === p.id && m.term === term && m.year === year,
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
  }, [classPupils, marks, term, year, subjects]);

  const handleSaveMark = (andNext: boolean = false) => {
    if (!selectedPupilId || !formData.score || !formData.maxScore) {
      toast.error("Please fill in score and max score");
      return;
    }

    const scoreNum = parseFloat(formData.score);
    const maxScoreNum = parseFloat(formData.maxScore);

    if (isNaN(scoreNum) || isNaN(maxScoreNum) || maxScoreNum <= 0) {
      toast.error("Please enter valid numeric values");
      return;
    }

    const pupil = classPupils.find((p) => p.id === selectedPupilId);
    const existingMark = marks.find(
      (m) =>
        m.pupilId === selectedPupilId &&
        m.subject === subject &&
        m.term === term &&
        m.year === year,
    );

    if (existingMark) {
      updateMark(existingMark.id, {
        score: scoreNum,
        maxScore: maxScoreNum,
        teacherComment: formData.teacherComment,
      });
      toast.success(`Mark updated for ${pupil?.firstName} ${pupil?.lastName}`);
    } else {
      addMark({
        pupilId: selectedPupilId,
        subject,
        term,
        year,
        score: scoreNum,
        maxScore: maxScoreNum,
        teacherComment: formData.teacherComment,
      });
      toast.success(`Mark added for ${pupil?.firstName} ${pupil?.lastName}`);
    }

    if (andNext) {
      const currentIndex = classPupils.findIndex((p) => p.id === selectedPupilId);
      if (currentIndex !== -1 && currentIndex < classPupils.length - 1) {
        const nextPupil = classPupils[currentIndex + 1];
        selectPupilForEntry(nextPupil.id);
      }
    }
  };

  const handleEditMark = () => {
    if (!editingMark || !formData.score || !formData.maxScore) {
      toast.error("Please fill in all required fields");
      return;
    }

    updateMark(editingMark.id, {
      score: parseFloat(formData.score),
      maxScore: parseFloat(formData.maxScore),
      teacherComment: formData.teacherComment,
    });

    const pupil = classPupils.find((p) => p.id === editingMark.pupilId);
    toast.success(`Mark updated for ${pupil?.firstName} ${pupil?.lastName}`);
    setEditDialogOpen(false);
    setEditingMark(null);
    setFormData({ score: "", maxScore: "100", teacherComment: "" });
  };

  const handleDelete = (markId: string, pupilName: string) => {
    if (confirm(`Are you sure you want to delete this mark for ${pupilName}?`)) {
      deleteMark(markId);
      toast.success("Mark deleted");
      if (editingMark?.id === markId) {
        setFormData((prev) => ({ ...prev, score: "", teacherComment: "" }));
        setEditingMark(null);
      }
    }
  };

  const openEditDialog = (mark: any) => {
    setSelectedPupilId(mark.pupilId);
    setEditingMark(mark);
    setFormData({
      score: mark.score.toString(),
      maxScore: mark.maxScore.toString(),
      teacherComment: mark.teacherComment || "",
    });
    setAddDialogOpen(true);
  };

  const openAddForPupil = (pupilId: string) => {
    selectPupilForEntry(pupilId);
    setAddDialogOpen(true);
  };

  const handleKeyDownForm = (e: React.KeyboardEvent<HTMLInputElement | HTMLTextAreaElement>, isEditMode: boolean = false) => {
    if (e.key === "ArrowDown" || e.key === "ArrowUp") {
      e.preventDefault();
      
      const currentPupilId = selectedPupilId;
      if (!currentPupilId) return;

      if (formData.score && formData.maxScore) {
        const existingMark = marks.find(
          (m) =>
            m.pupilId === currentPupilId &&
            m.subject === subject &&
            m.term === term &&
            m.year === year,
        );

        if (existingMark) {
          updateMark(existingMark.id, {
            score: parseFloat(formData.score),
            maxScore: parseFloat(formData.maxScore),
            teacherComment: formData.teacherComment,
          });
        } else {
          addMark({
            pupilId: currentPupilId,
            subject,
            term,
            year,
            score: parseFloat(formData.score),
            maxScore: parseFloat(formData.maxScore),
            teacherComment: formData.teacherComment,
          });
        }
      }

      const currentIndex = classPupils.findIndex((p) => p.id === currentPupilId);
      if (currentIndex !== -1) {
        const nextIndex = e.key === "ArrowDown" 
          ? (currentIndex + 1) % classPupils.length 
          : (currentIndex - 1 + classPupils.length) % classPupils.length;
        
        const nextPupil = classPupils[nextIndex];
        selectPupilForEntry(nextPupil.id);
      }
    }
  };

  const getGradeColor = (grade: string) => {
    switch (grade) {
      case "A":
        return "bg-green-500 text-white";
      case "B":
        return "bg-blue-500 text-white";
      case "C":
        return "bg-yellow-500 text-white";
      case "D":
        return "bg-orange-500 text-white";
      case "E":
        return "bg-red-500 text-white";
      default:
        return "bg-gray-500 text-white";
    }
  };

  const gradePreview = useMemo(() => {
    const s = parseFloat(formData.score);
    const m = parseFloat(formData.maxScore);
    if (isNaN(s) || isNaN(m) || m <= 0) return null;
    const pct = (s / m) * 100;
    let grade = "E";
    if (pct >= 90) grade = "A";
    else if (pct >= 80) grade = "B";
    else if (pct >= 70) grade = "C";
    else if (pct >= 60) grade = "D";
    return { pct, grade };
  }, [formData.score, formData.maxScore]);

  return (
    <AppShell title="Marks & Grades">
      <Card className="border-0 shadow-sm">
        <CardHeader className="pb-4">
          <div className="flex items-center justify-between">
            <CardTitle>Student Marks</CardTitle>
            <div className="flex items-center gap-2">
              <Button
                size="sm"
                variant="outline"
                onClick={() => setSheetDialogOpen(true)}
              >
                <FileSpreadsheet className="h-4 w-4 mr-2" />
                Preview Marks Sheet
              </Button>
              <Dialog open={addDialogOpen} onOpenChange={setAddDialogOpen}>
                <DialogTrigger asChild>
                  <Button size="sm">
                    <Plus className="h-4 w-4 mr-2" />
                    Add Mark
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-4xl max-h-[90vh] flex flex-col p-6">
                  <DialogHeader className="pb-3 border-b">
                    <div className="flex items-center justify-between">
                      <div>
                        <DialogTitle className="text-xl font-bold">Enter / Add Marks</DialogTitle>
                        <p className="text-xs text-muted-foreground mt-1">
                          Subject: <span className="font-semibold text-foreground">{subject}</span> | Class:{" "}
                          <span className="font-semibold text-foreground">{currentClass?.name || "Selected Class"}</span> |{" "}
                          Term: <span className="font-semibold text-foreground">{term}</span> | Year:{" "}
                          <span className="font-semibold text-foreground">{year}</span>
                        </p>
                      </div>
                    </div>
                  </DialogHeader>

                  <div className="grid grid-cols-1 md:grid-cols-12 gap-6 py-4 flex-1 overflow-hidden">
                    {/* Left Column: All Students Display */}
                    <div className="md:col-span-5 flex flex-col border-r pr-4 h-full min-h-0">
                      <div className="space-y-2 mb-3">
                        <div className="relative">
                          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                          <Input
                            placeholder="Search student..."
                            value={pupilSearch}
                            onChange={(e) => setPupilSearch(e.target.value)}
                            className="pl-9 h-9 text-xs"
                          />
                        </div>
                        <div className="flex items-center justify-between text-xs text-muted-foreground px-1">
                          <span>
                            All Students (<strong className="text-foreground">{classPupils.length}</strong>)
                          </span>
                          <span>
                            <strong className="text-green-600">{filteredMarks.length}</strong> / {classPupils.length} marked
                          </span>
                        </div>
                      </div>

                      <div className="flex-1 overflow-y-auto space-y-1.5 pr-1 max-h-[380px]">
                        {classPupils
                          .filter((p) =>
                            `${p.firstName} ${p.lastName} ${p.admissionNo || ""}`
                              .toLowerCase()
                              .includes(pupilSearch.toLowerCase()),
                          )
                          .map((p) => {
                            const m = filteredMarks.find((mark) => mark.pupilId === p.id);
                            const isSelected = p.id === selectedPupilId;
                            return (
                              <button
                                key={p.id}
                                type="button"
                                onClick={() => selectPupilForEntry(p.id)}
                                className={`w-full text-left p-2.5 rounded-lg border transition-all flex items-center justify-between cursor-pointer ${
                                  isSelected
                                    ? "bg-primary/10 border-primary shadow-xs ring-1 ring-primary"
                                    : "bg-card hover:bg-accent/50 border-border"
                                }`}
                              >
                                <div className="flex items-center gap-2.5 min-w-0">
                                  <div
                                    className={`h-8 w-8 rounded-full flex items-center justify-center font-bold text-xs shrink-0 ${
                                      isSelected
                                        ? "bg-primary text-primary-foreground"
                                        : "bg-muted text-muted-foreground"
                                    }`}
                                  >
                                    {p.firstName[0]}
                                    {p.lastName[0]}
                                  </div>
                                  <div className="min-w-0 truncate">
                                    <p className="font-semibold text-xs leading-none truncate">
                                      {p.firstName} {p.lastName}
                                    </p>
                                    {p.admissionNo && (
                                      <p className="text-[11px] text-muted-foreground mt-0.5 font-mono truncate">
                                        {p.admissionNo}
                                      </p>
                                    )}
                                  </div>
                                </div>
                                <div className="shrink-0 ml-2">
                                  {m ? (
                                    <Badge className={`${getGradeColor(m.grade || "")} text-[10px] px-1.5 py-0.5`}>
                                      {m.score}/{m.maxScore} ({m.grade})
                                    </Badge>
                                  ) : (
                                    <Badge variant="outline" className="text-[10px] text-muted-foreground px-1.5 py-0.5">
                                      No mark
                                    </Badge>
                                  )}
                                </div>
                              </button>
                            );
                          })}
                        {classPupils.length === 0 && (
                          <p className="text-center text-xs text-muted-foreground py-8">
                            No students in this class.
                          </p>
                        )}
                      </div>
                    </div>

                    {/* Right Column: Selected Student Mark Form */}
                    <div className="md:col-span-7 flex flex-col justify-between h-full space-y-4">
                      {selectedPupil ? (
                        <>
                          <div className="space-y-4">
                            <div className="p-3 bg-muted/40 rounded-lg border flex items-center justify-between">
                              <div className="flex items-center gap-3">
                                <div className="h-10 w-10 rounded-full bg-primary/10 text-primary font-bold flex items-center justify-center text-sm">
                                  {selectedPupil.firstName[0]}
                                  {selectedPupil.lastName[0]}
                                </div>
                                <div>
                                  <h4 className="font-bold text-sm">
                                    {selectedPupil.firstName} {selectedPupil.lastName}
                                  </h4>
                                  <p className="text-xs text-muted-foreground">
                                    Adm No: {selectedPupil.admissionNo || "N/A"}
                                  </p>
                                </div>
                              </div>
                              {existingMarkForSelected ? (
                                <Badge className={`${getGradeColor(existingMarkForSelected.grade || "")} px-2.5 py-1 text-xs font-semibold`}>
                                  Saved: {existingMarkForSelected.score}/{existingMarkForSelected.maxScore} ({existingMarkForSelected.grade})
                                </Badge>
                              ) : (
                                <Badge variant="secondary" className="px-2.5 py-1 text-xs">
                                  Pending Entry
                                </Badge>
                              )}
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                              <div className="space-y-2">
                                <Label htmlFor="add-score" className="text-xs font-semibold">
                                  Score
                                </Label>
                                <Input
                                  id="add-score"
                                  type="number"
                                  min="0"
                                  value={formData.score}
                                  onChange={(e) => setFormData({ ...formData, score: e.target.value })}
                                  onKeyDown={(e) => handleKeyDownForm(e, !!existingMarkForSelected)}
                                  placeholder="e.g. 85"
                                  className="text-sm font-semibold"
                                  autoFocus
                                />
                              </div>
                              <div className="space-y-2">
                                <Label htmlFor="add-max" className="text-xs font-semibold">
                                  Max Score
                                </Label>
                                <Input
                                  id="add-max"
                                  type="number"
                                  min="1"
                                  value={formData.maxScore}
                                  onChange={(e) => setFormData({ ...formData, maxScore: e.target.value })}
                                  onKeyDown={(e) => handleKeyDownForm(e, !!existingMarkForSelected)}
                                  className="text-sm"
                                />
                              </div>
                            </div>

                            {gradePreview && (
                              <div className="p-3 bg-accent/30 rounded-lg border text-xs flex items-center justify-between">
                                <span className="text-muted-foreground font-medium">Calculated Percentage & Grade:</span>
                                <div className="flex items-center gap-2">
                                  <span className="font-mono font-bold text-sm">{gradePreview.pct.toFixed(1)}%</span>
                                  <Badge className={`${getGradeColor(gradePreview.grade)} px-2 py-0.5 text-xs font-bold`}>
                                    Grade {gradePreview.grade}
                                  </Badge>
                                </div>
                              </div>
                            )}

                            <div className="space-y-2">
                              <Label htmlFor="add-comment" className="text-xs font-semibold">
                                Teacher Remarks / Comment (Optional)
                              </Label>
                              <Textarea
                                id="add-comment"
                                value={formData.teacherComment}
                                onChange={(e) => setFormData({ ...formData, teacherComment: e.target.value })}
                                onKeyDown={(e) => handleKeyDownForm(e, !!existingMarkForSelected)}
                                placeholder="e.g., Excellent performance, shown good understanding."
                                rows={3}
                                className="text-xs"
                              />
                            </div>
                          </div>

                          <div className="pt-3 border-t flex items-center justify-between gap-2">
                            <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                              <span>Tip: Use ↑ ↓ arrow keys to navigate</span>
                            </div>
                            <div className="flex items-center gap-2">
                              <Button variant="outline" size="sm" onClick={() => setAddDialogOpen(false)}>
                                Close
                              </Button>
                              {existingMarkForSelected && (
                                <Button
                                  variant="destructive"
                                  size="sm"
                                  onClick={() => handleDelete(existingMarkForSelected.id, `${selectedPupil.firstName} ${selectedPupil.lastName}`)}
                                >
                                  Delete
                                </Button>
                              )}
                              <Button size="sm" onClick={() => handleSaveMark(false)}>
                                {existingMarkForSelected ? "Update Mark" : "Save Mark"}
                              </Button>
                              <Button size="sm" variant="secondary" onClick={() => handleSaveMark(true)}>
                                Save & Next <ChevronRight className="h-4 w-4 ml-1" />
                              </Button>
                            </div>
                          </div>
                        </>
                      ) : (
                        <div className="flex flex-col items-center justify-center h-full py-12 text-muted-foreground">
                          <User className="h-10 w-10 mb-2 opacity-40" />
                          <p className="text-xs">Click on a student from the list on the left to enter marks.</p>
                        </div>
                      )}
                    </div>
                  </div>
                </DialogContent>
              </Dialog>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-3 mb-4">
            {currentUser?.role === "super_admin" && (
              <div className="flex items-center gap-2">
                <Label>School:</Label>
                <select
                  value={superSchoolId}
                  onChange={(e) => setSuperSchoolId(e.target.value)}
                  className="flex h-9 rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring file:border-0 file:bg-transparent file:text-sm file:font-medium md:text-sm"
                >
                  {schools.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.name}
                    </option>
                  ))}
                </select>
              </div>
            )}
            <div className="flex items-center gap-2">
              <Label>Class:</Label>
              <Select value={classId} onValueChange={setClassId} disabled={isTeacher}>
                <SelectTrigger className="w-40">
                  <SelectValue />
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
            <div className="flex items-center gap-2">
              <Label>Subject:</Label>
              <Select value={subject} onValueChange={setSubject}>
                <SelectTrigger className="w-48">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {availableSubjects.map((s) => (
                    <SelectItem key={s} value={s}>
                      {s}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-center gap-2">
              <Label>Term:</Label>
              <Select value={term} onValueChange={setTerm}>
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
            <div className="flex items-center gap-2">
              <Label>Year:</Label>
              <Input
                type="number"
                className="w-24"
                value={year}
                onChange={(e) => setYear(e.target.value)}
              />
            </div>
          </div>

          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Pupil</TableHead>
                {isAdmin && <TableHead>Admission No</TableHead>}
                <TableHead>Score</TableHead>
                <TableHead>Grade</TableHead>
                <TableHead>Comment</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {classPupils.map((p) => {
                const mark = filteredMarks.find((m) => m.pupilId === p.id);
                return (
                  <TableRow key={p.id}>
                    <TableCell className="font-medium">
                      {p.firstName} {p.lastName}
                    </TableCell>
                    {isAdmin && <TableCell>{p.admissionNo}</TableCell>}
                    <TableCell>{mark ? `${mark.score}/${mark.maxScore}` : "-"}</TableCell>
                    <TableCell>
                      {mark ? (
                        <Badge className={getGradeColor(mark.grade || "")}>{mark.grade}</Badge>
                      ) : (
                        <Badge variant="secondary">Not graded</Badge>
                      )}
                    </TableCell>
                    <TableCell className="max-w-xs truncate">
                      {mark?.teacherComment || "-"}
                    </TableCell>
                    <TableCell className="text-right space-x-2">
                      {mark ? (
                        <>
                          <Button size="sm" variant="outline" onClick={() => openEditDialog(mark)}>
                            <Pencil className="h-3 w-3" />
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleDelete(mark.id, `${p.firstName} ${p.lastName}`)}
                          >
                            <Trash2 className="h-3 w-3" />
                          </Button>
                        </>
                      ) : (
                        <Button
                          size="sm"
                          variant="ghost"
                          className="text-xs text-muted-foreground hover:text-foreground"
                          onClick={() => openAddForPupil(p.id)}
                        >
                          <Plus className="h-3 w-3 mr-1" /> Add mark
                        </Button>
                      )}
                    </TableCell>
                  </TableRow>
                );
              })}
              {classPupils.length === 0 && (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                    No pupils in this class.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Mark</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="edit-score">Score</Label>
                <Input
                  id="edit-score"
                  type="number"
                  min="0"
                  value={formData.score}
                  onChange={(e) => setFormData({ ...formData, score: e.target.value })}
                  onKeyDown={(e) => handleKeyDownForm(e, true)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-max">Max Score</Label>
                <Input
                  id="edit-max"
                  type="number"
                  min="1"
                  value={formData.maxScore}
                  onChange={(e) => setFormData({ ...formData, maxScore: e.target.value })}
                  onKeyDown={(e) => handleKeyDownForm(e, true)}
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-comment">Teacher Comment (Optional)</Label>
              <Textarea
                id="edit-comment"
                value={formData.teacherComment}
                onChange={(e) => setFormData({ ...formData, teacherComment: e.target.value })}
                onKeyDown={(e) => handleKeyDownForm(e, true)}
                rows={3}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleEditMark}>Update Mark</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Pupil Marks Sheet Preview Dialog */}
      <Dialog open={sheetDialogOpen} onOpenChange={setSheetDialogOpen}>
        <DialogContent className="max-w-5xl max-h-[90vh] flex flex-col">
          <DialogHeader className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 border-b gap-3">
            <div>
              <DialogTitle className="text-xl font-bold">
                {currentSchool?.name || "School Connect"} - Pupil Marks Sheet
              </DialogTitle>
              <p className="text-xs text-muted-foreground mt-1">
                Class: <span className="font-semibold text-foreground">{currentClass?.name || "All Classes"}</span> | Term: <span className="font-semibold text-foreground">{term}</span> | Year: <span className="font-semibold text-foreground">{year}</span>
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
                  const classNameStr = currentClass?.name || "All_Classes";
                  downloadCSV(
                    `Marks_Sheet_${classNameStr.replace(/\s+/g, "_")}_${term}_${year}`,
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
              {!isTeacher && (
                <div className="flex items-center gap-2">
                  <Label className="text-xs font-semibold">Class:</Label>
                  <Select value={classId} onValueChange={setClassId}>
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
              )}
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
              Total Pupils: <span className="font-semibold text-foreground">{classPupils.length}</span>
            </div>
          </div>

          <div className="flex-1 overflow-auto py-2">
            <Table className="border text-xs">
              <TableHeader className="bg-muted/70 sticky top-0">
                <TableRow>
                  <TableHead className="w-10 text-center font-bold">#</TableHead>
                  {isAdmin && <TableHead className="w-28 font-bold">Admission No</TableHead>}
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
                    {isAdmin && (
                      <TableCell className="font-mono text-xs">{row.pupil.admissionNo}</TableCell>
                    )}
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
            <Button variant="outline" onClick={() => setSheetDialogOpen(false)}>
              Close Preview
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AppShell>
  );
}
