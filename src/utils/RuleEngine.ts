import { 
  RuleSystemConfig, 
  CharacterData, 
  CalculationContext, 
  CalculationRule,
  DependencyRule,
  ValidationRule,
  SkillValue 
} from '../types/ruleSystem'

export class RuleEngine {
  private ruleSystem: RuleSystemConfig
  
  constructor(ruleSystem: RuleSystemConfig) {
    this.ruleSystem = ruleSystem
  }
  
  // 创建新角色
  createCharacter(playerId: string, name: string): CharacterData {
    const character: CharacterData = {
      id: this.generateId(),
      ruleSystemId: this.ruleSystem.id,
      name,
      attributes: {},
      skills: {},
      customFields: {},
      equipment: [],
      spells: this.ruleSystem.characterSchema.spellSystem?.enabled ? [] : undefined,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      playerId
    }
    
    // 初始化默认值
    this.initializeDefaults(character)
    
    // 执行初始计算
    this.recalculateAll(character)
    
    return character
  }
  
  // 初始化默认值
  private initializeDefaults(character: CharacterData): void {
    // 初始化属性
    this.ruleSystem.characterSchema.attributes.forEach(attr => {
      character.attributes[attr.id] = attr.defaultValue
    })
    
    // 初始化技能
    this.ruleSystem.characterSchema.skills.forEach(skill => {
      character.skills[skill.id] = {
        trained: skill.defaultTrained || false,
        modifier: 0,
        totalModifier: 0
      }
    })
    
    // 初始化自定义字段
    this.ruleSystem.characterSchema.customFields.forEach(field => {
      character.customFields[field.id] = field.defaultValue
    })
  }
  
  // 更新角色属性
  updateCharacter(character: CharacterData, field: string, value: any): CharacterData {
    const updatedCharacter = { ...character }
    
    // 更新字段值
    if (field.startsWith('attributes.')) {
      const attrId = field.substring(11)
      updatedCharacter.attributes = { ...character.attributes, [attrId]: value }
    } else if (field.startsWith('skills.')) {
      const skillId = field.substring(7)
      const skillField = field.split('.')[2] || 'trained'
      updatedCharacter.skills = {
        ...character.skills,
        [skillId]: { ...character.skills[skillId], [skillField]: value }
      }
    } else if (field.startsWith('customFields.')) {
      const fieldId = field.substring(13)
      updatedCharacter.customFields = { ...character.customFields, [fieldId]: value }
    }
    
    updatedCharacter.updatedAt = new Date().toISOString()
    
    // 重新计算受影响的字段
    this.recalculateAffected(updatedCharacter, field)
    
    return updatedCharacter
  }
  
  // 重新计算所有派生值
  recalculateAll(character: CharacterData): void {
    const context = this.createCalculationContext(character)
    
    // 按依赖顺序执行计算规则
    const sortedRules = this.sortCalculationRules()
    
    for (const rule of sortedRules) {
      this.executeCalculationRule(character, rule, context)
    }
    
    // 重新计算技能总修正
    this.recalculateSkills(character, context)
  }
  
  // 重新计算受影响的字段
  private recalculateAffected(character: CharacterData, changedField: string): void {
    const context = this.createCalculationContext(character)
    
    // 找到受影响的计算规则
    const affectedRules = this.ruleSystem.calculations.filter(rule =>
      rule.triggers.includes(changedField) || 
      rule.triggers.some(trigger => this.fieldMatches(changedField, trigger))
    )
    
    // 执行计算规则
    for (const rule of affectedRules) {
      this.executeCalculationRule(character, rule, context)
    }
    
    // 重新计算技能（如果基础属性发生变化）
    if (changedField.startsWith('attributes.')) {
      this.recalculateSkills(character, context)
    }
    
    // 执行依赖规则
    this.executeDependencyRules(character, changedField)
  }
  
