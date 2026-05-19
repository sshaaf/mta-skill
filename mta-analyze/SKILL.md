---
name: mta-analyze
description: Analyze Java codebases for migration using Konveyor kantra CLI. Use this skill whenever the user mentions analyzing a codebase for migration, modernization, or technology transformation - especially to EAP (JBoss Enterprise Application Platform), Quarkus, cloud-native platforms, or general cloud-readiness. Trigger on phrases like "analyze for migration to X", "check migration to Y", "run kantra", "analyze this app for Z", "migration assessment", or any request involving codebase analysis for technology transitions.
---

# Kantra Analysis Skill

This skill helps analyze Java codebases using the Konveyor kantra CLI tool to assess migration readiness and identify issues when moving between technology stacks.

## When to Use This Skill

Use this skill when the user wants to:
- Analyze a codebase for migration to a specific target (EAP, Quarkus, Spring Boot, cloud platforms, etc.)
- Assess migration effort or identify blockers
- Run kantra analysis with custom or default rules
- Get migration recommendations for Java applications

## Prerequisites Check

Before running analysis, verify kantra is installed:

```bash
kantra version
```

If kantra is not found, inform the user they need to install it from https://github.com/konveyor/kantra/releases and add it to their PATH.

## Workflow

### 1. Understand the Request

Extract the migration target from the user's request. Common patterns:
- "analyze for migration to EAP 8" → target: `eap8`
- "check migration to Quarkus" → target: `quarkus`
- "cloud readiness assessment" → target: `cloud-readiness`
- "analyze for EAP" (version unspecified) → ask which EAP version (e.g., eap7, eap8)

If the target is ambiguous, ask the user to clarify. You can list available targets:

```bash
kantra analyze --list-targets
```

### 2. Identify the Input Path

The input path is typically the current working directory where the user opened Claude, unless they specify otherwise. Confirm the path:

**Why this matters**: Kantra needs the root of the Java application to analyze all source files and dependencies correctly.

### 3. Auto-Detect Custom Rules

Before running analysis, check for custom rules in common locations:

```bash
# Check common rule directory locations
for dir in rules custom-rules .kantra/rules .konveyor/rules; do
  if [ -d "$dir" ]; then
    echo "Found: $dir"
    find "$dir" -name "*.yaml" -o -name "ruleset.yaml" | head -5
  fi
done
```

If custom rules are found:
- Tell the user which directory contains rules
- Ask: "I found custom rules in `<directory>`. Would you like to include these in the analysis?"
- If yes, use `--rules <directory>` flag when running kantra

**Why auto-detect matters**: Custom rules often capture project-specific migration concerns that default rules miss. The user may forget they have them.

### 4. Set Up Output Directory

Create a timestamped output directory to preserve analysis results:

```bash
OUTPUT_DIR="kantra-output-$(date +%Y%m%d-%H%M%S)"
mkdir -p "$OUTPUT_DIR"
```

**Why timestamped**: Multiple analyses can be compared over time as code evolves.

### 5. Run Kantra Analysis

Execute kantra with appropriate flags:

**Basic command** (no custom rules):
```bash
kantra analyze \
  --input=. \
  --output="$OUTPUT_DIR" \
  --target=<target> \
  --overwrite
```

**With custom rules**:
```bash
kantra analyze \
  --input=. \
  --output="$OUTPUT_DIR" \
  --target=<target> \
  --rules=<custom-rules-path> \
  --overwrite
```

**Common flags to consider**:
- `--source=<source>` - Filter by source technology if known (e.g., `--source=eap6`)
- `--mode=source-only` - Faster analysis, source code only (skip binaries)
- `--label-selector=<labels>` - Filter rules by labels

Run the command and capture the output. Analysis may take several minutes for large codebases.

### 6. Parse and Summarize Results

After analysis completes, the output directory contains:
- `static-report/index.html` - Main HTML report (open in browser)
- `analysis.log` - Detailed execution log
- `dependencies.yaml` - Dependency analysis
- Various YAML files with findings

Read the analysis summary and present key findings to the user:

