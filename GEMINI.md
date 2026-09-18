# GEMINI.md — LMS Engineering Rules

You are building a production-quality Learning Management System (LMS).

These rules are mandatory. Follow them for EVERY coding task in this project.

---

# 1. CORE PRINCIPLE

Build a SIMPLE, CLEAN, PRODUCTION-READY application.

Do NOT create "AI slop".

AI slop means:
- unnecessary features
- unnecessary abstractions
- duplicate components
- random libraries
- fake functionality
- placeholder functionality presented as finished
- excessive animations
- inconsistent UI
- huge files
- repetitive code
- over-engineered architecture
- unnecessary APIs
- unnecessary backend services
- code that works but is difficult to maintain

Prefer:
- simple
- predictable
- readable
- maintainable
- secure
- modular
- scalable when actually needed

When two approaches work, always choose the simpler one.

---

# 2. TECHNOLOGY STACK

Use ONLY the following core stack unless there is a strong technical reason otherwise:

Frontend / Application:
- Next.js
- TypeScript
- React
- Tailwind CSS

Backend services:
- Supabase

Database:
- Supabase PostgreSQL

Authentication:
- Supabase Auth
- Email + password ONLY

File storage:
- Supabase Storage initially

Do NOT introduce:
- MongoDB
- Prisma
- Firebase
- Express
- NestJS
- separate Node.js backend
- Redis
- Docker
- microservices
- GraphQL
- unnecessary third-party backend services

unless explicitly requested.

---

# 3. ARCHITECTURE

Use a modular monolith.

The application should remain ONE Next.js project.

Do NOT create microservices.

Use clear separation between:
- UI components
- pages/routes
- business logic
- database access
- authentication
- validation
- utilities

Recommended conceptual structure:

```
app/
components/
lib/
  supabase/
  auth/
  database/
  validations/
  utilities/
types/
hooks/
```

Keep the structure understandable.

Do not create folders simply to make the project look "professional".

---

# 4. NEXT.JS

Use the Next.js App Router.

The application should feel like a modern SPA:
- fast navigation
- client-side transitions where appropriate
- persistent application shell
- minimal unnecessary page reloads
- responsive UI

BUT:

Do not turn everything into a Client Component.

Use Server Components by default.

Use Client Components only when interactivity/state/browser APIs require them.

---

# 5. SUPABASE

Supabase is the backend service.

Use it for:
- authentication
- PostgreSQL database
- file storage
- Row Level Security (RLS)

Never expose sensitive Supabase credentials in client-side code.

Never expose service-role credentials to the browser.

Use environment variables correctly.

---

# 6. DATABASE RULES

Design the database BEFORE implementing complex features.

Use PostgreSQL relational design properly.

Important entities will include concepts such as:
- organizations
- users/profiles
- roles
- schools
- courses
- course sections/modules
- lessons
- lesson content
- enrollments/assignments
- progress
- quizzes
- quiz questions
- quiz attempts
- certificates
- notifications

Do NOT create all tables blindly.

Before creating a table:
1. Explain why it is required.
2. Explain its relationships.
3. Check whether an existing table can handle the requirement.

Avoid duplicated data.

Use foreign keys and appropriate indexes.

Use timestamps consistently.

---

# 7. MULTI-TENANCY

The LMS must be designed so that different organizations/clients can be isolated.

A user must NEVER be able to access another organization's private data.

Use Supabase Row Level Security.

Security must NOT depend only on frontend checks.

Frontend checks are for UX.

Database RLS is the actual security boundary.

Every new table containing organization-specific data must be reviewed for RLS requirements.

---

# 8. USER ROLES

The system should support role-based access.

Initial roles:
- Super Admin
- Organization Admin
- Manager
- Instructor/Employee
- Learner

Do not create additional roles unless required.

Permissions must be explicit.

Never assume that hiding a button means the user lacks permission.

The server/database must enforce permissions.

---

# 9. ADMIN PANEL

The admin panel is a FIRST-CLASS part of the application.

Admins should eventually be able to manage:
- employees/users
- schools
- courses
- course content
- lessons
- assignments
- enrollments
- progress
- quizzes
- certificates
- notifications
- reports

Example:

Employee A
→ assigned to School A
→ assigned Course 1

Employee B
→ assigned to School B
→ assigned Course 2

