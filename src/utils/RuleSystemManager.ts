import { RuleSystemConfig } from '../types/ruleSystem';

/**
 * 规则系统管理器
 * 负责加载、管理和提供不同的规则系统配置
 */
export class RuleSystemManager {
  private static instance: RuleSystemManager;
  private ruleSystems: Map<string, RuleSystemConfig> = new Map();
  private currentRuleSystem: string | null = null;

  private constructor() {}

  public static getInstance(): RuleSystemManager {
    if (!RuleSystemManager.instance) {
      RuleSystemManager.instance = new RuleSystemManager();
    }
    return RuleSystemManager.instance;
  }

  /**
   * 加载规则系统配置
   */
  public async loadRuleSystem(ruleSystemId: string): Promise<RuleSystemConfig> {
    // 如果已经加载过，直接返回
    if (this.ruleSystems.has(ruleSystemId)) {
      return this.ruleSystems.get(ruleSystemId)!;
    }

    try {
      // 动态导入规则配置文件
      const configPath = `../ruleConfigs/${ruleSystemId}.json`;
      const config = await import(configPath);
      const ruleSystemConfig: RuleSystemConfig = config.default || config;

      // 验证配置文件格式
      this.validateRuleSystemConfig(ruleSystemConfig);

      // 缓存配置
      this.ruleSystems.set(ruleSystemId, ruleSystemConfig);

      return ruleSystemConfig;
    } catch (error) {
      throw new Error(`Failed to load rule system '${ruleSystemId}': ${error}`);
    }
  }

  /**
   * 获取当前激活的规则系统
   */
  public getCurrentRuleSystem(): RuleSystemConfig | null {
    if (!this.currentRuleSystem) {
      return null;
    }
    return this.ruleSystems.get(this.currentRuleSystem) || null;
  }

  /**
   * 设置当前激活的规则系统
   */
  public async setCurrentRuleSystem(ruleSystemId: string): Promise<void> {
    // 确保规则系统已加载
    await this.loadRuleSystem(ruleSystemId);
    this.currentRuleSystem = ruleSystemId;
  }

  /**
   * 获取所有可用的规则系统列表
   */
  public getAvailableRuleSystems(): string[] {
    return Array.from(this.ruleSystems.keys());
  }

  /**
   * 验证规则系统配置的完整性
   */
  private validateRuleSystemConfig(config: RuleSystemConfig): void {
    if (!config.id || !config.name || !config.characterSchema) {
      throw new Error('Invalid rule system config: missing required fields');
    }

    if (!config.characterSchema.attributes || !Array.isArray(config.characterSchema.attributes)) {
      throw new Error('Invalid rule system config: attributes schema is required');
    }

    // 验证计算规则的依赖字段是否存在
    if (config.calculations) {
      for (const calc of config.calculations) {
        for (const trigger of calc.triggers) {
          if (!this.fieldExists(config, trigger)) {
            console.warn(`Calculation '${calc.id}' depends on non-existent field '${trigger}'`);
          }
        }
      }
    }

    // 验证依赖关系的字段是否存在
    if (config.dependencies) {
      for (const dep of config.dependencies) {
        if (!this.fieldExists(config, dep.sourceField)) {
          console.warn(`Dependency trigger field '${dep.sourceField}' does not exist`);
        }
        if (!this.fieldExists(config, dep.targetField)) {
          console.warn(`Dependency affected field '${dep.targetField}' does not exist`);
        }
      }
    }
  }

  /**
   * 检查字段是否在规则系统中存在
   */
  private fieldExists(config: RuleSystemConfig, fieldId: string): boolean {
    // 检查属性
    const attributeExists = config.characterSchema.attributes.some(attr => attr.id === fieldId);
    if (attributeExists) return true;

    // 检查技能
    const skillExists = config.characterSchema.skills.some(skill => skill.id === fieldId);
    if (skillExists) return true;

    // 检查自定义字段
    const customFieldExists = config.characterSchema.customFields.some(field => field.id === fieldId);
    if (customFieldExists) return true;

    // 检查计算字段（作为其他计算的目标字段）
    const calculatedFieldExists = config.calculations?.some(calc => calc.targetField === fieldId);
    if (calculatedFieldExists) return true;

    return false;
  }

  /**
   * 获取字段的显示名称
   */
  public getFieldDisplayName(fieldId: string): string {
    const currentRule = this.getCurrentRuleSystem();
    if (!currentRule) {
      return fieldId;
    }

    // 按优先级查找字段名称
    const attribute = currentRule.characterSchema.attributes.find(attr => attr.id === fieldId);
    if (attribute) return attribute.displayName || attribute.name;

    const skill = currentRule.characterSchema.skills.find(skill => skill.id === fieldId);
    if (skill) return skill.displayName || skill.name;

    const customField = currentRule.characterSchema.customFields.find(field => field.id === fieldId);
    if (customField) return customField.displayName || customField.name;

    return fieldId;
  }

  /**
   * 获取字段的描述
   */
  public getFieldDescription(fieldId: string): string {
    const currentRule = this.getCurrentRuleSystem();
    if (!currentRule) {
      return '';
    }

    const attribute = currentRule.characterSchema.attributes.find(attr => attr.id === fieldId);
    if (attribute) return attribute.description || '';

    const skill = currentRule.characterSchema.skills.find(skill => skill.id === fieldId);
    if (skill) return skill.description || '';

    const customField = currentRule.characterSchema.customFields.find(field => field.id === fieldId);
    if (customField) return customField.description || '';

    return '';
  }

  /**
   * 根据类别获取字段列表
   */
  public getFieldsByCategory(category: string): string[] {
    const currentRule = this.getCurrentRuleSystem();
    if (!currentRule) {
      return [];
    }

    const fields: string[] = [];

    // 搜索属性
    currentRule.characterSchema.attributes.forEach(attr => {
      if (attr.category === category) {
        fields.push(attr.id);
      }
    });

    // 搜索技能
    currentRule.characterSchema.skills.forEach(skill => {
      if (skill.category === category) {
        fields.push(skill.id);
      }
    });

    // 搜索自定义字段
    currentRule.characterSchema.customFields.forEach(field => {
      if (field.category === category) {
        fields.push(field.id);
      }
    });

    return fields;
  }
}

// 导出单例实例
export const ruleSystemManager = RuleSystemManager.getInstance();