```bash
# Check if analysis succeeded
if [ -f "$OUTPUT_DIR/static-report/index.html" ]; then
  echo "Analysis complete!"
  
  # Look for summary information in output
  if [ -f "$OUTPUT_DIR/output.yaml" ]; then
    # Parse key metrics from output.yaml if available
    grep -E "incidents|story-points|effort" "$OUTPUT_DIR/output.yaml" || true
  fi
fi
```

Present a summary including:
1. **Total issues found** (by category: mandatory, optional, potential)
2. **Estimated effort** (story points if available)
3. **Top issue categories** (what types of changes are most common)
4. **Path to HTML report** for detailed review

**Example summary format**:
```
Migration Analysis Complete for <target>

Key Findings:
• Total Issues: X mandatory, Y optional, Z potential
• Estimated Effort: N story points
• Top Categories:
  - Database migration concerns (XX issues)
  - Deprecated API usage (YY issues)
  - Configuration changes needed (ZZ issues)

📊 Full Report: <absolute-path-to-output-dir>/static-report/index.html

To view the detailed report with code snippets and recommendations:
  open <absolute-path-to-output-dir>/static-report/index.html
```

### 7. Offer Next Steps

After presenting results, offer helpful next steps:

- "Would you like me to help address any of the issues found?"
- "Should I look at the detailed findings for a specific category?"
- "Would you like to run analysis with different targets or filters?"

## Common Migration Targets

Reference these target values when the user requests analysis:

**JBoss EAP**:
- `eap8` - JBoss EAP 8
- `eap7` - JBoss EAP 7
- `eap6` - JBoss EAP 6

**Cloud & Containers**:
- `cloud-readiness` - General cloud-native readiness
- `quarkus` - Quarkus framework
- `camel` - Apache Camel (various versions)

**Other**:
- `openjdk11`, `openjdk17`, `openjdk21` - OpenJDK version migrations
- `jakarta-ee` - Jakarta EE transformation
- `spring-boot` - Spring Boot migration

List all available targets: `kantra analyze --list-targets`

## Error Handling

**Kantra not installed**:
```
I need kantra CLI to run this analysis, but it's not installed.

Install it from: https://github.com/konveyor/kantra/releases

Download the latest release, extract it, and add the kantra executable to your PATH.
```

**Analysis fails**:
- Check the analysis.log in the output directory
- Common issues: insufficient permissions, invalid target name, malformed custom rules
- Suggest rerunning with `--mode=source-only` if dependency analysis fails

**Empty or unexpected output**:
- Verify the input path contains Java source files
- Check if the target is appropriate for the codebase
- Suggest listing targets/sources to verify correct names

## Tips for Best Results

1. **Target specificity**: Use specific versions (e.g., `eap8` not just "EAP") for more accurate results
2. **Clean builds**: Run on a clean workspace without build artifacts for faster analysis  
3. **Custom rules**: Project-specific rules significantly improve migration accuracy
4. **Incremental analysis**: Compare reports over time as migration progresses
5. **Source filtering**: Use `--source` to focus on specific migration paths (e.g., `--source=eap6 --target=eap8`)

## Examples

**Example 1: Basic EAP 8 migration**
```
User: "Analyze this codebase for migration to EAP 8"

Actions:
1. Verify kantra installed
2. Check for custom rules (found none)
3. Run: kantra analyze --input=. --output=kantra-output-20260519-143022 --target=eap8 --overwrite
4. Parse results and show summary
5. Provide path to HTML report
```

**Example 2: Quarkus migration with custom rules**
```
User: "Check if we can migrate to Quarkus"

Actions:
1. Verify kantra installed
2. Auto-detect custom rules → found in ./rules/
3. Ask: "Found custom rules in ./rules/. Include them? (y/n)"
4. User: "yes"
5. Run: kantra analyze --input=. --output=kantra-output-20260519-143530 --target=quarkus --rules=./rules --overwrite
6. Parse results and show summary with custom rule findings
7. Provide path to HTML report
```

**Example 3: Cloud readiness**
```
User: "I need a cloud readiness assessment"

Actions:
1. Verify kantra installed
2. Check for custom rules (none found)
3. Run: kantra analyze --input=. --output=kantra-output-20260519-144012 --target=cloud-readiness --overwrite
4. Highlight cloud-specific concerns (stateful sessions, local file I/O, etc.)
5. Provide path to HTML report
```
