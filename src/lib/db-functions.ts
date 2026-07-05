import { createServerFn } from "@tanstack/react-start";
import { sql, toCamel, toSnake } from "./db";

export interface School {
  id: string;
  name: string;
  address?: string;
  phone?: string;
  email?: string;
  registeredAt: string;
}

// Types matching frontend
export interface User {
  id: string;
  name: string;
  email: string;
  role: "super_admin" | "admin" | "deputy" | "teacher";
  status: "pending" | "verified" | "rejected";
  phone?: string;
  classId?: string;
  registeredAt: string;
  password?: string;
  schoolId?: string;
  subjects?: string[];
}

export interface Pupil {
  id: string;
  admissionNo: string;
  firstName: string;
  lastName: string;
  gender: "M" | "F";
  dob: string;
  classId: string;
  photo?: string;
  active: boolean;
  parentIds: string[];
  schoolId: string;
}

export interface ParentInput {
  name: string;
  phone: string;
  email: string;
  relationship: string;
}

export interface Parent {
  id: string;
  name: string;
  phone: string;
  email: string;
  relationship: string;
  schoolId: string;
}

export interface ClassRoom {
  id: string;
  name: string;
  teacherId?: string;
  schoolId: string;
}

export interface Attendance {
  id: string;
  pupilId: string;
  date: string;
  arrival?: string;
  departure?: string;
  arrivalTransport?: string;
  arrivalVehicleReg?: string;
  arrivalPersonName?: string;
  arrivalPersonRelation?: string;
  arrivalPhone?: string;
  departureTransport?: string;
  departureVehicleReg?: string;
  departurePersonName?: string;
  departurePersonRelation?: string;
  departurePhone?: string;
}

export interface Notification {
  id: string;
  pupilId: string;
  parentId: string;
  channel: "sms" | "email";
  type: "arrival" | "departure";
  status: "sent" | "failed";
  message: string;
  timestamp: string;
  phoneNumber?: string;
}

export interface AuditLog {
  id: string;
  actorId: string;
  actorName: string;
  action: string;
  target: string;
  timestamp: string;
}

export interface Mark {
  id: string;
  pupilId: string;
  subject: string;
  term: string;
  year: string;
  score: number;
  maxScore: number;
  grade?: string;
  teacherComment?: string;
  recordedBy: string;
  recordedAt: string;
}

// ----------------------------------------------------
// 1. Get Initial Data
// ----------------------------------------------------
export const getInitialData = createServerFn({ method: "GET" })
  .handler(async () => {
    try {
      const schools = await sql`SELECT * FROM schools ORDER BY name ASC`;
      const users = await sql`SELECT * FROM users ORDER BY registered_at DESC`;
      const classes = await sql`SELECT * FROM classes ORDER BY name ASC`;
      const parents = await sql`SELECT * FROM parents ORDER BY name ASC`;
      
      // Aggregate parentIds in the pupils query
      const pupils = await sql`
        SELECT p.*, COALESCE(ARRAY_AGG(pp.parent_id) FILTER (WHERE pp.parent_id IS NOT NULL), '{}') as parent_ids
        FROM pupils p
        LEFT JOIN pupil_parents pp ON p.id = pp.pupil_id
        GROUP BY p.id, p.admission_no, p.first_name, p.last_name, p.gender, p.dob, p.class_id, p.photo, p.active, p.school_id
        ORDER BY p.first_name ASC, p.last_name ASC
      `;
      
      const attendance = await sql`SELECT * FROM attendance ORDER BY date DESC, arrival DESC`;
      const notifications = await sql`SELECT * FROM notifications ORDER BY timestamp DESC LIMIT 200`;
      const audit = await sql`SELECT * FROM audit_logs ORDER BY timestamp DESC LIMIT 200`;
      const marks = await sql`SELECT * FROM marks ORDER BY recorded_at DESC`;

      return {
        schools: toCamel<School[]>(schools),
        users: toCamel<User[]>(users),
        classes: toCamel<ClassRoom[]>(classes),
        parents: toCamel<Parent[]>(parents),
        pupils: toCamel<Pupil[]>(pupils).map(p => ({
          ...p,
          parentIds: p.parentIds || [],
        })),
        attendance: toCamel<Attendance[]>(attendance),
        notifications: toCamel<Notification[]>(notifications),
        audit: toCamel<AuditLog[]>(audit),
        marks: toCamel<Mark[]>(marks),
      };
    } catch (error) {
      console.error("Error in getInitialData server function:", error);
      throw error;
    }
  });

