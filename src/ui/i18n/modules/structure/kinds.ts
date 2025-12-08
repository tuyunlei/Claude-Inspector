export const structureKinds = {
  en: {
    root: {
      label: 'Root Directory',
      description: 'The root of your Claude data structure.',
      match: 'Root Folder'
    },
    'project-root': {
      label: 'Projects Directory',
      description: 'Contains the conversation history for all projects. Deleting files here will result in the loss of session history.',
      match: 'Folder: projects'
    },
    'project-log': {
      label: 'Project Session Log',
      description: 'A JSONL file containing the event stream for a specific session. Contains all messages, tool uses, and results.',
      match: 'Path: .../projects/*.jsonl'
    },
    'todo-root': {
      label: 'Todos Directory',
      description: 'Stores extracted tasks and to-do items. Deleting this only removes task lists, not the actual session logs.',
      match: 'Folder: todos'
    },
    todo: {
      label: 'Todo List',
      description: 'A JSON file containing tasks extracted from a session context.',
      match: 'Path: .../todos/*.json'
    },
    'shell-root': {
      label: 'Shell Snapshots Directory',
      description: 'Storage for shell state snapshots used to restore context during sessions.',
      match: 'Folder: shell_snapshots'
    },
    'shell-snapshot': {
      label: 'Shell Snapshot',
      description: 'Snapshot of the shell state or history for context restoration.',
      match: 'Path: .../shell_snapshots/...'
    },
    'stats-root': {
      label: 'Telemetry Directory',
      description: 'Contains usage statistics and telemetry data. Can be safely deleted as it regenerates.',
      match: 'Folder: statsig'
    },
    stats: {
      label: 'Statistics',
      description: 'Usage and telemetry data used by the CLI.',
      match: 'Path includes "statsig"'
    },
    'commands-root': {
      label: 'Commands Directory',
      description: 'Custom command scripts and workflow definitions for Claude Code.',
      match: 'Folder: commands'
    },
    commands: {
      label: 'Custom Command',
      description: 'A script or configuration defining a custom command.',
      match: 'Path includes "commands"'
    },
    settings: {
      label: 'Global Configuration',
      description: 'Global settings for Claude Code, including approved tools and hooks.',
      match: 'Filename: settings.json'
    },
    'mcp-config': {
      label: 'MCP Configuration',
      description: 'Model Context Protocol server definitions and environment variables.',
      match: 'Filename: mcp-servers.json'
    },
    'history-index': {
      label: 'History Index',
      description: 'Index of past sessions and their metadata (timestamps, project paths).',
      match: 'Filename: history.jsonl'
    },
    credentials: {
      label: 'Credentials',
      description: 'Authentication tokens and keys. Content is strictly hidden for security.',
      match: 'Filename: *.credentials.json OR credentials.json'
    },
    other: {
      label: 'File',
      description: 'Generic file resource or unrecognized Claude data.',
      match: 'No specific pattern'
    },
    folder: {
      label: 'Folder',
      description: 'Directory containing files.',
      match: 'Directory'
    }
  },
  zh: {
    root: {
      label: '根目录',
      description: 'Claude 数据结构的根目录。',
      match: '根文件夹'
    },
    'project-root': {
      label: '项目日志目录',
      description: '存储所有项目的会话历史记录。删除此处的子目录或文件将导致历史对话丢失。',
      match: '目录名: projects'
    },
    'project-log': {
      label: '项目会话日志',
      description: '包含特定会话事件流的 JSONL 文件。记录了所有消息、工具调用和执行结果。',
      match: '路径: .../projects/*.jsonl'
    },
    'todo-root': {
      label: '待办事项目录',
      description: '存储提取的任务和待办项。删除此目录仅移除任务列表，不影响会话日志本身。',
      match: '目录名: todos'
    },
    todo: {
      label: '待办清单',
      description: '从会话中提取的任务 JSON 文件。',
      match: '路径: .../todos/*.json'
    },
    'shell-root': {
      label: 'Shell 快照目录',
      description: '存储 Shell 状态快照，用于在会话期间恢复上下文。',
      match: '目录名: shell_snapshots'
    },
    'shell-snapshot': {
      label: 'Shell 快照',
      description: '用于恢复上下文的 Shell 状态或历史记录快照。',
      match: '路径: .../shell_snapshots/...'
    },
    'stats-root': {
      label: '统计数据目录',
      description: '包含使用情况统计和遥测数据。可以安全删除，CLI 会自动重新生成。',
      match: '目录名: statsig'
    },
    stats: {
      label: '统计数据',
      description: 'CLI 使用的统计和遥测数据。',
      match: '路径包含 "statsig"'
    },
    'commands-root': {
      label: '自定义命令目录',
      description: 'Claude Code 的自定义命令脚本和工作流定义。',
      match: '目录名: commands'
    },
    commands: {
      label: '自定义命令',
      description: '定义自定义命令的脚本或配置文件。',
      match: '路径包含 "commands"'
    },
    settings: {
      label: '全局配置',
      description: 'Claude Code 的全局设置，包括批准的工具和 Hooks。',
      match: '文件名: settings.json'
    },
    'mcp-config': {
      label: 'MCP 配置',
      description: 'Model Context Protocol 服务器定义和环境变量。',
      match: '文件名: mcp-servers.json'
    },
    'history-index': {
      label: '历史索引',
      description: '过去会话及其元数据（时间戳、项目路径）的索引文件。',
      match: '文件名: history.jsonl'
    },
    credentials: {
      label: '凭据',
      description: '认证令牌和密钥。为安全起见，内容已严格隐藏。',
      match: '文件名: *.credentials.json 或 credentials.json'
    },
    other: {
      label: '文件',
      description: '通用文件资源或未识别的 Claude 数据。',
      match: '无特定模式'
    },
    folder: {
      label: '文件夹',
      description: '包含文件的目录。',
      match: '目录'
    }
  }
};