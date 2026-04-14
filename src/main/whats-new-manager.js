/**
 * WhatsNewManager - Orchestrates changelog reading, version detection, and persistence
 * Requirements: 1.1, 1.2, 1.3, 1.4, 5.1, 5.2, 5.3, 5.4
 */

const fs = require('fs');
const { parseChangelog } = require('./changelog-parser');

class WhatsNewManager {
    /**
     * @param {import('./config-store')} configStore - ConfigStore instance
     * @param {string} appVersion - Current application version
     * @param {string} changelogPath - Path to the CHANGELOG.md file
     */
    constructor(configStore, appVersion, changelogPath) {
        this.configStore = configStore;
        this.appVersion = appVersion;
        this.changelogPath = changelogPath;
    }

    /**
     * Reads the CHANGELOG.md, parses it, and determines if the modal should be shown
     * @returns {Promise<{entries: import('./changelog-parser').ChangelogEntry[], currentVersion: string, shouldShow: boolean}>}
     */
    async getChangelogData() {
        const currentVersion = this.appVersion;

        let entries;
        try {
            const content = await fs.promises.readFile(this.changelogPath, 'utf-8');
            entries = parseChangelog(content);
        } catch (err) {
            // File not found or read error — return empty entries, don't show modal
            console.warn(`[WhatsNewManager] Could not read changelog: ${err.message}`);
            return { entries: [], currentVersion, shouldShow: false };
        }

        let shouldShow;
        try {
            const lastSeenVersion = this.getLastSeenVersion();
            shouldShow = currentVersion !== lastSeenVersion;
        } catch (err) {
            // ConfigStore unavailable — fallback to showing the modal
            console.error(`[WhatsNewManager] ConfigStore error: ${err.message}`);
            shouldShow = true;
        }

        return { entries, currentVersion, shouldShow };
    }

    /**
     * Persists the version as seen in the ConfigStore
     * @param {string} version - Version string to mark as seen
     */
    markVersionSeen(version) {
        this.configStore.set('whatsNew.lastSeenVersion', version);
    }

    /**
     * Returns the last seen version from the ConfigStore, or null if not set
     * @returns {string|null}
     */
    getLastSeenVersion() {
        return this.configStore.get('whatsNew.lastSeenVersion') || null;
    }
}

module.exports = WhatsNewManager;
