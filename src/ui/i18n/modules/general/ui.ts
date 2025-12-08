
export const generalUi = {
  en: {
    sidebar: {
      title: "Claude Inspector",
      subtitle: "Local Log Inspector",
      projects: "Projects",
      upload: "Upload Logs",
      uploadConfig: "Add Config",
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
    }
  },
  zh: {
    sidebar: {
      title: "Claude Inspector",
      subtitle: "本地日志分析器",
      projects: "项目列表",
      upload: "重新上传",
      uploadConfig: "补充配置",
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
    }
  }
};
