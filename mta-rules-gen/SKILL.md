---
name: mta-rules-gen
description: Generate custom migration rules for MTA (Migration Toolkit for Applications) using the Scribe MCP server. Use this skill whenever the user wants to create custom migration rules, rulesets, or patterns for Java application migrations. Trigger on phrases like "generate migration rules for X", "create custom rules for Y", "write a ruleset for Z", "I need rules to detect A", or any request involving creating, drafting, or generating MTA/Konveyor migration rules.
---

# MTA Rules Generation Skill

This skill helps generate custom migration rules for the Migration Toolkit for Applications (MTA) using the Scribe MCP server. It enables AI agents to create tailored rulesets for specific migration scenarios.

## When to Use This Skill

Use this skill when the user wants to:
- Generate custom migration rules for specific technology stacks
- Create rulesets for detecting deprecated APIs or patterns
- Define transformation rules for code modernization
- Build custom rules that extend MTA's default rule base
- Document migration patterns as executable rules

## Prerequisites Check

Before generating rules, verify the Scribe MCP server is available. The server should be accessible at `http://localhost:8080/mcp/sse`.

If Scribe is not running, inform the user they need to start it:
```bash
# Using the native binary
./scribe

# Or in dev mode
mvn quarkus:dev
```

See https://github.com/sshaaf/scribe for installation instructions.

## Workflow

### 0. Verify Scribe MCP Tools are Available

**FIRST STEP - DO THIS BEFORE ANYTHING ELSE:**

Check if you have access to Scribe MCP tools. Look for MCP tools from the Scribe server in your available tools.

If you DO NOT see any Scribe/rule-generation MCP tools:
1. **Stop immediately** - do not proceed with manual rule generation
2. Inform the user: "I cannot generate rules without the Scribe MCP server. Please ensure:
   - Scribe server is running at http://localhost:8080
   - The MCP server is configured in your Claude settings
   - Check the server health: `curl http://localhost:8080/q/health`"
3. Do not attempt to create rules manually

If you DO have Scribe MCP tools available:
- Note which tools are available for rule generation
- Proceed to step 1

### 1. Understand the Migration Scenario

Extract key information from the user's request:
- **Source technology**: What are they migrating from? (e.g., "Spring Boot 2.x", "Java EE 7", "WebLogic APIs")
- **Target technology**: What are they migrating to? (e.g., "Spring Boot 3.x", "Jakarta EE 10", "Quarkus")
- **Specific patterns**: What code patterns, APIs, or configurations need detection?
- **Desired actions**: What should happen when the pattern is found? (hint, warning, error, transformation suggestion)

**Example extractions:**
- "Create rules for Spring Boot 2 to 3 migration" → source: Spring Boot 2.x, target: Spring Boot 3.x
- "Detect usage of javax.* packages" → pattern: javax.* imports, action: suggest jakarta.* replacement
- "Flag WebLogic-specific JMS code" → source: WebLogic JMS API, target: Jakarta JMS / platform-agnostic

If the request is vague, ask clarifying questions:
- "What specific APIs or patterns should the rule detect?"
- "What severity should violations have?" (mandatory, optional, potential)
- "Should the rule suggest automatic fixes or just flag issues?"

### 2. Use Scribe MCP Server to Generate Rules

**CRITICAL: You MUST use MCP tools provided by the Scribe server. Do NOT generate rules manually.**

The Scribe MCP server running at `http://localhost:8080/mcp/sse` provides specialized tools for generating MTA migration rules. These tools understand Konveyor/MTA rule syntax and incorporate migration expertise.

**Use the `mcp__scribe__executeKantraOperation` tool:**

