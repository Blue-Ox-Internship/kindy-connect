import { createFileRoute, Link } from "@tanstack/react-router";
import { AppShell } from "@/components/app-shell";
import { useStore, type User, type Role } from "@/lib/store";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
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
import {
  Check,
  X,
  Plus,
  Search,
  Trash2,
  Edit2,
  Eye,
  EyeOff,
  Copy,
  GraduationCap,
  BookMarked,
  Mail,
  Phone,
  School,
  Building2,
} from "lucide-react";
import { useState, useMemo, useEffect } from "react";
import { toast } from "sonner";

export const Route = createFileRoute("/app/teachers")({
  head: () => ({ meta: [{ title: "Teachers - Noble Edu Admin" }] }),
  component: TeachersPage,
});

function TeachersPage() {
  const {
    currentUser,
    users,
    schools,
    classes,
    approveTeacher,
    rejectTeacher,
    registerUser,
    updateUser,
    deleteUser,
    getSchoolSubjects,
  } = useStore();

  const [q, setQ] = useState("");
  const [open, setOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [roleFilter, setRoleFilter] = useState<string>("teacher");
  const [schoolFilter, setSchoolFilter] = useState<string>("all");
  const [visiblePasswords, setVisiblePasswords] = useState<Record<string, boolean>>({});

  // Create User Form State
  const [form, setForm] = useState({
    id: "",
    name: "",
    email: "",
    phone: "",
    role: "teacher" as Role,
    schoolId: currentUser?.schoolId ?? schools[0]?.id ?? "",
    classId: "",
    password: "",
    subjects: [] as string[],
    photo: "",
  });

  // Edit User Form State
  const [editForm, setEditForm] = useState({
    name: "",
    email: "",
    phone: "",
    role: "teacher" as Role,
    schoolId: "",
    classId: "",
    password: "",
    subjects: [] as string[],
    photo: "",
  });

  const isSuperAdmin = currentUser?.role === "super_admin";
  const isSchoolAdmin = currentUser?.role === "admin";
  const isAuthorized = isSuperAdmin || isSchoolAdmin || currentUser?.role === "deputy";

  // Available subjects for Create Modal
  const targetSchoolForSubjects = form.schoolId || (schoolFilter !== "all" ? schoolFilter : undefined) || currentUser?.schoolId;
  const rawSubjects = typeof getSchoolSubjects === "function" ? getSchoolSubjects(targetSchoolForSubjects) : [];
  const availableSubjects = useMemo(() => (rawSubjects || []).map((s) => s.name), [rawSubjects]);

  // Available classes for target school
  const availableClasses = useMemo(() => {
    const sId = targetSchoolForSubjects;
    if (!sId) return classes || [];
    return (classes || []).filter((c) => c.schoolId === sId);
  }, [classes, targetSchoolForSubjects]);

  // Available subjects for Edit Modal
  const targetEditSchool = editForm.schoolId || currentUser?.schoolId;
  const rawEditSubjects = typeof getSchoolSubjects === "function" ? getSchoolSubjects(targetEditSchool) : [];
  const availableEditSubjects = useMemo(() => (rawEditSubjects || []).map((s) => s.name), [rawEditSubjects]);

  const availableEditClasses = useMemo(() => {
    if (!targetEditSchool) return classes || [];
    return (classes || []).filter((c) => c.schoolId === targetEditSchool);
  }, [classes, targetEditSchool]);

  const togglePasswordVisibility = (userId: string) => {
    setVisiblePasswords((prev) => ({
      ...prev,
      [userId]: !prev[userId],
    }));
  };

  const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>, isEdit = false) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      toast.error("Please select an image file");
      return;
    }

    if (file.size > 2 * 1024 * 1024) {
      toast.error("Image size must be less than 2MB");
      return;
    }

    const reader = new FileReader();
    reader.onloadend = () => {
      if (isEdit) {
        setEditForm((prev) => ({ ...prev, photo: reader.result as string }));
      } else {
        setForm((prev) => ({ ...prev, photo: reader.result as string }));
      }
    };
    reader.readAsDataURL(file);
  };

  const resetForm = () => {
    setForm({
      id: "",
      name: "",
      email: "",
      phone: "",
      role: "teacher" as Role,
      schoolId: currentUser?.schoolId ?? schools?.[0]?.id ?? "",
      classId: "",
      password: "",
      subjects: [],
      photo: "",
    });
  };

  const handleOpenChange = (isOpen: boolean) => {
    setOpen(isOpen);
    resetForm();
  };

  const handleOpenEdit = (user: User) => {
    setEditingUser(user);
    setEditForm({
      name: user.name || "",
      email: user.email || "",
      phone: user.phone || "",
      role: user.role || "teacher",
      schoolId: user.schoolId || currentUser?.schoolId || "",
      classId: user.classId || "",
      password: "",
      subjects: Array.isArray(user.subjects) ? [...user.subjects] : [],
      photo: user.photo || "",
    });
    setEditOpen(true);
  };

  const listToDisplay = useMemo(() => {
    let list = users || [];

    // Filter by role if set (defaults to "teacher" for Teachers page)
    if (roleFilter !== "all") {
      list = list.filter((u) => u?.role === roleFilter);
    }

    // Filter by school scope
    if (!isSuperAdmin) {
      list = list.filter((u) => u?.schoolId === currentUser?.schoolId);
    } else if (schoolFilter !== "all") {
      list = list.filter((u) => u?.schoolId === schoolFilter);
    }

    // Filter by search query
    if (q.trim()) {
      const searchLower = q.toLowerCase();
      list = list.filter(
        (u) =>
          (u?.name || "").toLowerCase().includes(searchLower) ||
          (u?.email || "").toLowerCase().includes(searchLower) ||
          (u?.id || "").toLowerCase().includes(searchLower) ||
          (u?.phone || "").toLowerCase().includes(searchLower) ||
          (u?.subjects || []).some((s) => s.toLowerCase().includes(searchLower)),
      );
    }

    return list;
  }, [users, roleFilter, isSuperAdmin, currentUser, schoolFilter, q]);

  const pending = useMemo(
    () => (listToDisplay || []).filter((t) => t?.status === "pending"),
    [listToDisplay],
  );
  const verified = useMemo(
    () => (listToDisplay || []).filter((t) => t?.status === "verified"),
    [listToDisplay],
  );
  const rejected = useMemo(
    () => (listToDisplay || []).filter((t) => t?.status === "rejected"),
    [listToDisplay],
  );

  const formatRegisteredAt = (value: string | Date | undefined | null) => {
    if (!value) return "N/A";
    if (value instanceof Date) return value.toISOString().slice(0, 10);
    if (typeof value === "string") return value.slice(0, 10);
    return String(value);
  };

  const submitCreateUser = async () => {
    const userId = form.id.trim();
    const name = form.name.trim();
    const email = form.email.trim();
    const phone = form.phone.trim();
    const password = form.password.trim();

    if (!userId || !name || !email || !phone || !password) {
      return toast.error("Please fill in all required fields");
    }

    if (users.some((u) => (u?.id || "").trim().toLowerCase() === userId.toLowerCase())) {
      return toast.error(`User ID '${userId}' is already assigned`);
    }
    if (users.some((u) => (u?.email || "").trim().toLowerCase() === email.toLowerCase())) {
      return toast.error(`Email address '${email}' is already registered`);
    }
    if (users.some((u) => u?.phone && u.phone.trim() === phone)) {
      return toast.error(`Phone number '${phone}' is already registered`);
    }

    if (form.role === "teacher" && form.subjects.length === 0) {
      return toast.error("Please select at least one subject for the teacher");
    }

    const targetSchoolId = isSuperAdmin ? form.schoolId : (currentUser?.schoolId ?? "");
    if (!isSuperAdmin && !targetSchoolId) {
      return toast.error("School context is missing");
    }

    try {
      await registerUser({
        id: form.id.trim(),
        name: form.name.trim(),
        email: form.email.trim(),
        phone: form.phone.trim(),
        role: form.role,
        password: form.password,
        schoolId: isSuperAdmin && form.role === "super_admin" ? undefined : targetSchoolId,
        classId: form.classId || undefined,
        status: "verified",
        subjects: form.role === "teacher" ? form.subjects : undefined,
        photo: form.photo,
      });

      toast.success(`Account for ${form.name} created successfully!`);
      setOpen(false);
      resetForm();
    } catch (error: any) {
      console.error("Error creating user:", error);
      toast.error(error.message || "Failed to create user");
    }
  };

  const submitEditUser = async () => {
    if (!editingUser) return;
    const name = editForm.name.trim();
    const email = editForm.email.trim();
    const phone = editForm.phone.trim();

    if (!name || !email || !phone) {
      return toast.error("Please fill in all required fields (Name, Email, Phone)");
    }

    if (
      (users || []).some(
        (u) => u?.id !== editingUser.id && (u?.email || "").trim().toLowerCase() === email.toLowerCase(),
      )
    ) {
      return toast.error(`Email address '${email}' is registered to another user`);
    }
    if (
      (users || []).some(
        (u) => u?.id !== editingUser.id && u?.phone && u.phone.trim() === phone,
      )
    ) {
      return toast.error(`Phone number '${phone}' is registered to another user`);
    }

    try {
      const updates: Partial<Omit<User, "id" | "registeredAt">> & { password?: string } = {
        name,
        email,
        phone,
        role: editForm.role,
        schoolId: editForm.schoolId || undefined,
        classId: editForm.classId || undefined,
        subjects: editForm.role === "teacher" ? editForm.subjects : undefined,
        photo: editForm.photo || undefined,
      };

      if (editForm.password.trim()) {
        updates.password = editForm.password.trim();
      }

      await updateUser(editingUser.id, updates);
      toast.success(`Updated profile for ${name}`);
      setEditOpen(false);
      setEditingUser(null);
    } catch (error: any) {
      console.error("Error updating user:", error);
      toast.error(error.message || "Failed to update teacher");
    }
  };

  const renderTable = (list: typeof users, withActions = false, showManage = false) => {
    let totalCols = 5; // Teacher, Subjects, Class, Registered, Status
    if (isSuperAdmin) totalCols += 2; // User ID, School
    if (isSuperAdmin || isSchoolAdmin) totalCols += 1; // Password
    if (withActions || showManage) totalCols += 1; // Actions

    return (
      <Table>
        <TableHeader>
          <TableRow>
            {isSuperAdmin && <TableHead>User ID</TableHead>}
            <TableHead>Teacher Details</TableHead>
            {isSuperAdmin && <TableHead>School</TableHead>}
            <TableHead>Assigned Class</TableHead>
            <TableHead>Subjects</TableHead>
            {(isSuperAdmin || isSchoolAdmin) && <TableHead>Password</TableHead>}
            <TableHead>Registered</TableHead>
            <TableHead>Status</TableHead>
            {(withActions || showManage) && <TableHead className="text-right">Actions</TableHead>}
          </TableRow>
        </TableHeader>
        <TableBody>
          {(list || []).map((t) => {
            if (!t) return null;
            const schoolName = schools?.find((s) => s.id === t.schoolId)?.name || "System Wide";
            const assignedClass = classes?.find((c) => c.id === t.classId)?.name || "Unassigned";
            const canDelete = isSuperAdmin && t.id !== currentUser?.id;
            const initials = (t.name || "T")
              .split(" ")
              .map((n) => n[0])
              .join("")
              .toUpperCase()
              .slice(0, 2);

            return (
              <TableRow key={t.id || Math.random().toString()} className="group hover:bg-muted/40">
                {isSuperAdmin && (
                  <TableCell className="font-mono text-xs font-semibold">
                    <div className="flex items-center gap-1">
                      <span>{t.id || "N/A"}</span>
                      <Button
                        size="icon"
                        variant="ghost"
                        className="h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity"
                        onClick={() => {
                          navigator.clipboard.writeText(t.id);
                          toast.success("User ID copied");
                        }}
                        title="Copy ID"
                      >
                        <Copy className="h-3 w-3 text-muted-foreground" />
                      </Button>
                    </div>
                  </TableCell>
                )}
                <TableCell>
                  <div className="flex items-center gap-3">
                    <Avatar className="h-9 w-9 border">
                      {t.photo && <AvatarImage src={t.photo} alt={t.name} />}
                      <AvatarFallback className="bg-primary/10 text-primary font-semibold text-xs">
                        {initials}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <div className="font-semibold text-sm flex items-center gap-2">
                        {t.name || "Unnamed"}
                        {t.id === currentUser?.id && (
                          <Badge variant="outline" className="text-[10px] py-0 px-1 border-primary/40 text-primary font-normal">
                            You
                          </Badge>
                        )}
                      </div>
                      <div className="flex flex-col gap-0.5 mt-0.5 text-xs text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <Mail className="h-3 w-3" /> {t.email || "No email"}
                        </span>
                        {t.phone && (
                          <span className="flex items-center gap-1">
                            <Phone className="h-3 w-3" /> {t.phone}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </TableCell>
                {isSuperAdmin && (
                  <TableCell className="text-muted-foreground text-xs">{schoolName}</TableCell>
                )}
                <TableCell>
                  <Badge variant={t.classId ? "secondary" : "outline"} className="font-normal text-xs">
                    <Building2 className="h-3 w-3 mr-1 opacity-70" />
                    {assignedClass}
                  </Badge>
                </TableCell>
                <TableCell className="max-w-[200px]">
                  {t.subjects && t.subjects.length > 0 ? (
                    <div className="flex flex-wrap gap-1">
                      {t.subjects.map((sub) => (
                        <Badge key={sub} variant="outline" className="text-[11px] py-0 px-1.5 font-normal bg-secondary/50">
                          {sub}
                        </Badge>
                      ))}
                    </div>
                  ) : (
                    <span className="text-xs text-muted-foreground italic">None assigned</span>
                  )}
                </TableCell>
                {(isSuperAdmin || isSchoolAdmin) && (
                  <TableCell className="font-mono text-xs">
                    <div className="flex items-center gap-1">
                      <span>{visiblePasswords[t.id] ? t.password || "N/A" : "••••••••"}</span>
                      <Button
                        size="icon"
                        variant="ghost"
                        className="h-6 w-6"
                        onClick={() => togglePasswordVisibility(t.id)}
                        title={visiblePasswords[t.id] ? "Hide password" : "Show password"}
                      >
                        {visiblePasswords[t.id] ? (
                          <EyeOff className="h-3 w-3 text-muted-foreground" />
                        ) : (
                          <Eye className="h-3 w-3 text-muted-foreground" />
                        )}
                      </Button>
                      {t.password && (
                        <Button
                          size="icon"
                          variant="ghost"
                          className="h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity"
                          onClick={() => {
                            navigator.clipboard.writeText(t.password || "");
                            toast.success("Password copied");
                          }}
                          title="Copy password"
                        >
                          <Copy className="h-3 w-3 text-muted-foreground" />
                        </Button>
                      )}
                    </div>
                  </TableCell>
                )}
                <TableCell className="text-xs text-muted-foreground">{formatRegisteredAt(t.registeredAt)}</TableCell>
                <TableCell>
                  <Badge
                    variant={
                      t.status === "verified"
                        ? "default"
                        : t.status === "rejected"
                          ? "destructive"
                          : "secondary"
                    }
                    className="capitalize text-xs font-normal"
                  >
                    {t.status || "pending"}
                  </Badge>
                </TableCell>
                {(withActions || showManage) && (
                  <TableCell className="text-right space-x-1">
                    {withActions && (
                      <>
                        <Button
                          size="sm"
                          onClick={async () => {
                            await approveTeacher(t.id);
                            toast.success(`${t.name || "Teacher"} approved - account active`);
                          }}
                        >
                          <Check className="h-4 w-4 mr-1" />
                          Approve
                        </Button>
                        <Button
                          size="sm"
                          variant="destructive"
                          onClick={async () => {
                            await rejectTeacher(t.id);
                            toast(`${t.name || "Teacher"} status set to rejected`);
                          }}
                        >
                          <X className="h-4 w-4 mr-1" />
                          Reject
                        </Button>
                      </>
                    )}
                    {showManage && (
                      <>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleOpenEdit(t)}
                          title="Edit Teacher"
                        >
                          <Edit2 className="h-3.5 w-3.5 mr-1" />
                          Edit
                        </Button>
                        {canDelete && (
                          <Button
                            size="sm"
                            variant="outline"
                            className="text-destructive hover:bg-destructive hover:text-destructive-foreground"
                            onClick={async () => {
                              if (
                                confirm(
                                  `Are you sure you want to delete ${t.name || "this user"}? This action cannot be undone.`,
                                )
                              ) {
                                try {
                                  await deleteUser(t.id);
                                  toast.success(`${t.name || "User"} has been deleted`);
                                } catch (error: any) {
                                  toast.error(error.message || "Failed to delete user");
                                }
                              }
                            }}
                            title="Delete User"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </Button>
                        )}
                      </>
                    )}
                  </TableCell>
                )}
              </TableRow>
            );
          })}
          {list.length === 0 && (
            <TableRow>
              <TableCell colSpan={totalCols} className="text-center text-muted-foreground py-8">
                No teacher accounts found matching the specified filter criteria.
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
    );
  };

  if (!isAuthorized) {
    return (
      <AppShell title="Unauthorized">
        <Card className="border-destructive/50 max-w-lg mx-auto mt-8">
          <CardHeader>
            <CardTitle className="text-destructive">Access Denied</CardTitle>
            <CardDescription>You do not have permission to view the Teachers page.</CardDescription>
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

  // Teacher Metrics
  const totalTeachers = (users || []).filter((u) => u?.role === "teacher").length;
  const pendingTeachersCount = (users || []).filter((u) => u?.role === "teacher" && u?.status === "pending").length;
  const verifiedTeachersCount = (users || []).filter((u) => u?.role === "teacher" && u?.status === "verified").length;

  return (
    <AppShell title="Teachers Console">
      <div className="space-y-6">
        {/* Metrics Grid */}
        <div className="grid gap-4 sm:grid-cols-3">
          <Card className="border-0 shadow-sm bg-gradient-to-br from-emerald-500/10 to-transparent">
            <CardContent className="p-5 flex items-center gap-4">
              <div className="h-12 w-12 rounded-2xl bg-emerald-500/15 text-emerald-600 flex items-center justify-center dark:text-emerald-400">
                <GraduationCap className="h-6 w-6" />
              </div>
              <div>
                <div className="text-3xl font-bold">{totalTeachers}</div>
                <div className="text-sm text-muted-foreground">Total Teachers</div>
              </div>
            </CardContent>
          </Card>
          <Card className="border-0 shadow-sm bg-gradient-to-br from-amber-500/10 to-transparent">
            <CardContent className="p-5 flex items-center gap-4">
              <div className="h-12 w-12 rounded-2xl bg-amber-500/15 text-amber-600 flex items-center justify-center dark:text-amber-400">
                <GraduationCap className="h-6 w-6" />
              </div>
              <div>
                <div className="text-3xl font-bold">{pendingTeachersCount}</div>
                <div className="text-sm text-muted-foreground">Pending Approvals</div>
              </div>
            </CardContent>
          </Card>
          <Card className="border-0 shadow-sm bg-gradient-to-br from-blue-500/10 to-transparent">
            <CardContent className="p-5 flex items-center gap-4">
              <div className="h-12 w-12 rounded-2xl bg-blue-500/15 text-blue-600 flex items-center justify-center dark:text-blue-400">
                <BookMarked className="h-6 w-6" />
              </div>
              <div>
                <div className="text-3xl font-bold">{verifiedTeachersCount}</div>
                <div className="text-sm text-muted-foreground">Active Verified Teachers</div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Main Card */}
        <Card className="border-0 shadow-sm">
          <CardHeader className="flex flex-col sm:flex-row items-start sm:items-center justify-between pb-3 gap-4">
            <div>
              <CardTitle>Teachers Manager</CardTitle>
              <CardDescription>
                Review teacher registrations, assign subject specialties, manage class teachers, and configure credentials.
              </CardDescription>
            </div>

            {/* Create Teacher Dialog */}
            <Dialog open={open} onOpenChange={handleOpenChange}>
              <DialogTrigger asChild>
                <Button className="flex items-center gap-1.5">
                  <Plus className="h-4 w-4" /> Add Teacher
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle>Register New Teacher Account</DialogTitle>
                </DialogHeader>
                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    submitCreateUser();
                  }}
                  autoComplete="off"
                  className="space-y-3 py-2 text-sm"
                >
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <Label htmlFor="create-id">Login ID *</Label>
                      <Input
                        id="create-id"
                        value={form.id}
                        onChange={(e) => setForm({ ...form, id: e.target.value })}
                        placeholder="e.g. TCH-001"
                        autoComplete="off"
                      />
                    </div>
                    <div>
                      <Label htmlFor="create-pwd">Password *</Label>
                      <Input
                        id="create-pwd"
                        type="password"
                        value={form.password}
                        onChange={(e) => setForm({ ...form, password: e.target.value })}
                        placeholder="Secret123"
                        autoComplete="new-password"
                        data-lpignore="true"
                        data-bwignore="true"
                        data-1p-ignore="true"
                      />
                    </div>
                  </div>
                  <div>
                    <Label htmlFor="create-name">Full Name *</Label>
                    <Input
                      id="create-name"
                      value={form.name}
                      onChange={(e) => setForm({ ...form, name: e.target.value })}
                      placeholder="e.g. Jane Doe"
                      autoComplete="off"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <Label htmlFor="create-email">Email Address *</Label>
                      <Input
                        id="create-email"
                        type="email"
                        value={form.email}
                        onChange={(e) => setForm({ ...form, email: e.target.value })}
                        placeholder="jane@school.com"
                        autoComplete="off"
                      />
                    </div>
                    <div>
                      <Label htmlFor="create-phone">Phone Number *</Label>
                      <Input
                        id="create-phone"
                        value={form.phone}
                        onChange={(e) => setForm({ ...form, phone: e.target.value })}
                        placeholder="+256..."
                        autoComplete="off"
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <Label htmlFor="create-role">System Role</Label>
                      <select
                        id="create-role"
                        value={form.role}
                        onChange={(e) => setForm({ ...form, role: e.target.value as Role })}
                        className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                      >
                        <option value="teacher">Teacher</option>
                        <option value="deputy">Deputy</option>
                        {isSuperAdmin && <option value="admin">School Admin</option>}
                      </select>
                    </div>
                    {isSuperAdmin && (
                      <div>
                        <Label htmlFor="create-school">Assigned School</Label>
                        <select
                          id="create-school"
                          value={form.schoolId}
                          onChange={(e) => setForm({ ...form, schoolId: e.target.value })}
                          className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                        >
                          {schools.map((s) => (
                            <option key={s.id} value={s.id}>
                              {s.name}
                            </option>
                          ))}
                        </select>
                      </div>
                    )}
                  </div>
                  <div>
                    <Label htmlFor="create-class">Assigned Class (Optional)</Label>
                    <select
                      id="create-class"
                      value={form.classId}
                      onChange={(e) => setForm({ ...form, classId: e.target.value })}
                      className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                    >
                      <option value="">-- Select Class --</option>
                      {availableClasses.map((c) => (
                        <option key={c.id} value={c.id}>
                          {c.name}
                        </option>
                      ))}
                    </select>
                  </div>
                  {form.role === "teacher" && (
                    <div>
                      <Label htmlFor="create-subjects">Teaching Subjects (Select at least one) *</Label>
                      {availableSubjects.length === 0 ? (
                        <div className="mt-2 p-3 bg-amber-500/10 border border-amber-500/30 rounded-md text-xs text-amber-800 dark:text-amber-300 space-y-1">
                          <div>No subjects configured for this school yet.</div>
                          <Link to="/app/subjects" className="font-semibold underline text-primary">
                            Configure school subjects
                          </Link>
                        </div>
                      ) : (
                        <div className="grid grid-cols-2 gap-2 mt-2 p-3 border rounded-md max-h-40 overflow-y-auto">
                          {availableSubjects.map((subject) => (
                            <label key={subject} className="flex items-center gap-2 cursor-pointer text-xs">
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
                                className="h-4 w-4 rounded border-gray-300"
                              />
                              <span>{subject}</span>
                            </label>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                  <div>
                    <Label htmlFor="create-photo">Profile Photo</Label>
                    <Input
                      id="create-photo"
                      type="file"
                      accept="image/*"
                      onChange={(e) => handlePhotoChange(e, false)}
                    />
                    {form.photo && (
                      <div className="mt-2 flex items-center gap-2">
                        <img
                          src={form.photo}
                          alt="Preview"
                          className="w-12 h-12 object-cover rounded-full border"
                        />
                        <span className="text-xs text-muted-foreground">Photo preview</span>
                      </div>
                    )}
                  </div>
                  <DialogFooter className="pt-2">
                    <Button type="submit">Create Account</Button>
                  </DialogFooter>
                </form>
              </DialogContent>
            </Dialog>

            {/* Edit Teacher Dialog */}
            <Dialog open={editOpen} onOpenChange={setEditOpen}>
              <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle>Edit Teacher Profile ({editingUser?.id})</DialogTitle>
                </DialogHeader>
                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    submitEditUser();
                  }}
                  autoComplete="off"
                  className="space-y-3 py-2 text-sm"
                >
                  <div>
                    <Label htmlFor="edit-name">Full Name *</Label>
                    <Input
                      id="edit-name"
                      value={editForm.name}
                      onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                      autoComplete="off"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <Label htmlFor="edit-email">Email Address *</Label>
                      <Input
                        id="edit-email"
                        type="email"
                        value={editForm.email}
                        onChange={(e) => setEditForm({ ...editForm, email: e.target.value })}
                        autoComplete="off"
                      />
                    </div>
                    <div>
                      <Label htmlFor="edit-phone">Phone Number *</Label>
                      <Input
                        id="edit-phone"
                        value={editForm.phone}
                        onChange={(e) => setEditForm({ ...editForm, phone: e.target.value })}
                        autoComplete="off"
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <Label htmlFor="edit-role">System Role</Label>
                      <select
                        id="edit-role"
                        value={editForm.role}
                        onChange={(e) => setEditForm({ ...editForm, role: e.target.value as Role })}
                        className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                      >
                        <option value="teacher">Teacher</option>
                        <option value="deputy">Deputy</option>
                        {isSuperAdmin && <option value="admin">School Admin</option>}
                      </select>
                    </div>
                    {isSuperAdmin && (
                      <div>
                        <Label htmlFor="edit-school">Assigned School</Label>
                        <select
                          id="edit-school"
                          value={editForm.schoolId}
                          onChange={(e) => setEditForm({ ...editForm, schoolId: e.target.value })}
                          className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                        >
                          {schools.map((s) => (
                            <option key={s.id} value={s.id}>
                              {s.name}
                            </option>
                          ))}
                        </select>
                      </div>
                    )}
                  </div>
                  <div>
                    <Label htmlFor="edit-class">Assigned Class</Label>
                    <select
                      id="edit-class"
                      value={editForm.classId}
                      onChange={(e) => setEditForm({ ...editForm, classId: e.target.value })}
                      className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                    >
                      <option value="">-- Unassigned --</option>
                      {availableEditClasses.map((c) => (
                        <option key={c.id} value={c.id}>
                          {c.name}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <Label htmlFor="edit-pwd">Reset Password (Leave blank to keep existing)</Label>
                    <Input
                      id="edit-pwd"
                      type="password"
                      value={editForm.password}
                      onChange={(e) => setEditForm({ ...editForm, password: e.target.value })}
                      placeholder="New password"
                      autoComplete="new-password"
                    />
                  </div>
                  {editForm.role === "teacher" && (
                    <div>
                      <Label>Teaching Subjects</Label>
                      {availableEditSubjects.length === 0 ? (
                        <div className="mt-2 p-2 bg-muted rounded-md text-xs text-muted-foreground">
                          No subjects configured for this school.
                        </div>
                      ) : (
                        <div className="grid grid-cols-2 gap-2 mt-2 p-3 border rounded-md max-h-40 overflow-y-auto">
                          {availableEditSubjects.map((subject) => (
                            <label key={subject} className="flex items-center gap-2 cursor-pointer text-xs">
                              <input
                                type="checkbox"
                                checked={editForm.subjects.includes(subject)}
                                onChange={(e) => {
                                  if (e.target.checked) {
                                    setEditForm({ ...editForm, subjects: [...editForm.subjects, subject] });
                                  } else {
                                    setEditForm({
                                      ...editForm,
                                      subjects: editForm.subjects.filter((s) => s !== subject),
                                    });
                                  }
                                }}
                                className="h-4 w-4 rounded border-gray-300"
                              />
                              <span>{subject}</span>
                            </label>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                  <div>
                    <Label htmlFor="edit-photo">Update Profile Photo</Label>
                    <Input
                      id="edit-photo"
                      type="file"
                      accept="image/*"
                      onChange={(e) => handlePhotoChange(e, true)}
                    />
                    {editForm.photo && (
                      <div className="mt-2 flex items-center gap-2">
                        <img
                          src={editForm.photo}
                          alt="Preview"
                          className="w-12 h-12 object-cover rounded-full border"
                        />
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          className="text-xs text-destructive h-7 px-2"
                          onClick={() => setEditForm({ ...editForm, photo: "" })}
                        >
                          Remove photo
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
          <CardContent className="p-5 pt-0">
            {/* Toolbar Filters */}
            <div className="flex flex-col sm:flex-row gap-3 mb-4 justify-between items-stretch sm:items-center">
              <div className="relative flex-1 max-w-sm">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  value={q}
                  onChange={(e) => setQ(e.target.value)}
                  placeholder="Search teacher by name, email, phone or subject..."
                  className="pl-9"
                />
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <div className="flex items-center gap-2">
                  <Label className="shrink-0 text-xs font-medium">Role:</Label>
                  <select
                    value={roleFilter}
                    onChange={(e) => setRoleFilter(e.target.value)}
                    className="flex h-9 rounded-md border border-input bg-transparent px-2.5 py-1 text-xs shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                  >
                    <option value="teacher">Teachers Only</option>
                    <option value="deputy">Deputies</option>
                    <option value="admin">School Admins</option>
                    <option value="all">All Roles</option>
                  </select>
                </div>

                {isSuperAdmin && (
                  <div className="flex items-center gap-2">
                    <Label className="shrink-0 text-xs font-medium">School:</Label>
                    <select
                      value={schoolFilter}
                      onChange={(e) => setSchoolFilter(e.target.value)}
                      className="flex h-9 rounded-md border border-input bg-transparent px-2.5 py-1 text-xs shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
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
            </div>

            {/* Tabs for Pending, Verified, Rejected */}
            <Tabs defaultValue="pending">
              <TabsList className="mb-2">
                <TabsTrigger value="pending" className="relative">
                  Pending Approvals
                  {pending.length > 0 && (
                    <Badge className="ml-2 bg-amber-500 text-white font-normal px-1.5 py-0 text-[10px]">
                      {pending.length}
                    </Badge>
                  )}
                </TabsTrigger>
                <TabsTrigger value="verified">
                  Active Teachers ({verified.length})
                </TabsTrigger>
                <TabsTrigger value="rejected">
                  Rejected ({rejected.length})
                </TabsTrigger>
              </TabsList>
              <TabsContent value="pending" className="mt-2">
                {renderTable(pending, true, false)}
              </TabsContent>
              <TabsContent value="verified" className="mt-2">
                {renderTable(verified, false, true)}
              </TabsContent>
              <TabsContent value="rejected" className="mt-2">
                {renderTable(rejected, false, true)}
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </div>
    </AppShell>
  );
}
