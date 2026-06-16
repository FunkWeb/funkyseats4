# Example Issues: Learning from Real Cases

This document provides real-world examples of properly filled-out issues using the templates. Use these as reference when creating your own issues.

---

## Example 1: Feature Request

### Title
```
feature/add-user-email-verification
```

### Issue Content

**Description:**
Add email verification functionality to the user registration flow. When a new user registers, they should receive a verification email with a secure token. Users cannot access their account until they verify their email.

**Acceptance Criteria:**
- [ ] Users receive a verification email after registration
- [ ] Email contains a secure, time-limited verification link
- [ ] Clicking the link verifies the email address
- [ ] Unverified users see a "verify email" prompt
- [ ] Email verification status is stored in the database
- [ ] After 7 days, unverified accounts are deleted
- [ ] Users can request a new verification email

**Definition of Done:**
- [ ] Code is written and reviewed
- [ ] Unit tests are written (>80% coverage of new code)
- [ ] Code follows project style guide
- [ ] Email template created and approved
- [ ] Email service integration tested
- [ ] Documentation updated with email verification flow
- [ ] No console errors introduced
- [ ] Tested with real email service
- [ ] Merged to main branch

---

## Example 2: Bug Fix

### Title
```
bug/fix-password-reset-email-not-sending
```

### Issue Content

**Description of the Bug:**
Users attempting to reset their password receive an error message, but no password reset email is sent. The error occurs intermittently and appears related to email service configuration.

**Expected Behavior:**
When a user clicks "Forgot Password" and enters their email, a password reset email should be sent within 30 seconds containing a reset link.

**Steps to Reproduce:**
1. Go to the login page
2. Click "Forgot Password"
3. Enter a valid email address
4. Click "Send Reset Email"
5. Wait 30 seconds
6. Check email inbox for reset email
7. No email is received, and user sees error: "Email service temporarily unavailable"

**Environment:**
- Browser: Chrome 120
- OS: macOS 14.2
- Version: main branch (commit abc123)
- Database: PostgreSQL 14

**Acceptance Criteria:**
- [ ] Password reset emails send successfully
- [ ] Email arrives within 30 seconds
- [ ] Reset link is valid for 24 hours
- [ ] Error messages are clear to users
- [ ] Email service failures are logged

**Definition of Done:**
- [ ] Root cause identified and documented
- [ ] Fix is implemented
- [ ] Email service configuration verified
- [ ] Unit tests verify email sending
- [ ] Integration tests with email service pass
- [ ] Tested in staging environment
- [ ] No similar email issues found
- [ ] Code reviewed and approved
- [ ] Merged to main

---

## Example 3: Documentation

### Title
```
doc/add-api-authentication-guide
```

### Issue Content

**Documentation Needed:**
Create comprehensive documentation for API authentication. Developers building integrations need clear instructions on how to authenticate API requests, handle tokens, and implement security best practices.

**Scope:**
- [x] API Documentation
- [x] Developer Guide
- [ ] User Guide
- [ ] Setup/Installation

**Target Audience:**
- [x] Developers
- [ ] DevOps/Infrastructure

**Key Topics to Cover:**
- OAuth 2.0 flow overview
- Bearer token format and usage
- Token expiration and refresh mechanism
- Common authentication errors and solutions
- Security best practices (storing tokens, HTTPS requirement)
- Code examples in multiple languages (JavaScript, Python, cURL)
- Rate limiting related to authentication

**Reference Materials:**
- GitHub Issue #234 (OAuth implementation)
- PR #567 (API auth service)
- OpenAPI spec at `docs/openapi.yaml`

**Definition of Done:**
- [ ] Documentation is written clearly and concisely
- [ ] All code examples are tested and accurate
- [ ] All links are functional
- [ ] Security best practices are included
- [ ] Documentation proofread for grammar
- [ ] Screenshots of OAuth flow added
- [ ] Different programming language examples included
- [ ] Documentation reviewed and approved
- [ ] Merged to main branch

---

## Example 4: API Endpoint

### Title
```
api/post-create-user
```

### Issue Content

**HTTP Method:**
- [x] POST

**Route/Path:**
```
POST /api/v1/users
```

**Request Parameters:**
```json
{
  "email": "user@example.com",
  "firstName": "John",
  "lastName": "Doe",
  "password": "securePassword123"
}
```