  // 执行单个计算规则
  private executeCalculationRule(
    character: CharacterData, 
    rule: CalculationRule, 
    context: CalculationContext
  ): void {
    try {
      // 检查执行条件
      if (rule.condition && !this.evaluateCondition(rule.condition, context)) {
        return
      }
      
      // 计算新值
      const newValue = this.evaluateFormula(rule.formula, context)
      
      // 更新字段值
      this.setFieldValue(character, rule.targetField, newValue)
      
    } catch (error) {
      console.error(`计算规则执行失败: ${rule.name}`, error)
    }
  }
  
  // 重新计算技能
  private recalculateSkills(character: CharacterData, context: CalculationContext): void {
    this.ruleSystem.characterSchema.skills.forEach(skillDef => {
      const skill = character.skills[skillDef.id]
      if (skill) {
        const baseAttrValue = context.getAttributeValue(skillDef.baseAttribute)
        const attrModifier = this.getAttributeModifier(baseAttrValue)
        skill.totalModifier = attrModifier + skill.modifier
      }
    })
  }
  
  // 执行依赖规则
  private executeDependencyRules(character: CharacterData, changedField: string): void {
    const affectedRules = this.ruleSystem.dependencies.filter(rule =>
      rule.sourceField === changedField
    )
    
    for (const rule of affectedRules) {
      this.executeDependencyRule(character, rule)
    }
  }
  
  // 执行单个依赖规则
  private executeDependencyRule(character: CharacterData, rule: DependencyRule): void {
    try {
      const context = this.createCalculationContext(character)
      const result = this.evaluateFormula(rule.rule, context)
      
      switch (rule.type) {
        case 'modify':
          this.setFieldValue(character, rule.targetField, result)
          break
        case 'enable':
          // 启用/禁用字段的逻辑
          break
        case 'show':
          // 显示/隐藏字段的逻辑
          break
        case 'validate':
          // 验证逻辑
          break
      }
    } catch (error) {
      console.error(`依赖规则执行失败: ${rule.name}`, error)
    }
  }
  
  // 验证角色数据
  validateCharacter(character: CharacterData): ValidationResult {
    const errors: ValidationError[] = []
    const warnings: ValidationError[] = []
    
    for (const rule of this.ruleSystem.validations) {
      const result = this.executeValidationRule(character, rule)
      if (result) {
        if (result.severity === 'error') {
          errors.push(result)
        } else if (result.severity === 'warning') {
          warnings.push(result)
        }
      }
    }
    
    return {
      valid: errors.length === 0,
      errors,
      warnings
    }
  }
  
  // 执行验证规则
  private executeValidationRule(character: CharacterData, rule: ValidationRule): ValidationError | null {
    try {
      const context = this.createCalculationContext(character)
      const fieldValue = this.getFieldValue(character, rule.field)
      
      let isValid = true
      
      switch (rule.type) {
        case 'required':
          isValid = fieldValue != null && fieldValue !== ''
          break
        case 'range':
          const [min, max] = rule.rule.split(',').map(Number)
          isValid = fieldValue >= min && fieldValue <= max
          break
        case 'custom':
          isValid = this.evaluateFormula(rule.rule, context)
          break
      }
      
      if (!isValid) {
        return {
          field: rule.field,
          message: rule.message,
          severity: rule.severity,
          rule: rule.name
        }
      }
      
      return null
    } catch (error) {
      console.error(`验证规则执行失败: ${rule.name}`, error)
      return null
    }
  }
  
  // 创建计算上下文
  private createCalculationContext(character: CharacterData): CalculationContext {
    return {
      character,
      ruleSystem: this.ruleSystem,
      getAttributeValue: (attributeId: string) => character.attributes[attributeId],
      getSkillValue: (skillId: string) => character.skills[skillId],
      getEquipmentModifier: (type: string) => this.calculateEquipmentModifier(character, type),
      floor: Math.floor,
      ceil: Math.ceil,
      round: Math.round,
      min: Math.min,
      max: Math.max
    }
  }
  
