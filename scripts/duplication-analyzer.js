/**
 * Code Duplication Analyzer
 * Parses jscpd reports and provides duplication metrics
 */

const fs = require('fs');
const path = require('path');

/**
 * Read and parse jscpd JSON report
 * @param {string} reportPath - Path to jscpd-report.json
 * @returns {Object} Parsed duplication data
 */
function parseDuplicationReport(reportPath = './reports/jscpd/jscpd-report.json') {
    try {
        if (!fs.existsSync(reportPath)) {
            console.warn(`Duplication report not found at ${reportPath}`);
            return null;
        }

        const reportData = JSON.parse(fs.readFileSync(reportPath, 'utf8'));

        return {
            summary: {
                totalFiles: reportData.statistics?.total?.files || 0,
                totalLines: reportData.statistics?.total?.lines || 0,
                totalTokens: reportData.statistics?.total?.tokens || 0,
                duplicatedLines: reportData.statistics?.total?.duplicatedLines || 0,
                duplicatedTokens: reportData.statistics?.total?.duplicatedTokens || 0,
                duplicatedPercentage: reportData.statistics?.total?.percentage || 0,
                clonesFound: reportData.statistics?.total?.clones || 0
            },
            clones: (reportData.duplicates || []).map(clone => ({
                format: clone.format,
                lines: clone.lines,
                tokens: clone.tokens,
                firstFile: {
                    path: clone.firstFile?.name || '',
                    start: clone.firstFile?.start || 0,
                    end: clone.firstFile?.end || 0
                },
                secondFile: {
                    path: clone.secondFile?.name || '',
                    start: clone.secondFile?.start || 0,
                    end: clone.secondFile?.end || 0
                }
            }))
        };
    } catch (error) {
        console.error('Error parsing duplication report:', error.message);
        return null;
    }
}

/**
 * Get duplication issues formatted for quality report
 * @param {number} threshold - Duplication percentage threshold
 * @returns {Array} Array of issue objects
 */
function getDuplicationIssues(threshold = 5) {
    const report = parseDuplicationReport();

    if (!report) {
        return [];
    }

    const issues = [];

    // Check if overall duplication exceeds threshold
    if (report.summary.duplicatedPercentage > threshold) {
        issues.push({
            severity: 'high',
            category: 'duplication',
            message: `Code duplication (${report.summary.duplicatedPercentage.toFixed(2)}%) exceeds threshold (${threshold}%)`,
            recommendation: `Refactor duplicated code into reusable functions or modules. Found ${report.summary.clonesFound} duplicate code blocks.`,
            file: 'multiple',
            line: 0
        });
    }

    // Add individual clone issues
    report.clones.forEach((clone, index) => {
        issues.push({
            severity: 'medium',
            category: 'duplication',
            message: `Duplicate code block found (${clone.lines} lines, ${clone.tokens} tokens)`,
            recommendation: 'Consider extracting this duplicated code into a shared function or module',
            file: clone.firstFile.path,
            line: clone.firstFile.start,
            details: {
                duplicateLocation: {
                    file: clone.secondFile.path,
                    line: clone.secondFile.start
                }
            }
        });
    });

    return issues;
}

/**
 * Generate a summary report of code duplication
 * @returns {string} Formatted summary
 */
function generateDuplicationSummary() {
    const report = parseDuplicationReport();

    if (!report) {
        return 'No duplication report available. Run `npm run duplication` first.';
    }

    const summary = report.summary;

    return `
Code Duplication Analysis
=========================
Files Analyzed: ${summary.totalFiles}
Total Lines: ${summary.totalLines}
Duplicated Lines: ${summary.duplicatedLines} (${summary.duplicatedPercentage.toFixed(2)}%)
Clones Found: ${summary.clonesFound}

Status: ${summary.duplicatedPercentage <= 5 ? '✓ PASS' : '✗ FAIL'} (Threshold: 5%)
`;
}

module.exports = {
    parseDuplicationReport,
    getDuplicationIssues,
    generateDuplicationSummary
};

// CLI usage
if (require.main === module) {
    console.log(generateDuplicationSummary());
}