**Response Format (Success - 201 Created):**
```json
{
  "status": "success",
  "data": {
    "id": "uuid-string",
    "email": "user@example.com",
    "firstName": "John",
    "lastName": "Doe",
    "createdAt": "2024-01-15T10:30:00Z"
  }
}
```

**Response Format (Error - 400 Bad Request):**
```json
{
  "status": "error",
  "message": "Invalid request",
  "errors": [
    {
      "field": "email",
      "message": "Email is already registered"
    }
  ]
}
```

**Status Codes:**
- [x] 201 Created
- [x] 400 Bad Request
- [x] 409 Conflict (email already exists)
- [x] 500 Internal Server Error

**Authentication & Authorization:**
- [ ] No authentication required
- [x] Requires authentication (JWT)
- [ ] Requires specific role: Admin

**Database Queries:**
- Insert new user into `users` table
- Check for existing email in `users` table
- Insert verification record into `email_verifications` table

**Error Handling:**
- Duplicate email: Return 409 with message "Email is already registered"
- Invalid email format: Return 400 with field error
- Weak password: Return 400 with password requirements
- Database error: Return 500 with generic error message (log specific details)

**Definition of Done:**
- [ ] Endpoint implemented according to spec
- [ ] All status codes return correct responses
- [ ] Request validation implemented (email format, password strength)
- [ ] Authentication/authorization verified
- [ ] Database queries are optimized
- [ ] Error responses follow standard format
- [ ] Unit tests cover success and error cases
- [ ] API documentation updated
- [ ] Tested with Postman/Insomnia
- [ ] Code review complete
- [ ] Merged to main

---

## Example 5: Frontend/UI Component

### Title
```
frontend/create-user-profile-card
```

### Issue Content

**Description:**
Create a reusable UserProfileCard component that displays user information in a card format. The component should show user avatar, name, bio, and action buttons (Follow, Message, etc.). Component should be responsive and accessible.

**Design Reference:**
- Figma: https://figma.com/file/abc123/design-system
- Design system: Uses tokens for spacing, colors, typography

**Component Structure:**
- **Component name:** UserProfileCard
- **Parent component:** ProfilePage, UserDirectory
- **Child components:** Avatar, Button, Icon

**Props/State Management:**
```javascript
Props: {
  userId: string (required),
  user: {
    id: string,
    name: string,
    avatar: string (URL),
    bio: string,
    followers: number,
    isFollowing: boolean
  },
  onFollow: function (callback when user clicks follow),
  onMessage: function (callback when user clicks message)
}

State: {
  isLoading: boolean,
  isFollowing: boolean
}
```

**Acceptance Criteria:**
- [ ] Component matches design specification
- [ ] User data displays correctly
- [ ] Follow button toggles follow status
- [ ] Message button opens messaging modal
- [ ] Loading state shows skeleton while data loads

**Responsive Design:**
- [x] Works on mobile (< 768px)
- [x] Works on tablet (768px - 1024px)
- [x] Works on desktop (> 1024px)

**Accessibility (WCAG 2.1):**
- [x] Keyboard navigation implemented
- [x] ARIA labels for buttons
- [x] Color contrast meets AA standards
- [x] Screen reader compatible
- [x] Focus indicators visible

**Definition of Done:**
- [ ] Component implemented matching design
- [ ] Code follows style guide
- [ ] Responsive on all screen sizes
- [ ] WCAG 2.1 AA accessibility met
- [ ] Unit tests with >80% coverage
- [ ] Props are TypeScript typed
- [ ] No console errors
- [ ] Integrates properly with parent
- [ ] Tested manually in Chrome, Firefox, Safari, Edge
- [ ] Code reviewed
- [ ] Merged to main

---

## Example 6: Backend/Database Work

### Title
```
backend/create-users-table-with-indices
```

### Issue Content

**Description:**
Create the initial `users` table to store user account information. This is a foundational table required before implementing authentication features. Table should include proper indexing for common queries (email lookups, user ID searches).

**Technology/Framework:**
- Database: PostgreSQL 14
- Language/Framework: Laravel 10 (migration framework)
- Tools: Laravel migrations

