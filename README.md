# MTA Skills for AI Agents

Three complementary skills for Java application migration powered by Konveyor/MTA:

1. **mta-analyze** - Analyze codebases for migration readiness using MTA CLI (kantra or mta-cli)
2. **mta-rules-gen** - Generate custom migration rules using the Scribe MCP server
3. **mta-migration** - Orchestrate end-to-end application migrations with planning and execution

## Workflow

```mermaid
graph TB
    Start([User Request]) --> Decision{What do you need?}
    
    Decision -->|Analyze only| Analyze[/mta-analyze/]
    Decision -->|Generate rules only| RulesGen[/mta-rules-gen/]
    Decision -->|Full migration| Migration[/mta-migration/]
    
    Analyze --> Kantra[Run MTA CLI<br/>kantra or mta-cli]
    Kantra --> CustomRules{Custom rules<br/>exist?}
    CustomRules -->|Yes| AnalyzeWithRules[Analyze with<br/>custom rules]
    CustomRules -->|No| AnalyzeDefault[Analyze with<br/>default rules]
    AnalyzeWithRules --> Report1[Generate<br/>HTML Report]
    AnalyzeDefault --> Report1
    Report1 --> End1([Analysis Complete])
    
    RulesGen --> Scribe[Connect to<br/>Scribe MCP]
    Scribe --> GenerateRules[Generate custom<br/>YAML rules]
    GenerateRules --> SaveRules[Save to<br/>ruleset/]
    SaveRules --> End2([Rules Ready])
    
    Migration --> Phase1[Phase 1:<br/>Analysis]
    Phase1 --> RunAnalyze[Use mta-analyze]
    RunAnalyze --> Phase2[Phase 2:<br/>Gap Detection]
    Phase2 --> Gaps{Missing<br/>rules?}
    Gaps -->|Yes| UseRulesGen[Use mta-rules-gen]
    Gaps -->|No| Phase3[Phase 3:<br/>Create Plan]
    UseRulesGen --> SaveToRuleset[Save to ruleset/]
    SaveToRuleset --> ReAnalyze[Re-run analysis<br/>with custom rules]
    ReAnalyze --> Phase3
    Phase3 --> CreatePlan[Generate<br/>MIGRATION_PLAN.md]
    CreatePlan --> UserApproval{User<br/>approves?}
    UserApproval -->|No| End3([Plan Review])
    UserApproval -->|Yes| Phase4[Phase 4:<br/>Execution]
    Phase4 --> GitBranch[Create git branch]
    GitBranch --> Execute[Execute phases:<br/>deps → code → config → tests]
    Execute --> Validate[Validate each phase]
    Validate --> End4([Migration Complete])
    
    style Analyze fill:#e1f5ff
    style RulesGen fill:#fff4e1
    style Migration fill:#e1ffe1
    style Kantra fill:#f0f0f0
    style Scribe fill:#f0f0f0
    style End1 fill:#c8e6c9
    style End2 fill:#c8e6c9
    style End3 fill:#fff9c4
    style End4 fill:#c8e6c9
```

## Installation

**Local install** (installs to `.claude/skills/` in current directory):
```bash
npx @sshaaf/mta-skill
```

**Global install** (installs to `~/.claude/skills/` for all projects):
```bash
npx @sshaaf/mta-skill -g
```

** Development** 
during development you can run installer.js e.g. /home/user/mta-skill/installer.js. This should install the skill in local .claude directory.

```
cd current-project
/home/user/mta-skill/installer.js
```


The skill will be available to any AI agent that supports the `.claude/skills/` directory structure.

## Usage

### MTA Analysis (`/mta-analyze`)

Analyze your codebase for migration readiness:

```
/mta-analyze analyze this codebase for migration to EAP 8
```

Or naturally:
```
Analyze this Java app for migration to Quarkus
Check if we can migrate to EAP 8
Run a cloud readiness assessment
```

The skill will:
1. Check if kantra is installed
2. Auto-detect custom migration rules
3. Run the analysis with appropriate targets
4. Generate a detailed HTML report
5. Summarize key findings and migration effort

### Rules Generation (`/mta-rules-gen`)

Generate custom migration rules using Scribe:

