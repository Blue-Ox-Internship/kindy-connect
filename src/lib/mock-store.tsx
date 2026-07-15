import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  useCallback,
  useRef,
  type ReactNode,
} from "react";
import {
  getInitialData,
  loginUser,
  registerUser as registerUserDb,
  approveTeacher as approveTeacherDb,
  rejectTeacher as rejectTeacherDb,
  deleteUser as deleteUserDb,
  addPupil as addPupilDb,
  updatePupil as updatePupilDb,
  deactivatePupil as deactivatePupilDb,
  addParent as addParentDb,
  markArrival as markArrivalDb,
  markDeparture as markDepartureDb,
  addMark as addMarkDb,
  updateMark as updateMarkDb,
  deleteMark as deleteMarkDb,
  addSchool as addSchoolDb,
  updateSchool as updateSchoolDb,
  deleteSchool as deleteSchoolDb,
  addClass as addClassDb,
  updateClass as updateClassDb,
  deleteClass as deleteClassDb,
  type Role,
  type TeacherStatus,
  type User,
  type Pupil,
  type Parent,
  type ClassRoom,
  type Attendance,
  type Notification,
  type AuditLog,
  type Mark,
  type School,
} from "./db-functions";

// Re-export types so we don't break existing imports in components
export type {
  Role,
  TeacherStatus,
  User,
  Pupil,
  Parent,
  ClassRoom,
  Attendance,
  Notification,
  AuditLog,
  Mark,
  School,
};

interface Store {
  currentUser: User | null;
  users: User[];
  pupils: Pupil[];
  parents: Parent[];
  classes: ClassRoom[];
  attendance: Attendance[];
  notifications: Notification[];
  audit: AuditLog[];
  marks: Mark[];
  schools: School[];
  login: (id: string) => Promise<User | null>;
  loginAs: (role: Role) => Promise<void>;
  logout: () => void;
  setSchoolContext: (schoolId: string | null) => void;
  registerUser: (data: {
    id: string;
    name: string;
    email: string;
    phone: string;
    password?: string;
    role: Role;
    schoolId?: string;
    newSchoolName?: string;
    status?: TeacherStatus;
    subjects?: string[];
    photo?: string;
  }) => Promise<void>;
  approveTeacher: (id: string) => Promise<void>;
  rejectTeacher: (id: string) => Promise<void>;
  deleteUser: (id: string) => Promise<void>;
  addPupil: (data: Omit<Pupil, "id" | "active"> & { parent?: Omit<Parent, "id"> }) => Promise<void>;
  updatePupil: (id: string, data: Partial<Pupil>) => Promise<void>;
  deactivatePupil: (id: string) => Promise<void>;
  addParent: (data: Omit<Parent, "id">) => Promise<void>;
  markArrival: (
    pupilId: string,
    transportDetails?: {
      transport: string;
      vehicleReg?: string;
      personName: string;
      personRelation: string;
      phone?: string;
    },
  ) => Promise<void>;
  markDeparture: (
    pupilId: string,
    transportDetails?: {
      transport: string;
      vehicleReg?: string;
      personName: string;
      personRelation: string;
      phone?: string;
    },
  ) => Promise<void>;
  addMark: (data: Omit<Mark, "id" | "recordedBy" | "recordedAt">) => Promise<void>;
  updateMark: (
    id: string,
    data: Partial<Omit<Mark, "id" | "recordedBy" | "recordedAt">>,
  ) => Promise<void>;
  deleteMark: (id: string) => Promise<void>;
  addSchool: (data: {
    name: string;
    address?: string;
    phone?: string;
    email?: string;
  }) => Promise<void>;
  updateSchool: (id: string, data: Partial<Omit<School, "id" | "registeredAt">>) => Promise<void>;
  deleteSchool: (id: string) => Promise<void>;
  addClass: (data: { name: string; schoolId: string; teacherId?: string }) => Promise<void>;
  updateClass: (id: string, data: Partial<Omit<ClassRoom, "id">>) => Promise<void>;
  deleteClass: (id: string) => Promise<void>;
  refreshData: () => Promise<void>;
}

