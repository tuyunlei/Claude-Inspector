
import { ProjectIdentity } from '../../../model/projects';

/**
 * Generates shortest unique suffix for display names.
 */
export function buildUniqueProjectDisplayNames(projects: ProjectIdentity[]): Map<string, string> {
  const nameMap = new Map<string, string>();
  
  const splitPath = (path: string) => path.split(/[/\\]/).filter(p => p && p !== '.');
  
  const items = projects.map(p => ({
    id: p.id,
    segments: splitPath(p.canonicalPath)
  }));

  const depths = new Map<string, number>();
  items.forEach(p => depths.set(p.id, 1));

  let hasCollision = true;
  // Guard against infinite loops if paths are identical
  let iterations = 0; 
  const maxIterations = 20; 

  while (hasCollision && iterations < maxIterations) {
    hasCollision = false;
    iterations++;

    const nameToIds = new Map<string, string[]>();

    // Build current names
    for (const item of items) {
      const depth = depths.get(item.id)!;
      // If we run out of segments, use full path (segments joined)
      const effectiveDepth = Math.min(depth, item.segments.length);
      const name = item.segments.slice(-effectiveDepth).join('/');
      
      const list = nameToIds.get(name) || [];
      list.push(item.id);
      nameToIds.set(name, list);
    }

    // Detect collisions
    for (const [name, ids] of nameToIds.entries()) {
      if (ids.length > 1) {
        let collisionResolved = false;
        for (const id of ids) {
          const item = items.find(i => i.id === id)!;
          const currentDepth = depths.get(id)!;
          
          if (currentDepth < item.segments.length) {
            depths.set(id, currentDepth + 1);
            hasCollision = true;
            collisionResolved = true;
          }
        }
        // If we couldn't increase depth for any colliding item, they are identical paths (unlikely given ID uniqueness, but possible if canonicalPath logic fails)
        // We accept the collision in display name if we can't resolve it.
        if (!collisionResolved) {
             // Leave hasCollision as is for this group
        }
      }
    }
  }

  // Finalize
  for (const item of items) {
    const depth = depths.get(item.id)!;
    const effectiveDepth = Math.min(depth, item.segments.length);
    let name = item.segments.slice(-effectiveDepth).join('/');
    if (!name) name = item.id; // Fallback
    nameMap.set(item.id, name);
  }

  return nameMap;
}