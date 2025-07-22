// 规则系统类型定义
export interface RuleSystemConfig {
  id: string
  name: string
  version: string
  description: string
  author: string
  
  // 角色数据结构定义
  characterSchema: CharacterSchema
  
  // 计算规则
  calculations: CalculationRule[]
  
  // 联动规则
  dependencies: DependencyRule[]
  
  // 验证规则
  validations: ValidationRule[]
  
  // UI 渲染配置
  ui: UIConfig
}

// 角色数据结构
export interface CharacterSchema {
  // 基础属性
  attributes: AttributeDefinition[]
  
  // 技能
  skills: SkillDefinition[]
  
  // 自定义字段
  customFields: FieldDefinition[]
  
  // 装备槽位
  equipmentSlots: EquipmentSlotDefinition[]
  
  // 法术系统（可选）
  spellSystem?: SpellSystemDefinition
}

// 属性定义
export interface AttributeDefinition {
  id: string
  name: string
  displayName: string
  type: 'number' | 'string' | 'boolean' | 'enum'
  defaultValue: any
  min?: number
  max?: number
  enumValues?: string[]
  category: 'core' | 'derived' | 'resource' | 'combat' | 'custom' | 'ability' | 'basic' | 'modifier' | 'identity' | 'physical'
  description?: string
  formula?: string // 如果是派生属性，定义计算公式
}

// 技能定义
export interface SkillDefinition {
  id: string
  name: string
  displayName: string
  keyAbility: string // 关联的核心属性
  category: string
  trainedOnly: boolean // 是否只能受训使用
  armorCheckPenalty?: boolean // 是否受护甲检定减值影响
  defaultTrained?: boolean
  description?: string
}

// 自定义字段定义
export interface FieldDefinition {
  id: string
  name: string
  displayName: string
  type: 'text' | 'number' | 'boolean' | 'select' | 'multiselect' | 'textarea'
  options?: string[]
  defaultValue?: any
  required?: boolean
  category: string
  description?: string
}

// 装备槽位定义
export interface EquipmentSlotDefinition {
  id: string
  name: string
  displayName: string
  type: 'single' | 'multiple'
  maxItems?: number
  allowedTypes: string[]
  category: string
}

// 法术系统定义
export interface SpellSystemDefinition {
  enabled: boolean
  spellSlots?: SpellSlotDefinition[]
  spellAttributes: string[] // 影响法术的属性
  spellCategories: string[]
}

export interface SpellSlotDefinition {
  level: number
  count: number
  formula?: string // 动态计算法术位数量
}

// 计算规则
export interface CalculationRule {
  id: string
  name: string
  targetField: string // 要计算的字段
  formula: string // 计算公式
  triggers: string[] // 触发条件（当哪些字段变化时重新计算）
  condition?: string // 执行条件
  description?: string
}

// 依赖规则（联动）
export interface DependencyRule {
  id: string
  name: string
  sourceField: string // 源字段
  targetField: string // 目标字段
  type: 'modify' | 'enable' | 'show' | 'validate'
  rule: string // 规则表达式
  description?: string
}

// 验证规则
export interface ValidationRule {
  id: string
  name: string
  field: string
  type: 'range' | 'required' | 'custom'
  rule: string // 验证表达式
  message: string // 错误消息
  severity: 'error' | 'warning' | 'info'
}

// UI 配置
export interface UIConfig {
  layout: LayoutConfig
  tabs: TabConfig[]
  fieldGroups: FieldGroupConfig[]
  customComponents?: CustomComponentConfig[]
}

export interface LayoutConfig {
  type: 'tabs' | 'accordion' | 'single'
  columns: number
  responsive: boolean
}

export interface TabConfig {
  id: string
  name: string
  displayName: string
  icon?: string
  fields: string[]
  order: number
}

export interface FieldGroupConfig {
  id: string
  name: string
  displayName: string
  fields: string[]
  layout: 'horizontal' | 'vertical' | 'grid'
  collapsible?: boolean
  defaultCollapsed?: boolean
}

export interface CustomComponentConfig {
  id: string
  type: string
  props: Record<string, any>
  fields: string[]
}

// 角色数据实例
export interface CharacterData {
  id: string
  ruleSystemId: string
  name: string
  
  // 动态数据，根据规则系统结构变化
  attributes: Record<string, any>
  skills: Record<string, SkillValue>
  customFields: Record<string, any>
  equipment: CharacterEquipment[]
  spells?: CharacterSpell[]
  
  // 元数据
  createdAt: string
  updatedAt: string
  playerId: string
}

// 技能受训等级
export type ProficiencyLevel = 'untrained' | 'trained' | 'expert' | 'master' | 'legendary'

export interface SkillValue {
  trained: boolean // 兼容性保留
  proficiencyLevel: ProficiencyLevel // 新的受训等级
  modifier: number
  totalModifier: number // 包含属性加成的总修正
}

export interface CharacterEquipment {
  id: string
  itemId: string
  name: string
  slot?: string
  equipped: boolean
  quantity: number
  customProperties?: Record<string, any>
}

export interface CharacterSpell {
  id: string
  spellId: string
  name: string
  level: number
  prepared: boolean
  known: boolean
  timesUsed?: number
}

// 公式计算上下文
export interface CalculationContext {
  character: CharacterData
  ruleSystem: RuleSystemConfig
  getAttributeValue: (attributeId: string) => any
  getSkillValue: (skillId: string) => SkillValue
  getEquipmentModifier: (type: string) => number
  
  // 辅助函数
  floor: (value: number) => number
  ceil: (value: number) => number
  round: (value: number) => number
  min: (...values: number[]) => number
  max: (...values: number[]) => number
}

// 计算详情类型（用于调试）
export interface CalculationDetails {
  ruleName: string
  targetField: string
  formula: string
  variables: Record<string, any>
  currentValue: any
  calculatedValue: any
  isUpToDate: boolean
  error?: string
}