  // 公式求值（简化版，实际应该使用安全的表达式解析器）
  private evaluateFormula(formula: string, context: CalculationContext): any {
    try {
      // 替换变量
      let processedFormula = formula
      
      // 替换属性引用 @attr.strength -> context.getAttributeValue('strength')
      processedFormula = processedFormula.replace(
        /@attr\.(\w+)/g, 
        (_, attrId) => `context.getAttributeValue('${attrId}')`
      )
      
      // 替换技能引用 @skill.athletics -> context.getSkillValue('athletics')
      processedFormula = processedFormula.replace(
        /@skill\.(\w+)/g, 
        (_, skillId) => `context.getSkillValue('${skillId}').totalModifier`
      )
      
      // 替换函数调用
      processedFormula = processedFormula.replace(/floor/g, 'context.floor')
      processedFormula = processedFormula.replace(/ceil/g, 'context.ceil')
      processedFormula = processedFormula.replace(/round/g, 'context.round')
      processedFormula = processedFormula.replace(/min/g, 'context.min')
      processedFormula = processedFormula.replace(/max/g, 'context.max')
      
      // 注意：在生产环境中应该使用安全的表达式解析器
      return Function('context', `return ${processedFormula}`)(context)
    } catch (error) {
      console.error('公式求值失败:', formula, error)
      return 0
    }
  }
  
  // 条件求值
  private evaluateCondition(condition: string, context: CalculationContext): boolean {
    try {
      return this.evaluateFormula(condition, context)
    } catch {
      return false
    }
  }
  
  // 获取字段值
  private getFieldValue(character: CharacterData, field: string): any {
    if (field.startsWith('attributes.')) {
      return character.attributes[field.substring(11)]
    } else if (field.startsWith('skills.')) {
      const parts = field.split('.')
      const skillId = parts[1]
      const prop = parts[2] || 'totalModifier'
      return character.skills[skillId]?.[prop as keyof SkillValue]
    } else if (field.startsWith('customFields.')) {
      return character.customFields[field.substring(13)]
    }
    return null
  }
  
  // 设置字段值
  private setFieldValue(character: CharacterData, field: string, value: any): void {
    if (field.startsWith('attributes.')) {
      character.attributes[field.substring(11)] = value
    } else if (field.startsWith('skills.')) {
      const parts = field.split('.')
      const skillId = parts[1]
      const prop = parts[2] || 'modifier'
      if (character.skills[skillId]) {
        const skill = character.skills[skillId]
        if (prop === 'trained') {
          skill.trained = value
        } else if (prop === 'modifier') {
          skill.modifier = value
        } else if (prop === 'totalModifier') {
          skill.totalModifier = value
        }
      }
    } else if (field.startsWith('customFields.')) {
      character.customFields[field.substring(13)] = value
    }
  }
  
  // 字段匹配检查
  private fieldMatches(field: string, pattern: string): boolean {
    return pattern.includes('*') ? 
      new RegExp(pattern.replace('*', '.*')).test(field) : 
      field === pattern
  }
  
  // 计算规则排序（确保依赖关系正确）
  private sortCalculationRules(): CalculationRule[] {
    // 简化版排序，实际应该使用拓扑排序
    return [...this.ruleSystem.calculations].sort((a, b) => {
      // 核心属性计算优先
      const aIsCore = a.targetField.startsWith('attributes.')
      const bIsCore = b.targetField.startsWith('attributes.')
      
      if (aIsCore && !bIsCore) return -1
      if (!aIsCore && bIsCore) return 1
      
      return 0
    })
  }
  
  // 计算装备修正
  private calculateEquipmentModifier(character: CharacterData, type: string): number {
    return character.equipment
      .filter(item => item.equipped)
      .reduce((total, item) => {
        // 这里应该查询装备数据库获取修正值
        return total + (item.customProperties?.[type] || 0)
      }, 0)
  }
  
  // 计算属性修正值（D&D风格）
  private getAttributeModifier(attributeValue: number): number {
    return Math.floor((attributeValue - 10) / 2)
  }
  
  // 生成ID
  private generateId(): string {
    return Math.random().toString(36).substring(2, 15)
  }
}

// 验证结果类型
interface ValidationResult {
  valid: boolean
  errors: ValidationError[]
  warnings: ValidationError[]
}

interface ValidationError {
  field: string
  message: string
  severity: 'error' | 'warning' | 'info'
  rule: string
}
