import { createFileRoute } from "@tanstack/react-router";
import { AppShell } from "@/components/app-shell";
import { useStore } from "@/lib/store";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  AlertCircle,
  CheckCircle2,
  Landmark,
  PencilLine,
  Plus,
  Trash2,
  WalletCards,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";

export const Route = createFileRoute("/app/fees")({
  head: () => ({ meta: [{ title: "School Fees - Noble Edu Admin" }] }),
  component: FeesPage,
});

type FeeCategory = "Tuition" | "Boarding" | "Exam" | "Development" | "Uniform" | "Other";
type FeeStatus = "Open" | "Closed";

type FeeRecord = {
  id: string;
  schoolId: string;
  name: string;
  category: FeeCategory;
  amount: number;
  description: string;
  dueDate: string;
  collected: number;
  status: FeeStatus;
  updatedAt: string;
};

const STORAGE_KEY = "noble-school-fees-v1";

const feeCategories: FeeCategory[] = [
  "Tuition",
  "Boarding",
  "Exam",
  "Development",
  "Uniform",
  "Other",
];

const currency = (amount: number) =>
  new Intl.NumberFormat("en-UG", {
    style: "currency",
    currency: "UGX",
    maximumFractionDigits: 0,
  }).format(amount);

const formatDate = (value?: string) => {
  if (!value) return "Not set";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return value;
  return d.toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" });
};

const readFees = (): FeeRecord[] => {
  if (typeof window === "undefined") return [];

  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as FeeRecord[];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
};

