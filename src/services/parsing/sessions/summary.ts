
import { decodeProjectName, GLOBAL_SESSIONS_ID, SYSTEM_SESSIONS_ID, UNKNOWN_PROJECT_PATH } from '../../analytics/projects';
import { SessionSummary, SessionPathUsage, SessionStoryRole } from '../../../model/sessions';
import { ParsedSessionSnapshot } from './types';

function resolveProjectId(snapshot: ParsedSessionSnapshot): string | null {
    if (snapshot.directoryId) {
        return snapshot.directoryId;
    }
    const path = snapshot.projectPath;
    if (path === UNKNOWN_PROJECT_PATH) {
        if (snapshot.kind === 'chat') return GLOBAL_SESSIONS_ID;
        if (snapshot.kind === 'file-history-only') return SYSTEM_SESSIONS_ID;
        return null;
    }
    return path; 
}

function groupSnapshotsBySessionId(raw: ParsedSessionSnapshot[]): Map<string, ParsedSessionSnapshot[]> {
    const byId = new Map<string, ParsedSessionSnapshot[]>();
    for (const snap of raw) {
        if (!snap.id) continue;
        const arr = byId.get(snap.id) ?? [];
        arr.push(snap);
        byId.set(snap.id, arr);
    }
    return byId;
}

function pickPrimaryProjectId(snapshots: ParsedSessionSnapshot[]): string | null {
    const projectCounts = new Map<string, number>();
    let bestProjectId: string | null = null;
    let maxCount = -1;

    for (const snap of snapshots) {
        const pid = resolveProjectId(snap);
        if (pid) {
            const count = (projectCounts.get(pid) || 0) + 1;
            projectCounts.set(pid, count);
            if (count > maxCount) {
                maxCount = count;
                bestProjectId = pid;
            }
        }
    }
    return bestProjectId;
}

function pickBaseSnapshot(snapshots: ParsedSessionSnapshot[]): ParsedSessionSnapshot | undefined {
    let baseSnapshot: ParsedSessionSnapshot | undefined;
    for (const snap of snapshots) {
        if (!baseSnapshot) {
            baseSnapshot = snap;
            continue;
        }
        if (snap.lastEventAt > baseSnapshot.lastEventAt) {
            baseSnapshot = snap;
        }
    }
    return baseSnapshot;
}

function buildPathUsages(snapshots: ParsedSessionSnapshot[]): SessionPathUsage[] {
    const pathUsageMap = new Map<string, SessionPathUsage>();
    for (const snap of snapshots) {
        const path = snap.projectPath;
        const existing = pathUsageMap.get(path);
        const pid = resolveProjectId(snap);

        if (!existing) {
            pathUsageMap.set(path, {
                path,
                projectId: pid,
                firstEventAt: snap.firstEventAt,
                lastEventAt: snap.lastEventAt,
                messageCount: snap.messageCount
            });
        } else {
            if (snap.firstEventAt < existing.firstEventAt) existing.firstEventAt = snap.firstEventAt;
            if (snap.lastEventAt > existing.lastEventAt) existing.lastEventAt = snap.lastEventAt;
            existing.messageCount += snap.messageCount;
        }
    }
    return Array.from(pathUsageMap.values());
}

function mergeFeatureFlags(snapshots: ParsedSessionSnapshot[]) {
    const hasChatMessages = snapshots.some(s => s.hasChatMessages);
    const hasFileSnapshots = snapshots.some(s => s.hasFileSnapshots);
    const hasToolCalls = snapshots.some(s => s.hasToolCalls);
    const fileSnapshotCount = snapshots.reduce((acc, s) => acc + s.fileSnapshotCount, 0);

    let storyRole: SessionStoryRole;
    if (hasChatMessages) storyRole = 'chat';
    else if (hasFileSnapshots) storyRole = 'code-activity';
    else storyRole = 'system';

    return {
        hasChatMessages,
        hasFileSnapshots,
        hasToolCalls,
        fileSnapshotCount,
        storyRole
    };
}

function derivePrimaryProjectPath(
    baseSnapshot: ParsedSessionSnapshot,
    primaryProjectId: string | null
): string {
    let primaryProjectPath = baseSnapshot.projectPath;
    if (primaryProjectId && primaryProjectId.startsWith('-')) {
         primaryProjectPath = decodeProjectName(primaryProjectId);
    }
    return primaryProjectPath;
}

export function buildCanonicalSessions(raw: ParsedSessionSnapshot[]): SessionSummary[] {
    const byId = groupSnapshotsBySessionId(raw);
    const result: SessionSummary[] = [];

    for (const [id, snapshots] of byId) {
        if (snapshots.length === 0) continue;

        const primaryProjectId = pickPrimaryProjectId(snapshots);
        const baseSnapshot = pickBaseSnapshot(snapshots);
        
        if (!baseSnapshot) continue;

        const pathUsages = buildPathUsages(snapshots);
        const featureFlags = mergeFeatureFlags(snapshots);
        const primaryProjectPath = derivePrimaryProjectPath(baseSnapshot, primaryProjectId);

        result.push({
            id: baseSnapshot.id,
            timestamp: new Date(baseSnapshot.firstEventAt).getTime(),
            projectPath: primaryProjectPath,
            primaryProjectId,
            primaryProjectPath,
            pathUsages,
            display: baseSnapshot.display,
            messageCount: baseSnapshot.messageCount,
            totalTokens: baseSnapshot.totalTokens,
            modelDistribution: baseSnapshot.modelDistribution,
            events: baseSnapshot.events,
            kind: baseSnapshot.kind,
            ...featureFlags
        });
    }

    return result;
}