This is THE tool you must use to generate MTA rules. It accepts:
- **operation**: The type of rule to create (e.g., "CREATE_JAVA_CLASS_RULE", "CREATE_JAVA_IMPORT_RULE", "CREATE_GO_REFERENCED_RULE", etc.)
- **params**: JSON string with rule parameters including:
  - `ruleID`: Unique identifier (e.g., "springboot-2-to-3-001")
  - `javaPattern` or `pattern`: The code pattern to detect (e.g., "javax.validation.*")
  - `location`: Where to detect (IMPORT, CLASS, METHOD_CALL, ANNOTATION, etc.)
  - `message`: Detailed migration guidance (minimum 10 lines in markdown with Before/After examples)
  - `category`: MANDATORY, OPTIONAL, or POTENTIAL
  - `effort`: Story points (1-13)
  - `labels`: Clear source/target tags (e.g., "konveyor.io/source=springboot2", "konveyor.io/target=springboot3")
  - `links`: Array of {title, url} with documentation links

**Example call:**
```
mcp__scribe__executeKantraOperation(
  operation: "CREATE_JAVA_IMPORT_RULE",
  params: {
    "ruleID": "springboot-27-to-32-javax-validation-001",
    "javaPattern": "javax.validation.*",
    "message": "javax.validation has been replaced with jakarta.validation in Spring Boot 3.x...",
    "category": "MANDATORY",
    "effort": 1,
    "labels": ["konveyor.io/source=springboot2", "konveyor.io/target=springboot3"],
    "links": [{"title": "Jakarta EE Migration", "url": "https://..."}]
  }
)
```

**Important**: Call this tool multiple times if you need to create multiple rules for different patterns. Each tool call generates one rule.

**Why you must use Scribe MCP tools:**
- Ensures correct MTA/Konveyor YAML schema
- Incorporates migration best practices and expertise
- Generates proper effort estimates based on complexity
- Includes relevant documentation links automatically
- Validates rule syntax before returning

**IMPORTANT**: If Scribe MCP tools are not available in your tool list, inform the user that the Scribe MCP server needs to be configured in their Claude settings or that the server may not be running. Do NOT attempt to generate rules manually - the whole point of this skill is to use the Scribe MCP server.

### 3. Review and Customize Generated Rules

After Scribe generates the initial rules:

1. **Review the rule structure** for completeness:
   - Does it have clear condition patterns?
   - Are the messages helpful and actionable?
   - Is the effort estimation reasonable?
   - Are there links to migration guides?

2. **Show the user** the generated rules and explain:
   - What patterns the rule detects
   - What severity/category was assigned
   - What actions will be taken when the rule fires
   - The estimated effort (story points) for addressing issues

3. **Offer customization options**:
   - Adjust effort estimates
   - Modify messages or add more context
   - Add or remove condition patterns
   - Change severity levels
   - Add custom tags or categories

### 4. Save Rules to Output File

Save the generated rules to a YAML file in an appropriate location:

**Suggested naming patterns:**
- `<source>-to-<target>-rules.yaml` (e.g., `springboot2-to-springboot3-rules.yaml`)
- `<technology>-migration-rules.yaml` (e.g., `weblogic-migration-rules.yaml`)
- `custom-<description>-rules.yaml` (e.g., `custom-api-detection-rules.yaml`)

**Default location**: Save to `./migration-rules/` directory if it exists, otherwise save to the current directory.

```bash
# Create rules directory if needed
mkdir -p migration-rules

# Save the generated rules
cat > migration-rules/custom-rules.yaml <<'EOF'
[generated rule content]
EOF
```

**Why organized storage matters**: Keeping rules in a dedicated directory makes them easy to find and use with kantra's `--rules` flag. Users can point MTA analysis at this directory to apply all custom rules.

### 5. Validate Rule Syntax (Optional)

If possible, perform basic validation:
- Check YAML syntax is valid
- Verify required fields are present (id, message, when conditions)
- Confirm effort values are numeric
- Ensure tag format is correct

You can do basic validation with:
```bash
# Check YAML syntax
python3 -c "import yaml; yaml.safe_load(open('migration-rules/custom-rules.yaml'))" && echo "✓ Valid YAML" || echo "✗ YAML syntax error"
```

### 6. Provide Usage Instructions

After generating and saving rules, tell the user how to use them:

