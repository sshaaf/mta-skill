---
name: mta-migration
description: Orchestrates end-to-end application migration using MTA analysis and custom rule generation. Use this skill when the user wants to migrate an application to a new technology stack (e.g., Spring Boot upgrade, Java EE to Quarkus, WebLogic to JBoss). Triggers on phrases like "migrate this app to X", "upgrade to Y", "modernize this application", "help me migrate from A to B", or any request involving planning and executing a technology migration.
---

# MTA Migration Orchestration Skill

This skill orchestrates complete application migrations by combining MTA analysis, custom rule generation, migration planning, and execution. It automates the full migration lifecycle from analysis to completion.

## When to Use This Skill

Use this skill when the user wants to:
- Migrate an application to a new technology stack
- Upgrade framework versions (Spring Boot 2→3, Java EE→Jakarta EE, etc.)
- Modernize legacy applications (WebLogic→Quarkus, etc.)
- Plan and execute a comprehensive migration with validation

**Don't use this skill for:**
- Just running analysis (use `/mta-analyze` directly)
- Just generating rules (use `/mta-rules-gen` directly)
- Simple code refactoring without migration

## Prerequisites

- **MTA Skills Available**: `mta-analyze` and `mta-rules-gen` must be installed
- **Scribe MCP Server**: Must be running at `http://localhost:8080/mcp/sse` for rule generation
- **Git Repository**: Codebase must be in a git repository (for safe branching)
- **kantra CLI**: Must be installed and available in PATH

## Migration Workflow

### Phase 1: Analysis

1. **Invoke MTA Analysis**
   - Use the `/mta-analyze` skill to analyze the codebase
   - Ensure you pass the correct target platform (e.g., `--target=quarkus`, `--target=springboot3`)
   - Wait for analysis to complete and HTML report to be generated

2. **Parse Analysis Results**
   - Read the analysis output directory (default: `./analysis-output`)
   - Parse the HTML report and identify:
     - Migration issues by category (mandatory, optional, potential)
     - Effort estimates (story points)
     - Affected files and line numbers
     - Recommended changes

3. **Identify Gaps**
   - Look for patterns in the analysis that suggest missing rules:
     - Many issues in similar categories without specific rules
     - Generic "potential" warnings that could be more specific
     - Custom/internal APIs not covered by default MTA rules
     - Technology-specific patterns unique to this codebase

### Phase 2: Custom Rule Generation

1. **Determine if Custom Rules are Needed**
   - If gaps identified, proceed to rule generation
   - If no gaps, skip to Phase 3

2. **Generate Custom Rules**
   - For each identified gap, invoke `/mta-rules-gen` with specific prompts
   - Example prompts:
     - "Generate rules to detect usage of `com.company.legacy.*` APIs"
     - "Create rules for detecting Spring Security patterns missing from the analysis"
   - Collect all generated rule files

3. **Save Rules to Ruleset Directory**
   - Create `ruleset/` directory in the project root if it doesn't exist
   - Copy all generated custom rules to `ruleset/custom-rules.yaml`
   - If multiple rule sets were generated, combine them or save as separate files with descriptive names

4. **Re-run Analysis with Custom Rules** (Optional but Recommended)
   - Run MTA analysis again with `--rules=./ruleset`
   - This provides a more complete picture of the migration scope
   - Update the gap analysis based on new results

### Phase 3: Migration Plan Generation

Generate a comprehensive migration plan document with these sections:

#### Plan Structure

