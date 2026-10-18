---
title: "Attribute Based Access Control(ABAC) Pattern"
termSlug: "attribute-based-access-control-abac-pattern"
year: 2026
month: 7
monthName: "July"
day: 22
order: 15
source: "2026/july-term.md"
sourceUrl: "https://github.com/swegrowthid/daily-term-SE-Growth/blob/main/2026/july-term.md"
excerpt: "Attribute-Based Access Control (ABAC) is an authorization model that grants or denies access based on attributes of the user, the resource, the action, and the environment — evaluated against a set..."
---
### Definition:

Attribute-Based Access Control (ABAC) is an authorization model that grants or denies access based on attributes of the user, the resource, the action, and the environment — evaluated against a set of policies written as rules. Instead of asking "who is this user?" (RBAC) or "what list is this user on?" (ACL), ABAC asks "does the full context of this request match the policy?"

ABAC evaluates multiple attributes simultaneously to make a decision:
```text
WHAT ABAC EVALUATES:
═══════════════════════════════════════════════════════════════

  ACCESS REQUEST: "Can Alice view the document 'Q4 Budget'?"

  ┌─────────────────────────────────────────────────────────┐
  │                                                         │
  │  SUBJECT ATTRIBUTES          RESOURCE ATTRIBUTES        │
  │  (Who is asking)             (What are they asking for) │
  │  ┌──────────────────┐        ┌──────────────────────┐   │
  │  │ Alice             │        │ document: Q4 Budget  │   │
  │  │ department:       │        │ classification:     │   │
  │  │   Finance         │        │   "confidential"    │   │
  │  │ role: Analyst     │        │ owner: "Bob"        │   │
  │  │ clearance: Level 3│        │ project: "Q4-Plan"  │   │
  │  │ location: NYC     │        │ created: 2026-06-01 │   │
  │  └──────────────────┘        └──────────────────────┘   │
  │                                                         │
  │  ACTION ATTRIBUTES            ENVIRONMENT ATTRIBUTES    │
  │  (What do they want to do)    (What is the context)     │
  │  ┌──────────────────┐        ┌──────────────────────┐   │
  │  │ action: "VIEW"   │        │ time: 2:30 PM        │   │
  │  │ method: "read"   │        │ day: Tuesday          │   │
  │  │ via: "web-app"   │        │ ip_range: corp-vpn   │   │
  │  │                   │        │ threat_level: normal │   │
  │  └──────────────────┘        └──────────────────────┘   │
  │                                                         │
  └─────────────────────────────────────────────────────────┘
                              │
                              ▼
              ┌──────────────────────────────────┐
              │  POLICY EVALUATION ENGINE         │
              │  ─────────────────────             │
              │                                    │
              │  Policy: "Finance team members    │
              │  can VIEW confidential documents  │
              │  during business hours from the   │
                            │  corporate VPN."                   │
                            │                                    │
                            │  Alice is Finance        ✅        │
                            │  Action is VIEW          ✅        │
                            │  Doc is confidential     ✅        │
                            │  Time is business hours  ✅        │
                            │  IP is corp VPN          ✅        │
                            │                                    │
                            │  → ALLOW ✅                        │
                            └──────────────────────────────────┘
```

### Example:

A visual flow of how ABAC handles a real-world scenario that would be impossible to express with roles alone.

A healthcare system. A doctor (Alice) needs to access a patient's medical record. The system has complex policies:

