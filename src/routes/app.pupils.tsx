import { createFileRoute } from "@tanstack/react-router";
import { AppShell } from "@/components/app-shell";
import { useStore, type Pupil } from "@/lib/mock-store";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Plus, Search, Edit } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

export const Route = createFileRoute("/app/pupils")({
  head: () => ({ meta: [{ title: "Pupils - Little Stars" }] }),
  component: PupilsPage,
});

function PupilsPage() {
  const { pupils, classes, parents, addPupil, updatePupil, deactivatePupil } = useStore();
  const [q, setQ] = useState("");
  const [open, setOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [editingPupil, setEditingPupil] = useState<Pupil | null>(null);
  const [form, setForm] = useState({
    admissionNo: "",
    firstName: "",
    lastName: "",
    gender: "M" as "M" | "F",
    dob: "",
    classId: classes[0]?.id ?? "",
    parentName: "",
    parentPhone: "",
    parentEmail: "",
    parentRelationship: "Mother",
    photo: "",
  });
  const [editForm, setEditForm] = useState({
    admissionNo: "",
    firstName: "",
    lastName: "",
    gender: "M" as "M" | "F",
    dob: "",
    classId: "",
    photo: "",
  });

  const filtered = pupils.filter(
    (p) => `${p.firstName} ${p.lastName} ${p.admissionNo}`.toLowerCase().includes(q.toLowerCase()),
  );

  const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    // Validate file type
    if (!file.type.startsWith("image/")) {
      toast.error("Please select an image file");
      return;
    }
    
    // Validate file size (max 2MB)
    if (file.size > 2 * 1024 * 1024) {
      toast.error("Image size must be less than 2MB");
      return;
    }
    
    // Convert to base64
    const reader = new FileReader();
    reader.onloadend = () => {
      setForm({ ...form, photo: reader.result as string });
    };
    reader.readAsDataURL(file);
  };

  const handleEditPhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    // Validate file type
    if (!file.type.startsWith("image/")) {
      toast.error("Please select an image file");
      return;
    }
    
    // Validate file size (max 2MB)
    if (file.size > 2 * 1024 * 1024) {
      toast.error("Image size must be less than 2MB");
      return;
    }
    
    // Convert to base64
    const reader = new FileReader();
    reader.onloadend = () => {
      setEditForm({ ...editForm, photo: reader.result as string });
    };
    reader.readAsDataURL(file);
  };

  const submit = async () => {
    if (!form.admissionNo || !form.firstName || !form.lastName) return toast.error("Fill required fields");
    if (pupils.some((p) => p.admissionNo === form.admissionNo)) return toast.error("Admission number already exists");
    if (!form.parentName || !form.parentPhone || !form.parentEmail) {
      return toast.error("Parent / guardian details are required");
    }

    try {
      await addPupil({
        admissionNo: form.admissionNo,
        firstName: form.firstName,
        lastName: form.lastName,
        gender: form.gender,
        dob: form.dob,
        classId: form.classId,
        photo: form.photo || undefined,
        parentIds: [],
        parent: {
          name: form.parentName,
          phone: form.parentPhone,
          email: form.parentEmail,
          relationship: form.parentRelationship,
        },
      } as any);
      toast.success("Pupil registered successfully and saved to database");
      setOpen(false);
      setForm({
        admissionNo: "",
        firstName: "",
        lastName: "",
        gender: "M",
        dob: "",
        classId: classes[0]?.id ?? "",
        parentName: "",
        parentPhone: "",
        parentEmail: "",
        parentRelationship: "Mother",
        photo: "",
      });
    } catch (error: any) {
      console.error("Error saving pupil:", error);
      toast.error(`Failed to save pupil: ${error.message || "Unknown error"}`);
    }
  };

  const openEdit = (pupil: Pupil) => {
    setEditingPupil(pupil);
    setEditForm({
      admissionNo: pupil.admissionNo,
      firstName: pupil.firstName,
      lastName: pupil.lastName,
      gender: pupil.gender,
      dob: pupil.dob,
      classId: pupil.classId,
      photo: pupil.photo || "",
    });
    setEditOpen(true);
  };

  const submitEdit = async () => {
    if (!editingPupil) return;
    if (!editForm.admissionNo || !editForm.firstName || !editForm.lastName) {
      return toast.error("Fill required fields");
    }
    
    // Check if admission number changed and is already taken
    if (editForm.admissionNo !== editingPupil.admissionNo && 
        pupils.some((p) => p.admissionNo === editForm.admissionNo)) {
      return toast.error("Admission number already exists");
    }

    await updatePupil(editingPupil.id, {
      admissionNo: editForm.admissionNo,
      firstName: editForm.firstName,
      lastName: editForm.lastName,
      gender: editForm.gender,
      dob: editForm.dob,
      classId: editForm.classId,
      photo: editForm.photo || undefined,
    });
    
    toast.success(`${editForm.firstName} ${editForm.lastName} updated successfully`);
    setEditOpen(false);
    setEditingPupil(null);
  };

  return (
    <AppShell title="Pupils">
      <Card className="border-0 shadow-sm">
        <CardContent className="p-5">
          <div className="flex flex-col sm:flex-row gap-3 mb-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search by name or admission no..." className="pl-9" />
            </div>
            <Dialog open={open} onOpenChange={setOpen}>
              <DialogTrigger asChild>
                <Button><Plus className="h-4 w-4 mr-1" /> Register pupil</Button>
              </DialogTrigger>
              <DialogContent className="max-h-[90vh] overflow-y-auto">
                <DialogHeader><DialogTitle>Register new pupil</DialogTitle></DialogHeader>
                <div className="grid grid-cols-2 gap-3 pr-2">
                  <div className="col-span-2"><Label>Admission number</Label><Input value={form.admissionNo} onChange={(e) => setForm({ ...form, admissionNo: e.target.value })} /></div>
                  <div><Label>First name</Label><Input value={form.firstName} onChange={(e) => setForm({ ...form, firstName: e.target.value })} /></div>
                  <div><Label>Last name</Label><Input value={form.lastName} onChange={(e) => setForm({ ...form, lastName: e.target.value })} /></div>
                  <div><Label>Gender</Label>
                    <Select value={form.gender} onValueChange={(v) => setForm({ ...form, gender: v as "M" | "F" })}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent><SelectItem value="M">Male</SelectItem><SelectItem value="F">Female</SelectItem></SelectContent>
                    </Select>
                  </div>
                  <div><Label>Date of birth</Label><Input type="date" value={form.dob} onChange={(e) => setForm({ ...form, dob: e.target.value })} /></div>
                  <div className="col-span-2"><Label>Class</Label>
                    <Select value={form.classId} onValueChange={(v) => setForm({ ...form, classId: v })}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>{classes.map((c) => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}</SelectContent>
                    </Select>
                  </div>
                  <div className="col-span-2">
                    <Label>Photo</Label>
                    <Input type="file" accept="image/*" onChange={handlePhotoChange} />
                    {form.photo && (
                      <div className="mt-2">
                        <img src={form.photo} alt="Preview" className="w-24 h-24 object-cover rounded-md border" />
                      </div>
                    )}
                  </div>
                  <div className="col-span-2 rounded-xl border p-3 space-y-3 bg-muted/20">
                    <div className="text-sm font-medium">Parent / guardian details <span className="text-destructive">*</span></div>
                    <div><Label>Full name <span className="text-destructive">*</span></Label><Input value={form.parentName} onChange={(e) => setForm({ ...form, parentName: e.target.value })} /></div>
                    <div><Label>Phone <span className="text-destructive">*</span></Label><Input value={form.parentPhone} onChange={(e) => setForm({ ...form, parentPhone: e.target.value })} placeholder="+254..." /></div>
                    <div><Label>Email <span className="text-destructive">*</span></Label><Input type="email" value={form.parentEmail} onChange={(e) => setForm({ ...form, parentEmail: e.target.value })} /></div>
                    <div><Label>Relationship <span className="text-destructive">*</span></Label>
                      <Select value={form.parentRelationship} onValueChange={(v) => setForm({ ...form, parentRelationship: v })}>
                        <SelectTrigger><SelectValue /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Mother">Mother</SelectItem>
                          <SelectItem value="Father">Father</SelectItem>
                          <SelectItem value="Guardian">Guardian</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </div>
                <DialogFooter><Button onClick={submit}>Save pupil</Button></DialogFooter>
              </DialogContent>
            </Dialog>
          </div>

          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Photo</TableHead><TableHead>Adm. No</TableHead><TableHead>Name</TableHead><TableHead>Class</TableHead><TableHead>Gender</TableHead><TableHead>Guardians</TableHead><TableHead>Status</TableHead><TableHead></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map((p) => (
                <TableRow key={p.id}>
                  <TableCell>
                    {p.photo ? (
                      <img src={p.photo} alt={`${p.firstName} ${p.lastName}`} className="w-10 h-10 object-cover rounded-full border" />
                    ) : (
                      <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center text-xs font-medium">
                        {p.firstName[0]}{p.lastName[0]}
                      </div>
                    )}
                  </TableCell>
                  <TableCell className="font-mono text-xs">{p.admissionNo}</TableCell>
                  <TableCell className="font-medium">{p.firstName} {p.lastName}</TableCell>
                  <TableCell>{classes.find((c) => c.id === p.classId)?.name ?? "-"}</TableCell>
                  <TableCell>{p.gender === "M" ? "Male" : "Female"}</TableCell>
                  <TableCell>{p.parentIds.length}</TableCell>
                  <TableCell>{p.active ? <Badge>Active</Badge> : <Badge variant="secondary">Inactive</Badge>}</TableCell>
                  <TableCell className="text-right">
                    <Button size="sm" variant="ghost" onClick={() => openEdit(p)}>
                      <Edit className="h-4 w-4 mr-1" /> Edit
                    </Button>
                    {p.active && <Button size="sm" variant="ghost" onClick={() => { deactivatePupil(p.id); toast.success("Pupil deactivated"); }}>Deactivate</Button>}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Edit Pupil Dialog */}
      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogContent className="max-h-[90vh] overflow-y-auto">
          <DialogHeader><DialogTitle>Edit Pupil Details</DialogTitle></DialogHeader>
          <div className="grid grid-cols-2 gap-3">
            <div className="col-span-2">
              <Label>Admission number</Label>
              <Input value={editForm.admissionNo} onChange={(e) => setEditForm({ ...editForm, admissionNo: e.target.value })} />
            </div>
            <div>
              <Label>First name</Label>
              <Input value={editForm.firstName} onChange={(e) => setEditForm({ ...editForm, firstName: e.target.value })} />
            </div>
            <div>
              <Label>Last name</Label>
              <Input value={editForm.lastName} onChange={(e) => setEditForm({ ...editForm, lastName: e.target.value })} />
            </div>
            <div>
              <Label>Gender</Label>
              <Select value={editForm.gender} onValueChange={(v) => setEditForm({ ...editForm, gender: v as "M" | "F" })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="M">Male</SelectItem>
                  <SelectItem value="F">Female</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Date of birth</Label>
              <Input type="date" value={editForm.dob} onChange={(e) => setEditForm({ ...editForm, dob: e.target.value })} />
            </div>
            <div className="col-span-2">
              <Label>Class</Label>
              <Select value={editForm.classId} onValueChange={(v) => setEditForm({ ...editForm, classId: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {classes.map((c) => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="col-span-2">
              <Label>Photo</Label>
              <Input type="file" accept="image/*" onChange={handleEditPhotoChange} />
              {editForm.photo && (
                <div className="mt-2">
                  <img src={editForm.photo} alt="Preview" className="w-24 h-24 object-cover rounded-md border" />
                </div>
              )}
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditOpen(false)}>Cancel</Button>
            <Button onClick={submitEdit}>Save Changes</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AppShell>
  );
}