```markdown
# Migration Plan: [Source] → [Target]

## Executive Summary
- **Source Platform**: Current technology stack
- **Target Platform**: Destination technology stack
- **Estimated Effort**: Total story points from analysis
- **Critical Issues**: Count of mandatory issues
- **Custom Rules Generated**: Number of rules in ruleset/

## Prerequisites
- [ ] Git branch created: `migration/[source]-to-[target]`
- [ ] Backup verified
- [ ] Dependencies reviewed
- [ ] Team notified

## Phase 1: Dependency Updates
### Tasks
- [ ] Update parent POMs / build files
- [ ] Update framework versions
- [ ] Update transitive dependencies
### Validation
- [ ] Build succeeds
- [ ] No dependency conflicts

## Phase 2: Code Migrations
### Mandatory Changes (Story Points: X)
[Group by category, list specific files and changes]

### Optional Changes (Story Points: Y)
[Improvements and best practices]

### Validation
- [ ] Code compiles
- [ ] No compiler errors

## Phase 3: Configuration Updates
### Tasks
- [ ] Update application.properties / application.yml
- [ ] Update XML configuration files
- [ ] Update deployment descriptors
### Validation
- [ ] Configuration files valid
- [ ] Application starts successfully

## Phase 4: Testing
### Unit Tests
- [ ] Run existing unit tests
- [ ] Fix failing tests
- [ ] Add tests for migrated code

### Integration Tests
- [ ] Run integration tests
- [ ] Verify database connections
- [ ] Verify external service integrations

### Manual Testing
- [ ] Test critical user flows
- [ ] Verify authentication/authorization
- [ ] Check error handling

## Phase 5: Deployment Validation
### Tasks
- [ ] Build production artifact
- [ ] Deploy to staging/test environment
- [ ] Run smoke tests
- [ ] Performance testing

## Rollback Plan
[Steps to revert if migration fails]

## Appendix: Analysis Details
- Analysis report: `./analysis-output/static-report/index.html`
- Custom rules: `./ruleset/`
- MTA command used: `kantra analyze ...`
```

### Phase 4: Validation Planning

Based on the codebase, include appropriate validation steps:

1. **Build System Detection**
   - Maven: Include `mvn clean verify`
   - Gradle: Include `./gradlew build`
   - npm: Include `npm test`

2. **Test Framework Detection**
   - JUnit: Include test execution
   - TestNG: Include test execution
   - Integration tests: Include if present

3. **Application Type**
   - Web app: Include startup verification (`curl http://localhost:8080/health`)
   - Microservice: Include health endpoint checks
   - Library: Include compilation and unit tests only

### Phase 5: Plan Presentation

1. **Save the Migration Plan**
   - Write to `MIGRATION_PLAN.md` in the project root
   - Include all sections with specific, actionable tasks

2. **Present to User**
   - Show a summary of:
     - Total effort (story points)
     - Number of files affected
     - Critical issues count
     - Custom rules generated (if any)
   - Ask: "I've created a comprehensive migration plan in `MIGRATION_PLAN.md`. Would you like me to execute it? I'll create a git branch first for safety."

3. **Wait for Approval**
   - Do NOT proceed to execution without explicit user approval
   - If user wants to review the plan first, wait for them to read it
   - If user requests changes to the plan, update it accordingly

### Phase 6: Migration Execution

**IMPORTANT**: Only proceed if user has approved execution.

1. **Safety Checks**
   ```bash
   # Verify git repository
   git status
   
   # Check for uncommitted changes
   if git diff-index --quiet HEAD --; then
     echo "Working directory clean"
   else
     echo "WARNING: Uncommitted changes detected"
     # Ask user if they want to commit or stash
   fi
   ```

2. **Create Migration Branch**
   ```bash
   # Create branch with descriptive name
   git checkout -b migration/[source]-to-[target]-$(date +%Y%m%d)
   ```

3. **Execute Migration Phases**
   - Work through each phase in `MIGRATION_PLAN.md` sequentially
   - For each task:
     - Log what you're doing
     - Execute the change
     - Run the validation steps
     - Commit changes with descriptive message
   - Example commit message format:
     ```
     migration: [Phase X] [Task description]
     
     - Specific change 1
     - Specific change 2
     
     Story points: X
     ```

4. **Validation After Each Phase**
   - Run the validation commands specified in the plan
   - If validation fails:
     - Log the failure
     - Attempt automatic fix if possible
     - If cannot fix automatically, report to user and pause
   - Do not proceed to next phase until validation passes

5. **Continuous Progress Updates**
   - After each phase completes, show user:
     - What was done
     - Validation results
     - What's next
   - Keep updates concise but informative