// ----------------------------------------------------
// 2. Authentication Functions
// ----------------------------------------------------
export const loginUser = createServerFn({ method: "POST" })
  .validator((d: { id: string }) => d)
  .handler(async ({ data }) => {
    const { id } = data;
    try {
      const results = await sql`
        SELECT * FROM users 
        WHERE id = ${id}
      `;
      if (results.length === 0) return null;
      const user = toCamel<User>(results[0]);
      if (user.role === "teacher" && user.status !== "verified") return null;
      return user;
    } catch (error) {
      console.error("Error in loginUser:", error);
      throw error;
    }
  });

export const registerUser = createServerFn({ method: "POST" })
  .validator((d: Omit<User, "status" | "registeredAt"> & { schoolId?: string; newSchoolName?: string; status?: "pending" | "verified" | "rejected"; subjects?: string[] }) => d)
  .handler(async ({ data }) => {
    const id = data.id.trim();
    const status = data.status || (data.role === "admin" ? "verified" : "pending");
    const registeredAt = new Date().toISOString().slice(0, 10);
    
    try {
      // Check for existing email
      const emailCheck = await sql`SELECT id FROM users WHERE LOWER(email) = LOWER(${data.email})`;
      if (emailCheck.length > 0) {
        throw new Error("Email already used");
      }
      
      // Check for existing phone if provided
      if (data.phone) {
        const phoneCheck = await sql`SELECT id FROM users WHERE phone = ${data.phone}`;
        if (phoneCheck.length > 0) {
          throw new Error("Phone number already used");
        }
      }
      
      const result = await sql.begin(async (sql) => {
        let finalSchoolId = data.schoolId;
        let newSchool: any = null;

        if (data.schoolId === "new" && data.newSchoolName) {
          const generatedSchoolId = "s-" + Math.random().toString(36).slice(2, 10);
          const dbSchool = toSnake({
            id: generatedSchoolId,
            name: data.newSchoolName,
            registeredAt,
          });
          await sql`INSERT INTO schools ${sql(dbSchool)}`;
          finalSchoolId = generatedSchoolId;
          newSchool = toCamel<School>(dbSchool);
        }

        const dbUser = toSnake({
          id,
          name: data.name,
          email: data.email,
          phone: data.phone,
          role: data.role,
          status,
          registeredAt,
          password: data.password || "admin123",
          schoolId: finalSchoolId || null,
          subjects: data.subjects || null,
        });

        await sql`INSERT INTO users ${sql(dbUser)}`;
        return {
          user: toCamel<User>(dbUser),
          school: newSchool,
        };
      });
      return result;
    } catch (error: any) {
      console.error("Error in registerUser:", error);
      // Return user-friendly error messages
      if (error.message === "Email already used" || error.message === "Phone number already used") {
        throw error;
      }
      // Check for PostgreSQL unique constraint violations
      if (error.code === '23505') {
        if (error.constraint === 'users_email_key' || error.message?.includes('email')) {
          throw new Error("Email already used");
        }
        if (error.constraint === 'users_phone_key' || error.message?.includes('phone')) {
          throw new Error("Phone number already used");
        }
      }
      throw error;
    }
  });

export const approveTeacher = createServerFn({ method: "POST" })
  .validator((d: { id: string; actorId: string; actorName: string }) => d)
  .handler(async ({ data }) => {
    const { id, actorId, actorName } = data;
    const logId = Math.random().toString(36).slice(2, 10);
    
    try {
      await sql.begin(async (sql) => {
        const users = await sql`
          UPDATE users SET status = 'verified' WHERE id = ${id} RETURNING name
        `;
        if (users.length > 0) {
          const teacherName = users[0].name;
          await sql`
            INSERT INTO audit_logs (id, actor_id, actor_name, action, target, timestamp)
            VALUES (${logId}, ${actorId}, ${actorName}, 'Approved teacher', ${teacherName}, CURRENT_TIMESTAMP)
          `;
        }
      });
      return { id };
    } catch (error) {
      console.error("Error in approveTeacher:", error);
      throw error;
    }
  });