```
Custom rules saved to: migration-rules/<filename>.yaml

To use these rules with MTA analysis:

1. Run kantra with the --rules flag:
   kantra analyze \
     --input=. \
     --output=analysis-output \
     --target=<target> \
     --rules=./migration-rules \
     --overwrite

2. Or if you want to use only these specific rules:
   kantra analyze \
     --input=. \
     --output=analysis-output \
     --rules=migration-rules/<filename>.yaml \
     --overwrite

3. The rules will appear in the analysis report alongside default MTA rules.
```

### 7. Offer Next Steps

After rule generation, suggest helpful follow-up actions:
- "Would you like to test these rules on your codebase now?"
- "Should I create additional rules for related patterns?"
- "Would you like me to run an MTA analysis using these custom rules?"

## Rule Structure Reference

MTA rules follow this general YAML structure:

```yaml
---
- ruleID: unique-rule-identifier
  description: What this rule detects and why
  when:
    # Condition patterns - what to look for
    java.referenced:
      pattern: "com.example.deprecated.*"
    # or xml, file, etc.
  perform:
    # Actions when pattern matches
    message: "Clear description of the issue and how to fix it"
    category: mandatory  # or optional, potential
    effort: 3  # story points
    tags:
      - deprecated-api
      - spring-boot
    links:
      - title: "Migration Guide"
        url: "https://..."
```

**Key fields explained:**
- `ruleID`: Unique identifier (use kebab-case: `my-custom-rule-123`)
- `when`: Condition patterns (what code to detect)
- `message`: Helpful explanation shown to developers
- `category`: Severity - mandatory (must fix), optional (should fix), potential (might need fixing)
- `effort`: Estimated story points (1-13, where 1=trivial, 13=very complex)
- `tags`: Labels for categorization and filtering
- `links`: Documentation and migration guide references

## Common Rule Patterns

### Detecting Deprecated Imports

```yaml
when:
  java.referenced:
    pattern: "javax.servlet.*"
perform:
  message: "javax.servlet has been replaced with jakarta.servlet"
  category: mandatory
  effort: 1
```

### Detecting Method Calls

```yaml
when:
  java.referenced:
    location: METHOD_CALL
    pattern: "org.springframework.boot.autoconfigure.EnableAutoConfiguration"
perform:
  message: "EnableAutoConfiguration is deprecated in Spring Boot 3"
  category: optional
  effort: 2
```

### Detecting Annotations

```yaml
when:
  java.referenced:
    location: ANNOTATION
    pattern: "javax.ejb.*"
perform:
  message: "EJB annotations should be replaced with CDI or Spring equivalents"
  category: mandatory
  effort: 5
```

### XML Configuration Detection

```yaml
when:
  xmlfile.matches:
    xpath: "//web-app[@version='2.5']"
perform:
  message: "Servlet 2.5 web.xml should be upgraded to Jakarta Servlet 5.0+"
  category: mandatory
  effort: 3
```

## Tips for Effective Rules

1. **Be specific in patterns**: Use precise package/class names rather than broad wildcards
2. **Provide actionable messages**: Tell users what to change, not just what's wrong
3. **Link to documentation**: Include migration guides or API documentation
4. **Estimate effort realistically**: 1 = simple find/replace, 5 = moderate refactoring, 13 = major redesign
5. **Use appropriate severity**:
   - `mandatory`: Breaks functionality or prevents deployment
   - `optional`: Best practice or recommended change
   - `potential`: Might need attention depending on usage
6. **Tag consistently**: Use standard tags (deprecated-api, configuration, security, etc.) for filtering

## Error Handling

**Scribe MCP tools not available**:
```
I cannot generate MTA rules without access to the Scribe MCP server tools.

Current status:
- I don't see any Scribe MCP tools in my available tools
- The Scribe server may not be running or not configured

Please ensure:
1. Scribe server is running:
   - Start with: mvn quarkus:dev
   - Or use native binary: ./scribe
   - Verify: curl http://localhost:8080/q/health

2. Scribe MCP server is configured in Claude settings:
   - Add Scribe MCP server configuration to your Claude MCP settings
   - Server URL: http://localhost:8080/mcp/sse
   - Restart Claude if needed

Once configured, I'll be able to use Scribe's rule generation tools.
```