function FeesPage() {
  const { currentUser, schools = [] } = useStore();
  const isAdmin = currentUser?.role === "super_admin" || currentUser?.role === "admin";

  const defaultSchoolId =
    currentUser?.role === "super_admin" ? schools[0]?.id ?? "" : currentUser?.schoolId ?? "";

  const [schoolId, setSchoolId] = useState(defaultSchoolId);
  const [fees, setFees] = useState<FeeRecord[]>([]);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState({
    name: "",
    category: "Tuition" as FeeCategory,
    amount: "",
    description: "",
    dueDate: "",
    collected: "0",
  });

  useEffect(() => {
    setFees(readFees());
  }, []);

  useEffect(() => {
    if (typeof window !== "undefined") {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(fees));
    }
  }, [fees]);

  useEffect(() => {
    if (currentUser?.role === "super_admin") {
      if (!schools.some((school) => school.id === schoolId) && schools[0]) {
        setSchoolId(schools[0].id);
      }
    } else if (currentUser?.schoolId && currentUser.schoolId !== schoolId) {
      setSchoolId(currentUser.schoolId);
    }
  }, [currentUser, schools, schoolId]);

  const selectedSchoolName =
    schools.find((school) => school.id === schoolId)?.name ?? "Selected school";

  const schoolFees = useMemo(
    () => fees.filter((fee) => fee.schoolId === schoolId),
    [fees, schoolId],
  );

  const totals = useMemo(() => {
    const totalDue = schoolFees.reduce((sum, fee) => sum + Number(fee.amount || 0), 0);
    const collected = schoolFees.reduce((sum, fee) => sum + Number(fee.collected || 0), 0);
    const outstanding = Math.max(totalDue - collected, 0);
    const openFees = schoolFees.filter((fee) => fee.status === "Open").length;

    return { totalDue, collected, outstanding, openFees };
  }, [schoolFees]);

  const resetForm = () => {
    setForm({
      name: "",
      category: "Tuition",
      amount: "",
      description: "",
      dueDate: "",
      collected: "0",
    });
    setEditingId(null);
  };

  const openCreateDialog = () => {
    resetForm();
    setDialogOpen(true);
  };

  const openEditDialog = (fee: FeeRecord) => {
    setEditingId(fee.id);
    setForm({
      name: fee.name,
      category: fee.category,
      amount: String(fee.amount),
      description: fee.description,
      dueDate: fee.dueDate,
      collected: String(fee.collected),
    });
    setDialogOpen(true);
  };

  const handleSaveFee = () => {
    if (!schoolId) {
      toast.error("Choose a school before creating a fee plan.");
      return;
    }

    const name = form.name.trim();
    const amount = Number(form.amount);
    const collected = Number(form.collected || 0);

    if (!name) {
      toast.error("Fee title is required.");
      return;
    }

    if (!Number.isFinite(amount) || amount <= 0) {
      toast.error("Amount must be a valid positive figure.");
      return;
    }

    if (!Number.isFinite(collected) || collected < 0) {
      toast.error("Collected amount must be zero or more.");
      return;
    }

    const nextRecord: FeeRecord = {
      id: editingId ?? crypto.randomUUID(),
      schoolId,
      name,
      category: form.category,
      amount,
      description: form.description.trim(),
      dueDate: form.dueDate,
      collected,
      status: collected >= amount ? "Closed" : "Open",
      updatedAt: new Date().toISOString(),
    };

    setFees((prev) => {
      const existing = prev.filter((fee) => fee.id !== nextRecord.id);
      return [...existing, nextRecord].sort((a, b) => a.name.localeCompare(b.name));
    });

    toast.success(editingId ? "Fee plan updated." : "Fee plan created.");
    setDialogOpen(false);
    resetForm();
  };

  const handleDeleteFee = (feeId: string) => {
    setFees((prev) => prev.filter((fee) => fee.id !== feeId));
    toast.success("Fee plan removed.");
  };

  if (!isAdmin) {
    return (
      <AppShell title="Unauthorized">
        <div className="flex min-h-[40vh] items-center justify-center text-center text-muted-foreground">
          <div className="space-y-2">
            <AlertCircle className="mx-auto h-9 w-9 text-muted-foreground" />
            <p>You do not have permission to manage school fees.</p>
          </div>
        </div>
      </AppShell>
    );
  }

  return (
    <AppShell title="School Fees">
      <div className="space-y-6">
        <div className="grid gap-4 md:grid-cols-4">
          <Card>
            <CardHeader className="pb-2">
              <CardDescription>Total due</CardDescription>
              <CardTitle className="text-2xl">{currency(totals.totalDue)}</CardTitle>
            </CardHeader>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardDescription>Collected</CardDescription>
              <CardTitle className="text-2xl">{currency(totals.collected)}</CardTitle>
            </CardHeader>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardDescription>Outstanding</CardDescription>
              <CardTitle className="text-2xl">{currency(totals.outstanding)}</CardTitle>
            </CardHeader>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardDescription>Open fee plans</CardDescription>
              <CardTitle className="text-2xl">{totals.openFees}</CardTitle>
            </CardHeader>
          </Card>
        </div>

        <Card>
          <CardHeader className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <WalletCards className="h-5 w-5 text-primary" />
                {selectedSchoolName}
              </CardTitle>
              <CardDescription>Manage school fee structures and collections.</CardDescription>
            </div>

            <div className="flex flex-col gap-3 md:flex-row md:items-center">
              {currentUser?.role === "super_admin" ? (
                <div className="w-full min-w-[180px] md:w-[220px]">
                  <Select value={schoolId} onValueChange={setSchoolId}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select school" />
                    </SelectTrigger>
                    <SelectContent>
                      {schools.map((school) => (
                        <SelectItem key={school.id} value={school.id}>
                          {school.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              ) : null}

              <Dialog open={dialogOpen} onOpenChange={(open) => {
                setDialogOpen(open);
                if (!open) resetForm();
              }}>
                <DialogTrigger asChild>
                  <Button onClick={openCreateDialog} className="gap-2">
                    <Plus className="h-4 w-4" />
                    Add fee plan
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-xl">
                  <DialogHeader>
                    <DialogTitle>{editingId ? "Update fee plan" : "Create fee plan"}</DialogTitle>
                  </DialogHeader>

                  <div className="grid gap-4 py-2 md:grid-cols-2">
                    <div className="md:col-span-2">
                      <Label htmlFor="fee-name">Fee title</Label>
                      <Input
                        id="fee-name"
                        value={form.name}
                        onChange={(e) => setForm((prev) => ({ ...prev, name: e.target.value }))}
                        placeholder="Term fees"
                      />
                    </div>

                    <div>
                      <Label htmlFor="fee-category">Category</Label>
                      <Select
                        value={form.category}
                        onValueChange={(value) => setForm((prev) => ({ ...prev, category: value as FeeCategory }))}
                      >
                        <SelectTrigger id="fee-category">
                          <SelectValue placeholder="Select category" />
                        </SelectTrigger>
                        <SelectContent>
                          {feeCategories.map((category) => (
                            <SelectItem key={category} value={category}>
                              {category}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div>
                      <Label htmlFor="fee-amount">Amount (UGX)</Label>
                      <Input
                        id="fee-amount"
                        type="number"
                        min="0"
                        value={form.amount}
                        onChange={(e) => setForm((prev) => ({ ...prev, amount: e.target.value }))}
                        placeholder="500000"
                      />
                    </div>

                    <div>
                      <Label htmlFor="fee-due-date">Due date</Label>
                      <Input
                        id="fee-due-date"
                        type="date"
                        value={form.dueDate}
                        onChange={(e) => setForm((prev) => ({ ...prev, dueDate: e.target.value }))}
                      />
                    </div>

                    <div>
                      <Label htmlFor="fee-collected">Collected so far</Label>
                      <Input
                        id="fee-collected"
                        type="number"
                        min="0"
                        value={form.collected}
                        onChange={(e) => setForm((prev) => ({ ...prev, collected: e.target.value }))}
                        placeholder="0"
                      />
                    </div>

                    <div className="md:col-span-2">
                      <Label htmlFor="fee-description">Description</Label>
                      <Input
                        id="fee-description"
                        value={form.description}
                        onChange={(e) => setForm((prev) => ({ ...prev, description: e.target.value }))}
                        placeholder="Termly tuition, boarding support, or exam fees"
                      />
                    </div>
                  </div>

                  <DialogFooter>
                    <Button variant="outline" onClick={() => setDialogOpen(false)}>
                      Cancel
                    </Button>
                    <Button onClick={handleSaveFee}>{editingId ? "Save changes" : "Create fee"}</Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            </div>
          </CardHeader>

          <CardContent className="p-0">
            {schoolFees.length === 0 ? (
              <div className="flex flex-col items-center justify-center gap-3 p-10 text-center text-muted-foreground">
                <Landmark className="h-10 w-10 text-muted-foreground/60" />
                <p>No fee plans have been set for this school yet.</p>
                <Button variant="secondary" onClick={openCreateDialog}>
                  <Plus className="mr-2 h-4 w-4" />
                  Add the first fee plan
                </Button>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Title</TableHead>
                    <TableHead>Category</TableHead>
                    <TableHead>Amount</TableHead>
                    <TableHead>Collected</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Due</TableHead>
                    <TableHead className="w-24 text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>

                <TableBody>
                  {schoolFees.map((fee) => {
                    const outstanding = Math.max(fee.amount - fee.collected, 0);
                    const isPaid = fee.collected >= fee.amount;

                    return (
                      <TableRow key={fee.id}>
                        <TableCell>
                          <div className="font-medium">{fee.name}</div>
                          <div className="text-xs text-muted-foreground">{fee.description || "No description"}</div>
                        </TableCell>
                        <TableCell>{fee.category}</TableCell>
                        <TableCell>{currency(fee.amount)}</TableCell>
                        <TableCell>{currency(fee.collected)}</TableCell>
                        <TableCell>
                          {isPaid ? (
                            <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 px-2 py-1 text-xs font-medium text-emerald-800">
                              <CheckCircle2 className="h-3.5 w-3.5" />
                              Closed
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 rounded-full bg-amber-100 px-2 py-1 text-xs font-medium text-amber-800">
                              <AlertCircle className="h-3.5 w-3.5" />
                              Open
                            </span>
                          )}
                        </TableCell>
                        <TableCell>
                          <div>{formatDate(fee.dueDate)}</div>
                          <div className="text-xs text-muted-foreground">Outstanding: {currency(outstanding)}</div>
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-2">
                            <Button variant="outline" size="icon" onClick={() => openEditDialog(fee)}>
                              <PencilLine className="h-4 w-4" />
                            </Button>
                            <Button variant="outline" size="icon" onClick={() => handleDeleteFee(fee.id)}>
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>
    </AppShell>
  );
}
