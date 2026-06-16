# GitHub Issue Template Guide
 
Welcome! This guide explains how to create issues in our repository using the provided templates and naming conventions.
 
## Quick Start
 
1. Go to the repository's Issues tab
2. Click "New Issue"
3. Choose the appropriate template for your issue type
4. Follow the naming convention format for the title
5. Fill in all the required sections
6. Submit the issue
---
 
## Naming Convention System
 
All issue titles must follow a strict naming convention to keep our project organized and make it easy to search and filter issues.
 
### Format
```
[type]/[brief-description-in-kebab-case]
```
 
### Components Explained
 
#### Type (Required)
The type prefix identifies what kind of work this issue involves:
 
| Type | Use Case | Example |
|------|----------|---------|
| `feature` | New functionality or enhancements | `feature/add-login-authentication` |
| `bug` | Fixing defects or broken functionality | `bug/login-form-validation-error` |
| `doc` | Documentation work | `doc/update-readme` |
| `api` | API endpoint creation or modification | `api/get-users` |
| `frontend` | UI/UX components and pages | `frontend/create-user-profile-card` |
| `backend` | Database, infrastructure, services | `backend/create-users-table` |
| `test` | Testing and QA work | `test/unit-tests-auth-service` |
 
#### Description (Required)
Brief, descriptive text in kebab-case (words separated by hyphens):
 
✅ **Good examples:**
- `feature/add-user-authentication`
- `bug/fix-mobile-layout-responsive`
- `doc/write-api-documentation`
- `api/post-create-new-user`
- `frontend/build-navigation-component`

❌ **Bad examples:**
- `feature/AddUserAuth` (use kebab-case, not camelCase)
- `feature/adding a user authentication feature` (spaces and special characters)
- `feature/feature` (not descriptive enough)
- `AddUserAuth` (missing type prefix)
---
 
## Issue Templates Overview
 
### 1. Feature Request
Use this template when adding new functionality or enhancements.
 
**Title format:** `feature/[description]`
 
