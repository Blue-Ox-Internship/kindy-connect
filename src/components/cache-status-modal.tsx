import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Database, RefreshCw, Trash2, Cpu, Activity, Clock, Zap, CheckCircle2 } from "lucide-react";
import { useStore } from "@/lib/store";
import { toast } from "sonner";

export function CacheStatusModal() {
  const { refreshData, lastSyncTime, purgeCache, getServerStats } = useStore() as any;
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [purging, setPurging] = useState(false);
  const [stats, setStats] = useState<{
    hits: number;
    misses: number;
    revalidations: number;
    invalidations: number;
    itemCount: number;
    estimatedMemoryBytes: number;
    lastInvalidatedAt: string | null;
  } | null>(null);

  const fetchStats = async () => {
    if (getServerStats) {
      const res = await getServerStats();
      if (res) setStats(res);
    }
  };

  useEffect(() => {
    if (open) {
      fetchStats();
    }
  }, [open]);

  const handleRefresh = async () => {
    setLoading(true);
    try {
      await refreshData();
      await fetchStats();
      toast.success("Data revalidated from cache/database");
    } catch (err) {
      toast.error("Failed to refresh data");
    } finally {
      setLoading(false);
    }
  };

  const handlePurge = async () => {
    setPurging(true);
    try {
      if (purgeCache) {
        await purgeCache();
        await fetchStats();
        toast.success("Server and client cache completely purged and refreshed");
      }
    } catch (err) {
      toast.error("Failed to purge cache");
    } finally {
      setPurging(false);
    }
  };

  const hitRatio = stats && stats.hits + stats.misses > 0
    ? Math.round((stats.hits / (stats.hits + stats.misses)) * 100)
    : 100;

  const memoryMb = stats ? (stats.estimatedMemoryBytes / 1024 / 1024).toFixed(2) : "0.00";

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          className="gap-2 text-xs font-medium bg-background/80 hover:bg-accent border-muted/80 shadow-xs transition-all"
        >
          <Zap className="h-3.5 w-3.5 text-amber-500 fill-amber-500/20" />
          <span className="hidden sm:inline">Cache Engine</span>
          <Badge variant="secondary" className="px-1.5 py-0 text-[10px] bg-emerald-500/10 text-emerald-600 font-semibold border-emerald-500/20">
            Active
          </Badge>
        </Button>
      </DialogTrigger>

      <DialogContent className="max-w-md">
        <DialogHeader className="pb-2 border-b">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-lg bg-amber-500/10 text-amber-600">
              <Zap className="h-5 w-5 fill-amber-500/20" />
            </div>
            <div>
              <DialogTitle className="text-lg">Scaling & Cache System</DialogTitle>
              <DialogDescription className="text-xs">
                In-memory SWR caching and query optimization stats
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <div className="space-y-4 py-2">
          {/* Status Banner */}
          <div className="flex items-center justify-between p-3 rounded-lg bg-muted/50 border text-xs">
            <div className="flex items-center gap-2">
              <Clock className="h-4 w-4 text-muted-foreground" />
              <span>Last Client Sync:</span>
            </div>
            <span className="font-mono font-medium text-foreground">
              {lastSyncTime || "Just now"}
            </span>
          </div>

          {/* Grid Stats */}
          <div className="grid grid-cols-2 gap-3">
            <Card className="shadow-none border-muted/70">
              <CardContent className="p-3 space-y-1">
                <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                  <Activity className="h-3.5 w-3.5 text-emerald-500" />
                  Cache Hit Ratio
                </div>
                <div className="text-xl font-bold tracking-tight text-foreground">
                  {hitRatio}%
                </div>
                <div className="text-[10px] text-muted-foreground">
                  {stats?.hits || 0} hits / {stats?.misses || 0} misses
                </div>
              </CardContent>
            </Card>

            <Card className="shadow-none border-muted/70">
              <CardContent className="p-3 space-y-1">
                <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                  <Cpu className="h-3.5 w-3.5 text-blue-500" />
                  Memory Footprint
                </div>
                <div className="text-xl font-bold tracking-tight text-foreground">
                  {memoryMb} <span className="text-xs font-normal text-muted-foreground">MB</span>
                </div>
                <div className="text-[10px] text-muted-foreground">
                  {stats?.itemCount || 0} cached objects
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Details breakdown */}
          <div className="space-y-2 rounded-lg border p-3 text-xs bg-card">
            <div className="flex justify-between py-1 border-b border-border/50">
              <span className="text-muted-foreground">Background Revalidations:</span>
              <span className="font-semibold text-foreground">{stats?.revalidations || 0}</span>
            </div>
            <div className="flex justify-between py-1 border-b border-border/50">
              <span className="text-muted-foreground">Tag Invalidations:</span>
              <span className="font-semibold text-foreground">{stats?.invalidations || 0}</span>
            </div>
            <div className="flex justify-between py-1">
              <span className="text-muted-foreground">Client Stale Time:</span>
              <span className="font-semibold text-foreground">5 mins (SWR Enabled)</span>
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="flex items-center justify-between gap-2 pt-3 border-t">
          <Button
            variant="destructive"
            size="sm"
            onClick={handlePurge}
            disabled={purging || loading}
            className="gap-1.5 text-xs"
          >
            <Trash2 className="h-3.5 w-3.5" />
            {purging ? "Purging..." : "Purge All Cache"}
          </Button>

          <Button
            variant="default"
            size="sm"
            onClick={handleRefresh}
            disabled={loading || purging}
            className="gap-1.5 text-xs"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${loading ? "animate-spin" : ""}`} />
            {loading ? "Refreshing..." : "Revalidate Now"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
