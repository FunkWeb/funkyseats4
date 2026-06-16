---
name: 4-Backend
about: Database schema changes, migrations, or backend infrastructure
title: backend/[brief-description]
labels: backend
assignees: ''
type: Task

---

## Description
Describe the backend work that needs to be done.
 
<!-- Add description here -->
 
---
 
## Technical Details
 
### Technology/Framework
Specify the technology involved:
- Database: ________
- Language/Framework: ________
- Tools: ________
### Schema Changes (if applicable)
Describe any database schema changes:
 
```sql
-- SQL migration code or description
```
 
### Performance Considerations
- Current performance issue: ________
- Expected improvement: ________
- Metrics to measure: ________
---
 
## Dependencies
List any dependencies or prerequisites:
 
- Dependency 1
- Dependency 2
- Dependency 3
---
 
## Risk Assessment
What could go wrong?
 
- Risk 1: mitigation strategy
- Risk 2: mitigation strategy
---
 
## Testing Strategy
How will this be tested?
 
- [ ] Unit tests
- [ ] Integration tests
- [ ] Load testing
- [ ] Manual testing
- [ ] Staging environment testing
---
 
## Deployment Considerations
Any special deployment steps or concerns?
 
- Zero-downtime migration needed: [ ] Yes [ ] No
- Database migration: [ ] Yes [ ] No
- Configuration changes: [ ] Yes [ ] No
- Environment-specific setup: [ ] Yes [ ] No
---
 
## Definition of Done
A database/backend task is done when **all** of the following are satisfied:
 
- [ ] Feature/change is implemented according to specifications
- [ ] All database migrations are created and tested
- [ ] Backward compatibility is considered (if needed)
- [ ] Code follows the project's style guide
- [ ] Unit tests are written covering normal and edge cases
- [ ] Integration tests verify interaction with database
- [ ] Performance impact is measured and acceptable
- [ ] Error handling is comprehensive
- [ ] Logging is implemented for debugging
- [ ] Database indexes are optimized if needed
- [ ] Code review is complete and approved
- [ ] Documentation is updated (schema, API, procedures)
- [ ] Tested in staging environment
- [ ] Rollback plan is documented (if critical)
- [ ] Branch is merged to `main`
---
 
## Migration Path (if applicable)
Describe how existing data will be handled:
 
<!-- Add migration details -->
 
---
 
## Monitoring/Alerts
What should be monitored after deployment?
 
- Metric 1: ________
- Metric 2: ________
- Alert threshold: ________
---
 
## Additional Context
Add any other relevant information, diagrams, or references.
 
<!-- Add context here -->