export const rejectTeacher = createServerFn({ method: "POST" })
  .validator((d: { id: string; actorId: string; actorName: string }) => d)
  .handler(async ({ data }) => {
    const { id, actorId, actorName } = data;
    const logId = Math.random().toString(36).slice(2, 10);
    
    try {
      await sql.begin(async (sql) => {
        const users = await sql`
          UPDATE users SET status = 'rejected' WHERE id = ${id} RETURNING name
        `;
        if (users.length > 0) {
          const teacherName = users[0].name;
          await sql`
            INSERT INTO audit_logs (id, actor_id, actor_name, action, target, timestamp)
            VALUES (${logId}, ${actorId}, ${actorName}, 'Rejected teacher', ${teacherName}, CURRENT_TIMESTAMP)
          `;
        }
      });
      return { id };
    } catch (error) {
      console.error("Error in rejectTeacher:", error);
      throw error;
    }
  });

// ----------------------------------------------------
// 3. Pupil CRUD Functions
// ----------------------------------------------------
export const addPupil = createServerFn({ method: "POST" })
  .validator((d: { pupil: Omit<Pupil, "id" | "active">; parent: ParentInput; actorId: string; actorName: string }) => d)
  .handler(async ({ data }) => {
    const { pupil, parent, actorId, actorName } = data;

    // Server-side validation: parent info is required
    if (!parent.name || !parent.phone || !parent.email || !parent.relationship) {
      throw new Error("Parent / guardian details are required");
    }

    const id = Math.random().toString(36).slice(2, 10);
    const logId = Math.random().toString(36).slice(2, 10);
    const parentId = Math.random().toString(36).slice(2, 10);

    const dbPupil = toSnake({
      id,
      admissionNo: pupil.admissionNo,
      firstName: pupil.firstName,
      lastName: pupil.lastName,
      gender: pupil.gender,
      dob: pupil.dob,
      classId: pupil.classId,
      photo: pupil.photo,
      active: true,
      schoolId: pupil.schoolId,
    });

    try {
      await sql.begin(async (sql) => {
        await sql`INSERT INTO parents ${sql(toSnake({ id: parentId, ...parent, schoolId: pupil.schoolId }))}`;

        await sql`INSERT INTO pupils ${sql(dbPupil)}`;

        await sql`INSERT INTO pupil_parents ${sql([{ pupil_id: id, parent_id: parentId }], "pupil_id", "parent_id")}`;

        if (pupil.parentIds && pupil.parentIds.length > 0) {
          const rows = pupil.parentIds.map(pid => ({
            pupil_id: id,
            parent_id: pid,
          }));
          await sql`INSERT INTO pupil_parents ${sql(rows, "pupil_id", "parent_id")}`;
        }

        const targetDesc = `${pupil.firstName} ${pupil.lastName} (${pupil.admissionNo})`;
        await sql`
          INSERT INTO audit_logs (id, actor_id, actor_name, action, target, timestamp)
          VALUES (${logId}, ${actorId}, ${actorName}, 'Created pupil', ${targetDesc}, CURRENT_TIMESTAMP)
        `;
      });

      return {
        id,
        ...pupil,
        active: true,
        parentIds: [parentId, ...(pupil.parentIds || [])],
      };
    } catch (error) {
      console.error("Error in addPupil:", error);
      throw error;
    }
  });

export const updatePupil = createServerFn({ method: "POST" })
  .validator((d: { id: string; data: Partial<Pupil> }) => d)
  .handler(async ({ data }) => {
    const { id, data: pupilData } = data;
    
    // Separate parentIds since it's junction table, other fields are in pupils table
    const { parentIds, ...directFields } = pupilData;
    const dbFields = toSnake(directFields);
    
    try {
      await sql.begin(async (sql) => {
        if (Object.keys(dbFields).length > 0) {
          await sql`
            UPDATE pupils SET ${sql(dbFields)} WHERE id = ${id}
          `;
        }
        
        if (parentIds !== undefined) {
          await sql`DELETE FROM pupil_parents WHERE pupil_id = ${id}`;
          if (parentIds.length > 0) {
            const rows = parentIds.map(parentId => ({
              pupil_id: id,
              parent_id: parentId,
            }));
            await sql`INSERT INTO pupil_parents ${sql(rows, "pupil_id", "parent_id")}`;
          }
        }
      });
      return { id, data: pupilData };
    } catch (error) {
      console.error("Error in updatePupil:", error);
      throw error;
    }
  });