const Ctx = createContext<Store | null>(null);

const SESSION_KEY = "kinder.currentUserId";
const SCHOOL_CONTEXT_KEY = "kinder.selectedSchoolId";

// ── Helpers ─────────────────────────────────────────────────────────────────
function classifyDbError(err: any): { isPaused: boolean; message: string } {
  const msg: string = err?.message || err?.toString() || "Unknown error";
  const isPaused =
    msg.includes("tenant") ||
    msg.includes("not found") ||
    msg.includes("ENOTFOUND") ||
    msg.includes("CONNECT_TIMEOUT") ||
    msg.includes("timeout") ||
    msg.includes("ECONNREFUSED");
  return { isPaused, message: msg };
}

export function MockStoreProvider({ children }: { children: ReactNode }) {
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [isPausedError, setIsPausedError] = useState(false);
  const [retryIn, setRetryIn] = useState(0); // seconds until next auto-retry
  const retryTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const [state, setState] = useState(() => {
    let savedUserId: string | null = null;
    let savedSchoolId: string | null = null;
    if (typeof window !== "undefined") {
      try {
        savedUserId = localStorage.getItem(SESSION_KEY);
        savedSchoolId = sessionStorage.getItem(SCHOOL_CONTEXT_KEY);
      } catch {}
    }
    return {
      currentUserId: savedUserId,
      selectedSchoolId: savedSchoolId,
      users: [] as User[],
      pupils: [] as Pupil[],
      parents: [] as Parent[],
      classes: [] as ClassRoom[],
      attendance: [] as Attendance[],
      notifications: [] as Notification[],
      audit: [] as AuditLog[],
      marks: [] as Mark[],
      schools: [] as School[],
    };
  });

  // ── Auto-retry countdown timer ───────────────────────────────────────────────
  const startRetryCountdown = useCallback((seconds: number, onFire: () => void) => {
    if (retryTimerRef.current) clearInterval(retryTimerRef.current);
    setRetryIn(seconds);
    let remaining = seconds;
    retryTimerRef.current = setInterval(() => {
      remaining -= 1;
      setRetryIn(remaining);
      if (remaining <= 0) {
        clearInterval(retryTimerRef.current!);
        retryTimerRef.current = null;
        onFire();
      }
    }, 1000);
  }, []);

  // ── Load database on mount (and on manual retry) ─────────────────────────────
  const attemptLoad = useCallback(async () => {
    // Clear any existing countdown
    if (retryTimerRef.current) {
      clearInterval(retryTimerRef.current);
      retryTimerRef.current = null;
    }
    setLoading(true);
    setLoadError(null);
    setIsPausedError(false);
    setRetryIn(0);

    // Timeout guard — Supabase free tier can take up to 25s to wake
    let timedOut = false;
    const timeoutId = setTimeout(() => {
      timedOut = true;
      setLoadError("Database is waking up (this can take up to 2 minutes on free tier).");
      setIsPausedError(true);
      setLoading(false);
      startRetryCountdown(15, attemptLoad);
    }, 25000);

    try {
      const data = await getInitialData();
      if (timedOut) return; // already shown error, ignore late response
      clearTimeout(timeoutId);
      setState((s) => ({
        ...s,
        schools: data.schools || [],
        users: data.users,
        pupils: data.pupils,
        parents: data.parents,
        classes: data.classes,
        attendance: data.attendance,
        notifications: data.notifications,
        audit: data.audit,
        marks: data.marks,
      }));
      setLoadError(null);
      setIsPausedError(false);
      setLoading(false);
    } catch (err: any) {
      if (timedOut) return;
      clearTimeout(timeoutId);
      console.error("Failed to load live database data:", err);
      const { isPaused, message } = classifyDbError(err);
      setLoadError(message);
      setIsPausedError(isPaused);
      setLoading(false);
      // Auto-retry every 15 seconds for paused-project errors
      if (isPaused) startRetryCountdown(15, attemptLoad);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [startRetryCountdown]);

  useEffect(() => {
    attemptLoad();
    return () => {
      if (retryTimerRef.current) clearInterval(retryTimerRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Refresh function to reload data from database
  const refreshData = useCallback(async () => {
    try {
      const data = await getInitialData();
      setState((s) => ({
        ...s,
        schools: data.schools || [],
        users: data.users,
        pupils: data.pupils,
        parents: data.parents,
        classes: data.classes,
        attendance: data.attendance,
        notifications: data.notifications,
        audit: data.audit,
        marks: data.marks,
      }));
    } catch (err) {
      console.error("Failed to refresh database data:", err);
    }
  }, []);

  // Sync user session to local storage
  useEffect(() => {
    try {
      if (state.currentUserId) {
        localStorage.setItem(SESSION_KEY, state.currentUserId);
      } else {
        localStorage.removeItem(SESSION_KEY);
      }
    } catch {}
  }, [state.currentUserId]);

  // Sync school context to session storage
  useEffect(() => {
    try {
      if (state.selectedSchoolId) {
        sessionStorage.setItem(SCHOOL_CONTEXT_KEY, state.selectedSchoolId);
      } else {
        sessionStorage.removeItem(SCHOOL_CONTEXT_KEY);
      }
    } catch {}
  }, [state.selectedSchoolId]);

  const currentUser = useMemo(
    () => state.users.find((u: User) => u.id === state.currentUserId) ?? null,
    [state.users, state.currentUserId],
  );

  const filteredUsers = useMemo(() => {
    if (!currentUser) return [];
    if (currentUser.role === "super_admin") {
      // Super admin with school context: filter by selected school
      if (state.selectedSchoolId) {
        return state.users.filter((u) => u.schoolId === state.selectedSchoolId);
      }
      // Super admin without school context: see all users
      return state.users;
    }
    // School-scoped users: see only their school
    return state.users.filter((u) => u.schoolId === currentUser.schoolId);
  }, [state.users, currentUser, state.selectedSchoolId]);

  const filteredClasses = useMemo(() => {
    if (!currentUser) return [];
    if (currentUser.role === "super_admin") {
      if (state.selectedSchoolId) {
        return state.classes.filter((c) => c.schoolId === state.selectedSchoolId);
      }
      return state.classes;
    }
    return state.classes.filter((c) => c.schoolId === currentUser.schoolId);
  }, [state.classes, currentUser, state.selectedSchoolId]);

  const filteredPupils = useMemo(() => {
    if (!currentUser) return [];
    if (currentUser.role === "super_admin") {
      if (state.selectedSchoolId) {
        return state.pupils.filter((p) => p.schoolId === state.selectedSchoolId);
      }
      return state.pupils;
    }
    return state.pupils.filter((p) => p.schoolId === currentUser.schoolId);
  }, [state.pupils, currentUser, state.selectedSchoolId]);

  const filteredParents = useMemo(() => {
    if (!currentUser) return [];
    if (currentUser.role === "super_admin") {
      if (state.selectedSchoolId) {
        return state.parents.filter((p) => p.schoolId === state.selectedSchoolId);
      }
      return state.parents;
    }
    return state.parents.filter((p) => p.schoolId === currentUser.schoolId);
  }, [state.parents, currentUser, state.selectedSchoolId]);

  const filteredAttendance = useMemo(() => {
    if (!currentUser) return [];
    if (currentUser.role === "super_admin") {
      if (state.selectedSchoolId) {
        return state.attendance.filter(
          (a) => state.pupils.find((p) => p.id === a.pupilId)?.schoolId === state.selectedSchoolId,
        );
      }
      return state.attendance;
    }
    return state.attendance.filter(
      (a) => state.pupils.find((p) => p.id === a.pupilId)?.schoolId === currentUser.schoolId,
    );
  }, [state.attendance, state.pupils, currentUser, state.selectedSchoolId]);

  const filteredNotifications = useMemo(() => {
    if (!currentUser) return [];
    if (currentUser.role === "super_admin") {
      if (state.selectedSchoolId) {
        return state.notifications.filter(
          (n) => state.pupils.find((p) => p.id === n.pupilId)?.schoolId === state.selectedSchoolId,
        );
      }
      return state.notifications;
    }
    return state.notifications.filter(
      (n) => state.pupils.find((p) => p.id === n.pupilId)?.schoolId === currentUser.schoolId,
    );
  }, [state.notifications, state.pupils, currentUser, state.selectedSchoolId]);

  const filteredAudit = useMemo(() => {
    if (!currentUser) return [];
    if (currentUser.role === "super_admin") {
      if (state.selectedSchoolId) {
        return state.audit.filter(
          (a) => state.users.find((u) => u.id === a.actorId)?.schoolId === state.selectedSchoolId,
        );
      }
      return state.audit;
    }
    return state.audit.filter(
      (a) => state.users.find((u) => u.id === a.actorId)?.schoolId === currentUser.schoolId,
    );
  }, [state.audit, state.users, currentUser, state.selectedSchoolId]);

  const filteredMarks = useMemo(() => {
    if (!currentUser) return [];
    if (currentUser.role === "super_admin") {
      if (state.selectedSchoolId) {
        return state.marks.filter(
          (m) => state.pupils.find((p) => p.id === m.pupilId)?.schoolId === state.selectedSchoolId,
        );
      }
      return state.marks;
    }
    return state.marks.filter(
      (m) => state.pupils.find((p) => p.id === m.pupilId)?.schoolId === currentUser.schoolId,
    );
  }, [state.marks, state.pupils, currentUser, state.selectedSchoolId]);

  const store: Store = {
    currentUser,
    users: filteredUsers,
    pupils: filteredPupils,
    parents: filteredParents,
    classes: filteredClasses,
    attendance: filteredAttendance,
    notifications: filteredNotifications,
    audit: filteredAudit,
    marks: filteredMarks,
    schools: state.schools,

    login: async (id) => {
      const u = await loginUser({ data: { id } });
      if (u) {
        setState((s) => ({ ...s, currentUserId: u.id }));
      }
      return u;
    },

    loginAs: async (role) => {
      const u = state.users.find((x: User) => x.role === role && x.status === "verified");
      if (u) {
        setState((s) => ({ ...s, currentUserId: u.id }));
      }
    },

    logout: () => {
      setState((s) => ({ ...s, currentUserId: null, selectedSchoolId: null }));
    },

    setSchoolContext: (schoolId: string | null) => {
      setState((s) => ({ ...s, selectedSchoolId: schoolId }));
    },

    registerUser: async ({
      id,
      name,
      email,
      phone,
      role,
      schoolId,
      newSchoolName,
      status,
      subjects,
      photo,
    }) => {
      const res = await registerUserDb({
        data: { id, name, email, phone, role, schoolId, newSchoolName, status, subjects, photo },
      });
      setState((s) => {
        const nextUsers = [...s.users, res.user];
        const nextSchools = res.school ? [...s.schools, res.school] : s.schools;
        return {
          ...s,
          users: nextUsers,
          schools: nextSchools,
        };
      });
    },

    approveTeacher: async (id) => {
      if (!currentUser) return;
      await approveTeacherDb({
        data: { id, actorId: currentUser.id, actorName: currentUser.name },
      });
      setState((s) => ({
        ...s,
        users: s.users.map((u: User) => (u.id === id ? { ...u, status: "verified" } : u)),
        audit: [
          {
            id: Math.random().toString(36).slice(2, 10),
            actorId: currentUser.id,
            actorName: currentUser.name,
            action: "Approved teacher",
            target: s.users.find((u) => u.id === id)?.name || id,
            timestamp: new Date().toISOString(),
          },
          ...s.audit,
        ],
      }));
    },

    rejectTeacher: async (id) => {
      if (!currentUser) return;
      await rejectTeacherDb({ data: { id, actorId: currentUser.id, actorName: currentUser.name } });
      setState((s) => ({
        ...s,
        users: s.users.map((u: User) => (u.id === id ? { ...u, status: "rejected" } : u)),
        audit: [
          {
            id: Math.random().toString(36).slice(2, 10),
            actorId: currentUser.id,
            actorName: currentUser.name,
            action: "Rejected teacher",
            target: s.users.find((u) => u.id === id)?.name || id,
            timestamp: new Date().toISOString(),
          },
          ...s.audit,
        ],
      }));
    },

    deleteUser: async (id) => {
      if (!currentUser) return;
      await deleteUserDb({ data: { id, actorId: currentUser.id, actorName: currentUser.name } });
      setState((s) => {
        const deletedUser = s.users.find((u) => u.id === id);
        return {
          ...s,
          users: s.users.filter((u) => u.id !== id),
          audit: [
            {
              id: Math.random().toString(36).slice(2, 10),
              actorId: currentUser.id,
              actorName: currentUser.name,
              action: "Deleted user",
              target: deletedUser ? `${deletedUser.name} (${deletedUser.role})` : id,
              timestamp: new Date().toISOString(),
            },
            ...s.audit,
          ],
        };
      });
    },

    addPupil: async (pupilData) => {
      if (!currentUser) return;
      const { parent, ...pupil } = pupilData as Omit<Pupil, "id" | "active"> & {
        parent?: Omit<Parent, "id">;
      };
      let createdParent: Parent | undefined;
      const schoolId = (pupil as any).schoolId || currentUser.schoolId;

      if (parent) {
        createdParent = await addParentDb({
          data: {
            parent: { ...parent, schoolId },
            actorId: currentUser.id,
            actorName: currentUser.name,
          },
        });
      }

      const newPupil = await addPupilDb({
        data: {
          pupil: {
            ...pupil,
            parentIds: createdParent
              ? [createdParent.id, ...(pupil.parentIds ?? [])]
              : (pupil.parentIds ?? []),
            schoolId,
          },
          parent: (parent
            ? { ...parent, schoolId }
            : { name: "", phone: "", email: "", relationship: "" }) as any,
          actorId: currentUser.id,
          actorName: currentUser.name,
        },
      });

      // Refresh data from database to ensure dashboard updates
      await refreshData();
    },

    updatePupil: async (id, data) => {
      await updatePupilDb({ data: { id, data } });
      setState((s) => ({
        ...s,
        pupils: s.pupils.map((p: Pupil) => (p.id === id ? { ...p, ...data } : p)),
      }));
    },

    deactivatePupil: async (id) => {
      await deactivatePupilDb({ data: { id } });
      setState((s) => ({
        ...s,
        pupils: s.pupils.map((p: Pupil) => (p.id === id ? { ...p, active: false } : p)),
      }));
    },

    addParent: async (parentData) => {
      if (!currentUser) return;
      const schoolId = (parentData as any).schoolId || currentUser.schoolId;
      const newParent = await addParentDb({
        data: {
          parent: { ...parentData, schoolId },
          actorId: currentUser.id,
          actorName: currentUser.name,
        },
      });
      setState((s) => ({
        ...s,
        parents: [...s.parents, newParent],
        audit: [
          {
            id: Math.random().toString(36).slice(2, 10),
            actorId: currentUser.id,
            actorName: currentUser.name,
            action: "Registered parent",
            target: newParent.name,
            timestamp: new Date().toISOString(),
          },
          ...s.audit,
        ],
      }));
    },

    markArrival: async (pupilId, transportDetails) => {
      if (!currentUser || !transportDetails) return;
      const res = await markArrivalDb({
        data: {
          pupilId,
          transportDetails,
          actorId: currentUser.id,
          actorName: currentUser.name,
        },
      });

      setState((s) => {
        const exists = s.attendance.some((a) => a.id === res.attendance.id);
        const nextAtt = exists
          ? s.attendance.map((a) => (a.id === res.attendance.id ? res.attendance : a))
          : [res.attendance, ...s.attendance];

        return {
          ...s,
          attendance: nextAtt,
          notifications: [...res.notifications, ...s.notifications],
          audit: [res.audit, ...s.audit],
        };
      });
    },

    markDeparture: async (pupilId, transportDetails) => {
      if (!currentUser || !transportDetails) return;
      const res = await markDepartureDb({
        data: {
          pupilId,
          transportDetails,
          actorId: currentUser.id,
          actorName: currentUser.name,
        },
      });

      setState((s) => {
        const exists = s.attendance.some((a) => a.id === res.attendance.id);
        const nextAtt = exists
          ? s.attendance.map((a) => (a.id === res.attendance.id ? res.attendance : a))
          : [res.attendance, ...s.attendance];

        return {
          ...s,
          attendance: nextAtt,
          notifications: [...res.notifications, ...s.notifications],
          audit: [res.audit, ...s.audit],
        };
      });
    },

    addMark: async (markData) => {
      if (!currentUser) return;
      const newMark = await addMarkDb({ data: { mark: markData, actorId: currentUser.id } });
      const pupil = state.pupils.find((p: Pupil) => p.id === markData.pupilId);

      setState((s) => ({
        ...s,
        marks: [newMark, ...s.marks],
        audit: [
          {
            id: Math.random().toString(36).slice(2, 10),
            actorId: currentUser.id,
            actorName: currentUser.name,
            action: "Added mark",
            target: pupil
              ? `${pupil.firstName} ${pupil.lastName} - ${markData.subject} (${markData.score}/${markData.maxScore})`
              : markData.subject,
            timestamp: new Date().toISOString(),
          },
          ...s.audit,
        ],
      }));
    },

    updateMark: async (id, markData) => {
      if (!currentUser) return;
      const res = await updateMarkDb({ data: { id, data: markData, actorId: currentUser.id } });

      setState((s) => {
        const existingMark = s.marks.find((m) => m.id === id);
        const pupil = existingMark ? s.pupils.find((p) => p.id === existingMark.pupilId) : null;

        return {
          ...s,
          marks: s.marks.map((m) => (m.id === id ? { ...m, ...res.data } : m)),
          audit: [
            {
              id: Math.random().toString(36).slice(2, 10),
              actorId: currentUser.id,
              actorName: currentUser.name,
              action: "Updated mark",
              target:
                pupil && existingMark
                  ? `${pupil.firstName} ${pupil.lastName} - ${existingMark.subject}`
                  : "Mark",
              timestamp: new Date().toISOString(),
            },
            ...s.audit,
          ],
        };
      });
    },

    deleteMark: async (id) => {
      if (!currentUser) return;
      await deleteMarkDb({ data: { id } });

      setState((s) => {
        const existingMark = s.marks.find((m) => m.id === id);
        const pupil = existingMark ? s.pupils.find((p) => p.id === existingMark.pupilId) : null;

        return {
          ...s,
          marks: s.marks.filter((m) => m.id !== id),
          audit: [
            {
              id: Math.random().toString(36).slice(2, 10),
              actorId: currentUser.id,
              actorName: currentUser.name,
              action: "Deleted mark",
              target:
                pupil && existingMark
                  ? `${pupil.firstName} ${pupil.lastName} - ${existingMark.subject}`
                  : "Mark",
              timestamp: new Date().toISOString(),
            },
            ...s.audit,
          ],
        };
      });
    },

    addSchool: async (schoolData) => {
      const newSchool = await addSchoolDb({ data: schoolData });
      setState((s) => ({
        ...s,
        schools: [...s.schools, newSchool],
      }));
    },

    updateSchool: async (id, schoolData) => {
      const res = await updateSchoolDb({ data: { id, data: schoolData } });
      setState((s) => ({
        ...s,
        schools: s.schools.map((sch) => (sch.id === id ? { ...sch, ...res.data } : sch)),
      }));
    },

    deleteSchool: async (id) => {
      await deleteSchoolDb({ data: { id } });
      setState((s) => ({
        ...s,
        schools: s.schools.filter((sch) => sch.id !== id),
        users: s.users.filter((u) => u.schoolId !== id),
        classes: s.classes.filter((c) => c.schoolId !== id),
        pupils: s.pupils.filter((p) => p.schoolId !== id),
      }));
    },

    addClass: async (classData) => {
      const newClass = await addClassDb({ data: classData });
      setState((s) => ({
        ...s,
        classes: [...s.classes, newClass],
        users: classData.teacherId
          ? s.users.map((u) => (u.id === classData.teacherId ? { ...u, classId: newClass.id } : u))
          : s.users,
      }));
    },

    updateClass: async (id, classData) => {
      const res = await updateClassDb({ data: { id, data: classData } });
      setState((s) => ({
        ...s,
        classes: s.classes.map((cls) => (cls.id === id ? { ...cls, ...res.data } : cls)),
        users:
          classData.teacherId !== undefined
            ? s.users.map((u) => {
                if (u.classId === id) return { ...u, classId: undefined };
                if (u.id === classData.teacherId) return { ...u, classId: id };
                return u;
              })
            : s.users,
      }));
    },

    deleteClass: async (id) => {
      await deleteClassDb({ data: { id } });
      setState((s) => ({
        ...s,
        classes: s.classes.filter((cls) => cls.id !== id),
        users: s.users.map((u) => (u.classId === id ? { ...u, classId: undefined } : u)),
      }));
    },

    refreshData,
  };

  // ── Error State ─────────────────────────────────────────────────────────────
  if (loadError) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background px-4">
        <div className="max-w-sm w-full text-center space-y-6">
          {/* Animated icon — orange for paused, red for other errors */}
          <div className="relative mx-auto w-fit">
            {isPausedError && (
              <div
                className="absolute inset-0 rounded-3xl bg-orange-400/20 animate-ping"
                style={{ animationDuration: "2s" }}
              />
            )}
            <div
              className={`relative h-20 w-20 rounded-3xl flex items-center justify-center mx-auto ${
                isPausedError ? "bg-orange-100 dark:bg-orange-900/30" : "bg-destructive/10"
              }`}
            >
              {isPausedError ? (
                /* Moon / sleep icon for paused */
                <svg
                  className="h-10 w-10 text-orange-500"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={1.5}
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M21.752 15.002A9.72 9.72 0 0 1 18 15.75c-5.385 0-9.75-4.365-9.75-9.75 0-1.33.266-2.597.748-3.752A9.753 9.753 0 0 0 3 11.25C3 16.635 7.365 21 12.75 21a9.753 9.753 0 0 0 9.002-5.998Z"
                  />
                </svg>
              ) : (
                /* Alert icon for generic errors */
                <svg
                  className="h-10 w-10 text-destructive"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={1.5}
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M12 9v3.75m9-.75a9 9 0 1 1-18 0 9 9 0 0 1 18 0Zm-9 3.75h.008v.008H12v-.008Z"
                  />
                </svg>
              )}
            </div>
          </div>

          {/* Title + message */}
          <div className="space-y-2">
            <h2 className="text-xl font-semibold text-foreground">
              {isPausedError ? "Database is sleeping" : "Connection failed"}
            </h2>
            {isPausedError ? (
              <div className="space-y-3">
                <p className="text-sm text-muted-foreground leading-relaxed">
                  Your Supabase free-tier project has <strong>paused due to inactivity</strong>. Go
                  to your dashboard, click <strong>Restore Project</strong>, then wait ~2 minutes.
                </p>
                {/* Step-by-step */}
                <ol className="text-left text-xs text-muted-foreground space-y-1.5 bg-muted/40 rounded-xl p-4">
                  <li className="flex items-start gap-2">
                    <span className="shrink-0 h-5 w-5 rounded-full bg-orange-500/15 text-orange-600 text-[10px] font-bold flex items-center justify-center mt-0.5">
                      1
                    </span>
                    Open <strong>Supabase Dashboard</strong> below
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="shrink-0 h-5 w-5 rounded-full bg-orange-500/15 text-orange-600 text-[10px] font-bold flex items-center justify-center mt-0.5">
                      2
                    </span>
                    Select your project → click <strong>Restore Project</strong>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="shrink-0 h-5 w-5 rounded-full bg-orange-500/15 text-orange-600 text-[10px] font-bold flex items-center justify-center mt-0.5">
                      3
                    </span>
                    Wait ~2 minutes — this page will <strong>retry automatically</strong>
                  </li>
                </ol>
              </div>
            ) : (
              <p className="text-sm text-muted-foreground leading-relaxed">
                Could not reach the database. Check your connection and try again.
              </p>
            )}
          </div>

          {/* Auto-retry countdown bar */}
          {isPausedError && retryIn > 0 && (
            <div className="space-y-2">
              <div className="h-1.5 w-full rounded-full bg-muted overflow-hidden">
                <div
                  className="h-full bg-orange-400 rounded-full transition-all duration-1000 ease-linear"
                  style={{ width: `${(retryIn / 15) * 100}%` }}
                />
              </div>
              <p className="text-xs text-muted-foreground">
                Auto-retrying in <span className="font-semibold text-orange-500">{retryIn}s</span>…
              </p>
            </div>
          )}

          {/* Action buttons */}
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <button
              onClick={attemptLoad}
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-primary px-5 py-2.5 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
            >
              <svg
                className="h-4 w-4"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0 3.181 3.183a8.25 8.25 0 0 0 13.803-3.7M4.031 9.865a8.25 8.25 0 0 1 13.803-3.7l3.181 3.182m0-4.991v4.99"
                />
              </svg>
              Retry now
            </button>
            <a
              href="https://supabase.com/dashboard/project/zgkjvkchapfwbqdsmsdt"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center justify-center gap-2 rounded-xl border border-input bg-background px-5 py-2.5 text-sm font-medium text-foreground transition-colors hover:bg-accent"
            >
              <svg
                className="h-4 w-4"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M13.5 6H5.25A2.25 2.25 0 0 0 3 8.25v10.5A2.25 2.25 0 0 0 5.25 21h10.5A2.25 2.25 0 0 0 18 18.75V10.5m-10.5 6L21 3m0 0h-5.25M21 3v5.25"
                />
              </svg>
              Open Dashboard
            </a>
          </div>

          <p className="text-[11px] text-muted-foreground/70">
            Free tier pauses after 7 days of inactivity. Upgrade to Pro to prevent this.
          </p>
        </div>
      </div>
    );
  }

  // ── Loading State ────────────────────────────────────────────────────────────
  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-6">
          {/* Animated brand mark */}
          <div className="relative">
            {/* Outer pulsing ring */}
            <div
              className="absolute inset-0 rounded-3xl bg-primary/20 animate-ping"
              style={{ animationDuration: "1.5s" }}
            />
            {/* Middle ring */}
            <div className="absolute -inset-2 rounded-[28px] bg-primary/10 animate-pulse" />
            {/* Icon container */}
            <div className="relative h-16 w-16 rounded-3xl bg-primary flex items-center justify-center shadow-lg shadow-primary/30">
              <svg
                className="h-8 w-8 text-primary-foreground"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={1.5}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M9.813 15.904 9 18.75l-.813-2.846a4.5 4.5 0 0 0-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 0 0 3.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 0 0 3.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 0 0-3.09 3.09ZM18.259 8.715 18 9.75l-.259-1.035a3.375 3.375 0 0 0-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 0 0 2.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 0 0 2.456 2.456L21.75 6l-1.035.259a3.375 3.375 0 0 0-2.456 2.456ZM16.894 20.567 16.5 21.75l-.394-1.183a2.25 2.25 0 0 0-1.423-1.423L13.5 18.75l1.183-.394a2.25 2.25 0 0 0 1.423-1.423l.394-1.183.394 1.183a2.25 2.25 0 0 0 1.423 1.423l1.183.394-1.183.394a2.25 2.25 0 0 0-1.423 1.423Z"
                />
              </svg>
            </div>
          </div>

          {/* Text */}
          <div className="text-center space-y-1">
            <p className="text-base font-semibold text-foreground">Little Stars</p>
            <p className="text-sm text-muted-foreground animate-pulse">Connecting to database…</p>
          </div>

          {/* Dots loader */}
          <div className="flex gap-1.5">
            {[0, 1, 2].map((i) => (
              <div
                key={i}
                className="h-2 w-2 rounded-full bg-primary/60 animate-bounce"
                style={{ animationDelay: `${i * 0.15}s`, animationDuration: "0.8s" }}
              />
            ))}
          </div>
        </div>
      </div>
    );
  }

  return <Ctx.Provider value={store}>{children}</Ctx.Provider>;
}

export function useStore() {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error("useStore must be used within MockStoreProvider");
  return ctx;
}
