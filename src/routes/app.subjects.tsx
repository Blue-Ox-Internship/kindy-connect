import { createFileRoute } from "@tanstack/react-router";
import { AppShell } from "@/components/app-shell";
import { useStore, type Subject } from "@/lib/store";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  BookMarked,
  Plus,
  ListPlus,
  Search,
  Pencil,
  Trash2,
  Sparkles,
  Building,
  CheckCircle2,
  Layers,
  AlertTriangle,
  GraduationCap,
  Eye,
} from "lucide-react";
import { useState, useMemo } from "react";
import { toast } from "sonner";

export const Route = createFileRoute("/app/subjects")({
  head: () => ({ meta: [{ title: "School Subjects - Kindy Connect" }] }),
  component: SubjectsPage,
});

function SubjectsPage() {
  const {
    currentUser,
    users,
    schools,
    selectedSchoolId,
    setSchoolContext,
    subjects,
    marks,
    addSubject,
    addSubjectsBulk,
    updateSubject,
    deleteSubject,
    seedDefaultSubjects,
    getSchoolSubjects,
  } = useStore();

  const userRole = (currentUser?.role || "").toLowerCase();
  const isSuperAdmin = userRole === "super_admin";
  const isStaff = isSuperAdmin || userRole === "admin" || userRole === "deputy" || userRole.includes("admin");
  const isCanEdit = isSuperAdmin || isStaff;

  // Selected school ID for subject context
  const activeSchoolId = isSuperAdmin
    ? selectedSchoolId || schools[0]?.id || currentUser?.schoolId || ""
    : currentUser?.schoolId || schools[0]?.id || "";

  const currentSchool = schools.find((s) => s.id === activeSchoolId);

  // Filtered subjects for current active school (with fallback default subjects if empty)
  const schoolSubjects = useMemo(() => {
    return getSchoolSubjects(activeSchoolId);
  }, [getSchoolSubjects, activeSchoolId, subjects]);

  // Teachers teaching subjects in this school
  const schoolTeachers = useMemo(() => {
    return users.filter(
      (u) => u.role === "teacher" && (isSuperAdmin ? true : u.schoolId === activeSchoolId)
    );
  }, [users, activeSchoolId, isSuperAdmin]);

  // Count coded subjects
  const codedSubjectsCount = useMemo(() => {
    return schoolSubjects.filter((s) => s.code && s.code.trim().length > 0).length;
  }, [schoolSubjects]);

  // Local UI states
  const [searchTerm, setSearchTerm] = useState("");
  const [addDialogOpen, setAddDialogOpen] = useState(false);
  const [bulkDialogOpen, setBulkDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedSubject, setSelectedSubject] = useState<Subject | null>(null);

  const [form, setForm] = useState({
    name: "",
    code: "",
  });

  const [bulkInput, setBulkInput] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Search filtered subjects list
  const filteredSubjects = useMemo(() => {
    return schoolSubjects.filter(
      (sub) =>
        sub.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (sub.code && sub.code.toLowerCase().includes(searchTerm.toLowerCase()))
    );
  }, [schoolSubjects, searchTerm]);

  // Open single add dialog
  const handleOpenAdd = () => {
    if (!activeSchoolId) {
      toast.error("Please select a school first");
      return;
    }
    setForm({ name: "", code: "" });
    setAddDialogOpen(true);
  };

  // Open bulk add dialog
  const handleOpenBulkAdd = () => {
    if (!activeSchoolId) {
      toast.error("Please select a school first");
      return;
    }
    setBulkInput("");
    setBulkDialogOpen(true);
  };

  // Submit single add subject
  const handleAddSubject = async () => {
    if (!form.name.trim()) {
      toast.error("Subject name is required");
      return;
    }
    const exists = schoolSubjects.some(
      (s) => s.name.toLowerCase() === form.name.trim().toLowerCase()
    );
    if (exists) {
      toast.error(`Subject "${form.name.trim()}" already exists in this school`);
      return;
    }

    try {
      setIsSubmitting(true);
      await addSubject({
        schoolId: activeSchoolId,
        name: form.name.trim(),
        code: form.code.trim(),
      });
      toast.success(`Subject "${form.name.trim()}" created successfully`);
      setAddDialogOpen(false);
    } catch (err: any) {
      toast.error(err?.message || "Failed to add subject");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Submit bulk add subjects
  const handleBulkAddSubjects = async () => {
    if (!bulkInput.trim()) {
      toast.error("Please enter at least one subject name");
      return;
    }

    const rawNames = bulkInput
      .split(/[\n,]+/)
      .map((n) => n.trim())
      .filter((n) => n.length > 0);

    if (rawNames.length === 0) {
      toast.error("No valid subject names entered");
      return;
    }

    const newItems: Array<{ name: string; code?: string }> = [];
    const skipped: string[] = [];

    for (const name of rawNames) {
      const already = schoolSubjects.some(
        (s) => s.name.toLowerCase() === name.toLowerCase()
      ) || newItems.some((i) => i.name.toLowerCase() === name.toLowerCase());

      if (already) {
        skipped.push(name);
      } else {
        const words = name.split(" ");
        let code = "";
        if (words.length >= 2) {
          code = (words[0][0] + words[1][0] + (words[2]?.[0] || words[1][1] || "")).toUpperCase();
        } else {
          code = name.slice(0, 3).toUpperCase();
        }
        newItems.push({ name, code });
      }
    }

    if (newItems.length === 0) {
      toast.error("All entered subjects already exist in this school");
      return;
    }

    try {
      setIsSubmitting(true);
      await addSubjectsBulk({
        schoolId: activeSchoolId,
        subjects: newItems,
      });
      toast.success(`Successfully added ${newItems.length} subjects!`);
      if (skipped.length > 0) {
        toast.info(`Skipped ${skipped.length} duplicate(s): ${skipped.join(", ")}`);
      }
      setBulkDialogOpen(false);
    } catch (err: any) {
      toast.error(err?.message || "Failed to add subjects in bulk");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Open edit dialog
  const handleOpenEdit = (subject: Subject) => {
    setSelectedSubject(subject);
    setForm({
      name: subject.name,
      code: subject.code || "",
    });
    setEditDialogOpen(true);
  };

  // Submit edit subject
  const handleEditSubject = async () => {
    if (!selectedSubject) return;
    if (!form.name.trim()) {
      toast.error("Subject name is required");
      return;
    }
    const exists = schoolSubjects.some(
      (s) => s.id !== selectedSubject.id && s.name.toLowerCase() === form.name.trim().toLowerCase()
    );
    if (exists) {
      toast.error(`Subject "${form.name.trim()}" already exists in this school`);
      return;
    }

    try {
      setIsSubmitting(true);
      await updateSubject(selectedSubject.id, form.name.trim(), form.code.trim());
      toast.success("Subject updated successfully");
      setEditDialogOpen(false);
      setSelectedSubject(null);
    } catch (err: any) {
      toast.error(err?.message || "Failed to update subject");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Open delete dialog
  const handleOpenDelete = (subject: Subject) => {
    setSelectedSubject(subject);
    setDeleteDialogOpen(true);
  };

  // Check if subject has marks recorded or assigned teachers
  const subjectUsageInfo = useMemo(() => {
    if (!selectedSubject) return { marksCount: 0, teachersCount: 0 };
    const marksCount = marks.filter((m) => m.subject.toLowerCase() === selectedSubject.name.toLowerCase()).length;
    const teachersCount = schoolTeachers.filter((t) => t.subjects?.includes(selectedSubject.name)).length;
    return { marksCount, teachersCount };
  }, [selectedSubject, marks, schoolTeachers]);

  // Submit delete subject
  const handleDeleteSubject = async () => {
    if (!selectedSubject) return;
    try {
      setIsSubmitting(true);
      await deleteSubject(selectedSubject.id);
      toast.success(`Subject "${selectedSubject.name}" deleted successfully`);
      setDeleteDialogOpen(false);
      setSelectedSubject(null);
    } catch (err: any) {
      toast.error(err?.message || "Failed to delete subject");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Seed default standard subjects
  const handleSeedDefaults = async () => {
    if (!activeSchoolId) return;
    try {
      setIsSubmitting(true);
      await seedDefaultSubjects(activeSchoolId);
      toast.success("Standard subjects seeded successfully!");
    } catch (err: any) {
      toast.error(err?.message || "Failed to seed default subjects");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <AppShell title="School Subjects">
      <div className="p-6 space-y-6 max-w-7xl mx-auto">
        {/* Header Summary & Actions */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h2 className="text-xl font-bold tracking-tight flex items-center gap-2">
              <BookMarked className="h-6 w-6 text-primary" />
              {currentSchool?.name || "School"} Curriculum Subjects
              {!isCanEdit && (
                <Badge variant="outline" className="text-xs bg-muted gap-1">
                  <Eye className="h-3 w-3" /> Read-Only View
                </Badge>
              )}
            </h2>
            <p className="text-sm text-muted-foreground">
              {isCanEdit
                ? `Create and manage subjects offered at ${currentSchool?.name || "your school"}. Assign subjects to teachers, record marks, and print report cards.`
                : `View subjects offered at ${currentSchool?.name || "your school"} and see teacher assignments.`}
            </p>
          </div>

          {isCanEdit && (
            <div className="flex flex-wrap items-center gap-2">
              <Button
                variant="outline"
                onClick={handleSeedDefaults}
                disabled={isSubmitting}
                className="gap-2"
              >
                <Sparkles className="h-4 w-4 text-amber-500" />
                Seed Standard Subjects
              </Button>
              <Button
                variant="outline"
                onClick={handleOpenBulkAdd}
                disabled={isSubmitting}
                className="gap-2"
              >
                <ListPlus className="h-4 w-4 text-primary" />
                Bulk Add
              </Button>
              <Button onClick={handleOpenAdd} className="gap-2">
                <Plus className="h-4 w-4" />
                Add Subject
              </Button>
            </div>
          )}
        </div>

        {/* Super Admin School Switcher */}
        {isSuperAdmin && (
          <Card className="bg-muted/40 border-dashed">
            <CardContent className="py-4 flex items-center gap-4">
              <Building className="h-5 w-5 text-muted-foreground" />
              <div className="flex-1 text-sm font-medium">Managing Subjects For:</div>
              <Select
                value={activeSchoolId}
                onValueChange={(val) => setSchoolContext(val)}
              >
                <SelectTrigger className="w-[260px] bg-background">
                  <SelectValue placeholder="Select School" />
                </SelectTrigger>
                <SelectContent>
                  {schools.map((sch) => (
                    <SelectItem key={sch.id} value={sch.id}>
                      {sch.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </CardContent>
          </Card>
        )}

        {/* Stats Grid Overview */}
        <div className="grid gap-4 sm:grid-cols-3">
          <Card className="border-0 shadow-sm">
            <CardContent className="p-4 flex items-center gap-4">
              <div className="h-12 w-12 rounded-2xl bg-primary/15 text-primary flex items-center justify-center">
                <BookMarked className="h-6 w-6" />
              </div>
              <div>
                <div className="text-2xl font-bold">{schoolSubjects.length}</div>
                <div className="text-xs text-muted-foreground">Total Curriculum Subjects</div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-sm">
            <CardContent className="p-4 flex items-center gap-4">
              <div className="h-12 w-12 rounded-2xl bg-green-500/15 text-green-600 flex items-center justify-center">
                <CheckCircle2 className="h-6 w-6" />
              </div>
              <div>
                <div className="text-2xl font-bold">{codedSubjectsCount}</div>
                <div className="text-xs text-muted-foreground">Subjects with Subject Codes</div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-sm">
            <CardContent className="p-4 flex items-center gap-4">
              <div className="h-12 w-12 rounded-2xl bg-blue-500/15 text-blue-600 flex items-center justify-center">
                <GraduationCap className="h-6 w-6" />
              </div>
              <div>
                <div className="text-2xl font-bold">{schoolTeachers.length}</div>
                <div className="text-xs text-muted-foreground">Teaching Staff Assigned</div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Search & Subject Table */}
        <Card>
          <CardHeader className="pb-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <CardTitle className="text-base font-semibold">
                  Subjects Directory ({filteredSubjects.length})
                </CardTitle>
                <CardDescription>
                  List of customized subjects configured for this school
                </CardDescription>
              </div>

              <div className="relative w-full sm:w-64">
                <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search subject or code..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-9"
                />
              </div>
            </div>
          </CardHeader>

          <CardContent className="p-0">
            {filteredSubjects.length === 0 ? (
              <div className="p-12 text-center space-y-3">
                <Layers className="h-12 w-12 text-muted-foreground mx-auto opacity-50" />
                <h3 className="text-base font-medium">No subjects found</h3>
                <p className="text-sm text-muted-foreground max-w-md mx-auto">
                  {searchTerm
                    ? "No subjects matched your search query."
                    : "No subjects have been configured for this school yet. Add your custom subjects or seed the standard curriculum."}
                </p>
                {!searchTerm && isCanEdit && (
                  <div className="flex flex-wrap justify-center gap-3 pt-2">
                    <Button variant="outline" onClick={handleSeedDefaults} disabled={isSubmitting}>
                      <Sparkles className="h-4 w-4 mr-2 text-amber-500" />
                      Seed Standard Subjects
                    </Button>
                    <Button variant="outline" onClick={handleOpenBulkAdd} disabled={isSubmitting}>
                      <ListPlus className="h-4 w-4 mr-2" />
                      Bulk Add Subjects
                    </Button>
                    <Button onClick={handleOpenAdd}>
                      <Plus className="h-4 w-4 mr-2" />
                      Add Custom Subject
                    </Button>
                  </div>
                )}
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-12">#</TableHead>
                    <TableHead>Subject Name</TableHead>
                    <TableHead>Subject Code</TableHead>
                    <TableHead>Assigned Teachers</TableHead>
                    {isCanEdit && <TableHead className="text-right">Actions</TableHead>}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredSubjects.map((sub, idx) => {
                    const assignedTeachers = schoolTeachers.filter((t) =>
                      t.subjects?.includes(sub.name)
                    );
                    const isMySubject = currentUser?.subjects?.includes(sub.name);
                    return (
                      <TableRow key={sub.id} className={isMySubject ? "bg-primary/5 font-medium" : ""}>
                        <TableCell className="font-mono text-xs text-muted-foreground">
                          {idx + 1}
                        </TableCell>
                        <TableCell className="font-medium">
                          <div className="flex items-center gap-2">
                            <BookMarked className="h-4 w-4 text-primary opacity-70" />
                            <span>{sub.name}</span>
                            {isMySubject && (
                              <Badge variant="default" className="text-[10px] py-0 px-1.5 bg-primary/20 text-primary border-primary/30">
                                My Subject
                              </Badge>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          {sub.code ? (
                            <Badge variant="outline" className="font-mono uppercase bg-primary/5">
                              {sub.code}
                            </Badge>
                          ) : (
                            <span className="text-xs text-muted-foreground">-</span>
                          )}
                        </TableCell>
                        <TableCell>
                          {assignedTeachers.length > 0 ? (
                            <div className="flex items-center gap-1.5 flex-wrap">
                              <Badge variant="secondary" className="text-xs">
                                {assignedTeachers.length} teacher{assignedTeachers.length > 1 ? "s" : ""}
                              </Badge>
                              <span className="text-xs text-muted-foreground truncate max-w-[200px]">
                                ({assignedTeachers.map((t) => t.name).join(", ")})
                              </span>
                            </div>
                          ) : (
                            <span className="text-xs text-muted-foreground opacity-60">Unassigned</span>
                          )}
                        </TableCell>
                        {isCanEdit && (
                          <TableCell className="text-right">
                            <div className="flex justify-end gap-1">
                              <Button
                                size="icon"
                                variant="ghost"
                                onClick={() => handleOpenEdit(sub)}
                                title="Edit subject"
                              >
                                <Pencil className="h-4 w-4 text-muted-foreground hover:text-foreground" />
                              </Button>
                              <Button
                                size="icon"
                                variant="ghost"
                                onClick={() => handleOpenDelete(sub)}
                                title="Delete subject"
                              >
                                <Trash2 className="h-4 w-4 text-destructive hover:text-destructive/80" />
                              </Button>
                            </div>
                          </TableCell>
                        )}
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Add Single Subject Dialog */}
      <Dialog open={addDialogOpen} onOpenChange={setAddDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Add Custom Subject</DialogTitle>
            <DialogDescription>
              Create a new subject for {currentSchool?.name || "this school"}.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="add-name">Subject Name *</Label>
              <Input
                id="add-name"
                placeholder="e.g., Mathematics, Luganda, Science"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                onKeyDown={(e) => e.key === "Enter" && handleAddSubject()}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="add-code">Subject Code (Optional)</Label>
              <Input
                id="add-code"
                placeholder="e.g., MTH, LUG, SCI"
                value={form.code}
                onChange={(e) => setForm({ ...form, code: e.target.value })}
                onKeyDown={(e) => e.key === "Enter" && handleAddSubject()}
              />
              <p className="text-xs text-muted-foreground">
                Short abbreviation used on report cards and summary tables.
              </p>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setAddDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleAddSubject} disabled={isSubmitting}>
              {isSubmitting ? "Adding..." : "Add Subject"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Bulk Add Subjects Dialog */}
      <Dialog open={bulkDialogOpen} onOpenChange={setBulkDialogOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <ListPlus className="h-5 w-5 text-primary" />
              Bulk Add Subjects
            </DialogTitle>
            <DialogDescription>
              Enter or paste multiple subject names below (one per line or separated by commas).
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-3">
            <div className="space-y-2">
              <Label htmlFor="bulk-input">Subject Names *</Label>
              <Textarea
                id="bulk-input"
                rows={6}
                placeholder={`Mathematics\nEnglish\nScience\nSocial Studies\nLuganda\nArt & Craft`}
                value={bulkInput}
                onChange={(e) => setBulkInput(e.target.value)}
                className="font-mono text-sm"
              />
              <p className="text-xs text-muted-foreground">
                Tip: Standard 3-letter codes will be automatically generated for each subject (you can edit them later).
              </p>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setBulkDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleBulkAddSubjects} disabled={isSubmitting}>
              {isSubmitting ? "Adding..." : "Add All Subjects"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Subject Dialog */}
      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Edit Subject</DialogTitle>
            <DialogDescription>
              Update subject details for {selectedSubject?.name}.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="edit-name">Subject Name *</Label>
              <Input
                id="edit-name"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                onKeyDown={(e) => e.key === "Enter" && handleEditSubject()}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="edit-code">Subject Code (Optional)</Label>
              <Input
                id="edit-code"
                value={form.code}
                onChange={(e) => setForm({ ...form, code: e.target.value })}
                onKeyDown={(e) => e.key === "Enter" && handleEditSubject()}
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setEditDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleEditSubject} disabled={isSubmitting}>
              {isSubmitting ? "Saving..." : "Save Changes"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Subject Dialog */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-destructive">
              <AlertTriangle className="h-5 w-5" />
              Delete Subject
            </DialogTitle>
            <DialogDescription>
              Are you sure you want to delete <strong className="text-foreground">{selectedSubject?.name}</strong>?
            </DialogDescription>
          </DialogHeader>

          {selectedSubject && (subjectUsageInfo.marksCount > 0 || subjectUsageInfo.teachersCount > 0) && (
            <div className="p-3 bg-amber-500/10 border border-amber-500/30 rounded-lg text-xs space-y-1 text-amber-800 dark:text-amber-300">
              <div className="font-semibold flex items-center gap-1">
                <AlertTriangle className="h-3.5 w-3.5" /> Notice:
              </div>
              {subjectUsageInfo.marksCount > 0 && (
                <div>• {subjectUsageInfo.marksCount} mark entries exist for this subject.</div>
              )}
              {subjectUsageInfo.teachersCount > 0 && (
                <div>• {subjectUsageInfo.teachersCount} teacher(s) currently assigned to teach this subject.</div>
              )}
            </div>
          )}

          <DialogFooter className="mt-4">
            <Button variant="outline" onClick={() => setDeleteDialogOpen(false)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleDeleteSubject} disabled={isSubmitting}>
              {isSubmitting ? "Deleting..." : "Delete Subject"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AppShell>
  );
}