export const deactivatePupil = createServerFn({ method: "POST" })
  .validator((d: { id: string }) => d)
  .handler(async ({ data }) => {
    try {
      await sql`
        UPDATE pupils SET active = false WHERE id = ${data.id}
      `;
      return { id: data.id };
    } catch (error) {
      console.error("Error in deactivatePupil:", error);
      throw error;
    }
  });

// ----------------------------------------------------
// 4. Parent Functions
// ----------------------------------------------------
export const addParent = createServerFn({ method: "POST" })
  .validator((d: { parent: Omit<Parent, "id">; actorId: string; actorName: string }) => d)
  .handler(async ({ data }) => {
    const { parent, actorId, actorName } = data;
    const id = Math.random().toString(36).slice(2, 10);
    const logId = Math.random().toString(36).slice(2, 10);
    
    const dbParent = toSnake({
      id,
      ...parent,
    });
    
    try {
      await sql.begin(async (sql) => {
        await sql`INSERT INTO parents ${sql(dbParent)}`;
        await sql`
          INSERT INTO audit_logs (id, actor_id, actor_name, action, target, timestamp)
          VALUES (${logId}, ${actorId}, ${actorName}, 'Registered parent', ${parent.name}, CURRENT_TIMESTAMP)
        `;
      });
      
      return { id, ...parent };
    } catch (error) {
      console.error("Error in addParent:", error);
      throw error;
    }
  });

// ----------------------------------------------------
// 5. Attendance & Notifications Functions
// ----------------------------------------------------
export const markArrival = createServerFn({ method: "POST" })
  .validator((d: { 
    pupilId: string; 
    transportDetails: { 
      transport: string; 
      vehicleReg?: string; 
      personName: string; 
      personRelation: string; 
      phone?: string; 
    }; 
    actorId: string; 
    actorName: string; 
  }) => d)
  .handler(async ({ data }) => {
    const { pupilId, transportDetails, actorId, actorName } = data;
    const date = new Date().toISOString().slice(0, 10);
    const time = new Date().toTimeString().slice(0, 5);
    const attendanceId = Math.random().toString(36).slice(2, 10);
    const logId = Math.random().toString(36).slice(2, 10);
    
    try {
      const result = await sql.begin(async (sql) => {
        // Fetch pupil details
        const pupils = await sql`SELECT first_name, last_name FROM pupils WHERE id = ${pupilId}`;
        if (pupils.length === 0) throw new Error("Pupil not found");
        const pupil = pupils[0];
        
        // Check if attendance already exists for today
        const existing = await sql`SELECT id FROM attendance WHERE pupil_id = ${pupilId} AND date = ${date}`;
        let updatedAtt: any;
        
        if (existing.length > 0) {
          // Update existing
          const rows = await sql`
            UPDATE attendance SET 
              arrival = ${time},
              arrival_transport = ${transportDetails.transport},
              arrival_vehicle_reg = ${transportDetails.vehicleReg || null},
              arrival_person_name = ${transportDetails.personName},
              arrival_person_relation = ${transportDetails.personRelation},
              arrival_phone = ${transportDetails.phone || null}
            WHERE id = ${existing[0].id}
            RETURNING *
          `;
          updatedAtt = rows[0];
        } else {
          // Insert new
          const rows = await sql`
            INSERT INTO attendance (
              id, pupil_id, date, arrival, 
              arrival_transport, arrival_vehicle_reg, arrival_person_name, arrival_person_relation, arrival_phone
            ) VALUES (
              ${attendanceId}, ${pupilId}, ${date}, ${time},
              ${transportDetails.transport}, ${transportDetails.vehicleReg || null}, ${transportDetails.personName}, ${transportDetails.personRelation}, ${transportDetails.phone || null}
            )
            RETURNING *
          `;
          updatedAtt = rows[0];
        }
        
        // Fetch mapped parents to send notifications
        const parents = await sql`
          SELECT p.* FROM parents p
          JOIN pupil_parents pp ON p.id = pp.parent_id
          WHERE pp.pupil_id = ${pupilId}
        `;
        
        const addedNotifications: any[] = [];
        
        for (const parent of parents) {
          const msg = `Dear ${parent.name}, your child ${pupil.first_name} ${pupil.last_name} has arrived safely at school today at ${time}.`;
          const smsId = Math.random().toString(36).slice(2, 10);
          const emailId = Math.random().toString(36).slice(2, 10);
          
          // Insert SMS notification record
          await sql`
            INSERT INTO notifications (id, pupil_id, parent_id, channel, type, status, message, timestamp, phone_number)
            VALUES (${smsId}, ${pupilId}, ${parent.id}, 'sms', 'arrival', 'sent', ${msg}, CURRENT_TIMESTAMP, ${parent.phone})
          `;
          
          // Insert Email notification record
          await sql`
            INSERT INTO notifications (id, pupil_id, parent_id, channel, type, status, message, timestamp, phone_number)
            VALUES (${emailId}, ${pupilId}, ${parent.id}, 'email', 'arrival', 'sent', ${msg}, CURRENT_TIMESTAMP, ${parent.phone})
          `;
          
          addedNotifications.push(
            { id: smsId, pupilId, parentId: parent.id, channel: "sms", type: "arrival", status: "sent", message: msg, timestamp: new Date().toISOString(), phoneNumber: parent.phone },
            { id: emailId, pupilId, parentId: parent.id, channel: "email", type: "arrival", status: "sent", message: msg, timestamp: new Date().toISOString(), phoneNumber: parent.phone }
          );
        }
        
        // Log action
        const targetDesc = `${pupil.first_name} ${pupil.last_name}`;
        await sql`
          INSERT INTO audit_logs (id, actor_id, actor_name, action, target, timestamp)
          VALUES (${logId}, ${actorId}, ${actorName}, 'Marked arrival', ${targetDesc}, CURRENT_TIMESTAMP)
        `;
        
        const addedAudit = {
          id: logId,
          actorId,
          actorName,
          action: "Marked arrival",
          target: targetDesc,
          timestamp: new Date().toISOString(),
        };
        
        return {
          attendance: toCamel<Attendance>(updatedAtt),
          notifications: addedNotifications,
          audit: addedAudit,
        };
      });
      
      return result;
    } catch (error) {
      console.error("Error in markArrival:", error);
      throw error;
    }
  });

