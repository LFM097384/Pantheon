# Pantheon 众神殿

> 一个现代化的在线跑团软件，支持实时语音、P2P连接和美观的用户界面。集成了强大的多规则车卡系统。

## 🚀 快速开始

### 环境要求

- Node.js 18+
- npm 或 yarn

### 安装运行

**Windows:**

```bash
双击运行 start.bat
```

**macOS/Linux:**

```bash
chmod +x start.sh
./start.sh
```

**手动运行:**

```bash
# 安装依赖
npm install

# 开发模式
npm run dev

# 构建生产版本
npm run build
npm run build:dist
```

## 🎯 核心功能

### 多规则车卡系统

- **Pathfinder RPG** 完整支持
- 实时属性计算和依赖关系处理
- 角色数据导入导出
- 本地数据持久化
- 为未来多规则扩展设计的开放架构

### 在线跑团功能

- 实时语音通信
- P2P 连接
- 房间管理
- DM 控制台
- 玩家大厅

### 用户友好界面

- 现代化 UI 设计
- 响应式布局
- 暗色/亮色主题支持
- 直观的操作体验

## 📁 项目结构

```
src/
├── main/                   # Electron 主进程
│   ├── main.ts            # 应用入口
│   └── preload.ts         # 预加载脚本
├── renderer/              # 前端渲染进程
│   ├── components/        # 可复用组件
│   │   ├── Layout/        # 布局组件
│   │   ├── CharacterSheetManager.tsx  # 角色卡管理器
│   │   └── DiceRoller.tsx # 骰子组件
│   ├── pages/             # 页面组件
│   │   ├── CharacterSheet.tsx    # 角色卡主页面
│   │   ├── CharacterLibrary.tsx  # 角色库
│   │   ├── HomePage.tsx          # 首页
│   │   ├── GameRoom.tsx          # 游戏房间
│   │   └── UserSetup.tsx         # 用户设置
│   ├── store/             # Redux 状态管理
│   └── styles/            # 样式文件
├── types/                 # TypeScript 类型定义
│   ├── ruleSystem.ts      # 规则系统类型
│   └── index.ts           # 通用类型
├── utils/                 # 工具类
│   ├── RuleEngine.ts      # 规则计算引擎
│   ├── RuleSystemManager.ts  # 规则系统管理器
│   ├── CharacterDataManager.ts  # 角色数据管理
│   ├── ConnectionManager.ts     # 连接管理
│   └── RoomManager.ts           # 房间管理
├── ruleConfigs/          # 规则系统配置
│   └── pathfinder.json   # Pathfinder 规则配置
└── test/                 # 测试文件
```

## 🎲 车卡系统使用指南

### 创建角色

1. 导航到角色卡页面
2. 选择规则系统（目前支持 Pathfinder RPG）
3. 点击"创建新角色"
4. 填写角色基本信息
5. 系统自动生成符合规则的角色数据

### 编辑角色

1. 在角色库中选择角色
2. 修改属性值，系统实时计算衍生属性
3. 管理技能点数和受训状态
4. 保存更改到本地存储

### 数据管理

- **导出**: 单个角色或批量导出为 JSON
- **导入**: 从 JSON 文件导入角色数据
- **备份**: 自动本地存储，支持数据恢复

### 规则系统特性

- **41个属性**: 包含基础属性、衍生属性、战斗数据等
- **26个技能**: 完整的 Pathfinder 技能列表
- **17个计算规则**: 自动计算属性修正、豁免、AC等
- **8个验证规则**: 确保数据有效性

## 🔧 技术栈

- **前端**: React 18 + TypeScript + Antd
- **后端**: Electron + Node.js
- **状态管理**: Redux Toolkit
- **实时通信**: Socket.io + PeerJS
- **构建工具**: Vite + Electron Builder

## 🏗️ 开发指南

### 添加新规则系统

1. 在 `src/ruleConfigs/` 创建新配置文件
2. 定义属性、技能、计算规则等
3. 更新系统注册列表
4. 测试新规则系统

详细说明请参考 [规则系统架构文档](./RULE_SYSTEM_README.md)

### 扩展功能

- 规则系统模块化设计，易于扩展
- 组件化架构，支持自定义UI
- 类型安全的开发体验
- 完整的测试支持

## 🌟 特色功能

- **智能计算**: 实时计算属性修正和衍生值
- **数据安全**: 本地存储 + 导入导出备份
- **用户体验**: 直观的界面和流畅的操作
- **扩展性**: 为未来多规则系统预留完整接口

## 🔮 未来规划

### 规则系统扩展

- D&D 5th Edition
- Call of Cthulhu
- World of Darkness
- 自定义规则系统支持

### 高级功能

- 法术系统集成
- 装备管理系统
- 战斗计算器
- 角色升级向导

### 协作功能

- 多人实时协作编辑
- GM 角色管理工具
- 团队角色卡共享

## 🧪 测试

```bash
# 运行车卡系统验证
node verify-character-system.js

# 启动开发服务器
npm run dev
```

## 📝 更新日志

### v0.2.1 (2024-07-22)

- 🔄 **优化实时计算**: 删除独立的"实时计算"演示Tab，所有属性、技能、衍生值直接在对应界面实时同步
- 🧹 **代码清理**: 移除CalculationDemo组件，简化用户界面
- ✅ **增强稳定性**: 确保所有计算结果在用户操作后自动刷新，无需额外确认
- 🎯 **更好的用户体验**: 统一的实时计算体验，减少界面复杂度

### v0.2.0 (2024-07-21)

- ✨ 新增完整的多规则车卡系统
- ✨ Pathfinder RPG 规则完整支持
- ✨ 动态规则引擎和实时计算
- ✨ 角色库和数据管理功能
- ✨ 模块化架构，为未来扩展预留接口

### v0.1.0

- 🎉 初始版本发布
- ✨ 基础跑团功能
- ✨ 实时语音通信
- ✨ P2P 连接支持

## 🤝 贡献

欢迎提交 Issues 和 Pull Requests！

## 📄 许可证

MIT License
