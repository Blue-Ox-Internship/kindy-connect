import { useState } from "react";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { useStore } from "@/lib/store";

export function LockScreen() {
  const { unlock, currentUser } = useStore() as any;
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const submit = async (e?: any) => {
    e?.preventDefault();
    setError("");
    setLoading(true);
    const ok = await unlock(password);
    setLoading(false);
    if (!ok) setError("Incorrect password");
  };

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-background/80">
      <div className="w-full max-w-md rounded-xl bg-card p-6 shadow-lg">
        <h2 className="text-lg font-semibold">Session locked</h2>
        <p className="text-sm text-muted-foreground mt-1">Enter your password to continue.</p>
        <div className="mt-4">
          <Input
            autoFocus
            type="password"
            value={password}
            onChange={(e: any) => setPassword(e.target.value)}
            onKeyDown={(e: any) => {
              if (e.key === "Enter" && !loading) submit(e);
            }}
            placeholder="Password"
            autoComplete="new-password"
            data-lpignore="true"
            data-bwignore="true"
            data-1p-ignore="true"
            data-form-type="other"
          />
          {error && <div className="text-destructive text-sm mt-2">{error}</div>}
          <div className="mt-4 flex justify-end">
            <Button type="button" onClick={submit} loading={loading}>
              Unlock
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default LockScreen;
