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
  type School
} from "./db-functions";

// Re-export types so we don't break existing imports in components
export type { Role, TeacherStatus, User, Pupil, Parent, ClassRoom, Attendance, Notification, AuditLog, Mark, School };

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
  registerUser: (data: { id: string; name: string; email: string; phone: string; password?: string; role: Role; schoolId?: string; newSchoolName?: string; status?: TeacherStatus; subjects?: string[] }) => Promise<void>;
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
  addSchool: (data: { name: string; address?: string; phone?: string; email?: string }) => Promise<void>;
  updateSchool: (id: string, data: Partial<Omit<School, "id" | "registeredAt">>) => Promise<void>;
  deleteSchool: (id: string) => Promise<void>;
  addClass: (data: { name: string; schoolId: string; teacherId?: string }) => Promise<void>;
  updateClass: (id: string, data: Partial<Omit<ClassRoom, "id">>) => Promise<void>;
  deleteClass: (id: string) => Promise<void>;
}

const Ctx = createContext<Store | null>(null);

const SESSION_KEY = "kinder.currentUserId";
const SCHOOL_CONTEXT_KEY = "kinder.selectedSchoolId";

export function MockStoreProvider({ children }: { children: ReactNode }) {
  const [loading, setLoading] = useState(true);
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

  // Load database tables on mount
  useEffect(() => {
    async function loadData() {
      try {
        const data = await getInitialData();
        setState(s => ({
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
    [state.users, state.currentUserId]
  );

  const filteredUsers = useMemo(() => {
    if (!currentUser) return [];
    if (currentUser.role === 'super_admin') {
      // Super admin with school context: filter by selected school
      if (state.selectedSchoolId) {
        return state.users.filter(u => u.schoolId === state.selectedSchoolId);
      }
      // Super admin without school context: see all users
      return state.users;
    }
    // School-scoped users: see only their school
    return state.users.filter(u => u.schoolId === currentUser.schoolId);
  }, [state.users, currentUser, state.selectedSchoolId]);

  const filteredClasses = useMemo(() => {
    if (!currentUser) return [];
    if (currentUser.role === 'super_admin') {
      if (state.selectedSchoolId) {
        return state.classes.filter(c => c.schoolId === state.selectedSchoolId);
      }
      return state.classes;
    }
    return state.classes.filter(c => c.schoolId === currentUser.schoolId);
  }, [state.classes, currentUser, state.selectedSchoolId]);

  const filteredPupils = useMemo(() => {
    if (!currentUser) return [];
    if (currentUser.role === 'super_admin') {
      if (state.selectedSchoolId) {
        return state.pupils.filter(p => p.schoolId === state.selectedSchoolId);
      }
      return state.pupils;
    }
    return state.pupils.filter(p => p.schoolId === currentUser.schoolId);
  }, [state.pupils, currentUser, state.selectedSchoolId]);

  const filteredParents = useMemo(() => {
    if (!currentUser) return [];
    if (currentUser.role === 'super_admin') {
      if (state.selectedSchoolId) {
        return state.parents.filter(p => p.schoolId === state.selectedSchoolId);
      }
      return state.parents;
    }
    return state.parents.filter(p => p.schoolId === currentUser.schoolId);
  }, [state.parents, currentUser, state.selectedSchoolId]);

  const filteredAttendance = useMemo(() => {
    if (!currentUser) return [];
    if (currentUser.role === 'super_admin') {
      if (state.selectedSchoolId) {
        return state.attendance.filter(a => 
          state.pupils.find(p => p.id === a.pupilId)?.schoolId === state.selectedSchoolId
        );
      }
      return state.attendance;
    }
    return state.attendance.filter(a => 
      state.pupils.find(p => p.id === a.pupilId)?.schoolId === currentUser.schoolId
    );
  }, [state.attendance, state.pupils, currentUser, state.selectedSchoolId]);

  const filteredNotifications = useMemo(() => {
    if (!currentUser) return [];
    if (currentUser.role === 'super_admin') {
      if (state.selectedSchoolId) {
        return state.notifications.filter(n => 
          state.pupils.find(p => p.id === n.pupilId)?.schoolId === state.selectedSchoolId
        );
      }
      return state.notifications;
    }
    return state.notifications.filter(n => 
      state.pupils.find(p => p.id === n.pupilId)?.schoolId === currentUser.schoolId
    );
  }, [state.notifications, state.pupils, currentUser, state.selectedSchoolId]);

  const filteredAudit = useMemo(() => {
    if (!currentUser) return [];
    if (currentUser.role === 'super_admin') {
      if (state.selectedSchoolId) {
        return state.audit.filter(a => 
          state.users.find(u => u.id === a.actorId)?.schoolId === state.selectedSchoolId
        );
      }
      return state.audit;
    }
    return state.audit.filter(a => 
      state.users.find(u => u.id === a.actorId)?.schoolId === currentUser.schoolId
    );
  }, [state.audit, state.users, currentUser, state.selectedSchoolId]);

  const filteredMarks = useMemo(() => {
    if (!currentUser) return [];
    if (currentUser.role === 'super_admin') {
      if (state.selectedSchoolId) {
        return state.marks.filter(m => 
          state.pupils.find(p => p.id === m.pupilId)?.schoolId === state.selectedSchoolId
        );
      }
      return state.marks;
    }
    return state.marks.filter(m => 
      state.pupils.find(p => p.id === m.pupilId)?.schoolId === currentUser.schoolId
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
      setState(s => ({ ...s, currentUserId: null, selectedSchoolId: null }));
    },

    setSchoolContext: (schoolId: string | null) => {
      setState(s => ({ ...s, selectedSchoolId: schoolId }));
    },

    registerUser: async ({ id, name, email, phone, role, schoolId, newSchoolName, status, subjects }) => {
      const res = await registerUserDb({ data: { id, name, email, phone, role, schoolId, newSchoolName, status, subjects } });
      setState(s => {
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
      const schoolId = (pupil as any).schoolId || currentUser.schoolId;

      if (parent) {
        createdParent = await addParentDb({ data: { parent: { ...parent, schoolId }, actorId: currentUser.id, actorName: currentUser.name } });
      }

      const newPupil = await addPupilDb({
        data: {
          pupil: {
            ...pupil,
            parentIds: createdParent ? [createdParent.id, ...(pupil.parentIds ?? [])] : pupil.parentIds ?? [],
            schoolId,
          },
          parent: parent ? { ...parent, schoolId } : undefined,
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
      const schoolId = (parentData as any).schoolId || currentUser.schoolId;
      const newParent = await addParentDb({ data: { parent: { ...parentData, schoolId }, actorId: currentUser.id, actorName: currentUser.name } });
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
          transportDetails,
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
          transportDetails,
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

    addSchool: async (schoolData) => {
      const newSchool = await addSchoolDb({ data: schoolData });
      setState(s => ({
        ...s,
        schools: [...s.schools, newSchool],
      }));
    },

    updateSchool: async (id, schoolData) => {
      const res = await updateSchoolDb({ data: { id, data: schoolData } });
      setState(s => ({
        ...s,
        schools: s.schools.map((sch) => (sch.id === id ? { ...sch, ...res.data } : sch)),
      }));
    },

    deleteSchool: async (id) => {
      await deleteSchoolDb({ data: { id } });
      setState(s => ({
        ...s,
        schools: s.schools.filter((sch) => sch.id !== id),
        users: s.users.filter((u) => u.schoolId !== id),
        classes: s.classes.filter((c) => c.schoolId !== id),
        pupils: s.pupils.filter((p) => p.schoolId !== id),
      }));
    },

    addClass: async (classData) => {
      const newClass = await addClassDb({ data: classData });
      setState(s => ({
        ...s,
        classes: [...s.classes, newClass],
        users: classData.teacherId
          ? s.users.map((u) => (u.id === classData.teacherId ? { ...u, classId: newClass.id } : u))
          : s.users,
      }));
    },

    updateClass: async (id, classData) => {
      const res = await updateClassDb({ data: { id, data: classData } });
      setState(s => ({
        ...s,
        classes: s.classes.map((cls) => (cls.id === id ? { ...cls, ...res.data } : cls)),
        users: classData.teacherId !== undefined
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
      setState(s => ({
        ...s,
        classes: s.classes.filter((cls) => cls.id !== id),
        users: s.users.map((u) => (u.classId === id ? { ...u, classId: undefined } : u)),
      }));
    },
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        {/* Loading silently */}
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