export const markDeparture = createServerFn({ method: "POST" })
  .validator((d: { 
    pupilId: string; 
    transportDetails: { 
      transport: string; 
      vehicleReg?: string; 
      personName: string; 
      personRelation: string; 
      phone?: string; 
    }; 
    actorId: string; 
    actorName: string; 
  }) => d)
  .handler(async ({ data }) => {
    const { pupilId, transportDetails, actorId, actorName } = data;
    const date = new Date().toISOString().slice(0, 10);
    const time = new Date().toTimeString().slice(0, 5);
    const attendanceId = Math.random().toString(36).slice(2, 10);
    const logId = Math.random().toString(36).slice(2, 10);
    
    try {
      const result = await sql.begin(async (sql) => {
        // Fetch pupil details
        const pupils = await sql`SELECT first_name, last_name FROM pupils WHERE id = ${pupilId}`;
        if (pupils.length === 0) throw new Error("Pupil not found");
        const pupil = pupils[0];
        
        // Check if attendance already exists for today
        const existing = await sql`SELECT id FROM attendance WHERE pupil_id = ${pupilId} AND date = ${date}`;
        let updatedAtt: any;
        
        if (existing.length > 0) {
          // Update existing
          const rows = await sql`
            UPDATE attendance SET 
              departure = ${time},
              departure_transport = ${transportDetails.transport},
              departure_vehicle_reg = ${transportDetails.vehicleReg || null},
              departure_person_name = ${transportDetails.personName},
              departure_person_relation = ${transportDetails.personRelation},
              departure_phone = ${transportDetails.phone || null}
            WHERE id = ${existing[0].id}
            RETURNING *
          `;
          updatedAtt = rows[0];
        } else {
          // Insert new
          const rows = await sql`
            INSERT INTO attendance (
              id, pupil_id, date, departure, 
              departure_transport, departure_vehicle_reg, departure_person_name, departure_person_relation, departure_phone
            ) VALUES (
              ${attendanceId}, ${pupilId}, ${date}, ${time},
              ${transportDetails.transport}, ${transportDetails.vehicleReg || null}, ${transportDetails.personName}, ${transportDetails.personRelation}, ${transportDetails.phone || null}
            )
            RETURNING *
          `;
          updatedAtt = rows[0];
        }
        
        // Fetch mapped parents to send notifications
        const parents = await sql`
          SELECT p.* FROM parents p
          JOIN pupil_parents pp ON p.id = pp.parent_id
          WHERE pp.pupil_id = ${pupilId}
        `;
        
        const addedNotifications: any[] = [];
        
        for (const parent of parents) {
          const msg = `Dear ${parent.name}, your child ${pupil.first_name} ${pupil.last_name} has left school today at ${time}.`;
          const smsId = Math.random().toString(36).slice(2, 10);
          const emailId = Math.random().toString(36).slice(2, 10);
          
          // Insert SMS notification record
          await sql`
            INSERT INTO notifications (id, pupil_id, parent_id, channel, type, status, message, timestamp, phone_number)
            VALUES (${smsId}, ${pupilId}, ${parent.id}, 'sms', 'departure', 'sent', ${msg}, CURRENT_TIMESTAMP, ${parent.phone})
          `;
          
          // Insert Email notification record
          await sql`
            INSERT INTO notifications (id, pupil_id, parent_id, channel, type, status, message, timestamp, phone_number)
            VALUES (${emailId}, ${pupilId}, ${parent.id}, 'email', 'departure', 'sent', ${msg}, CURRENT_TIMESTAMP, ${parent.phone})
          `;
          
          addedNotifications.push(
            { id: smsId, pupilId, parentId: parent.id, channel: "sms", type: "departure", status: "sent", message: msg, timestamp: new Date().toISOString(), phoneNumber: parent.phone },
            { id: emailId, pupilId, parentId: parent.id, channel: "email", type: "departure", status: "sent", message: msg, timestamp: new Date().toISOString(), phoneNumber: parent.phone }
          );
        }
        
        // Log action
        const targetDesc = `${pupil.first_name} ${pupil.last_name}`;
        await sql`
          INSERT INTO audit_logs (id, actor_id, actor_name, action, target, timestamp)
          VALUES (${logId}, ${actorId}, ${actorName}, 'Marked departure', ${targetDesc}, CURRENT_TIMESTAMP)
        `;
        
        const addedAudit = {
          id: logId,
          actorId,
          actorName,
          action: "Marked departure",
          target: targetDesc,
          timestamp: new Date().toISOString(),
        };
        
        return {
          attendance: toCamel<Attendance>(updatedAtt),
          notifications: addedNotifications,
          audit: addedAudit,
        };
      });
      
      return result;
    } catch (error) {
      console.error("Error in markDeparture:", error);
      throw error;
    }
  });

