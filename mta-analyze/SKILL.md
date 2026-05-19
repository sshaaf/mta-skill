---
name: mta-analyze
description: Analyze Java codebases for migration using Konveyor MTA CLI (kantra or mta-cli). Use this skill whenever the user mentions analyzing a codebase for migration, modernization, or technology transformation - especially to EAP (JBoss Enterprise Application Platform), Quarkus, cloud-native platforms, or general cloud-readiness. Trigger on phrases like "analyze for migration to X", "check migration to Y", "run kantra", "run mta-cli", "analyze this app for Z", "migration assessment", or any request involving codebase analysis for technology transitions.
---

# MTA Analysis Skill

This skill helps analyze Java codebases using the Konveyor MTA CLI tool (available as `kantra` or `mta-cli`) to assess migration readiness and identify issues when moving between technology stacks.

## When to Use This Skill

Use this skill when the user wants to:
- Analyze a codebase for migration to a specific target (EAP, Quarkus, Spring Boot, cloud platforms, etc.)
- Assess migration effort or identify blockers
- Run MTA analysis with custom or default rules
- Get migration recommendations for Java applications

## Prerequisites Check

Before running analysis, verify the MTA CLI is installed. The tool may be available as either `kantra` or `mta-cli`:

```bash
# Check for kantra first
if command -v kantra >/dev/null 2>&1; then
  MTA_CLI="kantra"
  kantra version
elif command -v mta-cli >/dev/null 2>&1; then
  MTA_CLI="mta-cli"
  mta-cli version
else
  echo "Error: MTA CLI not found. Please install it first."
  exit 1
fi
```

### Installation Instructions

If the MTA CLI is not found, the user needs to install it:

**For mta-cli:**
1. Download from https://github.com/konveyor/kantra/releases
2. Extract the downloaded archive
3. Rename the extracted directory to `mta-cli`
4. Create the `.kantra` directory: `mkdir -p ~/.kantra`
5. Move the entire `mta-cli` directory to `~/.kantra/mta-cli`
6. Add to PATH: `export PATH=$PATH:~/.kantra/mta-cli/bin` (add to ~/.bashrc or ~/.zshrc)
7. Verify: `mta-cli version`

**For kantra:**
1. Download from https://github.com/konveyor/kantra/releases
2. Extract and add the `kantra` executable to your PATH
3. Verify: `kantra version`

**Use `$MTA_CLI` in all subsequent commands** instead of hardcoding the tool name.

## Workflow

### 1. Understand the Request

Extract the migration target from the user's request. Common patterns:
- "analyze for migration to EAP 8" → target: `eap8`
- "check migration to Quarkus" → target: `quarkus`
- "cloud readiness assessment" → target: `cloud-readiness`
- "analyze for EAP" (version unspecified) → ask which EAP version (e.g., eap7, eap8)

If the target is ambiguous, ask the user to clarify. You can list available targets:

```bash
$MTA_CLI analyze --list-targets
```

### 2. Identify the Input Path

**IMPORTANT**: The MTA CLI does not allow analyzing the current directory (`.`). You must be in the **parent directory** and specify the application directory name.

**Correct setup**:
```bash
# If the user is inside the application directory
cd ..

# Then analyze the application directory by name
mta-cli analyze --output output --input <app-directory-name> --target <target> --overwrite
```

**Example**:
```bash
# User is in: /home/user/projects/my-app
# Move up:     cd /home/user/projects
# Analyze:     mta-cli analyze --output output --input my-app --target quarkus --overwrite
```

**Error you'll see if you try to analyze current directory**:
```
Error: input path /path/to/app cannot be the current directory
```

**Why this matters**: The MTA CLI requires the input to be a subdirectory, not the current working directory. This ensures proper analysis context.

**Helper workflow to get the directory names**:
```bash
# Get current directory name
APP_DIR=$(basename "$PWD")

# Get parent directory path
PARENT_DIR=$(dirname "$PWD")

# Navigate to parent
cd "$PARENT_DIR"

# Run analysis with app directory name
$MTA_CLI analyze --output output --input "$APP_DIR" --target <target> --overwrite

# Optionally return to original directory
cd "$APP_DIR"
```

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
- If yes, use `--rules <directory>` flag when running the MTA CLI

