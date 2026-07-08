# Teacher Subject Access Control Flow

## Visual Flow Diagram

```
┌─────────────────────────────────────────────────────────────┐
│                    TEACHER LOGIN                             │
│  Teacher: "Math Teacher"                                     │
│  Assigned Class: "Grade 1"                                   │
│  Assigned Subjects: ["Math", "Science"]                      │
└─────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────┐
│                   MARKS PAGE (UI LAYER)                      │
│  ✓ Subject dropdown shows: Math, Science                    │
│  ✗ Subject dropdown hides: Reading, Writing, Art, etc.      │
│  ✓ Can select only Grade 1 pupils                           │
└─────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────┐
│              TEACHER ATTEMPTS TO ADD MARK                    │
│  Pupil: "John Doe" (Grade 1)                                │
│  Subject: "Math"                                             │
│  Score: 85/100                                               │
└─────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────┐
│           APPLICATION LAYER (Server Function)                │
│  ✓ Check 1: Is pupil in teacher's class? (Grade 1) → YES   │
│  ✓ Check 2: Is Math in teacher's subjects? → YES           │
│  → Proceed to database                                       │
└─────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────┐
│            DATABASE LAYER (RLS Policy)                       │
│  ✓ Policy Check 1: Teacher's class_id = pupil's class_id   │
│  ✓ Policy Check 2: "Math" = ANY(teacher's subjects array)  │
│  → INSERT allowed                                            │
└─────────────────────────────────────────────────────────────┘
                            ↓
                      ✓ SUCCESS!


## Unauthorized Attempt Flow

```

┌─────────────────────────────────────────────────────────────┐
│ TEACHER LOGIN │
│ Teacher: "Math Teacher" │
│ Assigned Class: "Grade 1" │
│ Assigned Subjects: ["Math", "Science"] │
└─────────────────────────────────────────────────────────────┘
↓
┌─────────────────────────────────────────────────────────────┐
│ ATTACKER BYPASSES UI (e.g., API call) │
│ Direct API call to add mark for: │
│ Pupil: "John Doe" (Grade 1) │
│ Subject: "Reading" ← NOT ASSIGNED │
└─────────────────────────────────────────────────────────────┘
↓
┌─────────────────────────────────────────────────────────────┐
│ APPLICATION LAYER (Server Function) │
│ ✓ Check 1: Is pupil in teacher's class? → YES │
│ ✗ Check 2: Is Reading in teacher's subjects? → NO │
│ → Error: "You are not assigned to teach Reading" │
│ → BLOCKED at application layer │
└─────────────────────────────────────────────────────────────┘
↓
✗ REQUEST REJECTED

## Even if Application Layer is Compromised

```
┌─────────────────────────────────────────────────────────────┐
│       ATTACKER BYPASSES APPLICATION (Direct SQL)             │
│  Attacker somehow executes SQL directly or application       │
│  validation is disabled/bypassed                             │
└─────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────┐
│            DATABASE LAYER (RLS Policy)                       │
│  Query: INSERT INTO marks (..., subject='Reading', ...)     │
│  ✓ Policy Check 1: Teacher's class_id = pupil's class_id   │
│  ✗ Policy Check 2: "Reading" = ANY(teacher's subjects)     │
│  → PostgreSQL blocks the INSERT                              │
│  → Error: row-level security policy violation               │
└─────────────────────────────────────────────────────────────┘
                            ↓
                  ✗ DATABASE REJECTS


## Admin Flow (No Restrictions)

```

┌─────────────────────────────────────────────────────────────┐
│ ADMIN LOGIN │
│ Role: "admin" │
│ School: "Little Stars Kindergarten" │
└─────────────────────────────────────────────────────────────┘
↓
┌─────────────────────────────────────────────────────────────┐
│ MARKS PAGE (UI LAYER) │
│ ✓ Subject dropdown shows: ALL SUBJECTS │
│ ✓ Can select pupils from ALL CLASSES in their school │
└─────────────────────────────────────────────────────────────┘
↓
┌─────────────────────────────────────────────────────────────┐
│ APPLICATION LAYER (Server Function) │
│ ✓ Check: Is user admin or deputy? → YES │
│ → Skip subject validation │
│ → Proceed to database │
└─────────────────────────────────────────────────────────────┘
↓
┌─────────────────────────────────────────────────────────────┐
│ DATABASE LAYER (RLS Policy) │
│ ✓ Policy Check: Is user admin/deputy? → YES │
│ → INSERT allowed for any subject │
└─────────────────────────────────────────────────────────────┘
↓
✓ SUCCESS!

## Key Points

### Defense in Depth

The system uses **three independent security layers**:

1. UI prevents accidental violations
2. Application layer provides clear feedback
3. Database enforces final authority

### Role-Based Access

```
Super Admin:  Can access ALL schools, classes, subjects
Admin:        Can access their school's classes and ALL subjects
Deputy:       Can access their school's classes and ALL subjects
Teacher:      Can access ONLY their class and ASSIGNED subjects
```

### Subject Assignment Examples

**Example 1: Specialized Teacher**

```
Teacher: Sarah Johnson
Subjects: ["Math", "Science"]
Can Access: Math marks, Science marks
Cannot Access: Reading, Writing, Art, Music, PE
```

**Example 2: Substitute Teacher**

```
Teacher: John Smith
Subjects: ["Reading", "Math", "Writing", "Art", "Music", "Physical Education", "Science"]
Can Access: All subject marks
```

**Example 3: Reading Specialist**

```
Teacher: Emily Brown
Subjects: ["Reading", "Writing"]
Can Access: Reading marks, Writing marks
Cannot Access: Math, Science, Art, Music, PE
```

### Security Guarantees

✓ **Teacher cannot add marks** for subjects they're not assigned to
✓ **Teacher cannot view marks** for subjects they're not assigned to
✓ **Teacher cannot edit marks** for subjects they're not assigned to
✓ **Restrictions enforced** even if UI is bypassed
✓ **Restrictions enforced** even if application code is compromised
✓ **PostgreSQL RLS** provides final line of defense

### Error Handling

**Clear error messages** guide users:

```
❌ "Unauthorized: You are not assigned to teach Reading"
❌ "Unauthorized: You can only add marks for pupils in your assigned class"
❌ "Mark not found" (if trying to access another teacher's subject marks)
```

### Performance Impact

⚡ **Minimal overhead**:

- UI filtering: O(n) where n = number of subjects (7 subjects max)
- Server validation: 2 database queries (user lookup + pupil lookup)
- RLS policy: Single index lookup with array containment check
- Overall: ~10-20ms additional latency per request