// ----------------------------------------------------
// 6. Marks Functions
// ----------------------------------------------------
export const addMark = createServerFn({ method: "POST" })
  .validator((d: { mark: Omit<Mark, "id" | "recordedBy" | "recordedAt">; actorId: string }) => d)
  .handler(async ({ data }) => {
    const { mark, actorId } = data;
    const id = Math.random().toString(36).slice(2, 10);
    const recordedAt = new Date().toISOString();
    
    // Authorization check: Verify teacher can add marks for this subject
    const actor = await sql`SELECT role, class_id, subjects FROM users WHERE id = ${actorId}`;
    if (actor.length === 0) {
      throw new Error("Unauthorized: User not found");
    }
    
    const user = toCamel<User>(actor[0]);
    
    // If user is a teacher, verify they're authorized for this subject
    if (user.role === "teacher") {
      // Check if teacher is assigned to the pupil's class
      const pupilCheck = await sql`SELECT class_id FROM pupils WHERE id = ${mark.pupilId}`;
      if (pupilCheck.length === 0) {
        throw new Error("Pupil not found");
      }
      
      const pupilClassId = pupilCheck[0].class_id;
      if (user.classId !== pupilClassId) {
        throw new Error("Unauthorized: You can only add marks for pupils in your assigned class");
      }
      
      // Check if teacher is assigned to this subject
      if (!user.subjects || !user.subjects.includes(mark.subject)) {
        throw new Error(`Unauthorized: You are not assigned to teach ${mark.subject}`);
      }
    }
    
    // Calculate grade based on score percentage
    const percentage = (mark.score / mark.maxScore) * 100;
    let grade = "E";
    if (percentage >= 90) grade = "A";
    else if (percentage >= 80) grade = "B";
    else if (percentage >= 70) grade = "C";
    else if (percentage >= 60) grade = "D";
    
    const dbMark = toSnake({
      id,
      ...mark,
      grade,
      recordedBy: actorId,
      recordedAt,
    });
    
    try {
      await sql`
        INSERT INTO marks ${sql(dbMark)}
      `;
      return toCamel<Mark>(dbMark);
    } catch (error) {
      console.error("Error in addMark:", error);
      throw error;
    }
  });

