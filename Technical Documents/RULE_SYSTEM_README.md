# Pantheon 角色卡（车卡）规则系统

## 项目概述

本项目实现了一个可扩展的角色卡规则系统，支持不同的角色扮演游戏规则（如 Pathfinder、D&D 等）。系统通过配置文件开放规则接口，实现角色卡内部数据的联动和自动计算。

## 系统架构

### 核心组件

1. **规则系统类型定义** (`src/types/ruleSystem.ts`)
   - 定义了规则系统的完整类型结构
   - 包括属性定义、技能定义、计算规则、依赖规则、验证规则等

2. **规则引擎** (`src/utils/RuleEngine.ts`)
   - 负责角色数据的创建、更新、计算和验证
   - 支持自动计算衍生属性和联动更新

3. **规则系统管理器** (`src/utils/RuleSystemManager.ts`)
   - 管理不同规则系统的加载和切换
   - 提供字段信息查询和分类功能

4. **规则配置文件** (`src/ruleConfigs/`)
   - JSON 格式的规则配置文件
   - 目前包含 Pathfinder 规则系统示例

## 主要特性

### 1. 可扩展的规则系统
- 通过 JSON 配置文件定义不同的游戏规则
- 支持属性、技能、装备、法术等各种游戏元素
- 灵活的字段类型和分类系统

### 2. 自动计算和联动
- 支持基于公式的自动计算（如属性调整值、生命值等）
- 实现字段间的依赖关系和联动更新
- 触发器机制确保相关数据同步更新

### 3. 数据验证
- 灵活的验证规则系统
- 支持范围验证、必填验证和自定义验证
- 分级错误报告（错误、警告、信息）

### 4. UI 配置支持
- 支持布局配置（标签页、手风琴、单页等）
- 字段分组和排序
- 自定义显示样式和主题

## Pathfinder 规则系统示例

### 属性系统
- **基础属性**: 力量、敏捷、体质、智力、感知、魅力
- **衍生属性**: 生命值、护甲等级、基础攻击加值、豁免检定
- **调整值**: 自动计算的属性调整值

### 计算规则示例
```json
{
  "id": "abilityModifier_strength",
  "name": "力量调整值计算",
  "targetField": "strengthModifier",
  "formula": "Math.floor((strength - 10) / 2)",
  "triggers": ["strength"],
  "description": "计算力量调整值"
}
```

### 验证规则示例
```json
{
  "id": "strength_range",
  "name": "力量值范围验证",
  "field": "strength",
  "type": "range",
  "rule": "value >= 3 && value <= 25",
  "message": "力量值必须在3-25之间",
  "severity": "error"
}
```

## 使用方法

### 1. 加载规则系统
```typescript
import { ruleSystemManager } from './utils/RuleSystemManager';

// 加载 Pathfinder 规则
await ruleSystemManager.setCurrentRuleSystem('pathfinder');
const ruleConfig = ruleSystemManager.getCurrentRuleSystem();
```

### 2. 创建和更新角色
```typescript
import { RuleEngine } from './utils/RuleEngine';

const ruleEngine = new RuleEngine(ruleConfig);

// 创建角色
const character = ruleEngine.createCharacter('player1', '测试角色');

// 更新属性
const updatedCharacter = ruleEngine.updateCharacter(
  character, 
  'attributes.strength', 
  16
);
```

### 3. 获取字段信息
```typescript
// 获取字段显示名称
const displayName = ruleSystemManager.getFieldDisplayName('strength');

// 获取字段描述
const description = ruleSystemManager.getFieldDescription('strength');

// 按类别获取字段
const abilityFields = ruleSystemManager.getFieldsByCategory('ability');
```

## 测试验证

已创建测试文件验证规则系统的正确性：

- **简化测试** (`src/test/simpleRuleTest.js`): 基础功能验证
- **完整测试** (`src/test/testPathfinderRules.ts`): TypeScript 完整测试

测试结果显示：
- ✅ 属性默认值设置正常
- ✅ 自动计算公式工作正确
- ✅ 数据验证规则有效
- ✅ 字段联动机制正常

## 扩展新规则系统

要添加新的规则系统（如 D&D 5e），需要：

1. 在 `src/ruleConfigs/` 目录下创建新的 JSON 配置文件
2. 定义该规则系统的属性、技能、计算规则等
3. 通过 `ruleSystemManager.loadRuleSystem()` 加载使用

## 未来改进方向

1. **前端集成**: 将规则系统与角色卡页面深度集成
2. **规则编辑器**: 创建可视化的规则配置编辑工具
3. **更多规则系统**: 添加更多主流 TRPG 规则支持
4. **性能优化**: 优化大量计算和依赖解析的性能
5. **规则验证**: 增强配置文件的结构验证和错误报告

## 技术栈

- **TypeScript**: 类型安全的开发体验
- **JSON 配置**: 灵活的规则定义格式
- **模块化设计**: 清晰的代码组织结构
- **单例模式**: 高效的资源管理

---

这个规则系统为 Pantheon 项目提供了强大而灵活的角色卡管理能力，支持各种 TRPG 规则的快速集成和定制。
