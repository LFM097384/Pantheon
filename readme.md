# Pantheon 众神殿

> 一个现代化的在线跑团软件，支持实时语音、P2P连接和美观的用户界面。

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

## 📁 项目结构

```
src/
├── main/                   # Electron 主进程
│   ├── main.ts            # 应用入口
│   └── preload.ts         # 预加载脚本
├── renderer/              # 前端渲染进程
│   ├── components/        # 可复用组件
│   ├── pages/             # 页面组件
│   ├── store/             # Redux 状态管理
│   └── styles/            # 样式文件
├── ruleConfigs/           # 🆕 规则系统配置
│   └── pathfinder.json    # Pathfinder 规则配置
├── types/                 # TypeScript 类型定义
│   ├── index.ts          # 基础类型
│   └── ruleSystem.ts     # 🆕 规则系统类型
├── utils/                 # 工具类和管理器
│   ├── RuleEngine.ts      # 🆕 规则引擎
│   ├── RuleSystemManager.ts # 🆕 规则系统管理
│   ├── ConnectionManager.ts # P2P 连接管理
│   └── SignalingClient.ts   # 信令客户端
└── test/                  # 🆕 测试文件
    ├── simpleRuleTest.js     # 基础功能测试
    └── testPathfinderRules.ts # 完整测试
```

### 🆕 规则系统核心文件

- **`ruleSystem.ts`**: 完整的类型定义，支持属性、技能、计算规则等
- **`RuleEngine.ts`**: 规则引擎实现，处理角色数据和自动计算
- **`RuleSystemManager.ts`**: 多规则系统管理器，支持动态切换
- **`pathfinder.json`**: Pathfinder 规则的完整配置示例

## �️ 项目架构

### 技术栈

- **桌面应用**: Electron (跨平台支持)
- **前端框架**: React 18 + TypeScript
- **UI组件库**: Ant Design (美观现代的界面)
- **状态管理**: Redux Toolkit
- **实时通信**: Socket.IO + WebRTC (P2P支持)
- **构建工具**: Vite (快速开发体验)

### 目录结构

```
pantheon/
├── src/
│   ├── main/                 # Electron主进程
│   │   ├── main.ts          # 主进程入口
│   │   ├── preload.ts       # 预加载脚本
│   │   └── utils.ts         # 主进程工具
│   ├── renderer/            # React渲染进程
│   │   ├── components/      # 通用组件
│   │   ├── pages/           # 页面组件
│   │   ├── store/           # Redux状态管理
│   │   ├── styles/          # 样式文件
│   │   ├── App.tsx          # 应用根组件
│   │   └── main.tsx         # 渲染进程入口
│   ├── types/               # TypeScript类型定义
│   └── utils/               # 通用工具函数
├── dist/                    # 构建输出
├── package.json
└── README.md
```

## 🎯 功能特性

### 已实现 (v0.1 框架)

- ✅ 清晰的项目架构和文件组织
- ✅ Electron + React + TypeScript 技术栈
- ✅ 美观的Ant Design UI组件
- ✅ Redux状态管理系统
- ✅ 路由和页面导航
- ✅ 响应式布局和主题支持
- ✅ WebRTC连接管理器基础框架
- ✅ 骰子投掷工具函数

## 𞰼� 功能路线图（Feature Roadmap）

### ✅ V0.1 原型阶段（MVP）

> *目标：能跑起来一个规则简化的本地跑团局，展示界面和数据交互流程。*

* [X] **美观UI框架搭建** （使用Electron + React + TypeScript）
* [X] **玩家-主持人本地交互原型** （路由和页面结构）
* [X] **规则框架雏形** （支持基本骰子投掷逻辑）
* [ ] **车卡实现**
* [ ] **本地日志记录系统**

---

### 🚀 V0.5 交互阶段（核心功能）

> *目标：实现基本联机体验与规则处理自动化。*

* [ ] **P2P 联机模块**
  * WebRTC 或 socket.io 构建玩家-主持人之间的房间连接
  * DM 权限管理界面（隐藏地图、私聊玩家等）
* [ ] **语音功能集成**
  * 内嵌 WebRTC 音频通话
  * 静音/频道切换（如密语/广播）
* [ ] **扩展型规则引擎**
  * 模块化技能判定机制（可插拔“骰点规则”）
  * 支持系统切换（如Pathfinder, DnD 5e, CoC）
* [ ] **可视化战斗界面（简化版）**
  * 棋盘风格布局 / 人物位置拖放 / 简单贴图

---

### 🧠 V1.0 正式版发布

> *目标：满足完整线上跑团体验，支持内容创作与社区拓展。*

* [ ] **完整角色卡系统**
  * 属性成长、背包管理、技能树
* [ ] **模组/规则导入中心**
  * 支持 XML/JSON 格式的完整模组
* [ ] **地图编辑器 + Fog of War**
  * DM 可上传地图图层并控制玩家可见区域
* [ ] **战斗轮次与时间线管理**
  * 自动化轮次提示 / 效果倒计时
* [ ] **多语言支持**

---

### 🔮 V2.0 社区与AI集成

> *目标：打造长期生态与智能辅助功能*

* [ ] **模组创作者工具链**
  * 可视化规则编辑器 + 插件系统
* [ ] **AI 助理 DM / NPC**
  * GPT 驱动的对话与剧情生成器

## 🎯 核心特性

### 🎲 智能角色卡系统
- **可扩展规则引擎**: 支持多种 TRPG 规则系统 (Pathfinder, D&D等)
- **自动计算**: 属性调整值、生命值、豁免检定等自动计算
- **联动更新**: 属性变化时相关数据自动同步更新
- **数据验证**: 多层级验证确保角色数据完整性
- **JSON 配置**: 通过配置文件轻松添加新规则系统

### 🌐 P2P 网络连接
- **去中心化**: 直接玩家间连接，无需依赖服务器
- **实时同步**: 角色数据、聊天消息实时同步
- **房间管理**: 支持创建/加入游戏房间
- **网络优化**: 自动重连和错误恢复

### 🎨 现代化界面
- **美观设计**: 基于 Ant Design 的现代化 UI
- **响应式布局**: 适配不同屏幕尺寸
- **主题定制**: 支持自定义界面主题
- **用户体验**: 流畅的交互和动画效果