export const updateMark = createServerFn({ method: "POST" })
  .validator((d: { id: string; data: Partial<Omit<Mark, "id" | "recordedBy" | "recordedAt">>; actorId?: string }) => d)
  .handler(async ({ data }) => {
    const { id, data: markData, actorId } = data;
    
    // Authorization check if actorId is provided
    if (actorId) {
      const actor = await sql`SELECT role, class_id, subjects FROM users WHERE id = ${actorId}`;
      if (actor.length === 0) {
        throw new Error("Unauthorized: User not found");
      }
      
      const user = toCamel<User>(actor[0]);
      
      // If user is a teacher, verify they're authorized for this mark's subject
      if (user.role === "teacher") {
        // Get the mark's current subject and pupil
        const existingMark = await sql`
          SELECT m.subject, m.pupil_id, p.class_id 
          FROM marks m
          JOIN pupils p ON p.id = m.pupil_id
          WHERE m.id = ${id}
        `;
        
        if (existingMark.length === 0) {
          throw new Error("Mark not found");
        }
        
        const mark = existingMark[0];
        const pupilClassId = mark.class_id;
        const markSubject = mark.subject;
        
        // Check class assignment
        if (user.classId !== pupilClassId) {
          throw new Error("Unauthorized: You can only update marks for pupils in your assigned class");
        }
        
        // Check subject assignment - verify against current subject or new subject if being updated
        const subjectToCheck = markData.subject || markSubject;
        if (!user.subjects || !user.subjects.includes(subjectToCheck)) {
          throw new Error(`Unauthorized: You are not assigned to teach ${subjectToCheck}`);
        }
      }
    }
    
    // If score or maxScore changed, recalculate grade
    let grade: string | undefined = undefined;
    if (markData.score !== undefined || markData.maxScore !== undefined) {
      // Need to load the existing mark details to calculate grade properly if one is missing
      const existing = await sql`SELECT score, max_score FROM marks WHERE id = ${id}`;
      if (existing.length > 0) {
        const score = markData.score !== undefined ? markData.score : Number(existing[0].score);
        const maxScore = markData.maxScore !== undefined ? markData.maxScore : Number(existing[0].max_score);
        const percentage = (score / maxScore) * 100;
        grade = "E";
        if (percentage >= 90) grade = "A";
        else if (percentage >= 80) grade = "B";
        else if (percentage >= 70) grade = "C";
        else if (percentage >= 60) grade = "D";
      }
    }
    
    const dbFields = toSnake({
      ...markData,
      ...(grade !== undefined ? { grade } : {}),
    });
    
    try {
      await sql`
        UPDATE marks SET ${sql(dbFields)} WHERE id = ${id}
      `;
      return { id, data: { ...markData, ...(grade !== undefined ? { grade } : {}) } };
    } catch (error) {
      console.error("Error in updateMark:", error);
      throw error;
    }
  });

export const deleteMark = createServerFn({ method: "POST" })
  .validator((d: { id: string }) => d)
  .handler(async ({ data }) => {
    try {
      await sql`
        DELETE FROM marks WHERE id = ${data.id}
      `;
      return { id: data.id };
    } catch (error) {
      console.error("Error in deleteMark:", error);
      throw error;
    }
  });

// ----------------------------------------------------
// 7. School Management Functions
// ----------------------------------------------------
export const addSchool = createServerFn({ method: "POST" })
  .validator((d: { name: string; address?: string; phone?: string; email?: string }) => d)
  .handler(async ({ data }) => {
    const id = "s-" + Math.random().toString(36).slice(2, 10);
    const registeredAt = new Date().toISOString().slice(0, 10);
    const dbSchool = toSnake({
      id,
      ...data,
      registeredAt,
    });
    try {
      await sql`INSERT INTO schools ${sql(dbSchool)}`;
      return toCamel<School>(dbSchool);
    } catch (error) {
      console.error("Error in addSchool:", error);
      throw error;
    }
  });

export const updateSchool = createServerFn({ method: "POST" })
  .validator((d: { id: string; data: Partial<Omit<School, "id" | "registeredAt">> }) => d)
  .handler(async ({ data }) => {
    const { id, data: schoolData } = data;
    const dbFields = toSnake(schoolData);
    try {
      await sql`UPDATE schools SET ${sql(dbFields)} WHERE id = ${id}`;
      return { id, data: schoolData };
    } catch (error) {
      console.error("Error in updateSchool:", error);
      throw error;
    }
  });

