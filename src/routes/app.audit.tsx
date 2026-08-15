import { createFileRoute } from "@tanstack/react-router";
import { AppShell } from "@/components/app-shell";
import { useStore } from "@/lib/store";
import { Card, CardContent } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useMemo } from "react";

export const Route = createFileRoute("/app/audit")({
  head: () => ({ meta: [{ title: "Audit log - Noble Edu" }] }),
  component: AuditPage,
});

function AuditPage() {
  const { currentUser, audit } = useStore();

  const isSuperAdmin = currentUser?.role === "super_admin";
  const isSchoolAdmin = currentUser?.role === "admin";
  const isAuthorized = isSuperAdmin || isSchoolAdmin;

  const displayAudit = useMemo(() => {
    return (audit || []).filter((a) => {
      if (!a) return false;
      const action = (a.action || "").toLowerCase();
      const target = (a.target || "").toLowerCase();
      const actor = (a.actorName || "").toLowerCase();
      return !action.includes("cache") && !target.includes("cache") && !actor.includes("cache");
    });
  }, [audit]);

  if (!isAuthorized) {
    return (
      <AppShell title="Unauthorized">
        <div className="text-center py-12 text-muted-foreground">
          You do not have permission to view audit logs.
        </div>
      </AppShell>
    );
  }

  return (
    <AppShell title="Audit log">
      <Card className="border-0 shadow-sm">
        <CardContent className="p-5">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>When</TableHead>
                <TableHead>Who</TableHead>
                <TableHead>Action</TableHead>
                <TableHead>Target</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {displayAudit.map((a) => (
                <TableRow key={a.id}>
                  <TableCell className="text-xs text-muted-foreground">
                    {new Date(a.timestamp).toLocaleString()}
                  </TableCell>
                  <TableCell className="font-medium">{a.actorName}</TableCell>
                  <TableCell>{a.action}</TableCell>
                  <TableCell>{a.target}</TableCell>
                </TableRow>
              ))}
              {displayAudit.length === 0 && (
                <TableRow>
                  <TableCell colSpan={4} className="text-center text-muted-foreground py-8">
                    No audit log records found.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </AppShell>
  );
}
