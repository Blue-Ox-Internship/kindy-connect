import { Card, CardContent, CardHeader } from "./card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "./table";

export function TableLoadingSkeleton({ rows = 5 }: { rows?: number }) {
  return (
    <div className="animate-pulse">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead><div className="h-4 bg-muted rounded w-24"></div></TableHead>
            <TableHead><div className="h-4 bg-muted rounded w-32"></div></TableHead>
            <TableHead><div className="h-4 bg-muted rounded w-20"></div></TableHead>
            <TableHead><div className="h-4 bg-muted rounded w-28"></div></TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {Array.from({ length: rows }).map((_, i) => (
            <TableRow key={i}>
              <TableCell><div className="h-4 bg-muted rounded w-20"></div></TableCell>
              <TableCell><div className="h-4 bg-muted rounded w-32"></div></TableCell>
              <TableCell><div className="h-4 bg-muted rounded w-16"></div></TableCell>
              <TableCell><div className="h-4 bg-muted rounded w-24"></div></TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}

export function CardLoadingSkeleton() {
  return (
    <Card className="animate-pulse">
      <CardHeader>
        <div className="h-6 bg-muted rounded w-32 mb-2"></div>
        <div className="h-4 bg-muted rounded w-48"></div>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          <div className="h-4 bg-muted rounded w-full"></div>
          <div className="h-4 bg-muted rounded w-5/6"></div>
          <div className="h-4 bg-muted rounded w-4/6"></div>
        </div>
      </CardContent>
    </Card>
  );
}

export function DashboardLoadingSkeleton() {
  return (
    <div className="space-y-6 animate-pulse">
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <Card key={i}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <div className="h-4 bg-muted rounded w-24"></div>
              <div className="h-8 w-8 bg-muted rounded"></div>
            </CardHeader>
            <CardContent>
              <div className="h-8 bg-muted rounded w-16 mb-1"></div>
              <div className="h-3 bg-muted rounded w-32"></div>
            </CardContent>
          </Card>
        ))}
      </div>
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
        <Card className="col-span-4">
          <CardHeader>
            <div className="h-6 bg-muted rounded w-40"></div>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className="flex items-center space-x-4">
                  <div className="h-12 w-12 bg-muted rounded-full"></div>
                  <div className="flex-1 space-y-2">
                    <div className="h-4 bg-muted rounded w-3/4"></div>
                    <div className="h-3 bg-muted rounded w-1/2"></div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
        <Card className="col-span-3">
          <CardHeader>
            <div className="h-6 bg-muted rounded w-32"></div>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="space-y-2">
                  <div className="h-4 bg-muted rounded w-full"></div>
                  <div className="h-3 bg-muted rounded w-4/5"></div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