export const deleteSchool = createServerFn({ method: "POST" })
  .validator((d: { id: string }) => d)
  .handler(async ({ data }) => {
    try {
      await sql`DELETE FROM schools WHERE id = ${data.id}`;
      return { id: data.id };
    } catch (error) {
      console.error("Error in deleteSchool:", error);
      throw error;
    }
  });

// ----------------------------------------------------
// 8. Class Management Functions
// ----------------------------------------------------
export const addClass = createServerFn({ method: "POST" })
  .validator((d: { id?: string; name: string; schoolId: string; teacherId?: string }) => d)
  .handler(async ({ data }) => {
    const id = data.id || "c-" + Math.random().toString(36).slice(2, 10);
    const dbClass = toSnake({
      id,
      name: data.name,
      schoolId: data.schoolId,
      teacherId: data.teacherId || null,
    });
    try {
      await sql.begin(async (sql) => {
        await sql`INSERT INTO classes ${sql(dbClass)}`;
        if (data.teacherId) {
          await sql`UPDATE users SET class_id = ${id} WHERE id = ${data.teacherId}`;
        }
      });
      return toCamel<ClassRoom>(dbClass);
    } catch (error) {
      console.error("Error in addClass:", error);
      throw error;
    }
  });

export const updateClass = createServerFn({ method: "POST" })
  .validator((d: { id: string; data: Partial<Omit<ClassRoom, "id">> }) => d)
  .handler(async ({ data }) => {
    const { id, data: classData } = data;
    const dbFields = toSnake(classData);
    try {
      await sql.begin(async (sql) => {
        if (Object.keys(dbFields).length > 0) {
          await sql`UPDATE classes SET ${sql(dbFields)} WHERE id = ${id}`;
        }
        if (classData.teacherId !== undefined) {
          // Reset previous teacher for this class
          await sql`UPDATE users SET class_id = NULL WHERE class_id = ${id}`;
          if (classData.teacherId) {
            await sql`UPDATE users SET class_id = ${id} WHERE id = ${classData.teacherId}`;
          }
        }
      });
      return { id, data: classData };
    } catch (error) {
      console.error("Error in updateClass:", error);
      throw error;
    }
  });

export const deleteClass = createServerFn({ method: "POST" })
  .validator((d: { id: string }) => d)
  .handler(async ({ data }) => {
    try {
      await sql.begin(async (sql) => {
        await sql`UPDATE users SET class_id = NULL WHERE class_id = ${data.id}`;
        await sql`DELETE FROM classes WHERE id = ${data.id}`;
      });
      return { id: data.id };
    } catch (error) {
      console.error("Error in deleteClass:", error);
      throw error;
    }
  });

// ----------------------------------------------------
// 9. User Management Functions
// ----------------------------------------------------
export const deleteUser = createServerFn({ method: "POST" })
  .validator((d: { id: string; actorId: string; actorName: string }) => d)
  .handler(async ({ data }) => {
    const { id, actorId, actorName } = data;
    const logId = Math.random().toString(36).slice(2, 10);
    
    try {
      await sql.begin(async (sql) => {
        // Get user details before deletion for audit log
        const users = await sql`
          SELECT name, role FROM users WHERE id = ${id}
        `;
        
        if (users.length === 0) {
          throw new Error("User not found");
        }
        
        const deletedUser = users[0];
        
        // Prevent super admins from deleting themselves
        if (id === actorId) {
          throw new Error("You cannot delete your own account");
        }
        
        // Only super_admin can delete other admins
        const actor = await sql`SELECT role FROM users WHERE id = ${actorId}`;
        if (actor.length === 0 || actor[0].role !== 'super_admin') {
          if (deletedUser.role === 'super_admin' || deletedUser.role === 'admin') {
            throw new Error("Unauthorized: Only super admins can delete admin accounts");
          }
        }
        
        // Delete user
        await sql`DELETE FROM users WHERE id = ${id}`;
        
        // Log the deletion
        await sql`
          INSERT INTO audit_logs (id, actor_id, actor_name, action, target, timestamp)
          VALUES (${logId}, ${actorId}, ${actorName}, 'Deleted user', ${deletedUser.name + ' (' + deletedUser.role + ')'}, CURRENT_TIMESTAMP)
        `;
      });
      
      return { id };
    } catch (error) {
      console.error("Error in deleteUser:", error);
      throw error;
    }
  });
