import { 
  RuleSystemConfig, 
  CharacterData, 
  CalculationContext, 
  CalculationRule,
  DependencyRule,
  ValidationRule,
  SkillValue,
  ProficiencyLevel 
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
        proficiencyLevel: 'untrained',
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
    // 创建初始计算上下文
    let context = this.createCalculationContext(character)
    
    // 标准化字段名以匹配计算规则的触发器
    const normalizedField = this.normalizeFieldName(changedField)
    
    // 找到受影响的计算规则（支持链式依赖）
    const affectedRules = this.findAffectedRules(normalizedField)
    
    // 按依赖顺序排序规则
    const sortedRules = this.sortRulesByDependency(affectedRules)
    
    // 执行计算规则
    for (const rule of sortedRules) {
      this.executeCalculationRule(character, rule, context)
      // 更新上下文以反映最新的计算结果
      context = this.createCalculationContext(character)
    }
    
    // 重新计算技能（如果基础属性发生变化）
    if (changedField.startsWith('attributes.') || this.isAbilityScore(normalizedField)) {
      this.recalculateSkills(character, context)
    }
    
    // 执行依赖规则
    this.executeDependencyRules(character, changedField)
    
    // 检查是否有二级依赖需要重新计算
    this.handleSecondaryDependencies(character, normalizedField)
  }

  // 标准化字段名
  private normalizeFieldName(fieldPath: string): string {
    if (fieldPath.startsWith('attributes.')) {
      return fieldPath.substring(11) // 移除 'attributes.' 前缀
    }
    if (fieldPath.startsWith('skills.')) {
      const parts = fieldPath.split('.')
      return parts[1] // 返回技能ID
    }
    if (fieldPath.startsWith('customFields.')) {
      return fieldPath.substring(13) // 移除 'customFields.' 前缀
    }
    return fieldPath
  }

  // 查找受影响的计算规则
  private findAffectedRules(normalizedField: string): CalculationRule[] {
    return this.ruleSystem.calculations.filter(rule => {
      // 检查直接触发器
      if (rule.triggers.includes(normalizedField)) {
        return true
      }
      
      // 检查通配符触发器
      return rule.triggers.some(trigger => this.fieldMatches(normalizedField, trigger))
    })
  }

  // 按依赖关系排序规则
  private sortRulesByDependency(rules: CalculationRule[]): CalculationRule[] {
    const sorted: CalculationRule[] = []
    const visited = new Set<string>()
    const visiting = new Set<string>()

    const visit = (rule: CalculationRule) => {
      if (visiting.has(rule.id)) {
        // 检测到循环依赖，按原顺序处理
        console.warn(`检测到循环依赖: ${rule.id}`)
        return
      }
      
      if (visited.has(rule.id)) {
        return
      }

      visiting.add(rule.id)

      // 查找依赖的规则
      const dependencies = rules.filter(r => 
        rule.triggers.some(trigger => r.targetField === trigger)
      )

      dependencies.forEach(dep => visit(dep))

      visiting.delete(rule.id)
      visited.add(rule.id)
      sorted.push(rule)
    }

    rules.forEach(rule => visit(rule))
    return sorted
  }

  // 检查是否是基础属性
  private isAbilityScore(fieldName: string): boolean {
    const abilityScores = ['strength', 'dexterity', 'constitution', 'intelligence', 'wisdom', 'charisma']
    return abilityScores.includes(fieldName)
  }

  // 处理二级依赖
  private handleSecondaryDependencies(character: CharacterData, changedField: string): void {
    // 如果改变的是基础属性，可能影响技能，进而影响其他计算
    if (this.isAbilityScore(changedField)) {
      // 重新检查所有可能受技能影响的计算规则
      const skillDependentRules = this.ruleSystem.calculations.filter(rule =>
        rule.triggers.some(trigger => trigger.startsWith('skill_') || trigger.includes('Skill'))
      )
      
      if (skillDependentRules.length > 0) {
        const context = this.createCalculationContext(character)
        skillDependentRules.forEach(rule => {
          this.executeCalculationRule(character, rule, context)
        })
      }
    }
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
      
      // 记录计算前的值（用于调试）
      const oldValue = this.getFieldValue(character, rule.targetField)
      
      // 计算新值
      const newValue = this.evaluateFormula(rule.formula, context)
      
      // 更新字段值
      this.setFieldValue(character, rule.targetField, newValue)
      
      // 在开发环境下记录计算过程
      if (process.env.NODE_ENV === 'development' || typeof window !== 'undefined') {
        if (oldValue !== newValue) {
          console.log(`🔄 计算规则执行: ${rule.name}`)
          console.log(`   公式: ${rule.formula}`)
          console.log(`   ${rule.targetField}: ${oldValue} → ${newValue}`)
        }
      }
      
    } catch (error) {
      console.error(`计算规则执行失败: ${rule.name}`, error)
    }
  }
  
  // 重新计算技能
  private recalculateSkills(character: CharacterData, context: CalculationContext): void {
    this.ruleSystem.characterSchema.skills.forEach(skillDef => {
      const skill = character.skills[skillDef.id]
      if (skill) {
        const baseAttrValue = context.getAttributeValue(skillDef.keyAbility)
        const attrModifier = this.getAttributeModifier(baseAttrValue)
        const proficiencyBonus = this.getProficiencyBonus(skill.proficiencyLevel)
        skill.totalModifier = attrModifier + skill.modifier + proficiencyBonus
      }
    })
  }

  // 获取受训等级加值
  private getProficiencyBonus(level: string): number {
    switch (level) {
      case 'untrained': return 0
      case 'trained': return 2
      case 'expert': return 4
      case 'master': return 6
      case 'legendary': return 8
      default: return 0
    }
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
  
  // 公式求值（增强版，支持更多变量引用）
  private evaluateFormula(formula: string, context: CalculationContext): any {
    try {
      // 替换变量
      let processedFormula = formula
      
      // 支持直接属性名引用 strength -> context.getAttributeValue('strength')
      const attributeIds = this.ruleSystem.characterSchema.attributes.map(attr => attr.id)
      attributeIds.forEach(attrId => {
        const regex = new RegExp(`\\b${attrId}\\b`, 'g')
        processedFormula = processedFormula.replace(regex, `context.getAttributeValue('${attrId}')`)
      })
      
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
      
      // 替换修正值引用 strengthModifier -> context.getAttributeValue('strengthModifier')
      const modifierPattern = /(\w+)Modifier\b/g
      processedFormula = processedFormula.replace(modifierPattern, (match) => {
        return `context.getAttributeValue('${match}')`
      })
      
      // 替换函数调用
      processedFormula = processedFormula.replace(/\bMath\.floor/g, 'context.floor')
      processedFormula = processedFormula.replace(/\bMath\.ceil/g, 'context.ceil')
      processedFormula = processedFormula.replace(/\bMath\.round/g, 'context.round')
      processedFormula = processedFormula.replace(/\bMath\.min/g, 'context.min')
      processedFormula = processedFormula.replace(/\bMath\.max/g, 'context.max')
      processedFormula = processedFormula.replace(/\bfloor/g, 'context.floor')
      processedFormula = processedFormula.replace(/\bceil/g, 'context.ceil')
      processedFormula = processedFormula.replace(/\bround/g, 'context.round')
      processedFormula = processedFormula.replace(/\bmin/g, 'context.min')
      processedFormula = processedFormula.replace(/\bmax/g, 'context.max')
      
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
        } else if (prop === 'proficiencyLevel') {
          skill.proficiencyLevel = value as ProficiencyLevel
          // 同步更新trained属性以保持兼容
          skill.trained = value !== 'untrained'
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

  // 获取计算过程详情（用于调试和展示）
  public getCalculationDetails(character: CharacterData): CalculationDetails[] {
    const details: CalculationDetails[] = []
    const context = this.createCalculationContext(character)
    
    // 遍历所有计算规则
    this.ruleSystem.calculations.forEach(rule => {
      try {
        const currentValue = this.getFieldValue(character, rule.targetField)
        const calculatedValue = this.evaluateFormula(rule.formula, context)
        
        // 分析公式中的变量
        const variables = this.extractVariables(rule.formula)
        const variableValues: Record<string, any> = {}
        
        variables.forEach(varName => {
          if (character.attributes[varName] !== undefined) {
            variableValues[varName] = character.attributes[varName]
          }
        })
        
        details.push({
          ruleName: rule.name,
          targetField: rule.targetField,
          formula: rule.formula,
          variables: variableValues,
          currentValue,
          calculatedValue,
          isUpToDate: currentValue === calculatedValue
        })
      } catch (error) {
        details.push({
          ruleName: rule.name,
          targetField: rule.targetField,
          formula: rule.formula,
          variables: {},
          currentValue: null,
          calculatedValue: null,
          isUpToDate: false,
          error: error instanceof Error ? error.message : String(error)
        })
      }
    })
    
    return details
  }
  
  // 提取公式中的变量名
  private extractVariables(formula: string): string[] {
    const variables: Set<string> = new Set()
    
    // 匹配属性名（字母开头的标识符）
    const variablePattern = /\b[a-zA-Z]\w*\b/g
    const matches = formula.match(variablePattern) || []
    
    matches.forEach(match => {
      // 排除函数名和关键字
      const excluded = ['Math', 'floor', 'ceil', 'round', 'min', 'max', 'context', 'getAttributeValue']
      if (!excluded.includes(match)) {
        variables.add(match)
      }
    })
    
    return Array.from(variables)
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

// 计算过程详情
interface CalculationDetails {
  ruleName: string
  targetField: string
  formula: string
  variables: Record<string, any>
  currentValue: any
  calculatedValue: any
  isUpToDate: boolean
  error?: string
}
