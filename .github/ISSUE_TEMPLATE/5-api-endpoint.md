---
name: 5-API endpoint
about: Create or modify an API endpoint
title: api/[brief-description]
labels: api
assignees: ''
type: Task

---

## Endpoint Details
 
### HTTP Method
- [ ] GET
- [ ] POST
- [ ] PUT
- [ ] PATCH
- [ ] DELETE
### Route/Path
```
/api/v1/[path]
```
 
### Request Parameters
Describe query parameters, path parameters, and request body:
 
```json
{
  "example": "structure"
}
```
 
### Response Format
Describe the expected response structure:
 
```json
{
  "status": "success",
  "data": {
    "example": "structure"
  }
}
```
 
### Status Codes
List the HTTP status codes this endpoint should return:
 
- [ ] 200 OK
- [ ] 201 Created
- [ ] 400 Bad Request
- [ ] 401 Unauthorized
- [ ] 403 Forbidden
- [ ] 404 Not Found
- [ ] 500 Internal Server Error
- [ ] Other: ________
---
 
## Authentication & Authorization
- [ ] No authentication required
- [ ] Requires authentication (JWT, etc.)
- [ ] Requires specific role/permission: ________
---
 
## Database Queries
Describe the database operations needed:
 
- Query/Operation 1
- Query/Operation 2
- Query/Operation 3
---
 
## Error Handling
How should errors be handled? What error messages should be returned?
 
<!-- Add error handling details -->
 
---
 
## Definition of Done
An API endpoint is done when **all** of the following are satisfied:
 
- [ ] Endpoint is implemented according to specifications
- [ ] All HTTP methods and status codes work as specified
- [ ] Request validation is implemented (input validation, type checking)
- [ ] Authentication/authorization is implemented and working
- [ ] Database queries are optimized and properly error-handled
- [ ] Error responses follow the project's standard format
- [ ] Unit tests are written covering success and error cases
- [ ] API documentation is written or updated (OpenAPI/Swagger if applicable)
- [ ] Request/response examples are documented
- [ ] Endpoint is tested using a tool like Postman/Insomnia
- [ ] Code review is complete and approved
- [ ] Code follows the project's style guide
- [ ] No console errors or security vulnerabilities introduced
- [ ] Branch is merged to `main`
---
 
## Related Issues/PRs
Link to any related issues or pull requests:
 
<!-- Add related links -->
 
---
 
## Additional Context
Add any other relevant information, diagrams, or reference implementations.
 
<!-- Add context here -->
