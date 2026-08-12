import { createFileRoute } from "@tanstack/react-router";
import { AppShell } from "@/components/app-shell";
import { useStore, type Subject } from "@/lib/store";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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
import { BookOpen, Plus, Search, Pencil, Trash2, Sparkles, Building } from "lucide-react";
import { useState, useMemo } from "react";
import { toast } from "sonner";

export const Route = createFileRoute("/app/subjects")({
  head: () => ({ meta: [{ title: "Custom Subjects - Kindy Connect" }] }),
  component: SubjectsPage,
});

function SubjectsPage() {
  const {
    currentUser,
    schools,
    selectedSchoolId,
    setSchoolContext,
    subjects,
    addSubject,
    updateSubject,
    deleteSubject,
    seedDefaultSubjects,
  } = useStore();

  const isSuperAdmin = currentUser?.role === "super_admin";
  const isStaff = currentUser?.role === "admin" || currentUser?.role === "deputy";

  // Selected school ID for subject context
  const activeSchoolId = isSuperAdmin
    ? selectedSchoolId || schools[0]?.id || ""
    : currentUser?.schoolId || "";

  const currentSchool = schools.find((s) => s.id === activeSchoolId);

  // Filtered subjects for current active school
  const schoolSubjects = useMemo(() => {
    return subjects.filter((s) => s.schoolId === activeSchoolId);
  }, [subjects, activeSchoolId]);

  // Local UI states
  const [searchTerm, setSearchTerm] = useState("");
  const [addDialogOpen, setAddDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedSubject, setSelectedSubject] = useState<Subject | null>(null);

  const [form, setForm] = useState({
    name: "",
    code: "",
  });

  const [isSubmitting, setIsSubmitting] = useState(false);

  // Search filtered subjects list
  const filteredSubjects = useMemo(() => {
    return schoolSubjects.filter(
      (sub) =>
        sub.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (sub.code && sub.code.toLowerCase().includes(searchTerm.toLowerCase()))
    );
  }, [schoolSubjects, searchTerm]);

  // Open add dialog
  const handleOpenAdd = () => {
    if (!activeSchoolId) {
      toast.error("Please select a school first");
      return;
    }
    setForm({ name: "", code: "" });
    setAddDialogOpen(true);
  };

  // Submit add subject
  const handleAddSubject = async () => {
    if (!form.name.trim()) {
      toast.error("Subject name is required");
      return;
    }
    // Check duplicate name within school
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

  if (!isStaff && !isSuperAdmin) {
    return (
      <AppShell title="Custom Subjects">
        <div className="p-6 text-center text-muted-foreground">
          You do not have permission to manage subjects.
        </div>
      </AppShell>
    );
  }

  return (
    <AppShell title="School Subjects">
      <div className="p-6 space-y-6 max-w-7xl mx-auto">
        {/* Header Summary & Actions */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h2 className="text-xl font-bold tracking-tight flex items-center gap-2">
              <BookOpen className="h-6 w-6 text-primary" />
              {currentSchool?.name || "School"} Subjects
            </h2>
            <p className="text-sm text-muted-foreground">
              Manage custom subjects offered by {currentSchool?.name || "your school"}. Teachers can enter marks and generate report cards for these subjects.
            </p>
          </div>

          <div className="flex items-center gap-3">
            {schoolSubjects.length === 0 && (
              <Button
                variant="outline"
                onClick={handleSeedDefaults}
                disabled={isSubmitting}
                className="gap-2"
              >
                <Sparkles className="h-4 w-4 text-amber-500" />
                Seed Standard Subjects
              </Button>
            )}
            <Button onClick={handleOpenAdd} className="gap-2">
              <Plus className="h-4 w-4" />
              Add Subject
            </Button>
          </div>
        </div>

        {/* Super Admin School Switcher if applicable */}
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

        {/* Search & Subject Table */}
        <Card>
          <CardHeader className="pb-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <CardTitle className="text-base font-semibold">
                  Subjects ({filteredSubjects.length})
                </CardTitle>
                <CardDescription>
                  Active customized subject curriculum list
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
                <BookOpen className="h-12 w-12 text-muted-foreground mx-auto opacity-50" />
                <h3 className="text-base font-medium">No subjects found</h3>
                <p className="text-sm text-muted-foreground max-w-sm mx-auto">
                  {searchTerm
                    ? "No subjects matched your search query."
                    : "No subjects have been configured for this school yet. Add your first subject or load standard defaults."}
                </p>
                {!searchTerm && (
                  <div className="flex justify-center gap-3 pt-2">
                    <Button variant="outline" onClick={handleSeedDefaults} disabled={isSubmitting}>
                      <Sparkles className="h-4 w-4 mr-2 text-amber-500" />
                      Add Standard Defaults
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
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredSubjects.map((sub, idx) => (
                    <TableRow key={sub.id}>
                      <TableCell className="font-mono text-xs text-muted-foreground">
                        {idx + 1}
                      </TableCell>
                      <TableCell className="font-medium">
                        <div className="flex items-center gap-2">
                          <span>{sub.name}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        {sub.code ? (
                          <Badge variant="outline" className="font-mono uppercase">
                            {sub.code}
                          </Badge>
                        ) : (
                          <span className="text-xs text-muted-foreground">-</span>
                        )}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-1">
                          <Button
                            size="icon"
                            variant="ghost"
                            onClick={() => handleOpenEdit(sub)}
                          >
                            <Pencil className="h-4 w-4 text-muted-foreground hover:text-foreground" />
                          </Button>
                          <Button
                            size="icon"
                            variant="ghost"
                            onClick={() => handleOpenDelete(sub)}
                          >
                            <Trash2 className="h-4 w-4 text-destructive hover:text-destructive/80" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Add Subject Dialog */}
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
        <DialogContent className="sm:max-w-[400px]">
          <DialogHeader>
            <DialogTitle>Delete Subject</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete <strong className="text-foreground">{selectedSubject?.name}</strong>?
            </DialogDescription>
          </DialogHeader>

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
