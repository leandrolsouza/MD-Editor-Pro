/**
 * Tests for duplication analyzer
 */

const fs = require('fs');
const path = require('path');
const { parseDuplicationReport, getDuplicationIssues, generateDuplicationSummary } = require('./duplication-analyzer');

describe('Duplication Analyzer', () => {
    const testReportPath = path.join(__dirname, '../reports/jscpd/jscpd-report.json');

    describe('parseDuplicationReport', () => {
        it('should return null if report file does not exist', () => {
            const result = parseDuplicationReport('./nonexistent-report.json');
            expect(result).toBeNull();
        });

        it('should parse existing report correctly', () => {
            // Skip if report doesn't exist
            if (!fs.existsSync(testReportPath)) {
                console.log('Skipping test - run npm run duplication first');
                return;
            }

            const result = parseDuplicationReport(testReportPath);
            expect(result).toBeDefined();
            expect(result).toHaveProperty('summary');
            expect(result).toHaveProperty('clones');
            expect(result.summary).toHaveProperty('totalLines');
            expect(result.summary).toHaveProperty('duplicatedPercentage');
            expect(Array.isArray(result.clones)).toBe(true);
        });
    });

    describe('getDuplicationIssues', () => {
        it('should return empty array if no report exists', () => {
            const issues = getDuplicationIssues(5);
            // Will return empty if report doesn't exist
            expect(Array.isArray(issues)).toBe(true);
        });

        it('should format issues correctly when report exists', () => {
            // Skip if report doesn't exist
            if (!fs.existsSync(testReportPath)) {
                console.log('Skipping test - run npm run duplication first');
                return;
            }

            const issues = getDuplicationIssues(5);
            expect(Array.isArray(issues)).toBe(true);

            if (issues.length > 0) {
                const issue = issues[0];
                expect(issue).toHaveProperty('severity');
                expect(issue).toHaveProperty('category');
                expect(issue).toHaveProperty('message');
                expect(issue).toHaveProperty('recommendation');
                expect(issue.category).toBe('duplication');
            }
        });
    });

    describe('generateDuplicationSummary', () => {
        it('should return a string summary', () => {
            const summary = generateDuplicationSummary();
            expect(typeof summary).toBe('string');
            expect(summary.length).toBeGreaterThan(0);
        });

        it('should include key metrics in summary', () => {
            const summary = generateDuplicationSummary();
            expect(summary).toContain('Code Duplication Analysis');
            expect(summary).toContain('Files Analyzed');
            expect(summary).toContain('Total Lines');
            expect(summary).toContain('Duplicated Lines');
            expect(summary).toContain('Clones Found');
        });
    });
});
