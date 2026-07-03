import { createFileRoute } from "@tanstack/react-router";
import { AppShell } from "@/components/app-shell";
import { useStore, type ClassRoom } from "@/lib/mock-store";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Plus, Search, Edit2, Trash2 } from "lucide-react";
import { useState, useMemo } from "react";
import { toast } from "sonner";

export const Route = createFileRoute("/app/classes")({
  head: () => ({ meta: [{ title: "Classes - Little Stars" }] }),
  component: ClassesPage,
});

function ClassesPage() {
  const { currentUser, classes, users, pupils, schools, addClass, updateClass, deleteClass } = useStore();
  const [q, setQ] = useState("");
  const [open, setOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [editingClass, setEditingClass] = useState<ClassRoom | null>(null);

  const isSuperAdmin = currentUser?.role === "super_admin";
  const isAuthorized = isSuperAdmin || currentUser?.role === "admin" || currentUser?.role === "deputy";

  // Super Admin School filtering
  const [superSchoolId, setSuperSchoolId] = useState<string>(schools[0]?.id ?? "");

  // Form states
  const [form, setForm] = useState({
    name: "",
    teacherId: "",
    schoolId: currentUser?.schoolId ?? schools[0]?.id ?? "",
  });

  const [editForm, setEditForm] = useState({
    name: "",
    teacherId: "",
  });

  // Filter classes to display
  const classesToDisplay = useMemo(() => {
    let list = classes;
    if (isSuperAdmin) {
      list = list.filter((c) => c.schoolId === superSchoolId);
    }
    return list.filter((c) => c.name.toLowerCase().includes(q.toLowerCase()));
  }, [classes, isSuperAdmin, superSchoolId, q]);

  // List of teachers for the selected school
  const teachers = useMemo(() => {
    const targetSchoolId = isSuperAdmin ? (open ? form.schoolId : (editingClass?.schoolId ?? "")) : (currentUser?.schoolId ?? "");
    return users.filter((u) => u.role === "teacher" && u.status === "verified" && u.schoolId === targetSchoolId);
  }, [users, isSuperAdmin, open, form.schoolId, editingClass, currentUser]);

  const submitCreate = async () => {
    if (!form.name.trim()) return toast.error("Class name is required");
    const activeSchoolId = isSuperAdmin ? form.schoolId : (currentUser?.schoolId ?? "");
    if (!activeSchoolId) return toast.error("School is required");

    await addClass({
      name: form.name.trim(),
      schoolId: activeSchoolId,
      teacherId: form.teacherId || undefined,
    });

    toast.success("Classroom created successfully");
    setOpen(false);
    setForm({ name: "", teacherId: "", schoolId: currentUser?.schoolId ?? schools[0]?.id ?? "" });
  };

  const startEdit = (cls: ClassRoom) => {
    setEditingClass(cls);
    setEditForm({
      name: cls.name,
      teacherId: cls.teacherId || "",
    });
    setEditOpen(true);
  };

  const submitEdit = async () => {
    if (!editingClass) return;
    if (!editForm.name.trim()) return toast.error("Class name is required");

    await updateClass(editingClass.id, {
      name: editForm.name.trim(),
      teacherId: editForm.teacherId || undefined,
    });

    toast.success("Classroom updated successfully");
    setEditOpen(false);
    setEditingClass(null);
  };

  const handleDelete = async (id: string, name: string) => {
    if (confirm(`Are you sure you want to delete "${name}"? Teachers assigned will be unlinked.`)) {
      await deleteClass(id);
      toast.success("Classroom deleted successfully");
    }
  };

  if (!isAuthorized) {
    return (
      <AppShell title="Unauthorized">
        <div className="text-center py-12 text-muted-foreground">
          You do not have permission to access classroom management.
        </div>
      </AppShell>
    );
  }

  return (
    <AppShell title="Classrooms">
      <Card className="border-0 shadow-sm">
        <CardContent className="p-5">
          {/* Filters and Actions */}
          <div className="flex flex-col sm:flex-row gap-3 mb-5 justify-between">
            <div className="flex flex-1 flex-col sm:flex-row gap-3">
              <div className="relative flex-1 max-w-sm">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search classes..." className="pl-9" />
              </div>
              
              {isSuperAdmin && (
                <div className="flex items-center gap-2">
                  <Label className="shrink-0 text-sm">School Filter:</Label>
                  <select
                    value={superSchoolId}
                    onChange={(e) => setSuperSchoolId(e.target.value)}
                    className="flex h-9 rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                  >
                    {schools.map((s) => (
                      <option key={s.id} value={s.id}>{s.name}</option>
                    ))}
                  </select>
                </div>
              )}
            </div>

            <Dialog open={open} onOpenChange={setOpen}>
              <DialogTrigger asChild>
                <Button className="flex items-center gap-1">
                  <Plus className="h-4 w-4" /> Create Class
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Create new classroom</DialogTitle>
                </DialogHeader>
                <div className="space-y-4 py-2">
                  {isSuperAdmin && (
                    <div>
                      <Label htmlFor="school">School</Label>
                      <select
                        id="school"
                        value={form.schoolId}
                        onChange={(e) => setForm({ ...form, schoolId: e.target.value, teacherId: "" })}
                        className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-base shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1"
                      >
                        {schools.map((s) => (
                          <option key={s.id} value={s.id}>{s.name}</option>
                        ))}
                      </select>
                    </div>
                  )}
                  <div>
                    <Label htmlFor="name">Class Name</Label>
                    <Input id="name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="e.g. Sunflower Class" />
                  </div>
                  <div>
                    <Label htmlFor="teacher">Class Teacher (Optional)</Label>
                    <select
                      id="teacher"
                      value={form.teacherId}
                      onChange={(e) => setForm({ ...form, teacherId: e.target.value })}
                      className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-base shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1"
                    >
                      <option value="">Unassigned</option>
                      {teachers.map((t) => (
                        <option key={t.id} value={t.id}>{t.name}</option>
                      ))}
                    </select>
                  </div>
                </div>
                <DialogFooter>
                  <Button onClick={submitCreate}>Save Class</Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>

          {/* Classes Table */}
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Class Name</TableHead>
                {isSuperAdmin && <TableHead>School</TableHead>}
                <TableHead>Assigned Teacher</TableHead>
                <TableHead>Total Pupils</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {classesToDisplay.map((c) => {
                const schoolName = schools.find((s) => s.id === c.schoolId)?.name || "N/A";
                const teacherName = users.find((u) => u.id === c.teacherId)?.name || "Unassigned";
                const classPupilsCount = pupils.filter((p) => p.classId === c.id && p.active).length;
                return (
                  <TableRow key={c.id}>
                    <TableCell className="font-semibold">{c.name}</TableCell>
                    {isSuperAdmin && <TableCell className="text-muted-foreground text-sm">{schoolName}</TableCell>}
                    <TableCell>{teacherName}</TableCell>
                    <TableCell>{classPupilsCount} pupils</TableCell>
                    <TableCell className="text-right space-x-2">
                      <Button size="icon" variant="ghost" onClick={() => startEdit(c)}>
                        <Edit2 className="h-4 w-4 text-muted-foreground" />
                      </Button>
                      <Button size="icon" variant="ghost" onClick={() => handleDelete(c.id, c.name)}>
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </TableCell>
                  </TableRow>
                );
              })}
              {classesToDisplay.length === 0 && (
                <TableRow>
                  <TableCell colSpan={isSuperAdmin ? 5 : 4} className="text-center text-muted-foreground py-8">
                    No classes found.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>

          {/* Edit Dialog */}
          <Dialog open={editOpen} onOpenChange={setEditOpen}>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Edit Classroom - {editingClass?.name}</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 py-2">
                <div>
                  <Label htmlFor="edit-name">Class Name</Label>
                  <Input id="edit-name" value={editForm.name} onChange={(e) => setEditForm({ ...editForm, name: e.target.value })} />
                </div>
                <div>
                  <Label htmlFor="edit-teacher">Class Teacher</Label>
                  <select
                    id="edit-teacher"
                    value={editForm.teacherId}
                    onChange={(e) => setEditForm({ ...editForm, teacherId: e.target.value })}
                    className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-base shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1"
                  >
                    <option value="">Unassigned</option>
                    {teachers.map((t) => (
                      <option key={t.id} value={t.id}>{t.name}</option>
                    ))}
                  </select>
                </div>
              </div>
              <DialogFooter>
                <Button onClick={submitEdit}>Save Changes</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </CardContent>
      </Card>
    </AppShell>
  );
}