```
/mta-rules-gen create rules for Spring Boot 2 to 3 migration
```

Or naturally:
```
Generate rules to detect deprecated Spring Security configs
Create rules for WebLogic JMS to Jakarta JMS migration
I need rules to flag our internal deprecated APIs
```

The skill will:
1. Connect to Scribe MCP server (http://localhost:8080/mcp/sse)
2. Generate custom MTA rules based on your requirements
3. Save rules as YAML files in migration-rules/
4. Provide usage instructions for kantra --rules flag

### Migration Orchestration (`/mta-migration`)

Orchestrate complete application migrations:

```
/mta-migration migrate this Spring Boot 2.7 app to 3.2
```

Or naturally:
```
Migrate this application from WebLogic to Quarkus
Upgrade this app from Java EE 7 to Jakarta EE 10
Modernize this application to Spring Boot 3
```

The skill will:
1. Run MTA analysis on your codebase
2. Identify gaps and generate custom rules if needed
3. Create a comprehensive migration plan with phases
4. Create a git branch for safe execution
5. Execute the migration with validation at each step
6. Provide rollback instructions if needed

## Example Workflows

### Workflow 1: Analysis-Only

```
# Step 1: Generate custom rules
You: Create migration rules for detecting Spring Boot 2.x security configs

Agent: [uses mta-rules-gen]
       Generated rules saved to: migration-rules/springboot2-security-rules.yaml
       
       Rules detect:
       • Deprecated WebSecurityConfigurerAdapter
       • Old authentication patterns
       • Changed property names
       
       Usage: kantra analyze --rules=./migration-rules ...

# Step 2: Analyze codebase with custom rules
You: Now analyze this codebase for Spring Boot 3 migration using those rules

Agent: [uses mta-analyze]
       Running kantra with custom rules...
       
       Migration Analysis Complete
       
       Key Findings:
       • Total Issues: 18 mandatory, 12 optional, 5 potential
       • Custom rules found: 8 security configuration issues
       • Estimated Effort: 52 story points
       
       📊 Full Report: /path/to/kantra-output-*/static-report/index.html
```

### Workflow 2: Full Migration Orchestration

```
You: Migrate this Spring Boot 2.7 application to Spring Boot 3.2

Agent: [uses mta-migration]
       
       Phase 1: Analysis
       Running MTA analysis...
       Found 15 mandatory issues, 8 optional improvements
       
       Phase 2: Gap Analysis
       Identified missing rules for internal APIs
       Generating custom rules via Scribe MCP...
       Saved to: ruleset/custom-rules.yaml
       
       Phase 3: Migration Plan
       Created comprehensive plan: MIGRATION_PLAN.md
       
       Estimated effort: 42 story points
       • Dependency updates: 8 points
       • Code migrations: 28 points
       • Configuration: 6 points
       
       Would you like me to execute this migration?

You: Yes, proceed

Agent: Creating migration branch: migration/springboot27-to-32-20260519
       
       Executing Phase 1: Dependency Updates
       ✓ Updated parent POM to Spring Boot 3.2.x
       ✓ Build successful
       
       Executing Phase 2: Code Migrations
       ✓ Migrated javax.validation → jakarta.validation
       ✓ Updated SecurityConfig (removed WebSecurityConfigurerAdapter)
       ✓ Code compiles successfully
       
       Executing Phase 3: Tests
       ✓ All tests passing
       
       Migration Complete!
       Review changes: git diff main..migration/springboot27-to-32-20260519
```

## Supported Migration Targets

- **JBoss EAP**: `eap6`, `eap7`, `eap8`
- **Cloud Native**: `quarkus`, `cloud-readiness`, `camel`
- **OpenJDK**: `openjdk11`, `openjdk17`, `openjdk21`
- **Frameworks**: `spring-boot`, `jakarta-ee`

## Requirements

### Both Skills
- **AI agent** that supports skills (Claude Code, Cline, Roo-Code, etc.)
- **Java codebase** to work with

### MTA Analysis (`mta-analyze`)
- **MTA CLI** (kantra or mta-cli) - See installation instructions below

### Rules Generation (`mta-rules-gen`)
- **Scribe MCP Server** - Install from https://github.com/sshaaf/scribe
- Server must be running at http://localhost:8080/mcp/sse

### Migration Orchestration (`mta-migration`)
- **MTA CLI** (kantra or mta-cli) - See installation instructions below
- **Scribe MCP Server** (for custom rule generation) - https://github.com/sshaaf/scribe
- **Git repository** - Codebase must be in a git repo for safe branching

## Installing MTA CLI

The skills require the MTA CLI to be installed. You can use either `kantra` or `mta-cli`.

### Option 1: Installing mta-cli (Recommended for ~/.kantra setup)

1. Download the latest release from https://github.com/konveyor/kantra/releases
2. Extract the downloaded archive:
   ```bash
   tar -xzf kantra-<version>-<os>-<arch>.tar.gz
   ```
3. Rename the extracted directory to `mta-cli`:
   ```bash
   mv kantra-<version> mta-cli
   ```
4. Create the `.kantra` directory in your home folder:
   ```bash
   mkdir -p ~/.kantra
   ```
5. Move the entire `mta-cli` directory into `~/.kantra/`:
   ```bash
   mv mta-cli ~/.kantra/
   ```
6. Add to your PATH by adding this line to `~/.bashrc`, `~/.zshrc`, or `~/.bash_profile`:
   ```bash
   export PATH=$PATH:~/.kantra/mta-cli/bin
   ```
7. Reload your shell configuration:
   ```bash
   source ~/.bashrc  # or ~/.zshrc
   ```
8. Verify installation:
   ```bash
   mta-cli version
   ```

### Option 2: Installing kantra (Simpler PATH setup)

1. Download the latest release from https://github.com/konveyor/kantra/releases
2. Extract the archive
3. Add the `kantra` executable to a directory in your PATH (e.g., `/usr/local/bin` or `~/bin`)
4. Verify installation:
   ```bash
   kantra version
   ```

### Testing Your Installation

Once installed, test with a simple analysis. **Important**: You must run the command from the **parent directory** of your application, not from inside the application directory.

```bash
# Navigate to the parent directory of your application
cd /path/to/parent-directory

# Using mta-cli (analyze the app-directory subdirectory)
mta-cli analyze --output output --input <app-directory-name> --target quarkus --overwrite

# Using kantra (analyze the app-directory subdirectory)
kantra analyze --output output --input <app-directory-name> --target quarkus --overwrite
```

**Example**:
```bash
# If your app is at: /home/user/projects/my-app
# Navigate to:      /home/user/projects
cd /home/user/projects

# Then run:
mta-cli analyze --output output --input my-app --target quarkus --overwrite
```

**Note**: The `--input` cannot be `.` (current directory). You'll get an error: `input path cannot be the current directory`

The analysis report will be generated at `output/static-report/index.html`.

## What It Does

### MTA Analysis Skill
Automates the complete MTA CLI (kantra/mta-cli) analysis workflow:
- Detects migration targets from natural language requests
- Auto-discovers and offers to use custom rule sets
- Creates timestamped output directories for tracking progress
- Parses and summarizes analysis results with key metrics
- Generates detailed HTML reports for in-depth review
- Suggests next steps based on findings

### Rules Generation Skill
Enables custom migration rule creation:
- Uses Scribe MCP server for intelligent rule generation
- Creates properly formatted MTA/Konveyor YAML rulesets
- Generates rules for specific migration scenarios
- Includes effort estimates and severity levels
- Provides transformation hints and documentation links
- Saves rules in reusable format for kantra --rules flag

### Migration Orchestration Skill
Automates the complete migration lifecycle:
- Combines MTA analysis with custom rule generation
- Creates comprehensive migration plans with phases
- Manages git branches for safe execution
- Validates each phase (build, tests, startup)
- Handles dependency updates, code changes, and configuration
- Provides rollback instructions if migration fails
- Commits changes incrementally for easy review

## Compatible AI Agents

This skill works with any agent system that supports the skill format:
- **Claude Code** (CLI, desktop, web)
- **Cline** (VS Code extension)
- **Roo-Code** (VS Code extension)
- **Continue** (IDE extension)
- Other skill-compatible AI agents
