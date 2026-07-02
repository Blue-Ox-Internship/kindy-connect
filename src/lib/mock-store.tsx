import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import {
  getInitialData,
  loginUser,
  registerUser as registerUserDb,
  approveTeacher as approveTeacherDb,
  rejectTeacher as rejectTeacherDb,
  addPupil as addPupilDb,
  updatePupil as updatePupilDb,
  deactivatePupil as deactivatePupilDb,
  addParent as addParentDb,
  markArrival as markArrivalDb,
  markDeparture as markDepartureDb,
  addMark as addMarkDb,
  updateMark as updateMarkDb,
  deleteMark as deleteMarkDb,
  type Role,
  type TeacherStatus,
  type User,
  type Pupil,
  type Parent,
  type ClassRoom,
  type Attendance,
  type Notification,
  type AuditLog,
  type Mark
} from "./db-functions";

// Re-export types so we don't break existing imports in components
export type { Role, TeacherStatus, User, Pupil, Parent, ClassRoom, Attendance, Notification, AuditLog, Mark };

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
  login: (id: string) => Promise<User | null>;
  loginAs: (role: Role) => Promise<void>;
  logout: () => void;
  registerUser: (data: { name: string; email: string; phone: string; password?: string; role: Role }) => Promise<void>;
  approveTeacher: (id: string) => Promise<void>;
  rejectTeacher: (id: string) => Promise<void>;
  addPupil: (data: Omit<Pupil, "id" | "active"> & { parent?: Omit<Parent, "id"> }) => Promise<void>;
  updatePupil: (id: string, data: Partial<Pupil>) => Promise<void>;
  deactivatePupil: (id: string) => Promise<void>;
  addParent: (data: Omit<Parent, "id">) => Promise<void>;
  markArrival: (
    pupilId: string,
    transportDetails?: { transport: string; vehicleReg?: string; personName: string; personRelation: string; phone?: string }
  ) => Promise<void>;
  markDeparture: (
    pupilId: string,
    transportDetails?: { transport: string; vehicleReg?: string; personName: string; personRelation: string; phone?: string }
  ) => Promise<void>;
  addMark: (data: Omit<Mark, "id" | "recordedBy" | "recordedAt">) => Promise<void>;
  updateMark: (id: string, data: Partial<Omit<Mark, "id" | "recordedBy" | "recordedAt">>) => Promise<void>;
  deleteMark: (id: string) => Promise<void>;
}

const Ctx = createContext<Store | null>(null);

const SESSION_KEY = "kinder.currentUserId";

