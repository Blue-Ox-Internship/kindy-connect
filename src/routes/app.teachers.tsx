import { createFileRoute } from "@tanstack/react-router";
import { AppShell } from "@/components/app-shell";
import { useStore, type User, type Role } from "@/lib/mock-store";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { Check, X, Plus, Search } from "lucide-react";
import { useState, useMemo } from "react";
import { toast } from "sonner";

export const Route = createFileRoute("/app/teachers")({
  head: () => ({ meta: [{ title: "Users - Little Stars Admin" }] }),
  component: TeachersPage,
});

function TeachersPage() {
  const { currentUser, users, schools, approveTeacher, rejectTeacher, registerUser } = useStore();
  const [q, setQ] = useState("");
  const [open, setOpen] = useState(false);

  const isSuperAdmin = currentUser?.role === "super_admin";
  const isSchoolAdmin = currentUser?.role === "admin";
  const isAuthorized = isSuperAdmin || isSchoolAdmin || currentUser?.role === "deputy";

  // Super Admin School filtering
  const [schoolFilter, setSchoolFilter] = useState<string>("all");

  // Create User Form State
  const [form, setForm] = useState({
    id: "",
    name: "",
    email: "",
    phone: "",
    role: "teacher" as Role,
    schoolId: currentUser?.schoolId ?? schools[0]?.id ?? "",
    password: "admin123",
  });

  const listToDisplay = useMemo(() => {
    let list = isSuperAdmin || isSchoolAdmin ? users : users.filter((u) => u.role === "teacher");

    // Apply Super Admin school filter
    if (isSuperAdmin && schoolFilter !== "all") {
      list = list.filter((u) => u.schoolId === schoolFilter);
    }

    // Apply search filter
    if (q.trim()) {
      list = list.filter(
        (u) =>
          u.name.toLowerCase().includes(q.toLowerCase()) ||
          u.email.toLowerCase().includes(q.toLowerCase()) ||
          u.id.toLowerCase().includes(q.toLowerCase())
      );
    }

    return list;
  }, [users, isSuperAdmin, isSchoolAdmin, schoolFilter, q]);

  const pending = useMemo(() => listToDisplay.filter((t) => t.status === "pending"), [listToDisplay]);
  const verified = useMemo(() => listToDisplay.filter((t) => t.status === "verified"), [listToDisplay]);
  const rejected = useMemo(() => listToDisplay.filter((t) => t.status === "rejected"), [listToDisplay]);

  const formatRegisteredAt = (value: string | Date) =>
    value instanceof Date ? value.toISOString().slice(0, 10) : value;

  const submitCreateUser = async () => {
    if (!form.id.trim() || !form.name.trim() || !form.email.trim() || !form.phone.trim()) {
      return toast.error("Please fill in all fields");
    }

    // School mapping
    const targetSchoolId = isSuperAdmin ? form.schoolId : (currentUser?.schoolId ?? "");
    if (!isSuperAdmin && !targetSchoolId) {
      return toast.error("School context is missing");
    }

    await registerUser({
      id: form.id.trim(),
      name: form.name.trim(),
      email: form.email.trim(),
      phone: form.phone.trim(),
      role: form.role,
      password: form.password,
      schoolId: isSuperAdmin && form.role === "super_admin" ? undefined : targetSchoolId,
      status: "verified", // Administrator creates verified accounts immediately
    });

    toast.success(`Account for ${form.name} created successfully!`);
    setOpen(false);
    setForm({
      id: "",
      name: "",
      email: "",
      phone: "",
      role: "teacher",
      schoolId: currentUser?.schoolId ?? schools[0]?.id ?? "",
      password: "admin123",
    });
  };

  const renderTable = (list: typeof users, withActions = false) => (
    <Table>
      <TableHeader>
        <TableRow>
          {isSuperAdmin && <TableHead>User ID</TableHead>}
          <TableHead>Name</TableHead>
          <TableHead>Email</TableHead>
          <TableHead>Phone</TableHead>
          {isSuperAdmin && <TableHead>School</TableHead>}
          {(isSuperAdmin || isSchoolAdmin) && <TableHead>Role</TableHead>}
          {(isSuperAdmin || isSchoolAdmin) && <TableHead>Password</TableHead>}
          <TableHead>Registered</TableHead>
          <TableHead>Status</TableHead>
          {withActions && <TableHead>Actions</TableHead>}
        </TableRow>
      </TableHeader>
      <TableBody>
        {list.map((t) => {
          const schoolName = schools.find((s) => s.id === t.schoolId)?.name || "System Admin";
          return (
            <TableRow key={t.id}>
              {isSuperAdmin && <TableCell className="font-mono text-xs font-semibold">{t.id}</TableCell>}
              <TableCell className="font-medium">{t.name}</TableCell>
              <TableCell>{t.email}</TableCell>
              <TableCell>{t.phone}</TableCell>
              {isSuperAdmin && <TableCell className="text-muted-foreground text-xs">{schoolName}</TableCell>}
              {(isSuperAdmin || isSchoolAdmin) && (
                <TableCell className="capitalize">
                  <Badge variant="outline" className="capitalize font-normal">
                    {t.role.replace("_", " ")}
                  </Badge>
                </TableCell>
              )}
              {(isSuperAdmin || isSchoolAdmin) && <TableCell className="font-mono text-xs">{t.password || "N/A"}</TableCell>}
              <TableCell>{formatRegisteredAt(t.registeredAt)}</TableCell>
              <TableCell>
                <Badge
                  variant={t.status === "verified" ? "default" : t.status === "rejected" ? "destructive" : "secondary"}
                  className="capitalize"
                >
                  {t.status}
                </Badge>
              </TableCell>
              {withActions && (
                <TableCell className="space-x-2">
                  <Button
                    size="sm"
                    onClick={async () => {
                      await approveTeacher(t.id);
                      toast.success(`${t.name} approved - account active`);
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
                      toast(`${t.name} status set to rejected`);
                    }}
                  >
                    <X className="h-4 w-4 mr-1" />
                    Reject
                  </Button>
                </TableCell>
              )}
            </TableRow>
          );
        })}
        {list.length === 0 && (
          <TableRow>
            <TableCell
              colSpan={withActions ? (isSuperAdmin ? 10 : 8) : (isSuperAdmin ? 9 : 7)}
              className="text-center text-muted-foreground py-8"
            >
              No accounts in this category.
            </TableCell>
          </TableRow>
        )}
      </TableBody>
    </Table>
  );

  if (!isAuthorized) {
    return (
      <AppShell title="Unauthorized">
        <div className="text-center py-12 text-muted-foreground">
          You do not have permission to view this page.
        </div>
      </AppShell>
    );
  }

  return (
    <AppShell title={isSuperAdmin || isSchoolAdmin ? "User Accounts" : "Teacher Accounts"}>
      <Card className="border-0 shadow-sm">
        <CardHeader className="flex flex-row items-center justify-between pb-3">
          <div>
            <CardTitle>Accounts Manager</CardTitle>
            <CardDescription>
              {isSuperAdmin
                ? "Manage system-wide admin and staff credentials."
                : "Approve pending teacher requests and view school credentials."}
            </CardDescription>
          </div>

          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button className="flex items-center gap-1">
                <Plus className="h-4 w-4" /> Create User
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Register New Account</DialogTitle>
              </DialogHeader>
              <div className="space-y-3 py-2">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label htmlFor="create-id">Assigned ID (Login ID)</Label>
                    <Input id="create-id" value={form.id} onChange={(e) => setForm({ ...form, id: e.target.value })} placeholder="e.g. kst-001" />
                  </div>
                  <div>
                    <Label htmlFor="create-pwd">Password</Label>
                    <Input id="create-pwd" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} />
                  </div>
                </div>
                <div>
                  <Label htmlFor="create-name">Full Name</Label>
                  <Input id="create-name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label htmlFor="create-email">Email</Label>
                    <Input id="create-email" type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
                  </div>
                  <div>
                    <Label htmlFor="create-phone">Phone</Label>
                    <Input id="create-phone" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label htmlFor="create-role">Role</Label>
                    <select
                      id="create-role"
                      value={form.role}
                      onChange={(e) => setForm({ ...form, role: e.target.value as Role })}
                      className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-base shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring file:border-0 file:bg-transparent file:text-sm file:font-medium md:text-sm"
                    >
                      {isSuperAdmin && <option value="super_admin">Super Admin</option>}
                      {(isSuperAdmin || isSchoolAdmin) && <option value="admin">School Admin</option>}
                      <option value="deputy">Deputy</option>
                      <option value="teacher">Teacher</option>
                    </select>
                  </div>
                  {isSuperAdmin && form.role !== "super_admin" && (
                    <div>
                      <Label htmlFor="create-school">School</Label>
                      <select
                        id="create-school"
                        value={form.schoolId}
                        onChange={(e) => setForm({ ...form, schoolId: e.target.value })}
                        className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-base shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring file:border-0 file:bg-transparent file:text-sm file:font-medium md:text-sm"
                      >
                        {schools.map((s) => (
                          <option key={s.id} value={s.id}>{s.name}</option>
                        ))}
                      </select>
                    </div>
                  )}
                </div>
              </div>
              <DialogFooter>
                <Button onClick={submitCreateUser}>Create Account</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </CardHeader>
        <CardContent className="p-5 pt-0">
          <div className="flex flex-col sm:flex-row gap-3 mb-4 justify-between">
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search by name, email or ID..." className="pl-9" />
            </div>

            {isSuperAdmin && (
              <div className="flex items-center gap-2">
                <Label className="shrink-0 text-sm">School Filter:</Label>
                <select
                  value={schoolFilter}
                  onChange={(e) => setSchoolFilter(e.target.value)}
                  className="flex h-9 rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring file:border-0 file:bg-transparent file:text-sm file:font-medium md:text-sm"
                >
                  <option value="all">All Schools</option>
                  {schools.map((s) => (
                    <option key={s.id} value={s.id}>{s.name}</option>
                  ))}
                </select>
              </div>
            )}
          </div>

          <Tabs defaultValue="pending">
            <TabsList>
              <TabsTrigger value="pending">
                Pending
                {pending.length > 0 && <Badge className="ml-2 bg-accent text-accent-foreground">{pending.length}</Badge>}
              </TabsTrigger>
              <TabsTrigger value="verified">Verified</TabsTrigger>
              <TabsTrigger value="rejected">Rejected</TabsTrigger>
            </TabsList>
            <TabsContent value="pending" className="mt-4">
              {renderTable(pending, true)}
            </TabsContent>
            <TabsContent value="verified" className="mt-4">
              {renderTable(verified)}
            </TabsContent>
            <TabsContent value="rejected" className="mt-4">
              {renderTable(rejected)}
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </AppShell>
  );
}
