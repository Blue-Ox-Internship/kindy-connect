import { createFileRoute, Link } from "@tanstack/react-router";
import { AppShell } from "@/components/app-shell";
import { useStore, type User, type Role, type TeacherStatus } from "@/lib/store";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "@/components/ui/dialog";
import { Check, X, Plus, Search, Trash2, Edit, RefreshCw, Eye, EyeOff, UserPlus, BookOpen } from "lucide-react";
import { useState, useMemo, useEffect } from "react";
import { toast } from "sonner";

export const Route = createFileRoute("/app/teachers")({
  head: () => ({ meta: [{ title: "Teachers - Noble Edu Admin" }] }),
  component: TeachersPage,
});

export function TeachersPage() {
  const store = useStore();
  const currentUser = store?.currentUser ?? null;
  const users = useMemo(() => store?.users ?? [], [store?.users]);
  const schools = useMemo(() => store?.schools ?? [], [store?.schools]);
  const classes = useMemo(() => store?.classes ?? [], [store?.classes]);
  const { approveTeacher, rejectTeacher, registerUser, updateUser, deleteUser, getSchoolSubjects } = store;

  const isSuperAdmin = currentUser?.role === "super_admin";
  const isSchoolAdmin = currentUser?.role === "admin";
  const isAuthorized = isSuperAdmin || isSchoolAdmin || currentUser?.role === "deputy";

  const [q, setQ] = useState("");
  const [schoolFilter, setSchoolFilter] = useState<string>("all");
  const [open, setOpen] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  // Edit state
  const [editOpen, setEditOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [editShowPassword, setEditShowPassword] = useState(false);

  const defaultSchoolId = currentUser?.schoolId ?? schools[0]?.id ?? "";

  const [form, setForm] = useState({
    id: "",
    name: "",
    email: "",
    phone: "",
    role: "teacher" as Role,
    schoolId: defaultSchoolId,
    classId: "",
    password: "",
    subjects: [] as string[],
    photo: "",
  });

  const [editForm, setEditForm] = useState({
    name: "",
    email: "",
    phone: "",
    role: "teacher" as Role,
    schoolId: "",
    classId: "",
    password: "",
    status: "verified" as TeacherStatus,
    subjects: [] as string[],
    photo: "",
  });

  // Keep default school ID updated when component mounts or currentUser loads
  useEffect(() => {
    if (!form.schoolId && defaultSchoolId) {
      setForm((f) => ({ ...f, schoolId: defaultSchoolId }));
    }
  }, [defaultSchoolId]);

  // Target school for subjects & classes selection
  const activeSchoolForForm = form.schoolId || defaultSchoolId;
  const rawSubjects = getSchoolSubjects ? getSchoolSubjects(activeSchoolForForm) : [];
  const availableSubjects = useMemo(
    () => (rawSubjects || []).map((s) => s.name).filter(Boolean),
    [rawSubjects],
  );

  const availableClasses = useMemo(() => {
    if (!activeSchoolForForm) return classes;
    return classes.filter((c) => c && c.schoolId === activeSchoolForForm);
  }, [classes, activeSchoolForForm]);

  // Target school for edit form subjects & classes
  const activeSchoolForEdit = editForm.schoolId || defaultSchoolId;
  const rawEditSubjects = getSchoolSubjects ? getSchoolSubjects(activeSchoolForEdit) : [];
  const editAvailableSubjects = useMemo(
    () => (rawEditSubjects || []).map((s) => s.name).filter(Boolean),
    [rawEditSubjects],
  );

  const editAvailableClasses = useMemo(() => {
    if (!activeSchoolForEdit) return classes;
    return classes.filter((c) => c && c.schoolId === activeSchoolForEdit);
  }, [classes, activeSchoolForEdit]);

  const generateRandomTeacherId = () => {
    const prefix = "TCH";
    const num = Math.floor(100 + Math.random() * 900);
    return `${prefix}-${num}`;
  };

  const generateDefaultPassword = () => {
    return "Teacher@2026";
  };

  const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>, isEdit = false) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      toast.error("Please select a valid image file");
      return;
    }

    if (file.size > 2 * 1024 * 1024) {
      toast.error("Image size must be less than 2MB");
      return;
    }

    const reader = new FileReader();
    reader.onloadend = () => {
      if (isEdit) {
        setEditForm((f) => ({ ...f, photo: reader.result as string }));
      } else {
        setForm((f) => ({ ...f, photo: reader.result as string }));
      }
    };
    reader.readAsDataURL(file);
  };

  const resetForm = () => {
    setForm({
      id: generateRandomTeacherId(),
      name: "",
      email: "",
      phone: "",
      role: "teacher" as Role,
      schoolId: defaultSchoolId,
      classId: "",
      password: generateDefaultPassword(),
      subjects: [],
      photo: "",
    });
    setShowPassword(false);
  };

  const handleOpenChange = (isOpen: boolean) => {
    setOpen(isOpen);
    if (isOpen) {
      resetForm();
    }
  };

  const openEditModal = (user: User) => {
    setEditingUser(user);
    setEditForm({
      name: user.name || "",
      email: user.email || "",
      phone: user.phone || "",
      role: user.role || "teacher",
      schoolId: user.schoolId || defaultSchoolId,
      classId: user.classId || "",
      password: "",
      status: user.status || "verified",
      subjects: user.subjects || [],
      photo: user.photo || "",
    });
    setEditShowPassword(false);
    setEditOpen(true);
  };

  const listToDisplay = useMemo(() => {
    let list = users || [];

    if (!isSuperAdmin && isSchoolAdmin) {
      list = list.filter((u) => u && u.schoolId === currentUser?.schoolId);
    } else if (!isSuperAdmin && !isSchoolAdmin) {
      list = list.filter((u) => u && u.role === "teacher" && u.schoolId === currentUser?.schoolId);
    }

    if (isSuperAdmin && schoolFilter !== "all") {
      list = list.filter((u) => u && u.schoolId === schoolFilter);
    }

    if (q.trim()) {
      const search = q.toLowerCase();
      list = list.filter(
        (u) =>
          u &&
          ((u.name && u.name.toLowerCase().includes(search)) ||
            (u.email && u.email.toLowerCase().includes(search)) ||
            (u.id && u.id.toLowerCase().includes(search)) ||
            (u.phone && u.phone.toLowerCase().includes(search))),
      );
    }

    return list;
  }, [users, isSuperAdmin, isSchoolAdmin, schoolFilter, q, currentUser]);

  const pending = useMemo(
    () => listToDisplay.filter((t) => t && t.status === "pending"),
    [listToDisplay],
  );
  const verified = useMemo(
    () => listToDisplay.filter((t) => t && t.status === "verified"),
    [listToDisplay],
  );
  const rejected = useMemo(
    () => listToDisplay.filter((t) => t && t.status === "rejected"),
    [listToDisplay],
  );

  const formatRegisteredAt = (value: string | Date) =>
    value instanceof Date ? value.toISOString().slice(0, 10) : value;

  const submitCreateUser = async () => {
    const userId = form.id.trim();
    const name = form.name.trim();
    const email = form.email.trim();
    const phone = form.phone.trim();
    const password = form.password.trim();

    if (!userId || !name || !email || !phone || !password) {
      return toast.error("Please fill in all required fields (ID, Name, Email, Phone, Password)");
    }

    if (users.some((u) => u && u.id && u.id.trim().toLowerCase() === userId.toLowerCase())) {
      return toast.error(`Assigned ID '${userId}' is already in use`);
    }
    if (users.some((u) => u && u.email && u.email.trim().toLowerCase() === email.toLowerCase())) {
      return toast.error(`Email address '${email}' is already registered`);
    }
    if (users.some((u) => u && u.phone && u.phone.trim() === phone)) {
      return toast.error(`Phone number '${phone}' is already registered`);
    }

    const targetSchoolId = isSuperAdmin ? form.schoolId : (currentUser?.schoolId ?? defaultSchoolId);
    if (!isSuperAdmin && !targetSchoolId) {
      return toast.error("School context is missing");
    }

    try {
      await registerUser({
        id: userId,
        name,
        email,
        phone,
        role: form.role,
        password,
        schoolId: isSuperAdmin && form.role === "super_admin" ? undefined : targetSchoolId,
        status: "verified",
        subjects: form.subjects,
        photo: form.photo,
      });

      // If a class assignment was selected, update the user with classId
      if (form.classId && updateUser) {
        await updateUser(userId, { classId: form.classId });
      }

      toast.success(`Teacher account for ${name} created successfully!`);
      setOpen(false);
      resetForm();
    } catch (error: any) {
      console.error("Error creating teacher:", error);
      toast.error(error.message || "Failed to create teacher account");
    }
  };

  const submitEditUser = async () => {
    if (!editingUser) return;
    const name = editForm.name.trim();
    const email = editForm.email.trim();
    const phone = editForm.phone.trim();

    if (!name || !email || !phone) {
      return toast.error("Name, email, and phone cannot be empty");
    }

    try {
      await updateUser(editingUser.id, {
        name,
        email,
        phone,
        role: editForm.role,
        schoolId: isSuperAdmin && editForm.role === "super_admin" ? undefined : editForm.schoolId,
        classId: editForm.classId || undefined,
        status: editForm.status,
        subjects: editForm.subjects,
        photo: editForm.photo,
        ...(editForm.password.trim() ? { password: editForm.password.trim() } : {}),
      });

      toast.success(`Updated details for ${name}`);
      setEditOpen(false);
      setEditingUser(null);
    } catch (error: any) {
      console.error("Error updating user:", error);
      toast.error(error.message || "Failed to update user");
    }
  };

  const renderTable = (list: typeof users, withActions = false, showDelete = false) => (
    <div className="rounded-md border overflow-hidden">
      <Table>
        <TableHeader>
          <TableRow className="bg-muted/50">
            {isSuperAdmin && <TableHead className="w-24">User ID</TableHead>}
            <TableHead>Teacher Name</TableHead>
            <TableHead>Contact Info</TableHead>
            {isSuperAdmin && <TableHead>School</TableHead>}
            <TableHead>Class Assigned</TableHead>
            <TableHead>Subjects Taught</TableHead>
            {(isSuperAdmin || isSchoolAdmin) && <TableHead>Role</TableHead>}
            <TableHead>Registered</TableHead>
            <TableHead>Status</TableHead>
            <TableHead className="text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {list.map((t) => {
            if (!t) return null;
            const schoolName = schools.find((s) => s.id === t.schoolId)?.name || "System Admin";
            const assignedClass = classes.find((c) => c.id === t.classId)?.name;
            const canDelete = isSuperAdmin && t.id !== currentUser?.id;

            return (
              <TableRow key={t.id} className="hover:bg-muted/30 transition-colors">
                {isSuperAdmin && (
                  <TableCell className="font-mono text-xs font-semibold">{t.id}</TableCell>
                )}
                <TableCell>
                  <div className="flex items-center gap-3">
                    {t.photo ? (
                      <img
                        src={t.photo}
                        alt={t.name}
                        className="h-9 w-9 rounded-full object-cover border"
                      />
                    ) : (
                      <div className="h-9 w-9 rounded-full bg-primary/10 text-primary flex items-center justify-center font-bold text-sm">
                        {t.name?.charAt(0).toUpperCase() || "T"}
                      </div>
                    )}
                    <div>
                      <div className="font-medium text-foreground">{t.name}</div>
                      <div className="text-xs text-muted-foreground font-mono">{t.id}</div>
                    </div>
                  </div>
                </TableCell>
                <TableCell>
                  <div className="text-sm">{t.email}</div>
                  <div className="text-xs text-muted-foreground">{t.phone}</div>
                </TableCell>
                {isSuperAdmin && (
                  <TableCell className="text-muted-foreground text-xs">{schoolName}</TableCell>
                )}
                <TableCell>
                  {assignedClass ? (
                    <Badge variant="outline" className="font-normal bg-accent/20">
                      {assignedClass}
                    </Badge>
                  ) : (
                    <span className="text-xs text-muted-foreground italic">Unassigned</span>
                  )}
                </TableCell>
                <TableCell>
                  {t.subjects && t.subjects.length > 0 ? (
                    <div className="flex flex-wrap gap-1 max-w-xs">
                      {t.subjects.slice(0, 3).map((sub) => (
                        <Badge key={sub} variant="secondary" className="text-[10px] px-1.5 py-0">
                          {sub}
                        </Badge>
                      ))}
                      {t.subjects.length > 3 && (
                        <Badge variant="outline" className="text-[10px] px-1 py-0">
                          +{t.subjects.length - 3}
                        </Badge>
                      )}
                    </div>
                  ) : (
                    <span className="text-xs text-muted-foreground italic">None</span>
                  )}
                </TableCell>
                {(isSuperAdmin || isSchoolAdmin) && (
                  <TableCell>
                    <Badge variant="outline" className="capitalize font-normal text-xs">
                      {t.role ? t.role.replace("_", " ") : "N/A"}
                    </Badge>
                  </TableCell>
                )}
                <TableCell className="text-xs text-muted-foreground">
                  {t.registeredAt ? formatRegisteredAt(t.registeredAt) : "N/A"}
                </TableCell>
                <TableCell>
                  <Badge
                    variant={
                      t.status === "verified"
                        ? "default"
                        : t.status === "rejected"
                          ? "destructive"
                          : "secondary"
                    }
                    className="capitalize text-xs"
                  >
                    {t.status || "pending"}
                  </Badge>
                </TableCell>
                <TableCell className="text-right">
                  <div className="flex items-center justify-end gap-1">
                    <Button
                      size="sm"
                      variant="ghost"
                      className="h-8 px-2 text-muted-foreground hover:text-foreground"
                      onClick={() => openEditModal(t)}
                      title="Edit Teacher"
                    >
                      <Edit className="h-4 w-4" />
                    </Button>

                    {withActions && t.status === "pending" && (
                      <>
                        <Button
                          size="sm"
                          variant="outline"
                          className="h-8 px-2 text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50"
                          onClick={async () => {
                            await approveTeacher(t.id);
                            toast.success(`${t.name} approved and activated`);
                          }}
                        >
                          <Check className="h-4 w-4 mr-1" /> Approve
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          className="h-8 px-2 text-rose-600 hover:text-rose-700 hover:bg-rose-50"
                          onClick={async () => {
                            await rejectTeacher(t.id);
                            toast(`${t.name} status set to rejected`);
                          }}
                        >
                          <X className="h-4 w-4 mr-1" /> Reject
                        </Button>
                      </>
                    )}

                    {showDelete && canDelete && (
                      <Button
                        size="sm"
                        variant="ghost"
                        className="h-8 px-2 text-destructive hover:bg-destructive/10"
                        onClick={async () => {
                          if (
                            confirm(
                              `Are you sure you want to delete ${t.name}? This action cannot be undone.`,
                            )
                          ) {
                            try {
                              await deleteUser(t.id);
                              toast.success(`${t.name} has been deleted`);
                            } catch (error: any) {
                              toast.error(error.message || "Failed to delete user");
                            }
                          }
                        }}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                </TableCell>
              </TableRow>
            );
          })}
          {list.length === 0 && (
            <TableRow>
              <TableCell
                colSpan={isSuperAdmin ? 10 : 8}
                className="text-center text-muted-foreground py-10"
              >
                <div className="flex flex-col items-center justify-center gap-2">
                  <UserPlus className="h-8 w-8 text-muted-foreground/50" />
                  <div>No teacher records found in this view.</div>
                  <Button
                    variant="outline"
                    size="sm"
                    className="mt-2"
                    onClick={() => handleOpenChange(true)}
                  >
                    <Plus className="h-4 w-4 mr-1" /> Add New Teacher
                  </Button>
                </div>
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
    </div>
  );

  if (!isAuthorized) {
    return (
      <AppShell title="Unauthorized">
        <Card className="border-destructive/50 max-w-lg mx-auto mt-10">
          <CardHeader>
            <CardTitle className="text-destructive">Access Denied</CardTitle>
            <CardDescription>
              You do not have permission to access the Teachers Management page.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="text-sm">
              <strong>Current user:</strong> {currentUser?.name || "Unknown"}
            </div>
            <div className="text-sm">
              <strong>Current role:</strong>{" "}
              <Badge variant="outline" className="capitalize">
                {currentUser?.role?.replace("_", " ") || "none"}
              </Badge>
            </div>
            <div className="text-sm text-muted-foreground">
              <strong>Required roles:</strong> Admin, Super Admin, or Deputy
            </div>
          </CardContent>
        </Card>
      </AppShell>
    );
  }

  return (
    <AppShell title="Teacher Directory & Management">
      <Card className="border-0 shadow-sm">
        <CardHeader className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-4 border-b">
          <div>
            <CardTitle className="text-xl font-bold flex items-center gap-2">
              <BookOpen className="h-5 w-5 text-primary" /> Teachers Directory
            </CardTitle>
            <CardDescription>
              {isSuperAdmin
                ? `Manage teachers across all schools. Total listed: ${listToDisplay.length} user(s).`
                : `Add new teachers, assign classes and subjects, and manage staff access.`}
            </CardDescription>
          </div>

          <Dialog open={open} onOpenChange={handleOpenChange}>
            <DialogTrigger asChild>
              <Button className="flex items-center gap-2 shadow-sm font-medium">
                <Plus className="h-4 w-4" /> Add New Teacher
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle className="text-lg font-bold flex items-center gap-2">
                  <UserPlus className="h-5 w-5 text-primary" /> Register New Teacher
                </DialogTitle>
              </DialogHeader>

              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  submitCreateUser();
                }}
                autoComplete="off"
                className="space-y-4 py-2"
              >
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <div className="flex items-center justify-between">
                      <Label htmlFor="create-id" className="text-xs font-semibold">
                        Teacher Login ID *
                      </Label>
                      <button
                        type="button"
                        onClick={() => setForm({ ...form, id: generateRandomTeacherId() })}
                        className="text-xs text-primary flex items-center gap-1 hover:underline"
                      >
                        <RefreshCw className="h-3 w-3" /> Auto-ID
                      </button>
                    </div>
                    <Input
                      id="create-id"
                      value={form.id}
                      onChange={(e) => setForm({ ...form, id: e.target.value })}
                      placeholder="e.g. TCH-101"
                      className="mt-1"
                      required
                    />
                  </div>

                  <div>
                    <Label htmlFor="create-name" className="text-xs font-semibold">
                      Full Name *
                    </Label>
                    <Input
                      id="create-name"
                      value={form.name}
                      onChange={(e) => setForm({ ...form, name: e.target.value })}
                      placeholder="e.g. Mary Nambasa"
                      className="mt-1"
                      required
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="create-email" className="text-xs font-semibold">
                      Email Address *
                    </Label>
                    <Input
                      id="create-email"
                      type="email"
                      value={form.email}
                      onChange={(e) => setForm({ ...form, email: e.target.value })}
                      placeholder="e.g. mary@school.edu"
                      className="mt-1"
                      required
                    />
                  </div>

                  <div>
                    <Label htmlFor="create-phone" className="text-xs font-semibold">
                      Phone Number *
                    </Label>
                    <Input
                      id="create-phone"
                      value={form.phone}
                      onChange={(e) => setForm({ ...form, phone: e.target.value })}
                      placeholder="e.g. 0771234567"
                      className="mt-1"
                      required
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <div className="flex items-center justify-between">
                      <Label htmlFor="create-pwd" className="text-xs font-semibold">
                        Login Password *
                      </Label>
                      <button
                        type="button"
                        onClick={() => setForm({ ...form, password: generateDefaultPassword() })}
                        className="text-xs text-primary hover:underline"
                      >
                        Reset Default
                      </button>
                    </div>
                    <div className="relative mt-1">
                      <Input
                        id="create-pwd"
                        type={showPassword ? "text" : "password"}
                        value={form.password}
                        onChange={(e) => setForm({ ...form, password: e.target.value })}
                        required
                        className="pr-10"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                      >
                        {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </button>
                    </div>
                  </div>

                  <div>
                    <Label htmlFor="create-role" className="text-xs font-semibold">
                      Account Role
                    </Label>
                    <select
                      id="create-role"
                      value={form.role}
                      onChange={(e) => setForm({ ...form, role: e.target.value as Role })}
                      className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring mt-1"
                    >
                      <option value="teacher">Teacher</option>
                      <option value="deputy">Deputy Headteacher</option>
                      {(isSuperAdmin || isSchoolAdmin) && <option value="admin">School Admin</option>}
                      {isSuperAdmin && <option value="super_admin">Super Admin</option>}
                    </select>
                  </div>
                </div>

                {isSuperAdmin && form.role !== "super_admin" && (
                  <div>
                    <Label htmlFor="create-school" className="text-xs font-semibold">
                      Assigned School *
                    </Label>
                    <select
                      id="create-school"
                      value={form.schoolId}
                      onChange={(e) => setForm({ ...form, schoolId: e.target.value })}
                      className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring mt-1"
                    >
                      {schools.map((s) => (
                        <option key={s.id} value={s.id}>
                          {s.name}
                        </option>
                      ))}
                    </select>
                  </div>
                )}

                {form.role === "teacher" && (
                  <>
                    <div>
                      <Label htmlFor="create-class" className="text-xs font-semibold">
                        Class Teacher Assignment (Optional)
                      </Label>
                      <select
                        id="create-class"
                        value={form.classId}
                        onChange={(e) => setForm({ ...form, classId: e.target.value })}
                        className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring mt-1"
                      >
                        <option value="">-- No Class Assigned --</option>
                        {availableClasses.map((cls) => (
                          <option key={cls.id} value={cls.id}>
                            {cls.name}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <div className="flex items-center justify-between">
                        <Label className="text-xs font-semibold">
                          Subjects Taught (Optional)
                        </Label>
                        {availableSubjects.length > 0 && (
                          <div className="flex items-center gap-2 text-xs">
                            <button
                              type="button"
                              onClick={() => setForm({ ...form, subjects: [...availableSubjects] })}
                              className="text-primary hover:underline"
                            >
                              Select All
                            </button>
                            <span className="text-muted-foreground">•</span>
                            <button
                              type="button"
                              onClick={() => setForm({ ...form, subjects: [] })}
                              className="text-muted-foreground hover:underline"
                            >
                              Clear All
                            </button>
                          </div>
                        )}
                      </div>

                      {availableSubjects.length === 0 ? (
                        <div className="mt-1.5 p-3 bg-amber-500/10 border border-amber-500/30 rounded-md text-xs text-amber-800 dark:text-amber-300">
                          No custom subjects configured for this school yet. You can add the teacher now and assign subjects later in{" "}
                          <Link to="/app/subjects" className="font-semibold underline text-primary">
                            Subject Settings
                          </Link>
                          .
                        </div>
                      ) : (
                        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 mt-1.5 p-3 border rounded-md max-h-40 overflow-y-auto bg-muted/20">
                          {availableSubjects.map((subject) => (
                            <label
                              key={subject}
                              className="flex items-center gap-2 text-xs cursor-pointer hover:text-primary transition-colors"
                            >
                              <input
                                type="checkbox"
                                checked={form.subjects.includes(subject)}
                                onChange={(e) => {
                                  if (e.target.checked) {
                                    setForm({ ...form, subjects: [...form.subjects, subject] });
                                  } else {
                                    setForm({
                                      ...form,
                                      subjects: form.subjects.filter((s) => s !== subject),
                                    });
                                  }
                                }}
                                className="h-4 w-4 rounded border-input"
                              />
                              <span>{subject}</span>
                            </label>
                          ))}
                        </div>
                      )}
                    </div>
                  </>
                )}

                <div>
                  <Label htmlFor="create-photo" className="text-xs font-semibold">
                    Profile Photo (Optional)
                  </Label>
                  <Input
                    id="create-photo"
                    type="file"
                    accept="image/*"
                    onChange={(e) => handlePhotoChange(e, false)}
                    className="mt-1"
                  />
                  {form.photo && (
                    <div className="mt-2 flex items-center gap-3">
                      <img
                        src={form.photo}
                        alt="Preview"
                        className="w-16 h-16 object-cover rounded-full border"
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => setForm({ ...form, photo: "" })}
                        className="text-xs text-destructive"
                      >
                        Remove Photo
                      </Button>
                    </div>
                  )}
                </div>

                <DialogFooter className="pt-2">
                  <Button type="button" variant="outline" onClick={() => setOpen(false)}>
                    Cancel
                  </Button>
                  <Button type="submit">Create Teacher Account</Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>

          {/* EDIT TEACHER DIALOG */}
          <Dialog open={editOpen} onOpenChange={setEditOpen}>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle className="text-lg font-bold flex items-center gap-2">
                  <Edit className="h-5 w-5 text-primary" /> Edit Teacher Profile
                </DialogTitle>
              </DialogHeader>

              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  submitEditUser();
                }}
                autoComplete="off"
                className="space-y-4 py-2"
              >
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="edit-id" className="text-xs font-semibold">
                      Teacher ID
                    </Label>
                    <Input
                      id="edit-id"
                      value={editingUser?.id || ""}
                      disabled
                      className="mt-1 bg-muted font-mono"
                    />
                  </div>

                  <div>
                    <Label htmlFor="edit-name" className="text-xs font-semibold">
                      Full Name *
                    </Label>
                    <Input
                      id="edit-name"
                      value={editForm.name}
                      onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                      className="mt-1"
                      required
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="edit-email" className="text-xs font-semibold">
                      Email Address *
                    </Label>
                    <Input
                      id="edit-email"
                      type="email"
                      value={editForm.email}
                      onChange={(e) => setEditForm({ ...editForm, email: e.target.value })}
                      className="mt-1"
                      required
                    />
                  </div>

                  <div>
                    <Label htmlFor="edit-phone" className="text-xs font-semibold">
                      Phone Number *
                    </Label>
                    <Input
                      id="edit-phone"
                      value={editForm.phone}
                      onChange={(e) => setEditForm({ ...editForm, phone: e.target.value })}
                      className="mt-1"
                      required
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <Label htmlFor="edit-status" className="text-xs font-semibold">
                      Account Status
                    </Label>
                    <select
                      id="edit-status"
                      value={editForm.status}
                      onChange={(e) =>
                        setEditForm({ ...editForm, status: e.target.value as TeacherStatus })
                      }
                      className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring mt-1"
                    >
                      <option value="verified">Verified (Active)</option>
                      <option value="pending">Pending</option>
                      <option value="rejected">Rejected</option>
                    </select>
                  </div>

                  <div>
                    <Label htmlFor="edit-role" className="text-xs font-semibold">
                      Role
                    </Label>
                    <select
                      id="edit-role"
                      value={editForm.role}
                      onChange={(e) => setEditForm({ ...editForm, role: e.target.value as Role })}
                      className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring mt-1"
                    >
                      <option value="teacher">Teacher</option>
                      <option value="deputy">Deputy Headteacher</option>
                      {(isSuperAdmin || isSchoolAdmin) && <option value="admin">School Admin</option>}
                      {isSuperAdmin && <option value="super_admin">Super Admin</option>}
                    </select>
                  </div>

                  <div>
                    <Label htmlFor="edit-pwd" className="text-xs font-semibold">
                      New Password (Optional)
                    </Label>
                    <div className="relative mt-1">
                      <Input
                        id="edit-pwd"
                        type={editShowPassword ? "text" : "password"}
                        value={editForm.password}
                        onChange={(e) => setEditForm({ ...editForm, password: e.target.value })}
                        placeholder="Leave blank to keep"
                        className="pr-10"
                      />
                      <button
                        type="button"
                        onClick={() => setEditShowPassword(!editShowPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                      >
                        {editShowPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </button>
                    </div>
                  </div>
                </div>

                {editForm.role === "teacher" && (
                  <>
                    <div>
                      <Label htmlFor="edit-class" className="text-xs font-semibold">
                        Assigned Class Teacher
                      </Label>
                      <select
                        id="edit-class"
                        value={editForm.classId}
                        onChange={(e) => setEditForm({ ...editForm, classId: e.target.value })}
                        className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring mt-1"
                      >
                        <option value="">-- No Class Assigned --</option>
                        {editAvailableClasses.map((cls) => (
                          <option key={cls.id} value={cls.id}>
                            {cls.name}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <div className="flex items-center justify-between">
                        <Label className="text-xs font-semibold">Subjects Taught</Label>
                        {editAvailableSubjects.length > 0 && (
                          <div className="flex items-center gap-2 text-xs">
                            <button
                              type="button"
                              onClick={() =>
                                setEditForm({ ...editForm, subjects: [...editAvailableSubjects] })
                              }
                              className="text-primary hover:underline"
                            >
                              Select All
                            </button>
                            <span className="text-muted-foreground">•</span>
                            <button
                              type="button"
                              onClick={() => setEditForm({ ...editForm, subjects: [] })}
                              className="text-muted-foreground hover:underline"
                            >
                              Clear All
                            </button>
                          </div>
                        )}
                      </div>

                      {editAvailableSubjects.length === 0 ? (
                        <div className="mt-1.5 p-3 bg-amber-500/10 border border-amber-500/30 rounded-md text-xs text-amber-800 dark:text-amber-300">
                          No subjects configured yet for this school.
                        </div>
                      ) : (
                        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 mt-1.5 p-3 border rounded-md max-h-40 overflow-y-auto bg-muted/20">
                          {editAvailableSubjects.map((subject) => (
                            <label
                              key={subject}
                              className="flex items-center gap-2 text-xs cursor-pointer hover:text-primary transition-colors"
                            >
                              <input
                                type="checkbox"
                                checked={editForm.subjects.includes(subject)}
                                onChange={(e) => {
                                  if (e.target.checked) {
                                    setEditForm({
                                      ...editForm,
                                      subjects: [...editForm.subjects, subject],
                                    });
                                  } else {
                                    setEditForm({
                                      ...editForm,
                                      subjects: editForm.subjects.filter((s) => s !== subject),
                                    });
                                  }
                                }}
                                className="h-4 w-4 rounded border-input"
                              />
                              <span>{subject}</span>
                            </label>
                          ))}
                        </div>
                      )}
                    </div>
                  </>
                )}

                <div>
                  <Label htmlFor="edit-photo" className="text-xs font-semibold">
                    Profile Photo
                  </Label>
                  <Input
                    id="edit-photo"
                    type="file"
                    accept="image/*"
                    onChange={(e) => handlePhotoChange(e, true)}
                    className="mt-1"
                  />
                  {editForm.photo && (
                    <div className="mt-2 flex items-center gap-3">
                      <img
                        src={editForm.photo}
                        alt="Preview"
                        className="w-16 h-16 object-cover rounded-full border"
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => setEditForm({ ...editForm, photo: "" })}
                        className="text-xs text-destructive"
                      >
                        Remove Photo
                      </Button>
                    </div>
                  )}
                </div>

                <DialogFooter className="pt-2">
                  <Button type="button" variant="outline" onClick={() => setEditOpen(false)}>
                    Cancel
                  </Button>
                  <Button type="submit">Save Changes</Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        </CardHeader>

        <CardContent className="p-5">
          <div className="flex flex-col sm:flex-row gap-3 mb-5 justify-between">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                value={q}
                onChange={(e) => setQ(e.target.value)}
                placeholder="Search teachers by name, email, phone or ID..."
                className="pl-9"
              />
            </div>

            {isSuperAdmin && (
              <div className="flex items-center gap-2">
                <Label className="shrink-0 text-xs font-semibold">School Filter:</Label>
                <select
                  value={schoolFilter}
                  onChange={(e) => setSchoolFilter(e.target.value)}
                  className="flex h-9 rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                >
                  <option value="all">All Schools</option>
                  {schools.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.name}
                    </option>
                  ))}
                </select>
              </div>
            )}
          </div>

          <Tabs defaultValue="verified" className="w-full">
            <TabsList className="grid w-full grid-cols-3 max-w-md mb-4">
              <TabsTrigger value="verified" className="text-xs sm:text-sm">
                Active Teachers
                {verified.length > 0 && (
                  <Badge variant="secondary" className="ml-2 px-1.5 py-0 text-[10px]">
                    {verified.length}
                  </Badge>
                )}
              </TabsTrigger>
              <TabsTrigger value="pending" className="text-xs sm:text-sm">
                Pending Approval
                {pending.length > 0 && (
                  <Badge className="ml-2 bg-amber-500 text-white px-1.5 py-0 text-[10px]">
                    {pending.length}
                  </Badge>
                )}
              </TabsTrigger>
              <TabsTrigger value="rejected" className="text-xs sm:text-sm">
                Rejected
                {rejected.length > 0 && (
                  <Badge variant="outline" className="ml-2 px-1.5 py-0 text-[10px]">
                    {rejected.length}
                  </Badge>
                )}
              </TabsTrigger>
            </TabsList>

            <TabsContent value="verified" className="mt-0">
              {renderTable(verified, false, true)}
            </TabsContent>
            <TabsContent value="pending" className="mt-0">
              {renderTable(pending, true, true)}
            </TabsContent>
            <TabsContent value="rejected" className="mt-0">
              {renderTable(rejected, true, true)}
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </AppShell>
  );
}