- Doctors can read records of patients they are actively treating (4/12)
- Emergency room doctors can read ANY record during an emergency
- No one can access records from outside the hospital network (VPN required)
- Access to mental health records requires additional clearance
- Auditors can view access logs but not the records themselves
- All access is logged regardless of allow/deny
```text
═══════════════════════════════════════════════════════════════
  THREE ACCESS REQUESTS — THREE DIFFERENT OUTCOMES
═══════════════════════════════════════════════════════════════

  REQUEST A: Alice (normal doctor) tries to read Patient X's
            standard medical record during office hours.

  ┌─────────────────────────────────────────────────────────┐
  │                                                         │
  │  SUBJECT ATTRIBUTES:    RESOURCE ATTRIBUTES:            │
  │  • name: Dr. Alice      • type: medical_record          │
  │  • role: physician       • patient: Patient X           │
  │  • specialty: cardiology • classification: standard     │
  │  • patients: [X, Y, Z]  • dept: general_medicine        │
  │  • dept: cardiology                                     │
  │                          ENVIRONMENT:                   │
  │  ACTION:                 • time: Mon 10:30 AM           │
  │  • action: "READ"        • location: hospital_network   │
  │                          • emergency_active: false      │
  │                          • audit_log: maintained        │
  └─────────────────────────────────────────────────────────┘
                              │
                              ▼
              ┌──────────────────────────────────────────────┐
              │                                              │
              │  POLICY EVALUATION:                           │
              │                                              │
              │  P1: doctor CAN read patient IF              │
              │      patient IN doctor.patients              │
│      → Patient X IS in Alice's patients ✅   │
              │                                              │
              │  P2: access ALLOWED IF                        │
              │      location = hospital_network             │
              │      → Alice IS on hospital network ✅        │
              │                                              │
              │  P3: ALL access MUST be logged               │
              │      → Audit log entry created ✅             │
              │                                              │
              │  RESULT: ✅ ALLOWED                           │
              │                                              │
              └──────────────────────────────────────────────┘
═══════════════════════════════════════════════════════════════

  REQUEST B: Alice tries to read Patient Z's MENTAL HEALTH
             record (Alice treats Patient Z, but the record
             has extra restrictions).

  ┌─────────────────────────────────────────────────────────┐
  │                                                         │
  │  SUBJECT ATTRIBUTES:    RESOURCE ATTRIBUTES:            │
  │  • name: Dr. Alice      • type: medical_record          │
  │  • role: physician       • patient: Patient Z           │
  │  • specialty: cardiology • classification: MENTAL HEALTH│
  │  • patients: [X, Y, Z]  • dept: psychiatry              │
  │  • has_mental_health                                     │
  │    clearance: false     ENVIRONMENT:                    │
  │                         • time: Mon 10:30 AM            │
  │  ACTION:                 • location: hospital_network    │
  │  • action: "READ"        • emergency_active: false       │
  │                         • audit_log: maintained         │
  └─────────────────────────────────────────────────────────┘
                              │
                              ▼
              ┌──────────────────────────────────────────────┐
│                                              │
              │  POLICY EVALUATION:                           │
              │                                              │
              │  P1: doctor CAN read patient IF              │
              │      patient IN doctor.patients              │
              │      → Patient Z IS in Alice's patients ✅   │
              │                                              │
              │  P2: CAN read resource IF                     │
              │      resource.classification != "MENTAL      │
              │      HEALTH" OR                             │
              │      subject.has_mental_health_clearance     │
              │      = true                                  │
              │      → Resource IS "MENTAL HEALTH" ❌         │
              │      → Alice does NOT have clearance ❌      │
              │                                              │
              │  P3: emergency override?                      │
              │      emergency_active = false → no ❌        │
              │                                              │
              │  RESULT: ❌ DENIED                            │
              │  Reason: Mental health records require       │
              │           additional clearance.              │
              │                                              │
              └──────────────────────────────────────────────┘
═══════════════════════════════════════════════════════════════

  REQUEST C: Emergency! An unidentified critical patient
             arrives. Dr. Chen (ER doctor) needs to read
             ANY available record to check medical history.

  ┌─────────────────────────────────────────────────────────┐
  │                                                         │
  │  SUBJECT ATTRIBUTES:    RESOURCE ATTRIBUTES:            │
  │  • name: Dr. Chen       • type: medical_record          │
│  • role: ER_physician   • unknown patient               │
  │  • department: emergency • classification: ANY           │
  │  • has_emergency_flag:                                  │
  │    true                  ENVIRONMENT:                   │
  │                         • time: 3:00 AM                 │
  │  ACTION:                 • location: hospital_network    │
  │  • action: "READ"        • emergency_active: TRUE       │
  │                          • emergency_id: E-2026-07-22   │
  │                          • audit_log: maintained        │
  └─────────────────────────────────────────────────────────┘
                              │
                              ▼
              ┌──────────────────────────────────────────────┐
  │                                              │
  │  POLICY EVALUATION:                           │
  │                                              │
  │  P1: doctor CAN read patient IF               │
  │      patient IN doctor.patients               │
  │      → Unknown patient, not in list ❌         │
  │      (Normally this would DENY)               │
  │                                              │
  │  P3: OVERRIDE — emergency access IF           │
  │      subject.role = "ER_physician"           │
  │      AND subject.has_emergency_flag = true    │
  │      AND environment.emergency_active = true  │
  │      → Dr. Chen IS ER physician ✅            │
  │      → Emergency flag IS active ✅            │
  │      → Environment emergency IS active ✅     │
  │      → EMERGENCY OVERRIDE GRANTED ✅          │
  │                                              │
  │  P4: Emergency access MUST be logged with:    │
  │      • emergency_id: E-2026-07-22             │
  │      • reason: "unidentified critical patient"│
  │      • time-limited: expires in 4 hours       │
  │      • requires review within 24 hours        │
  │      → Special audit entry created ✅         │
  │                                              │
    │  RESULT: ✅ ALLOWED (emergency override)      │
    │          Access automatically expires         │
    │          at 7:00 AM unless renewed.           │
    │                                              │
    └──────────────────────────────────────────────────────────┘
```
