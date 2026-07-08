import { useStore } from "@/lib/mock-store";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

/**
 * School Selector Component
 * Allows Super Admin to switch between school contexts or view all schools
 * Only visible to users with super_admin role
 */
export function SchoolSelector() {
  const { currentUser, schools, setSchoolContext } = useStore();

  // Only show for super_admin role
  if (currentUser?.role !== "super_admin") {
    return null;
  }

  // Get the school store state directly for selected school ID
  // Since the store doesn't expose it, we'll use session storage
  const selectedSchoolId =
    typeof window !== "undefined"
      ? sessionStorage.getItem("kinder.selectedSchoolId") || "all"
      : "all";

  const handleSchoolChange = (value: string) => {
    if (value === "all") {
      setSchoolContext(null);
    } else {
      setSchoolContext(value);
    }
  };

  // Find the selected school to display its name
  const selectedSchool = schools.find((s) => s.id === selectedSchoolId);
  const displayValue =
    selectedSchoolId === "all" ? "All Schools" : selectedSchool?.name || "All Schools";

  return (
    <div className="px-3 py-2">
      <label className="text-xs font-medium text-muted-foreground mb-1 block">School Context</label>
      <Select value={selectedSchoolId} onValueChange={handleSchoolChange}>
        <SelectTrigger className="w-full">
          <SelectValue placeholder={displayValue}>{displayValue}</SelectValue>
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All Schools</SelectItem>
          {schools.map((school) => (
            <SelectItem key={school.id} value={school.id}>
              {school.name}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}
