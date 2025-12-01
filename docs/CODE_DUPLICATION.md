# Code Duplication Detection

This document describes the code duplication detection setup for MD Editor Pro.

## Overview

We use [jscpd](https://github.com/kucherenko/jscpd) to detect copy-paste code across the codebase. The tool analyzes JavaScript files and identifies duplicated code blocks that could be refactored into reusable functions or modules.

## Configuration

The duplication detection is configured in `.jscpd.json`:

- **Threshold**: 5% - The maximum acceptable duplication percentage
- **Min Lines**: 5 - Minimum number of lines to consider as duplication
- **Min Tokens**: 50 - Minimum number of tokens to consider as duplication
- **Reporters**: HTML, JSON, and Console output
- **Output**: Reports are saved to `./reports/jscpd/`

### Ignored Paths

The following paths are excluded from duplication analysis:
- `node_modules/`
- `dist/`
- `build/`
- `coverage/`
- Test files (`**/*.test.js`, `**/*.spec.js`)
- `.git/`
- `.kiro/`

## Usage

### Run Duplication Detection

```bash
# Run duplication detection with console output
npm run duplication

# Generate full reports (HTML, JSON, console)
npm run duplication:report

# View summary of duplication metrics
npm run duplication:summary
```

### View Reports

After running duplication detection, reports are available at:

- **HTML Report**: `reports/jscpd/html/index.html` - Interactive visual report
- **JSON Report**: `reports/jscpd/jscpd-report.json` - Machine-readable data
- **Console**: Immediate feedback in terminal

## Understanding Results

### Metrics

- **Files Analyzed**: Total number of JavaScript files scanned
- **Total Lines**: Total lines of code analyzed
- **Duplicated Lines**: Number of lines that are duplicated
- **Duplicated Percentage**: Percentage of code that is duplicated
- **Clones Found**: Number of duplicate code blocks detected

### Thresholds

- **Pass**: Duplication ≤ 5%
- **Fail**: Duplication > 5%

### Clone Information

Each detected clone includes:
- File paths of both occurrences
- Line numbers (start and end)
- Number of lines and tokens duplicated

## Integration with Quality Reports

The duplication analyzer (`scripts/duplication-analyzer.js`) provides utilities to integrate duplication metrics into the overall code quality reporting system:

```javascript
const { parseDuplicationReport, getDuplicationIssues } = require('./scripts/duplication-analyzer');

// Get parsed duplication data
const report = parseDuplicationReport();

// Get issues formatted for quality reports
const issues = getDuplicationIssues(5); // 5% threshold
```

## Addressing Duplication

When duplication is detected:

1. **Review the duplicated code** - Open the HTML report to see exact locations
2. **Identify common patterns** - Look for repeated logic that can be extracted
3. **Refactor into shared functions** - Create utility functions or modules
4. **Update imports** - Replace duplicated code with calls to shared functions
5. **Re-run detection** - Verify duplication percentage has decreased

### Common Refactoring Strategies

- Extract duplicated logic into utility functions
- Create base classes for shared behavior
- Use composition over duplication
- Create configuration objects for similar patterns
- Use higher-order functions for repeated operations

## CI Integration

To integrate duplication detection into CI/CD:

```bash
# In your CI pipeline
npm run duplication

# This will exit with code 1 if duplication exceeds threshold
```

## Maintenance

- Review duplication reports regularly (weekly/monthly)
- Update thresholds as codebase matures
- Document intentional duplication (if any)
- Track duplication trends over time

## Current Status

As of the last analysis:
- Duplication: 4.19%
- Status: ✓ PASS (below 5% threshold)
- Clones Found: 21

Run `npm run duplication:summary` for current metrics.