**Schema Changes:**
```sql
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email VARCHAR(255) NOT NULL UNIQUE,
  password_hash VARCHAR(255) NOT NULL,
  first_name VARCHAR(100),
  last_name VARCHAR(100),
  bio TEXT,
  avatar_url VARCHAR(255),
  is_email_verified BOOLEAN DEFAULT FALSE,
  is_active BOOLEAN DEFAULT TRUE,
  last_login_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  deleted_at TIMESTAMP
);

CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_is_active ON users(is_active);
CREATE INDEX idx_users_created_at ON users(created_at);
```

**Performance Considerations:**
- Current issue: None (new table)
- Expected queries: High volume of email lookups during login
- Metrics to measure: Query execution time < 10ms for email lookup

**Dependencies:**
- Database connection working
- Laravel environment configured

**Risk Assessment:**
- Risk: None (new table, no data migration)

**Testing Strategy:**
- [x] Unit tests
- [x] Integration tests
- [x] Manual testing

**Deployment Considerations:**
- Zero-downtime migration needed: No
- Database migration: Yes
- Configuration changes: No

**Definition of Done:**
- [ ] Migration created in Laravel
- [ ] Table created successfully
- [ ] Indices created for performance
- [ ] Foreign key relationships planned
- [ ] Unit tests verify table structure
- [ ] Manual testing of inserts/queries
- [ ] No data loss (new table)
- [ ] Code reviewed
- [ ] Merged to main

---

## Example 7: Testing/QA

### Title
```
test/add-unit-tests-authentication-service
```

### Issue Content

**Description:**
Write comprehensive unit tests for the AuthenticationService. Service handles user login, token generation, token validation, and logout. Current coverage is 0%—tests must cover normal flows, error cases, and edge cases.

**Scope of Testing:**
- AuthenticationService (main class)
- TokenManager (JWT token handling)
- PasswordValidator (password strength checking)

**Type of Testing:**
- [x] Unit Tests
- [ ] Integration Tests
- [ ] End-to-End Tests

**Test Coverage:**
- Current coverage: 0%
- Target coverage: 85%
- Priority areas: Login flow, token validation, error handling

**Test Cases:**

### Test Case 1: Successful Login
- **Description:** User logs in with correct email and password
- **Prerequisites:** User exists in test database, password is hashed correctly
- **Steps:**
  1. Call `authenticate(email, password)`
  2. Verify correct password is provided
  3. Verify user is found
  4. Return JWT token
- **Expected Result:** Function returns valid JWT token with user ID in payload

### Test Case 2: Invalid Password
- **Description:** User enters wrong password
- **Prerequisites:** User exists in test database
- **Steps:**
  1. Call `authenticate(email, wrongPassword)`
  2. Verify password comparison fails
  3. Return error
- **Expected Result:** Function throws AuthenticationError with message "Invalid credentials"

### Test Case 3: User Not Found
- **Description:** Email doesn't exist in database
- **Prerequisites:** None
- **Steps:**
  1. Call `authenticate(nonexistent@email.com, password)`
  2. User lookup fails
- **Expected Result:** Function throws UserNotFoundError

**Tools/Framework:**
- Testing framework: Jest
- Assertion library: Expect
- Mocking library: Jest mocks
- Test runner: Jest

**Edge Cases:**
- SQL injection in email field
- Very long password (10000+ characters)
- Null or undefined inputs
- Concurrent login requests

**Definition of Done:**
- [ ] All test cases implemented
- [ ] Tests are running and passing
- [ ] 85% coverage target met
- [ ] Edge cases covered
- [ ] Test code is readable and documented
- [ ] Tests run in < 5 seconds
- [ ] No flaky tests
- [ ] Code reviewed
- [ ] Merged to main

---

## Key Takeaways from Examples

### 1. Naming Convention is Consistent
Every example follows the format: `[type]/[description-in-kebab-case]`

### 2. Descriptions are Specific
Not just "add feature" but "add user email verification"

### 3. Definition of Done is Comprehensive
Each checklist ensures quality and completeness

### 4. Examples Include Real-World Details
Code snippets, API responses, database schemas, etc.

### 5. Acceptance Criteria are Testable
Each criterion can be verified objectively

---

## Practice: Create Your Own

Try creating an issue using these examples as reference:

1. Pick a small feature or bug you know about
2. Choose the appropriate template
3. Create a title following the naming convention
4. Fill out all sections using these examples as guides
5. Make sure your Definition of Done is complete
6. Ask your team lead to review before submitting

Remember: **Good issues = smooth development!**