**Key sections:**
- Description of the feature
- Acceptance criteria (what needs to work)
- Definition of Done (how to know it's complete)
**Example:** `feature/add-dark-mode-support`
 
---
 
### 2. Bug Fix
Use this template when reporting or fixing bugs.
 
**Title format:** `bug/[description]`
 
**Key sections:**
- Description of the bug
- Expected behavior
- Steps to reproduce
- Environment information
- Definition of Done
**Example:** `bug/fix-api-response-missing-fields`
 
---
 
### 3. Documentation
Use this template for any documentation-related work.
 
**Title format:** `doc/[description]`
 
**Key sections:**
- What documentation is needed
- Scope (which documents to update)
- Target audience
- Key topics to cover
- Definition of Done
**Example:** `doc/update-setup-instructions`
 
---
 
### 4. API Endpoint
Use this template when creating or modifying API endpoints.
 
**Title format:** `api/[HTTP-method]-[resource-name]`
 
**Key sections:**
- HTTP method (GET, POST, PUT, PATCH, DELETE)
- Route/path
- Request parameters and body format
- Response format
- Status codes
- Authentication requirements
- Database operations needed
- Definition of Done
**Example:** `api/get-all-users` or `api/post-create-product`
 
---
 
### 5. Frontend/UI
Use this template for creating UI components or working on the frontend.
 
**Title format:** `frontend/[description]`
 
**Key sections:**
- Component description
- Design reference (link to mockups)
- Component structure
- Props and state management
- Acceptance criteria
- Responsive design requirements
- Accessibility considerations
- Definition of Done
**Example:** `frontend/create-login-form-component`
 
---
 
### 6. Backend/Database
Use this template for database work, migrations, or backend infrastructure.
 
**Title format:** `backend/[description]`
 
**Key sections:**
- Description of the work
- Technical details (technology stack)
- Schema changes (if applicable)
- Performance considerations
- Testing strategy
- Deployment considerations
- Definition of Done
**Example:** `backend/create-users-table` or `backend/optimize-database-queries`
 
---
 
### 7. Testing/QA
Use this template when creating tests or improving test coverage.
 
**Title format:** `test/[description]`
 
**Key sections:**
- Testing scope
- Type of testing (unit, integration, E2E, etc.)
- Test coverage goals
- Test cases to implement
- Tools and frameworks
- Definition of Done
**Example:** `test/unit-tests-authentication-service`
 
---
 
## Definition of Done (DoD)
 
Each template includes a **Definition of Done** checklist. This is critical—it defines exactly what "complete" means for that issue.
 
### Why Definition of Done Matters
 
- **Clarity:** Developers know exactly when they're finished
- **Quality:** Ensures consistent standards across all work
- **Accountability:** Clear expectations for reviewers
- **Training:** Helps trainees learn project standards
### General Definition of Done Checklist
 
Most issues must satisfy these basic requirements:
 
- [ ] Work is implemented according to the issue description
- [ ] Code follows the project's style guide
- [ ] All applicable tests are written and passing
- [ ] Code has been reviewed and approved
- [ ] Documentation is updated if needed
- [ ] No new console errors or warnings introduced
- [ ] Branch is merged to `main`
---
 
## Step-by-Step: Creating an Issue
 
### Step 1: Identify the Issue Type
Ask yourself: "What kind of work is this?"
- Adding a feature? → Use **Feature** template
- Fixing a bug? → Use **Bug Fix** template
- Need docs? → Use **Documentation** template
- Building an API? → Use **API Endpoint** template
- Creating UI? → Use **Frontend/UI** template
- Database work? → Use **Backend** template
- Writing tests? → Use **Testing/QA** template
### Step 2: Create the Issue Title
Follow the naming convention: `[type]/[description]`
 
Examples:
```
feature/implement-two-factor-authentication
bug/fix-password-reset-email-not-sending
doc/add-deployment-guide
api/get-user-profile-by-id
frontend/create-settings-page
backend/add-database-indexes
test/add-e2e-tests-for-checkout-flow
```
 
### Step 3: Choose the Right Template
Click "New Issue" and select the template matching your issue type.
 
### Step 4: Fill Out All Sections
 
**Required sections (must complete):**
- ✅ Issue title (following naming convention)
- ✅ Description (clear and detailed)
- ✅ Acceptance Criteria (what must be true when done)
- ✅ Definition of Done (checklist of requirements)
**Additional sections:**
- Fill in any other sections relevant to your issue
- Remove sections that don't apply to your work
- Add details from the template examples
### Step 5: Review and Submit
- Double-check the title follows the naming convention
- Ensure all required sections are completed
- Click "Submit new issue"
---
 
## Tips for Writing Good Issues
 
### Be Descriptive
❌ **Bad:** `feature/add-login`

✅ **Good:** `feature/add-google-oauth-login`
 
### Be Specific
❌ **Bad:** "Make the app better"

✅ **Good:** "Improve login form validation to provide clear error messages for incorrect passwords"
 
### Include Examples
When applicable, include code examples, mockups, or screenshots.
 
### Reference Related Issues
Link to related issues using `#issue-number` format:
```
This feature depends on #123
This bug is related to #456
```
 
### Acceptance Criteria Must Be Testable
✅ Good: "User can successfully login using Google OAuth and profile data is saved"

❌ Bad: "Make login work with Google"
 
---
 
## Common Mistakes to Avoid
 
| Mistake | Problem | Solution |
|---------|---------|----------|
| Missing type prefix | Can't identify issue type | Always start with `type/` |
| Using spaces in description | Breaks naming convention | Use kebab-case: `add-user-auth` |
| Incomplete Definition of Done | Unclear when work is finished | Check all DoD boxes are complete |
| Vague descriptions | Hard to understand the work | Be specific and include examples |
| Forgetting to fill sections | Reviewers lack context | Complete all required sections |
| Not following kebab-case | Inconsistent issue names | Always use kebab-case: `auth-service` |

---
 
## Questions?
 
If you're unsure about:
- **Which template to use:** Ask your team lead or check the examples above
- **How to fill out a section:** Look at the template examples
- **What "done" means:** Read the Definition of Done checklist carefully
- **Naming conventions:** Check the examples in this guide
Remember: Clear issues make for smooth development!
