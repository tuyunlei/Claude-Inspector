export const dashboardData = {
  en: {
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
    }
  },
  zh: {
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
    }
  }
};