6. **Final Validation**
   ```bash
   # Build the application
   [build command from plan]
   
   # Run tests
   [test command from plan]
   
   # Start application (if applicable)
   [startup command from plan]
   
   # Run smoke tests
   [smoke test commands from plan]
   ```

7. **Completion Report**
   - Summarize what was changed
   - List all commits made
   - Report final validation results
   - Provide next steps:
     - Review the changes: `git diff main..migration/[branch-name]`
     - Merge if satisfied: `git checkout main && git merge [branch-name]`
     - Rollback if needed: `git checkout main && git branch -D [branch-name]`

## Error Handling

### Analysis Fails
- Check kantra CLI is installed
- Verify input directory exists
- Check Scribe MCP server is running (for custom rules)
- Report error to user with suggestions

### Custom Rule Generation Fails
- Check if Scribe MCP server is running
- If server unavailable, ask user if they want to:
  - Wait for server to start
  - Skip custom rule generation and proceed with default rules only
  - Abort migration planning

### Validation Fails During Execution
- Log the failure clearly
- If it's a build error:
  - Show the error message
  - Attempt to fix common issues (e.g., missing imports, package renames)
  - If cannot auto-fix, ask user for guidance
- If it's a test failure:
  - Show which tests failed
  - Check if tests need updating for new framework
  - Ask user if they want to:
    - Fix tests manually
    - Skip failing tests and continue (mark as TODO)
    - Abort migration

### Git Branch Creation Fails
- Check if branch already exists (ask user to delete or rename)
- Check for uncommitted changes (ask user to commit or stash)
- Verify git repository is valid

### No Path Forward for Blockers
If the analysis reveals critical issues that cannot be auto-resolved:
1. Document the blockers clearly in a `MIGRATION_BLOCKERS.md` file
2. List each blocker with:
   - Description of the issue
   - Why it blocks migration
   - Suggested approaches to resolve (if any)
3. Present to user: "I found critical blockers that need your input. See `MIGRATION_BLOCKERS.md` for details."
4. Wait for user to provide guidance before continuing

## Tips for Success

1. **Be Conservative with Automated Changes**
   - For complex refactorings, propose the change and ask user to review before executing
   - Commit frequently so changes can be reverted granularly

2. **Prioritize Mandatory Issues**
   - Focus on mandatory migration issues first (these break compilation/runtime)
   - Optional improvements can be deferred to a follow-up

3. **Validate Incrementally**
   - Don't wait until the end to validate
   - Validate after each phase to catch issues early

4. **Document Custom Rules**
   - If custom rules were generated, include them in the final commit
   - Add a README in `ruleset/` explaining what the rules detect

5. **Preserve Original Behavior**
   - The goal is to migrate the technology, not change functionality
   - If behavior changes are needed, flag them explicitly to the user

## Example Usage

**User**: "Migrate this Spring Boot 2.7 application to Spring Boot 3.2"

**Skill Actions**:
1. Run `/mta-analyze --target=springboot3 --input=.`
2. Parse analysis, identify gaps (e.g., internal API usage not detected)
3. Generate custom rules for internal APIs using `/mta-rules-gen`
4. Save rules to `ruleset/`
5. Create migration plan in `MIGRATION_PLAN.md`
6. Present plan to user
7. On approval, create `migration/springboot27-to-32-20260519` branch
8. Execute phases: dependencies → code → config → tests → validation
9. Report completion with summary of changes

## Integration with Other Skills

- **Uses `/mta-analyze`**: For codebase analysis
- **Uses `/mta-rules-gen`**: For custom rule generation
- **Complements both**: Provides end-to-end orchestration beyond individual analysis or rule generation

## Output Artifacts

After successful migration, these files are created:
- `MIGRATION_PLAN.md` - The comprehensive migration plan
- `ruleset/` - Directory containing any custom rules generated
- `MIGRATION_BLOCKERS.md` - If critical blockers found (optional)
- Git commits - All changes committed to migration branch
- Analysis reports - In `./analysis-output/` directory