export function MockStoreProvider({ children }: { children: ReactNode }) {
  const [loading, setLoading] = useState(true);
  const [state, setState] = useState(() => {
    let savedUserId: string | null = null;
    if (typeof window !== "undefined") {
      try {
        savedUserId = localStorage.getItem(SESSION_KEY);
      } catch {}
    }
    return {
      currentUserId: savedUserId,
      users: [] as User[],
      pupils: [] as Pupil[],
      parents: [] as Parent[],
      classes: [] as ClassRoom[],
      attendance: [] as Attendance[],
      notifications: [] as Notification[],
      audit: [] as AuditLog[],
      marks: [] as Mark[],
    };
  });

  // Load database tables on mount
  useEffect(() => {
    async function loadData() {
      try {
        const data = await getInitialData();
        setState(s => ({
          ...s,
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
        console.error("Failed to load live database data:", err);
      } finally {
        setLoading(false);
      }
    }
    loadData();
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

  const currentUser = useMemo(
    () => state.users.find((u: User) => u.id === state.currentUserId) ?? null,
    [state.users, state.currentUserId]
  );

  const store: Store = {
    currentUser,
    users: state.users,
    pupils: state.pupils,
    parents: state.parents,
    classes: state.classes,
    attendance: state.attendance,
    notifications: state.notifications,
    audit: state.audit,
    marks: state.marks,

    login: async (id) => {
      const u = await loginUser({ data: { id } });
      if (u) {
        setState(s => ({ ...s, currentUserId: u.id }));
      }
      return u;
    },

    loginAs: async (role) => {
      const u = state.users.find((x: User) => x.role === role && x.status === "verified");
      if (u) {
        setState(s => ({ ...s, currentUserId: u.id }));
      }
    },

    logout: () => {
      setState(s => ({ ...s, currentUserId: null }));
    },

    registerUser: async ({ id, name, email, phone, role }) => {
      const u = await registerUserDb({ data: { id, name, email, phone, role } });
      setState(s => ({ ...s, users: [...s.users, u] }));
    },

    approveTeacher: async (id) => {
      if (!currentUser) return;
      await approveTeacherDb({ data: { id, actorId: currentUser.id, actorName: currentUser.name } });
      setState(s => ({
        ...s,
        users: s.users.map((u: User) => (u.id === id ? { ...u, status: "verified" } : u)),
        audit: [
          {
            id: Math.random().toString(36).slice(2, 10),
            actorId: currentUser.id,
            actorName: currentUser.name,
            action: "Approved teacher",
            target: s.users.find(u => u.id === id)?.name || id,
            timestamp: new Date().toISOString(),
          },
          ...s.audit,
        ],
      }));
    },

    rejectTeacher: async (id) => {
      if (!currentUser) return;
      await rejectTeacherDb({ data: { id, actorId: currentUser.id, actorName: currentUser.name } });
      setState(s => ({
        ...s,
        users: s.users.map((u: User) => (u.id === id ? { ...u, status: "rejected" } : u)),
        audit: [
          {
            id: Math.random().toString(36).slice(2, 10),
            actorId: currentUser.id,
            actorName: currentUser.name,
            action: "Rejected teacher",
            target: s.users.find(u => u.id === id)?.name || id,
            timestamp: new Date().toISOString(),
          },
          ...s.audit,
        ],
      }));
    },

    addPupil: async (pupilData) => {
      if (!currentUser) return;
      const { parent, ...pupil } = pupilData as Omit<Pupil, "id" | "active"> & { parent?: Omit<Parent, "id"> };
      let createdParent: Parent | undefined;

      if (parent) {
        createdParent = await addParentDb({ data: { parent, actorId: currentUser.id, actorName: currentUser.name } });
      }

      const newPupil = await addPupilDb({
        data: {
          pupil: {
            ...pupil,
            parentIds: createdParent ? [createdParent.id, ...(pupil.parentIds ?? [])] : pupil.parentIds ?? [],
          },
          parent,
          actorId: currentUser.id,
          actorName: currentUser.name,
        },
      });
      setState(s => ({
        ...s,
        pupils: [...s.pupils, newPupil],
        parents: createdParent ? [...s.parents, createdParent] : s.parents,
        audit: [
          {
            id: Math.random().toString(36).slice(2, 10),
            actorId: currentUser.id,
            actorName: currentUser.name,
            action: "Created pupil",
            target: `${newPupil.firstName} ${newPupil.lastName} (${newPupil.admissionNo})`,
            timestamp: new Date().toISOString(),
          },
          ...s.audit,
        ],
      }));
    },

    updatePupil: async (id, data) => {
      await updatePupilDb({ data: { id, data } });
      setState(s => ({
        ...s,
        pupils: s.pupils.map((p: Pupil) => (p.id === id ? { ...p, ...data } : p)),
      }));
    },

    deactivatePupil: async (id) => {
      await deactivatePupilDb({ data: { id } });
      setState(s => ({
        ...s,
        pupils: s.pupils.map((p: Pupil) => (p.id === id ? { ...p, active: false } : p)),
      }));
    },

    addParent: async (parentData) => {
      if (!currentUser) return;
      const newParent = await addParentDb({ data: { parent: parentData, actorId: currentUser.id, actorName: currentUser.name } });
      setState(s => ({
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
          transportDetails: {
            transport: transportDetails.transport,
            vehicleReg: transportDetails.vehicleReg,
            personName: transportDetails.personName,
            personRelation: transportDetails.personRelation,
            phone: transportDetails.phone,
          },
          actorId: currentUser.id,
          actorName: currentUser.name,
        },
      });

      setState(s => {
        const exists = s.attendance.some(a => a.id === res.attendance.id);
        const nextAtt = exists
          ? s.attendance.map(a => (a.id === res.attendance.id ? res.attendance : a))
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
          transportDetails: {
            transport: transportDetails.transport,
            vehicleReg: transportDetails.vehicleReg,
            personName: transportDetails.personName,
            personRelation: transportDetails.personRelation,
            phone: transportDetails.phone,
          },
          actorId: currentUser.id,
          actorName: currentUser.name,
        },
      });

      setState(s => {
        const exists = s.attendance.some(a => a.id === res.attendance.id);
        const nextAtt = exists
          ? s.attendance.map(a => (a.id === res.attendance.id ? res.attendance : a))
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
      
      setState(s => ({
        ...s,
        marks: [newMark, ...s.marks],
        audit: [
          {
            id: Math.random().toString(36).slice(2, 10),
            actorId: currentUser.id,
            actorName: currentUser.name,
            action: "Added mark",
            target: pupil ? `${pupil.firstName} ${pupil.lastName} - ${markData.subject} (${markData.score}/${markData.maxScore})` : markData.subject,
            timestamp: new Date().toISOString(),
          },
          ...s.audit,
        ],
      }));
    },

    updateMark: async (id, markData) => {
      if (!currentUser) return;
      const res = await updateMarkDb({ data: { id, data: markData } });
      
      setState(s => {
        const existingMark = s.marks.find(m => m.id === id);
        const pupil = existingMark ? s.pupils.find(p => p.id === existingMark.pupilId) : null;
        
        return {
          ...s,
          marks: s.marks.map(m => (m.id === id ? { ...m, ...res.data } : m)),
          audit: [
            {
              id: Math.random().toString(36).slice(2, 10),
              actorId: currentUser.id,
              actorName: currentUser.name,
              action: "Updated mark",
              target: pupil && existingMark ? `${pupil.firstName} ${pupil.lastName} - ${existingMark.subject}` : "Mark",
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
      
      setState(s => {
        const existingMark = s.marks.find(m => m.id === id);
        const pupil = existingMark ? s.pupils.find(p => p.id === existingMark.pupilId) : null;
        
        return {
          ...s,
          marks: s.marks.filter(m => m.id !== id),
          audit: [
            {
              id: Math.random().toString(36).slice(2, 10),
              actorId: currentUser.id,
              actorName: currentUser.name,
              action: "Deleted mark",
              target: pupil && existingMark ? `${pupil.firstName} ${pupil.lastName} - ${existingMark.subject}` : "Mark",
              timestamp: new Date().toISOString(),
            },
            ...s.audit,
          ],
        };
      });
    },
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-4">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
          <p className="text-sm font-medium text-muted-foreground animate-pulse">Loading database records...</p>
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