**Unclear rule requirements**:
If the user's request doesn't provide enough detail to generate meaningful rules, ask:
- "What specific Java packages, classes, or methods should this rule detect?"
- "What's the migration target? (e.g., Quarkus, Spring Boot 3, Jakarta EE)"
- "What should developers do when this pattern is found?"
- "How critical is this change? (breaking change vs. best practice)"

**Invalid rule syntax**:
If generated rules have syntax errors, check:
- YAML indentation is correct (use 2 spaces, not tabs)
- Required fields are present (ruleID, when, perform)
- Effort values are numbers, not strings
- Pattern syntax matches MTA's query language

## Examples

**Example 1: Spring Boot 2 to 3 Migration Rules**
```
User: "I need rules to detect Spring Boot 2 dependencies that need upgrading to version 3"

Actions:
1. Understand requirement: detect Spring Boot 2.x dependencies, suggest 3.x versions
2. Use Scribe MCP to generate rules for common Spring Boot 2→3 changes
3. Generate rules covering:
   - spring-boot-starter-* version changes
   - Deprecated autoconfiguration classes
   - javax.* to jakarta.* package migrations
4. Save to migration-rules/springboot2-to-3-rules.yaml
5. Show user the generated rules with explanations
6. Provide usage command with --rules flag
```

**Example 2: Detecting Proprietary WebLogic APIs**
```
User: "Create rules to flag WebLogic-specific JMS code so we can replace it with standard Jakarta JMS"

Actions:
1. Identify patterns: weblogic.jms.* packages, WebLogic-specific classes
2. Use Scribe to generate rules detecting:
   - weblogic.jms.* imports
   - WebLogic JMSContext and related classes
   - WebLogic-specific configuration
3. Add transformation hints pointing to Jakarta JMS equivalents
4. Set category: mandatory (vendor lock-in removal)
5. Estimate effort: 5-8 points (requires API replacement + testing)
6. Save to migration-rules/weblogic-jms-migration-rules.yaml
7. Explain each rule's purpose and provide usage instructions
```

**Example 3: Custom API Deprecation Rules**
```
User: "Our company deprecated the com.acme.legacy.* packages. Generate rules to flag their usage and suggest the new com.acme.modern.* equivalents"

Actions:
1. Extract info: deprecated package (com.acme.legacy.*), replacement (com.acme.modern.*)
2. Use Scribe to create detection rules for:
   - Package imports
   - Class references
   - Method calls
3. Customize messages with company-specific migration guide links
4. Set appropriate effort based on API complexity
5. Save to migration-rules/acme-legacy-api-rules.yaml
6. Show sample matched patterns and transformation hints
7. Suggest testing on a sample codebase
```

## Integration with MTA Analysis

These custom rules work seamlessly with the MTA analysis workflow:

1. **Generate rules** using this skill (mta-rules-gen)
2. **Run analysis** using the mta-analyze skill with `--rules=./migration-rules`
3. **Review results** in the MTA HTML report, where custom rules appear alongside default rules
4. **Iterate**: Refine rules based on analysis results, adjust effort estimates, improve messages

**Workflow example:**
```
# Step 1: Generate custom rules
You: "Generate rules for detecting Java EE 7 to Jakarta EE 10 migration issues"
Agent: [uses mta-rules-gen skill] → creates migration-rules/javaee-to-jakarta-rules.yaml

# Step 2: Run analysis with custom rules
You: "Now analyze this codebase for Jakarta EE 10 migration using those custom rules"
Agent: [uses mta-analyze skill]
  kantra analyze --target=jakarta-ee --rules=./migration-rules --input=. --output=analysis-output

# Step 3: Review and refine
Agent: Shows findings from both default and custom rules
You: "The effort estimate for javax to jakarta seems low, increase it to 3 points"
Agent: [regenerates rules with adjusted effort] → updates migration-rules/javaee-to-jakarta-rules.yaml
```

This creates a powerful workflow: generate targeted rules, analyze code, refine rules based on results.