One employee may work with multiple schools.

One school may have multiple employees.

One course may be assigned to many employees.

Do not hard-code these relationships.

Use database relationships.

---

# 10. LMS CONTENT

Courses may contain:

Course
→ Modules/Sections
→ Lessons
→ Content

Lessons may contain:
- text
- images
- PDFs
- videos
- links
- quizzes

Do not store large video/PDF binary data directly inside PostgreSQL.

Store files in Supabase Storage.

Store only metadata and storage references in PostgreSQL.

---

# 11. VIDEO

Do NOT build a custom video streaming infrastructure.

For the initial version:
- use Supabase Storage for smaller/simple video requirements
- keep the video layer abstract enough that a dedicated video provider can be added later

Do not add a video SaaS provider unless actually required.

---

# 12. AUTHENTICATION

ONLY:
- Email
- Password

Do NOT implement:
- Google Login
- Microsoft Login
- Facebook Login
- OTP
- social authentication

unless explicitly requested later.

Include:
- login
- logout
- signup/invite flow as required
- password reset
- session handling
- protected routes

---

# 13. UI RULES

The supplied LMS screenshots are VISUAL/UX REFERENCES.

Use them to understand:
- information hierarchy
- navigation
- spacing
- layouts
- cards
- tabs
- dashboards
- interaction patterns

DO NOT copy:
- logos
- branding
- proprietary illustrations
- exact brand identity
- copyrighted assets

MANDATORY BRANDING & NAMING ENFORCEMENT:
- The project brand name is strictly **"TwoStep Forward"**.
- NEVER use the names **"ENpower"** or **"Zoho"** anywhere in the application, source code, UI text, mock/seed data, course titles, sample data, documentation, or filenames.
- Any reference screenshots that depict third-party brand names or course titles are purely UX/layout reference. Replace all references with **TwoStep Forward** and neutral, original content.

Create an ORIGINAL visual identity.

The two future branded LMS versions should use the same underlying application but allow branding differences such as:
- name
- logo
- colors
- favicon
- selected UI styling

Keep branding configurable rather than duplicating the entire codebase.

---

# 14. UI QUALITY

Every screen must be:
- responsive
- clean
- consistent
- accessible
- usable on desktop and tablet
- reasonably usable on mobile

Maintain consistent:
- spacing
- typography
- border radius
- buttons
- cards
- forms
- tables
- icons
- colors

Do NOT randomly change the design between screens.

Create reusable components when repetition actually exists.

---

# UI QUALITY GATE

Never consider a UI task complete simply because the page renders.

Before declaring completion, visually compare the implementation against the supplied reference screenshots.

Reject the implementation if it looks like:
- generic AI dashboard
- template UI
- excessive dark cards
- oversized components
- excessive gradients
- excessive rounded corners
- excessive whitespace
- random icons
- inconsistent typography
- placeholder-looking content

The UI must look intentionally designed, not merely functional.

When visual quality is poor, revise the UI before moving to the next feature.

---

# 15. NO UNNECESSARY LIBRARIES

Before adding a dependency ask:

"Can this be implemented cleanly using the existing stack?"

If YES:
Do not install another package.

Do not install libraries just because they are popular.

Every dependency should have a clear purpose.

---

# 16. TYPESCRIPT

Use strict TypeScript.

Avoid:
- `any`
- unnecessary type casting
- ignored TypeScript errors
- `@ts-ignore`
- `@ts-expect-error`

unless there is a documented technical reason.

Define proper types for database entities and API/business logic.

---

# 17. VALIDATION

Validate user input.

Never trust:
- form input
- URL parameters
- query parameters
- client-side state
- browser requests

Use server-side validation.

Never rely only on frontend validation.

---

# 18. ERROR HANDLING

Never silently swallow errors.

Do NOT write code like:

```typescript
try {
   ...
} catch {
   // ignore
}
```

Errors should be:
- handled
- logged appropriately
- shown to the user when relevant

User-facing errors should be understandable.

Never expose sensitive internal errors to users.

---

# 19. LOADING / EMPTY / ERROR STATES

Every important data-driven screen should consider:
1. Loading state
2. Empty state
3. Error state
4. Success state

Do not leave blank white screens when data is unavailable.

Do not fill the application with fake data just to make screens look populated.

Use clearly marked seed/demo data only when explicitly requested.

