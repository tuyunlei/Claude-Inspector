
export interface Plan {
  id: string;            // Use filePath as ID for now
  filePath: string;      // Relative path in ~/.claude
  title: string;         // Extracted from first line or heading
  content: string;       // Full markdown content
  inferredProjectPath?: string; // Optional: inferred association
}