**Why auto-detect matters**: Custom rules often capture project-specific migration concerns that default rules miss. The user may forget they have them.

### 4. Set Up Output Directory

Create an output directory to preserve analysis results:

```bash
# Simple output directory
OUTPUT_DIR="output"

# Or timestamped for multiple analyses
OUTPUT_DIR="output-$(date +%Y%m%d-%H%M%S)"

mkdir -p "$OUTPUT_DIR"
```

**Why separate outputs**: Multiple analyses can be compared over time as code evolves.

### 5. Run MTA Analysis

Execute the MTA CLI with appropriate flags. **CRITICAL**: You must `cd` to the parent directory first - the `--input` cannot be the current directory (`.`).

**Step 1**: Navigate to parent directory of the application:
```bash
# If user is in /path/to/my-app, move up one level
cd ..
# Now in /path/to/
```

**Step 2**: Run analysis from parent directory:

**Basic command**:
```bash
$MTA_CLI analyze \
  --output "$OUTPUT_DIR" \
  --input <app-directory-name> \
  --target <target> \
  --overwrite
```

**With custom rules** (rules directory should be relative to where you run the command):
```bash
$MTA_CLI analyze \
  --output "$OUTPUT_DIR" \
  --input <app-directory-name> \
  --target <target> \
  --rules <custom-rules-path> \
  --overwrite
```

**Real-world example**:
```bash
# From parent directory /Users/sshaaf/git/konveyor/getting-started/
mta-cli analyze \
  --output output \
  --input coolstore \
  --target quarkus \
  --overwrite
```

**With custom rules example**:
```bash
# Rules can be inside the app directory
mta-cli analyze \
  --output output \
  --input my-app \
  --target eap8 \
  --rules my-app/custom-rules \
  --overwrite
```

**Common flags to consider**:
- `--source <source>` - Filter by source technology if known (e.g., `--source eap6`)
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

List all available targets: `$MTA_CLI analyze --list-targets`

## Error Handling

**MTA CLI not installed**:
```
I need the MTA CLI (kantra or mta-cli) to run this analysis, but it's not installed.

Install it from: https://github.com/konveyor/kantra/releases

Download the latest release, extract it, and add the executable to your PATH as either 'kantra' or 'mta-cli'.
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
Working directory: /home/user/projects/my-eap-app

Actions:
1. Detect MTA CLI (found as 'kantra')
2. Check for custom rules (found none)
3. Get current directory name: my-eap-app
4. Move to parent: cd /home/user/projects
5. Run: kantra analyze --output output --input my-eap-app --target eap8 --overwrite
6. Parse results and show summary
7. Provide path to HTML report: output/static-report/index.html
```

**Example 2: Quarkus migration with custom rules**
```
User: "Check if we can migrate to Quarkus"
Working directory: /home/user/apps/coolstore

Actions:
1. Detect MTA CLI (found as 'mta-cli')
2. Auto-detect custom rules → found in ./rules/
3. Ask: "Found custom rules in ./rules/. Include them? (y/n)"
4. User: "yes"
5. Get current directory name: coolstore
6. Move to parent: cd /home/user/apps
7. Run: mta-cli analyze --output output --input coolstore --target quarkus --rules coolstore/rules --overwrite
8. Parse results and show summary with custom rule findings
9. Provide path to HTML report: output/static-report/index.html
```

**Example 3: Cloud readiness**
```
User: "I need a cloud readiness assessment"
Working directory: /home/user/legacy-app

Actions:
1. Detect MTA CLI (found as 'kantra')
2. Check for custom rules (none found)
3. Get current directory name: legacy-app
4. Move to parent: cd /home/user
5. Run: kantra analyze --output output --input legacy-app --target cloud-readiness --overwrite
6. Highlight cloud-specific concerns (stateful sessions, local file I/O, etc.)
7. Provide path to HTML report: output/static-report/index.html
```