---

# 20. NO FAKE FUNCTIONALITY

Never create a button that looks functional but does nothing.

If functionality is not implemented:
- either implement it
- or clearly mark it as unavailable/not implemented

Do not pretend a feature works.

---

# 21. FORMS

Forms must have:
- labels
- validation
- useful error messages
- loading state
- success feedback
- disabled state while submitting where appropriate

Do not submit the same request multiple times accidentally.

---

# 22. PERFORMANCE

Do not optimize prematurely.

But avoid obvious problems:
- unnecessary database queries
- fetching entire tables
- loading huge files unnecessarily
- unnecessary client components
- unnecessary re-renders
- enormous images
- fetching data repeatedly

Use pagination for potentially large datasets.

Use indexes where query patterns justify them.

---

# 23. SECURITY

Security is mandatory.

Never:
- expose service role keys
- trust client-side permissions
- bypass RLS
- expose private files publicly without a reason
- put secrets in source code
- store passwords yourself
- build custom authentication when Supabase Auth handles it

Think about authorization for EVERY protected operation.

---

# 24. CODE SIZE

Avoid giant files.

If a component becomes difficult to understand, split it logically.

But DO NOT split every 10 lines into a separate component.

Abstraction must solve a real problem.

---

# 25. REUSE

Before creating a new component, check whether an existing component can be reused.

Before creating a new utility, check whether an existing utility already solves the problem.

Do not create:

`Button1`, `Button2`, `Button3`, `Button4`

when one configurable Button component is sufficient.

---

# 26. NO PREMATURE FEATURES

Do NOT automatically add:
- AI assistant
- chat
- gamification
- leaderboards
- payment systems
- advanced analytics
- live classes
- calendar
- video conferencing
- social login
- complex notification systems

unless explicitly requested.

Build the actual LMS first.

---

# 27. DEVELOPMENT PROCESS

NEVER generate the entire application in one giant operation.

Build in phases.

Recommended sequence:

- **PHASE 1**: Project setup (Next.js, TypeScript, Tailwind, Supabase connection, environment configuration)
- **PHASE 2**: Authentication (login, signup/invite, logout, password reset, protected routes)
- **PHASE 3**: Application shell (navigation, header, profile, notifications, responsive layout)
- **PHASE 4**: Database foundation (organizations, users, roles, schools, courses)
- **PHASE 5**: Admin panel (user management, school management, course management, assignments)
- **PHASE 6**: Learner LMS (course list, course details, modules, lessons, video/PDF/text content, progress tracking)
- **PHASE 7**: Assessments (quizzes, attempts, scoring)
- **PHASE 8**: Reports (learner progress, course progress, school reports, admin reports)
- **PHASE 9**: Certificates (completion rules, certificate generation, certificate access)
- **PHASE 10**: Polish (responsive improvements, accessibility, performance, security review, error handling, testing)

---

# 28. BEFORE CODING

For any major feature:

FIRST explain:
1. What we are building
2. Why it is needed
3. Database changes
4. Security/RLS implications
5. Pages/components involved
6. Data flow
7. Then implementation

Do not immediately start writing hundreds of lines of code.

---

# 29. CHANGE CONTROL

If a requested change affects architecture or database structure:

STOP and explain the impact before making the change.

Do not silently redesign existing architecture.

Do not create migrations that destroy existing data without explicit confirmation.

Never delete production data casually.

---

# 30. TESTING

After implementing meaningful functionality:
- run TypeScript checks
- run linting
- test important flows
- check authentication
- check authorization
- check RLS
- check responsive UI

Fix errors before moving to the next major feature.

---

# 31. WHEN YOU ARE UNSURE

Do NOT guess.

If a requirement is ambiguous and the decision affects:
- database
- security
- architecture
- user permissions
- data integrity

ask for clarification.

For minor UI decisions, choose the simplest reasonable option and continue.

---

# 32. FINAL RULE

The goal is NOT to build the biggest LMS.

The goal is to build a SIMPLE, CLEAN, RELIABLE LMS that can actually be used.

Every line of code should have a reason.

Every feature should have a purpose.

Every database table should have a purpose.

Every dependency should have a purpose.

- **Simplicity > cleverness.**
- **Maintainability > complexity.**
- **Security > convenience.**
- **Working functionality > impressive-looking code.**
