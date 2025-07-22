# 多规则车卡系统架构说明

## 概述

Pantheon 众神殿的车卡系统采用了高度模块化和可扩展的架构设计，目前支持 Pathfinder RPG 规则，并为未来扩展其他规则系统（如 D&D 5e、Call of Cthulhu 等）预留了完整的接口。

## 系统架构

### 核心组件

1. **RuleSystemManager** (`src/utils/RuleSystemManager.ts`)

   - 规则系统的加载和管理
   - 支持动态切换不同规则系统
   - 提供规则系统的验证和字段查询功能
2. **RuleEngine** (`src/utils/RuleEngine.ts`)

   - 核心计算引擎
   - 处理属性计算、技能修正、依赖关系等
   - 角色数据的创建、更新和验证
3. **CharacterDataManager** (`src/utils/CharacterDataManager.ts`)

   - 角色数据的持久化存储
   - 导入导出功能
   - 数据备份和恢复
4. **CharacterSheetManager** (`src/renderer/components/CharacterSheetManager.tsx`)

   - 动态渲染角色卡界面
   - 根据规则系统配置自动生成表单
   - 实时计算和验证

### 数据流

```
规则配置文件 → RuleSystemManager → RuleEngine → CharacterData
                                      ↓
              UI组件 ← CharacterSheetManager ← 计算结果
                                      ↓
              本地存储 ← CharacterDataManager ← 数据持久化
```

## 规则系统配置

### 文件结构

规则系统配置文件位于 `src/ruleConfigs/` 目录下，使用 JSON 格式。每个规则系统包含：

- **基本信息**: id, name, version, description, author
- **角色数据结构**: attributes, skills, customFields, equipmentSlots
- **计算规则**: calculations 数组
- **依赖关系**: dependencies 数组
- **验证规则**: validations 数组
- **UI配置**: ui 对象

### Pathfinder 规则示例

```json
{
  "id": "pathfinder",
  "name": "Pathfinder RPG",
  "characterSchema": {
    "attributes": [
      {
        "id": "strength",
        "displayName": "力量",
        "type": "number",
        "category": "ability",
        "min": 3,
        "max": 25,
        "defaultValue": 10
      }
    ],
    "skills": [
      {
        "id": "acrobatics",
        "displayName": "杂技",
        "keyAbility": "dexterity",
        "category": "physical",
        "trainedOnly": false
      }
    ]
  },
  "calculations": [
    {
      "id": "abilityModifier_strength",
      "targetField": "strengthModifier",
      "formula": "Math.floor((strength - 10) / 2)",
      "triggers": ["strength"]
    }
  ]
}
```

## 使用指南

### 1. 启动系统

车卡系统已集成到主页面中，通过以下方式访问：

```tsx
import CharacterSheet from './pages/CharacterSheet';

// 在主应用中使用
<CharacterSheet playerId="player1" />
```

### 2. 创建新角色

1. 在角色卡页面选择规则系统
2. 点击"创建新角色"按钮
3. 填写基本信息（姓名、职业、种族等）
4. 系统自动生成符合规则的角色数据

### 3. 编辑角色

1. 在角色库中选择要编辑的角色
2. 系统自动加载对应的规则配置
3. 修改属性值，系统实时计算衍生值
4. 保存更改到本地存储

### 4. 数据管理

- **导出**: 支持单个角色或批量导出为 JSON 文件
- **导入**: 支持从 JSON 文件导入角色数据
- **备份**: 所有数据自动保存到本地存储

## 扩展新规则系统

### 1. 创建规则配置文件

在 `src/ruleConfigs/` 目录下创建新的 JSON 配置文件，例如 `dnd5e.json`:

```json
{
  "id": "dnd5e",
  "name": "D&D 5th Edition",
  "version": "1.0",
  "description": "D&D 5e 规则系统",
  "author": "Pantheon Team",
  "characterSchema": {
    "attributes": [
      // 定义 D&D 5e 的属性
    ],
    "skills": [
      // 定义 D&D 5e 的技能
    ]
  },
  "calculations": [
    // 定义计算规则
  ],
  "validations": [
    // 定义验证规则
  ],
  "ui": {
    // 定义 UI 配置
  }
}
```

### 2. 更新系统注册

在 `CharacterSheet.tsx` 中添加新规则系统到可用列表：

```tsx
const loadAvailableRuleSystems = async (): Promise<string[]> => {
  return ['pathfinder', 'dnd5e']; // 添加新规则系统
};
```

### 3. 测试新规则

系统会自动加载新规则配置，无需修改其他代码。

## 技术特性

### 动态计算系统

- 支持复杂的公式计算
- 自动处理字段依赖关系
- 实时更新衍生值

### 类型安全

- 完整的 TypeScript 类型定义
- 编译时类型检查
- 运行时数据验证

### 模块化设计

- 松耦合的组件架构
- 可插拔的规则系统
- 易于测试和维护

### 性能优化

- 增量计算避免不必要的重复计算
- 本地存储缓存提高响应速度
- 延迟加载减少初始化时间

## 文件目录结构

```
src/
├── types/
│   └── ruleSystem.ts          # 类型定义
├── utils/
│   ├── RuleSystemManager.ts   # 规则系统管理
│   ├── RuleEngine.ts          # 计算引擎
│   └── CharacterDataManager.ts # 数据管理
├── ruleConfigs/
│   └── pathfinder.json        # PF规则配置
├── renderer/
│   ├── components/
│   │   └── CharacterSheetManager.tsx # 角色卡组件
│   └── pages/
│       ├── CharacterSheet.tsx  # 主入口页面
│       └── CharacterLibrary.tsx # 角色库页面
```

## 未来规划

1. **更多规则系统支持**

   - D&D 5th Edition
   - Call of Cthulhu
   - World of Darkness
   - 自定义规则系统
2. **高级功能**

   - 法术系统集成
   - 装备管理
   - 战斗计算器
   - 自动升级
3. **协作功能**

   - 多人共享角色卡
   - 实时同步
   - GM管理工具
4. **扩展性**

   - 插件系统
   - 自定义组件
   - 主题定制

## 开发者注意事项

- 所有新规则系统都必须符合 `RuleSystemConfig` 接口
- 计算公式必须是安全的 JavaScript 表达式
- UI 配置应该考虑不同规则系统的差异
- 数据迁移和向后兼容性需要特别注意

## 联系方式

如有问题或建议，请联系开发团队或在项目仓库中提交 Issue。
