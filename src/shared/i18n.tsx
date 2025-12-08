
import React, { createContext, useContext, useState, ReactNode } from 'react';

const translations = {
  en: {
    common: {
      untitled: "Untitled",
      unknown: "Unknown",
      error: "Error",
      loading: "Loading...",
      truncated: "... (truncated)",
      viewAll: "View All",
      actions: "Actions",
      user: "USER",
      assistant: "CLAUDE",
      in: "In",
      out: "Out",
      macHint: "Mac: Cmd + Shift + . to show hidden files",
      sessions: "sessions"
    },
    sidebar: {
      title: "Claude Inspector",
      subtitle: "Local Log Inspector",
      projects: "Projects",
      upload: "Upload Logs",
      globalConfig: "Global Config",
      collapse: "Collapse Sidebar",
      expand: "Expand Sidebar",
      noProjects: "No Projects Found",
      events: "events",
      msgs: "msgs",
      snapshots: "snapshots",
      items: "items",
      globalHistory: "Global History",
      globalFiles: "Global Files"
    },
    workspace: {
      tabs: {
        overview: "Overview",
        history: "History",
        files: "Structure",
        todos: "Todos",
        settings: "Settings"
      },
      headers: {
        lastActive: "Last Active",
        sessions: "Sessions",
        tokens: "Tokens"
      },
      history: {
          title: "Project History",
          filterPlaceholder: "Search history...",
          empty: "No history found for this project."
      },
      files: {
          title: "Project Structure",
          description: "File structure view (scoped to ~/.claude)"
      },
      noProject: "No project found. Please upload logs."
    },
    theme: {
      light: "Light",
      dark: "Dark",
      system: "System"
    },
    upload: {
      title: "Claude Inspector",
      description: "Visualize your local Claude Code CLI logs, sessions, configurations, and tasks directly from your ~/.claude directory.",
      localProcessing: "Data is processed locally in your browser.",
      selectFolder: "Select ~/.claude Folder",
      selectZip: "Select .zip Archive",
      processing: "Processing...",
      or: "OR",
      optionalConfig: "Optional: Add MCP Config JSON",
      configHint: "If you use a custom config file (e.g. ~/.claude.json), upload it here to see extra MCP servers.",
      footer: "Open Source • Private & Secure • Includes History & MCP Config Support",
      error: "Failed to process",
      configDetected: "Config detected",
      dragDropHint: "Drag & drop {path} and {config} together",
      selectZipButton: "select a .zip archive"
    },
    dashboard: {
      overview: "Overview",
      subtitle: "Summary of your local Claude Code activity",
      totalSessions: "Total Sessions",
      totalTokens: "Total Tokens",
      totalProjects: "Total Projects",
      activeProjects: "Active Projects",
      pendingTasks: "Pending Tasks",
      sessionActivity: "Activity Trends",
      modelUsage: "Model Usage (Tokens)",
      noModelData: "No model data available",
      topProjects: "Top Projects",
      activityRange: "Activity Range",
      filesProcessed: "Files Processed",
      recentSessions: "Recent Sessions",
      viewAllHistory: "View All History",
      noRecent: "No recent sessions found.",
      noActivity30d: "No activity recorded in the last 30 days",
      noActivity: "No activity recorded yet.",
      last30Days: "30 Days",
      chartSessions: "Sessions"
    },
    history: {
      globalTitle: "Global History",
      globalSubtitle: "Timeline of all sessions across all projects.",
      allProjects: "All Projects",
      filterProject: "Filter by Project",
      filterTime: "Time Range",
      ranges: {
        all: "All Time",
        '7d': "Last 7 Days",
        '30d': "Last 30 Days"
      },
      sessionsFound: "sessions found"
    },
    sessions: {
      searchPlaceholder: "Search sessions...",
      searchInSession: "Find in session...",
      noSessions: "No sessions found",
      selectSession: "Select an item to view details",
      tokens: "Tokens",
      tok: "tok",
      in: "In",
      out: "Out",
      model: "Model",
      toolUse: "Tool Use",
      toolResult: "Tool Result",
      thinking: "Claude is thinking (content not recorded)",
      thinkingTitle: "Claude Thinking (Private)",
      thinkingEmpty: "Thinking process recorded, but no content available in log.",
      redactedThinking: "Thinking content redacted.",
      unsupported: "Unsupported Block Type",
      exportMarkdown: "Export Markdown",
      copyMarkdown: "Copy Markdown",
      copied: "Copied!",
      expand: "Expand",
      collapse: "Collapse",
      showSystemSessions: "Show System Sessions",
      showSystemSessionsTooltip: "Includes file-history-only sessions used for undo/rewind capabilities.",
      unknownProjectFileHistory: "System Snapshot",
      kindChat: "Chat",
      kindFileHistory: "File History",
      chatTimeline: "Chat Timeline",
      fileTimeline: "File Timeline",
      noChatEvents: "No user/assistant messages in this session.",
      noFileEvents: "No file snapshots recorded in this session.",
      fileSnapshot: "File Snapshot",
      trackedFiles: "Tracked Files",
      viewRawSnapshot: "View Raw Snapshot JSON",
      systemSessionNotice: "System Session: This session contains only file history snapshots used for rewinding/undoing changes.",
      trackedLocations: "Tracked Locations",
      codeViewDesc: "This session contains recorded file history snapshots but no conversation messages. This usually happens when using CLI commands that modify files without direct chat interaction (e.g. undo/rewind/checkout).",
      noFilesListed: "No files listed in snapshots.",
      rawEvents: "RAW EVENT STATS",
      duration: "Duration",
      eventCount: "Events",
      viewSession: "View Session",
      moreLines: "more lines",
      views: {
        chat: "Conversations",
        code: "Code Activity",
        system: "System Health"
      },
      codeActivity: {
        title: "Code Activity Summary",
        filesTouched: "Files Touched",
        timeline: "Snapshot Timeline",
        empty: "No code activity details available."
      },
      systemView: {
        title: "System Session Details",
        description: "This session is flagged as 'System'. It usually contains internal logs, startup sequences, or residual data from interrupted processes.",
        safeToIgnore: "It is generally safe to ignore this unless you are debugging the CLI itself."
      }
    },
    projects: {
      title: "Projects",
      sessions: "Sessions",
      totalTokens: "Total Tokens",
      lastActive: "Last Active",
      directoryTitle: "Projects Directory",
      directorySubtitle: "All detected projects and session groups",
      settingsTitle: "Project Settings",
      settingsDesc: "Specific configuration for {name} is not yet available. Please check the global configuration page for system-wide settings.",
      groups: {
        workspace: "Workspaces",
        globalTitle: "Global Sessions",
        globalSubtitle: "Sessions without a specific project context (e.g. general chat).",
        systemTitle: "System Sessions",
        systemSubtitle: "Internal sessions for file history snapshots and state tracking.",
        unknown: "Unknown Project"
      },
      columns: {
        session: "Session",
        tokens: "Tokens",
        messages: "Messages",
        date: "Date",
        project: "Project",
        type: "Type",
        lastActive: "Last Active",
        name: "Project Name"
      }
    },
    todos: {
      title: "Tasks & Todos",
      subtitle: "Tasks extracted from session context.",
      total: "Total",
      status: "Status",
      task: "Task",
      priority: "Priority",
      sessionId: "Session ID",
      noTodos: "No todo items found in logs.",
      normal: "Normal",
      statuses: {
        all: "All Statuses",
        pending: "Pending",
        inProgress: "In Progress",
        completed: "Completed"
      },
      countLabel: "Tasks"
    },
    config: {
      title: "Configuration",
      subtitle: "Read-only view of your settings and MCP configuration.",
      parseWarnings: "Parse Warnings",
      file: "File",
      line: "Line",
      message: "Message",
      mcpServers: "MCP Servers",
      noMcp: "No MCP servers found or config not parsed.",
      globalSettings: "Global Settings (Hooks)",
      noHooks: "No hooks configured in settings.json",
      envVars: "Env Variables"
    },
    structure: {
      path: "~/.claude",
      preview: "PREVIEW",
      loading: "Loading preview...",
      sensitive: "Sensitive Content Hidden",
      contentsOverview: "Contents Overview",
      fileContent: "File Content",
      selectFile: "Select a file or folder to view details",
      matchRule: "Identification Rule",
      contentUnavailable: "File content not available.",
      errorReading: "Error reading file.",
      noStructure: "No file structure available.",
      rootTitle: "All Files (~/.claude)",
      emptyDir: "Empty directory",
      noProjectFiles: "No files found for this project",
      projectFilesDesc: "This view shows session logs (*.jsonl) and tasks (*.json) from ~/.claude that are directly linked to this project.",
      projectFilesTitle: "Project Files",
      kinds: {
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
      }
    }
  },
  zh: {
     common: {
      untitled: "无标题",
      unknown: "未知",
      error: "错误",
      loading: "加载中...",
      truncated: "... (已截断)",
      viewAll: "查看全部",
      actions: "操作",
      user: "用户",
      assistant: "CLAUDE",
      in: "输入",
      out: "输出",
      macHint: "Mac: Cmd + Shift + . 显示隐藏文件",
      sessions: "会话"
    },
     sidebar: {
      title: "Claude Inspector",
      subtitle: "本地日志分析器",
      projects: "项目列表",
      upload: "重新上传",
      globalConfig: "全局配置",
      collapse: "收起侧边栏",
      expand: "展开侧边栏",
      noProjects: "未找到项目",
      events: "事件",
      msgs: "消息",
      snapshots: "快照",
      items: "项",
      globalHistory: "全局历史",
      globalFiles: "全局文件"
    },
    workspace: {
      tabs: {
        overview: "概览",
        history: "历史记录",
        files: "文件结构",
        todos: "待办事项",
        settings: "设置"
      },
      headers: {
        lastActive: "最后活跃",
        sessions: "会话数",
        tokens: "Token"
      },
      history: {
          title: "项目历史",
          filterPlaceholder: "搜索历史...",
          empty: "该项目暂无历史记录。"
      },
      files: {
          title: "项目结构",
          description: "文件结构视图 (范围: ~/.claude)"
      },
      noProject: "未找到项目。请先上传日志。"
    },
    theme: {
      light: "浅色",
      dark: "深色",
      system: "跟随系统"
    },
    upload: {
      title: "Claude Inspector",
      description: "直接从您的 ~/.claude 目录可视化 Claude Code CLI 日志、会话、配置和任务。",
      localProcessing: "数据仅在您的浏览器本地处理。",
      selectFolder: "选择 ~/.claude 文件夹",
      selectZip: "选择 .zip 压缩包",
      processing: "处理中...",
      or: "或",
      optionalConfig: "可选：添加 MCP 配置文件 JSON",
      configHint: "如果您使用自定义配置文件（例如 ~/.claude.json），请在此上传以查看额外的 MCP 服务器。",
      footer: "开源 • 隐私安全 • 支持历史记录和 MCP 配置",
      error: "处理失败",
      configDetected: "已检测到配置",
      dragDropHint: "同时拖拽 {path} 和 {config}",
      selectZipButton: "选择 .zip 压缩包"
    },
    dashboard: {
      overview: "概览",
      subtitle: "本地 Claude Code 活动摘要",
      totalSessions: "总会话数",
      totalTokens: "总 Token 数",
      totalProjects: "总项目数",
      activeProjects: "活跃项目",
      pendingTasks: "待办任务",
      sessionActivity: "活动趋势",
      modelUsage: "模型使用情况 (Token)",
      noModelData: "暂无模型数据",
      topProjects: "热门项目",
      activityRange: "活动时间范围",
      filesProcessed: "文件已处理",
      recentSessions: "最近会话",
      viewAllHistory: "查看所有历史",
      noRecent: "未找到最近的会话。",
      noActivity30d: "过去 30 天无活动记录",
      noActivity: "暂无活动记录。",
      last30Days: "30 天",
      chartSessions: "会话"
    },
    history: {
      globalTitle: "全局历史",
      globalSubtitle: "所有项目的会话时间线。",
      allProjects: "所有项目",
      filterProject: "筛选项目",
      filterTime: "时间范围",
      ranges: {
        all: "全部时间",
        '7d': "最近 7 天",
        '30d': "最近 30 天"
      },
      sessionsFound: "个会话"
    },
    sessions: {
      searchPlaceholder: "搜索会话...",
      searchInSession: "在会话中搜索...",
      noSessions: "未找到会话",
      selectSession: "选择一个条目以查看详情",
      tokens: "Token",
      tok: "k Tok",
      in: "输入",
      out: "输出",
      model: "模型",
      toolUse: "工具调用",
      toolResult: "工具结果",
      thinking: "此处为 Claude 的思考过程，未记录具体文本。",
      thinkingTitle: "Claude 深入思考（仅你可见）",
      thinkingEmpty: "此处为 Claude 的思考过程，但当前日志中没有具体内容。",
      redactedThinking: "思考内容已省略（redacted），日志中只保留了摘要。",
      unsupported: "不支持的块类型",
      exportMarkdown: "导出 Markdown",
      copyMarkdown: "复制 Markdown",
      copied: "已复制!",
      expand: "展开详情",
      collapse: "收起详情",
      showSystemSessions: "显示系统会话",
      showSystemSessionsTooltip: "包含仅用于撤销/倒带功能的纯文件历史会话。",
      unknownProjectFileHistory: "系统快照",
      kindChat: "对话",
      kindFileHistory: "文件历史",
      chatTimeline: "对话时间线",
      fileTimeline: "文件时间线",
      noChatEvents: "此会话中没有用户/助手消息。",
      noFileEvents: "此会话中没有记录文件快照。",
      fileSnapshot: "文件快照",
      trackedFiles: "追踪的文件",
      viewRawSnapshot: "查看原始快照 JSON",
      systemSessionNotice: "系统会话：此会话仅包含用于倒带/撤销更改的文件历史快照。",
      trackedLocations: "追踪路径",
      codeViewDesc: "此会话包含记录的文件历史快照，但没有对话消息。这通常发生在使用修改文件的 CLI 命令而没有直接聊天交互时（例如撤消/倒带/检出）。",
      noFilesListed: "快照中未列出文件。",
      rawEvents: "原始事件统计",
      duration: "持续时间",
      eventCount: "事件数",
      viewSession: "查看会话",
      moreLines: "更多行",
      views: {
        chat: "对话",
        code: "代码活动",
        system: "系统健康"
      },
      codeActivity: {
        title: "代码活动摘要",
        filesTouched: "涉及文件",
        timeline: "快照时间轴",
        empty: "暂无代码活动详情。"
      },
      systemView: {
        title: "系统会话详情",
        description: "此会话被标记为“系统会话”，通常包含内部日志、启动序列或中断进程的残留数据。",
        safeToIgnore: "除非您正在调试 CLI 本身，否则通常可以忽略此会话。"
      }
    },
    projects: {
      title: "项目",
      sessions: "会话",
      totalTokens: "总 Token",
      lastActive: "最后活跃",
      directoryTitle: "项目目录",
      directorySubtitle: "所有检测到的项目和会话组",
      settingsTitle: "项目设置",
      settingsDesc: "{name} 的特定配置尚不可用。请检查全局配置页面以获取系统级设置。",
      groups: {
        workspace: "工作区项目",
        globalTitle: "未归属到项目的会话",
        globalSubtitle: "没有附带工作目录信息的会话，通常是纯聊天类使用。",
        systemTitle: "系统会话（File History 等）",
        systemSubtitle: "Claude 用于记录文件历史快照和内部状态的系统会话。",
        unknown: "未知项目"
      },
      columns: {
        session: "会话",
        tokens: "Token",
        messages: "消息数",
        date: "日期",
        project: "项目",
        type: "类型",
        lastActive: "最后活跃",
        name: "项目名称"
      }
    },
    todos: {
      title: "任务 & 待办",
      subtitle: "从会话上下文中提取的任务。",
      total: "总计",
      status: "状态",
      task: "任务",
      priority: "优先级",
      sessionId: "会话 ID",
      noTodos: "日志中未找到待办事项。",
      normal: "普通",
      statuses: {
        all: "所有状态",
        pending: "待办",
        inProgress: "进行中",
        completed: "已完成"
      },
      countLabel: "任务"
    },
    config: {
      title: "配置",
      subtitle: "设置和 MCP 配置的只读视图。",
      parseWarnings: "解析警告",
      file: "File",
      line: "行号",
      message: "消息",
      mcpServers: "MCP 服务器",
      noMcp: "未找到 MCP 服务器或配置解析失败。",
      globalSettings: "全局设置 (Hooks)",
      noHooks: "settings.json 中未配置 hooks",
      envVars: "环境变量"
    },
    structure: {
      path: "~/.claude",
      preview: "预览",
      loading: "加载预览中...",
      sensitive: "敏感内容已隐藏",
      contentsOverview: "内容概览",
      fileContent: "文件内容",
      selectFile: "选择文件或文件夹查看详情",
      matchRule: "识别规则",
      contentUnavailable: "文件内容不可用。",
      errorReading: "读取文件错误。",
      noStructure: "无可用文件结构。",
      rootTitle: "所有文件 (~/.claude)",
      emptyDir: "空目录",
      noProjectFiles: "未找到此项目的文件",
      projectFilesDesc: "此视图显示与该项目直接链接的 ~/.claude 中的会话日志 (*.jsonl) 和任务 (*.json)。",
      projectFilesTitle: "项目文件",
      kinds: {
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
    }
  }
};

type Language = 'en' | 'zh';

// Helper to access nested keys
function getNested(obj: any, path: string) {
  return path.split('.').reduce((prev, curr) => prev ? prev[curr] : null, obj);
}

const I18nContext = createContext<{
  language: Language;
  setLanguage: (lang: Language) => void;
  t: (key: string, args?: Record<string, string>) => any;
}>({
  language: 'en',
  setLanguage: () => {},
  t: () => '',
});

export const useI18n = () => useContext(I18nContext);

export const I18nProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [language, setLanguage] = useState<Language>(() => {
    // Auto-detect
    if (typeof navigator !== 'undefined') {
        const lang = navigator.language;
        if (lang.startsWith('zh')) return 'zh';
    }
    return 'en';
  });

  const t = (key: string, args?: Record<string, string>) => {
    let text = getNested(translations[language], key);
    if (!text) return key;
    if (args) {
        Object.entries(args).forEach(([k, v]) => {
            text = text.replace(`{${k}}`, v);
        });
    }
    return text;
  };

  return (
    <I18nContext.Provider value={{ language, setLanguage, t }}>
      {children}
    </I18nContext.Provider>
  );
};
