# GitHub Issue Template Quick Reference
Keep this handy while creating issues!

---

## Naming Convention Cheat Sheet

### Format
```
[type]/[description-in-kebab-case]
```
### Issue Types

Type | When to Use | Example
|------|-------------|---------|
| `feature/` | New functionality | `feature/add-dark-mode` |
| `bug/` | Fix broken functionality | `bug/fix-login-error` |
| `doc/` | Documentation work | `doc/update-readme` |
| `api/` | API endpoint creation | `api/get-all-users` |
| `frontend/` | UI/UX components | `frontend/create-nav-bar` |
| `backend/` | Database/backend work | `backend/create-users-table` |
| `test/` | Testing/QA work | `test/add-auth-tests` |
 
---
 
## Template Quick Selection
 
**I'm creating a new feature** → Use **Feature** template
- Starts with: `feature/`
- Include: Description, acceptance criteria, Definition of Done
**I'm fixing a bug** → Use **Bug Fix** template
- Starts with: `bug/`
- Include: Description, steps to reproduce, Definition of Done
**I'm writing documentation** → Use **Documentation** template
- Starts with: `doc/`
- Include: What's needed, scope, Definition of Done
**I'm building an API endpoint** → Use **API Endpoint** template
- Starts with: `api/`
- Include: HTTP method, route, request/response format, Definition of Done
**I'm creating UI components** → Use **Frontend/UI** template
- Starts with: `frontend/`
- Include: Component description, design reference, Definition of Done
**I'm doing database work** → Use **Backend** template
- Starts with: `backend/`
- Include: Schema changes, performance notes, Definition of Done
**I'm writing tests** → Use **Testing/QA** template
- Starts with: `test/`
- Include: Test scope, test cases, Definition of Done
---
 
## Title Examples
 
✅ **Good Titles:**
- `feature/add-user-authentication`
- `bug/fix-mobile-responsive-layout`
- `doc/write-api-documentation`
- `api/post-create-product`
- `frontend/build-product-card`
- `backend/optimize-database-queries`
- `test/unit-tests-payment-service`
❌ **Bad Titles:**
- `AddUserAuth` (missing type)
- `feature/Add User Auth` (use kebab-case)
- `feature/new stuff` (too vague)
- `Feature Request` (missing type prefix)
---
 
## Every Issue Needs These:
 
1. ✅ **Title** - Following naming convention
2. ✅ **Description** - Clear explanation of what needs to be done
3. ✅ **Acceptance Criteria** - What must be true when done
4. ✅ **Definition of Done** - Complete checklist of requirements
---
 
## Before You Submit
 
- [ ] Title follows `[type]/[description]` format
- [ ] Using kebab-case (hyphens between words)
- [ ] Description is clear and detailed
- [ ] Acceptance criteria are testable
- [ ] Definition of Done is complete
- [ ] No typos in title
---
 
## If You're Not Sure...
 
| Question | Answer |
|----------|--------|
| Which template do I use? | Look at the "Template Quick Selection" above |
| Is my naming correct? | Check the "Title Examples" section |
| What goes in Definition of Done? | Read the template's DoD section |
| Can I see examples? | Check EXAMPLE_ISSUES.md |
| Where do I find templates? | Click "New Issue" in the Issues tab |
 
---
 
## Common Naming Patterns
 
### Features
```
feature/add-[feature-name]
feature/implement-[feature-name]
feature/enable-[feature-name]
```
 
Examples: `feature/add-two-factor-auth`, `feature/implement-dark-mode`
 
### Bugs
```
bug/fix-[problem]
bug/resolve-[problem]
bug/patch-[problem]
```
 
Examples: `bug/fix-login-timeout`, `bug/resolve-mobile-crash`
 
### API Endpoints
```
api/[method]-[resource]
api/[method]-[resource]-by-[identifier]
```
 
Examples: `api/get-users`, `api/post-create-product`, `api/delete-user-by-id`
 
### Frontend Components
```
frontend/create-[component-name]
frontend/build-[component-name]
frontend/implement-[component-name]
```
 
Examples: `frontend/create-login-form`, `frontend/build-dashboard`
 
### Database/Backend
```
backend/create-[table-name]
backend/add-[feature-name]
backend/optimize-[component-name]
```
 
Examples: `backend/create-orders-table`, `backend/add-caching`
 
### Documentation
```
doc/add-[topic]
doc/write-[topic]
doc/update-[document]
```
 
Examples: `doc/add-api-guide`, `doc/update-setup-instructions`
 
### Testing
```
test/add-[type]-tests-[component]
test/write-[type]-tests-for-[feature]
test/increase-coverage-[module]
```
 
Examples: `test/add-unit-tests-auth`, `test/write-e2e-tests-checkout`
 
---
 
## Definition of Done Checklist Items
 
**Most issues need:**
- Code is written and reviewed
- Tests are written and passing
- Code follows style guide
- Documentation is updated
- No console errors introduced
- Changes are merged
**API/Backend additionally need:**
- Database changes are tested
- Error handling is comprehensive
- Performance is acceptable
**Frontend additionally needs:**
- Responsive design works
- Accessibility requirements met
- Tested in multiple browsers
**Documentation needs:**
- Links are functional
- Spelling/grammar is correct
- Examples are accurate
---
 
## Tips for Success
 
🎯 **Be Specific** - The more detail, the better
📋 **Use Checklists** - Easy to track progress
🔍 **Check Examples** - EXAMPLE_ISSUES.md has real cases
❓ **Ask Questions** - Comment on the issue if unclear
✅ **Complete DoD** - Don't skip the Definition of Done
 
---
 
## Key Numbers to Remember
 
- **Kebab-case required**: ALL descriptions use hyphens between words
- **7 Issue Types**: feature, bug, doc, api, frontend, backend, test
- **4 Required Sections**: Title, Description, Acceptance Criteria, DoD
- **3 Main Naming Parts**: Type + "/" + description
---
 
## Get Help
 
📖 **Full Guide**: Read ISSUE_GUIDE.md
📝 **Examples**: Check EXAMPLE_ISSUES.md
⚙️ **Setup**: See SETUP_INSTRUCTIONS.md
❓ **Questions**: Ask your team lead or mentor
 
---
 
**Remember: Clear, well-named issues make development faster and easier for everyone!** 🚀
