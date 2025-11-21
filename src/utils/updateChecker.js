import * as Application from 'expo-application';
import AsyncStorage from '@react-native-async-storage/async-storage';

const UPDATE_CHECK_KEY = '@last_update_check';
const SKIPPED_VERSION_KEY = '@skipped_version';
const UPDATE_CHECK_INTERVAL = 24 * 60 * 60 * 1000; // 24 hours

export const DEFAULT_UPDATE_URL = 'https://gist.githubusercontent.com/HeinMynn/199fa70bb75f48a7b9d03b5ccc09d585/raw';

/**
 * Compare two semantic version strings
 * Returns: 1 if remote > current, -1 if remote < current, 0 if equal
 */
export function compareVersions(current, remote) {
    const c = current.split('.').map(Number);
    const r = remote.split('.').map(Number);

    for (let i = 0; i < 3; i++) {
        if (r[i] > c[i]) return 1;  // Update available
        if (r[i] < c[i]) return -1; // Current is newer
    }
    return 0; // Same version
}

/**
 * Check if enough time has passed since last update check
 */
export async function shouldCheckForUpdate() {
    try {
        const lastCheck = await AsyncStorage.getItem(UPDATE_CHECK_KEY);
        if (!lastCheck) return true;

        const timeSinceLastCheck = Date.now() - parseInt(lastCheck);
        return timeSinceLastCheck >= UPDATE_CHECK_INTERVAL;
    } catch (error) {
        console.error('Error checking update timestamp:', error);
        return true;
    }
}

/**
 * Save the current timestamp as last update check
 */
export async function saveUpdateCheckTimestamp() {
    try {
        await AsyncStorage.setItem(UPDATE_CHECK_KEY, Date.now().toString());
    } catch (error) {
        console.error('Error saving update timestamp:', error);
    }
}

/**
 * Check if user has skipped this version
 */
export async function isVersionSkipped(version) {
    try {
        const skippedVersion = await AsyncStorage.getItem(SKIPPED_VERSION_KEY);
        return skippedVersion === version;
    } catch (error) {
        console.error('Error checking skipped version:', error);
        return false;
    }
}

/**
 * Save skipped version
 */
export async function skipVersion(version) {
    try {
        await AsyncStorage.setItem(SKIPPED_VERSION_KEY, version);
    } catch (error) {
        console.error('Error saving skipped version:', error);
    }
}

/**
 * Clear skipped version
 */
export async function clearSkippedVersion() {
    try {
        await AsyncStorage.removeItem(SKIPPED_VERSION_KEY);
    } catch (error) {
        console.error('Error clearing skipped version:', error);
    }
}

/**
 * Fetch update information from remote URL
 * @param {string} updateUrl - URL to the update.json file
 * @returns {Promise<Object|null>} Update info or null if no update available
 */
export async function checkForUpdates(updateUrl) {
    try {
        // Get current app version
        const currentVersion = Application.nativeApplicationVersion || '1.0.0';

        // Fetch remote update info
        const response = await fetch(updateUrl, {
            method: 'GET',
            headers: {
                'Cache-Control': 'no-cache',
            },
        });

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const updateInfo = await response.json();

        // Validate response
        if (!updateInfo.version || !updateInfo.downloadUrl) {
            throw new Error('Invalid update info format');
        }

        // Check if version is skipped
        const skipped = await isVersionSkipped(updateInfo.version);
        if (skipped && !updateInfo.forceUpdate) {
            return null;
        }

        // Compare versions
        const comparison = compareVersions(currentVersion, updateInfo.version);

        if (comparison === 1) {
            // Update available
            return {
                currentVersion,
                newVersion: updateInfo.version,
                downloadUrl: updateInfo.downloadUrl,
                releaseNotes: updateInfo.releaseNotes || 'New version available',
                forceUpdate: updateInfo.forceUpdate || false,
            };
        }

        return null; // No update available
    } catch (error) {
        console.error('Error checking for updates:', error);
        throw error;
    }
}

/**
 * Get the last update check timestamp
 */
export async function getLastUpdateCheck() {
    try {
        const lastCheck = await AsyncStorage.getItem(UPDATE_CHECK_KEY);
        return lastCheck ? new Date(parseInt(lastCheck)) : null;
    } catch (error) {
        console.error('Error getting last update check:', error);
        return null;
    }
}
