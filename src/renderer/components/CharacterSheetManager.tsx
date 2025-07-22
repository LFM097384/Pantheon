import React, { useState, useEffect } from 'react';
import { Card, Tabs, Form, Input, InputNumber, Select, Button, message, Spin, Row, Col, Typography } from 'antd';
import { SaveOutlined, ReloadOutlined, UserOutlined } from '@ant-design/icons';
import { RuleEngine } from '../../utils/RuleEngine';
import { ruleSystemManager } from '../../utils/RuleSystemManager';
import { CharacterData, RuleSystemConfig, AttributeDefinition, SkillDefinition } from '../../types/ruleSystem';

const { TabPane } = Tabs;
const { Option } = Select;
const { Text } = Typography;

interface CharacterSheetManagerProps {
  characterId?: string;
  onSave?: (character: CharacterData) => void;
  onLoad?: (characterId: string) => CharacterData | null;
  ruleSystemId?: string;
}

export const CharacterSheetManager: React.FC<CharacterSheetManagerProps> = ({
  characterId,
  onSave,
  onLoad,
  ruleSystemId = 'pathfinder'
}) => {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [ruleSystem, setRuleSystem] = useState<RuleSystemConfig | null>(null);
  const [ruleEngine, setRuleEngine] = useState<RuleEngine | null>(null);
  const [character, setCharacter] = useState<CharacterData | null>(null);
  const [form] = Form.useForm();

  // 初始化规则系统和角色
  useEffect(() => {
    const initializeRuleSystem = async () => {
      try {
        setLoading(true);
        
        // 加载规则系统
        await ruleSystemManager.setCurrentRuleSystem(ruleSystemId);
        const ruleConfig = ruleSystemManager.getCurrentRuleSystem();
        
        if (!ruleConfig) {
          throw new Error(`无法加载规则系统: ${ruleSystemId}`);
        }

        setRuleSystem(ruleConfig);
        const engine = new RuleEngine(ruleConfig);
        setRuleEngine(engine);

        // 加载或创建角色
        let characterData: CharacterData;
        
        if (characterId && onLoad) {
          // 尝试加载现有角色
          const loadedCharacter = onLoad(characterId);
          if (loadedCharacter) {
            characterData = loadedCharacter;
          } else {
            throw new Error(`无法加载角色: ${characterId}`);
          }
        } else {
          // 创建新角色
          characterData = engine.createCharacter(
            'player1', // TODO: 从用户上下文获取
            '新角色'
          );
        }

        setCharacter(characterData);
        
        // 设置表单初始值
        const formValues = {
          ...characterData.attributes,
          ...characterData.customFields
        };
        
        // 添加技能值
        Object.entries(characterData.skills).forEach(([skillId, skillValue]) => {
          formValues[`skill_${skillId}_trained`] = skillValue.trained;
          formValues[`skill_${skillId}_modifier`] = skillValue.modifier;
          formValues[`skill_${skillId}_proficiencyLevel`] = skillValue.proficiencyLevel || 'untrained';
        });

        form.setFieldsValue(formValues);
        
      } catch (error) {
        console.error('初始化失败:', error);
        message.error(`初始化失败: ${error instanceof Error ? error.message : '未知错误'}`);
      } finally {
        setLoading(false);
      }
    };

    initializeRuleSystem();
  }, [ruleSystemId, characterId, onLoad, form]);

  // 处理字段变化 - 增强版，支持更完整的实时同步
  const handleFieldChange = (fieldPath: string, value: any) => {
    if (!character || !ruleEngine) return;

    try {
      console.log(`🔄 字段变化: ${fieldPath} = `, value);
      
      // 更新角色数据
      const updatedCharacter = ruleEngine.updateCharacter(character, fieldPath, value);
      setCharacter(updatedCharacter);

      console.log('📊 更新后的角色数据:', updatedCharacter);

      // 获取当前表单值
      const currentFormValues = form.getFieldsValue();
      
      // 更新所有属性值到表单
      const newFormValues = { ...currentFormValues };
      
      Object.entries(updatedCharacter.attributes).forEach(([key, val]) => {
        newFormValues[key] = val;
      });

      // 更新技能值到表单
      Object.entries(updatedCharacter.skills).forEach(([skillId, skillValue]) => {
        newFormValues[`skill_${skillId}_trained`] = skillValue.trained;
        newFormValues[`skill_${skillId}_modifier`] = skillValue.modifier;
        newFormValues[`skill_${skillId}_proficiencyLevel`] = skillValue.proficiencyLevel || 'untrained';
        // 注意：totalModifier是计算得出的，不需要在表单中设置
      });

      // 更新自定义字段
      Object.entries(updatedCharacter.customFields).forEach(([key, val]) => {
        newFormValues[key] = val;
      });

      console.log('📝 更新表单值:', newFormValues);

      // 批量更新表单值
      form.setFieldsValue(newFormValues);
      
      // 如果改变的是基础属性，显示提示信息
      if (fieldPath.startsWith('attributes.')) {
        const attrName = fieldPath.substring(11);
        const isBaseAttribute = ['strength', 'dexterity', 'constitution', 'intelligence', 'wisdom', 'charisma'].includes(attrName);
        if (isBaseAttribute) {
          console.log(`✅ 基础属性 ${attrName} 已更新，相关计算已自动重新计算`);
          console.log(`📈 ${attrName}Modifier = ${updatedCharacter.attributes[attrName + 'Modifier']}`);
        }
      }
      
    } catch (error) {
      console.error('字段更新失败:', error);
      message.error('字段更新失败');
    }
  };

  // 保存角色
  const handleSave = async () => {
    if (!character) return;

    try {
      setSaving(true);
      
      if (onSave) {
        await onSave(character);
        message.success('角色已保存');
      } else {
        // 默认保存到本地存储
        localStorage.setItem(`character_${character.id}`, JSON.stringify(character));
        message.success('角色已保存到本地');
      }
    } catch (error) {
      console.error('保存失败:', error);
      message.error('保存失败');
    } finally {
      setSaving(false);
    }
  };

  // 重置角色
  const handleReset = () => {
    if (!ruleEngine) return;

    const newCharacter = ruleEngine.createCharacter('player1', '新角色');
    setCharacter(newCharacter);
    
    const formValues = {
      ...newCharacter.attributes,
      ...newCharacter.customFields
    };
    
    form.setFieldsValue(formValues);
    message.info('角色已重置');
  };

  // 渲染属性输入 - 增强版，显示计算值
  const renderAttributeInput = (attr: AttributeDefinition) => {
    if (!character) return null;
    
    const isReadonly = attr.category === 'derived' || attr.category === 'modifier';
    const currentValue = character.attributes[attr.id];
    
    // 如果是修正值，显示对应的基础属性
    let baseAttribute = '';
    if (attr.id.endsWith('Modifier')) {
      baseAttribute = attr.id.replace('Modifier', '');
    }
    
    if (attr.type === 'enum') {
      return (
        <Select
          disabled={isReadonly}
          placeholder={`选择${attr.displayName}`}
          value={currentValue}
          onChange={(value) => handleFieldChange(`attributes.${attr.id}`, value)}
        >
          {attr.enumValues?.map(enumValue => (
            <Option key={enumValue} value={enumValue}>{enumValue}</Option>
          ))}
        </Select>
      );
    }

    if (attr.type === 'number') {
      return (
        <div style={{ position: 'relative' }}>
          <InputNumber
            style={{ width: '100%' }}
            min={attr.min}
            max={attr.max}
            disabled={isReadonly}
            placeholder={attr.displayName}
            value={currentValue}
            onChange={(value) => handleFieldChange(`attributes.${attr.id}`, value || 0)}
          />
          {isReadonly && baseAttribute && (
            <div style={{ 
              fontSize: '11px', 
              color: '#666', 
              position: 'absolute', 
              right: '8px', 
              bottom: '-16px' 
            }}>
              基于 {baseAttribute}
            </div>
          )}
        </div>
      );
    }

    return (
      <Input
        disabled={isReadonly}
        placeholder={attr.displayName}
        value={currentValue}
        onChange={(e) => handleFieldChange(`attributes.${attr.id}`, e.target.value)}
      />
    );
  };

  // 渲染技能输入 - 增强版，显示更多信息
  const renderSkillInput = (skill: SkillDefinition) => {
    if (!character || !ruleSystem) return null;
    
    const skillValue = character.skills[skill.id];
    if (!skillValue) return null;

    // 获取关联的基础属性值和修正值
    const baseAttrValue = character.attributes[skill.keyAbility] || 10;
    const baseAttrModifier = Math.floor((baseAttrValue - 10) / 2);
    const skillRanks = skillValue.modifier;
    
    // 获取受训等级加值
    const getProficiencyBonus = (level: string): number => {
      switch (level) {
        case 'untrained': return 0
        case 'trained': return 2
        case 'expert': return 4
        case 'master': return 6
        case 'legendary': return 8
        default: return 0
      }
    };

    const proficiencyBonus = getProficiencyBonus(skillValue.proficiencyLevel || 'untrained');
    
    // 重新计算总修正值（确保显示最新的值）
    const calculatedTotalModifier = baseAttrModifier + skillRanks + proficiencyBonus;
    const totalModifier = calculatedTotalModifier; // 使用计算出的值而不是存储的值

    // 计算修正值来源的详细信息
    const modifierBreakdown = [
      { source: '属性修正', value: baseAttrModifier },
      { source: '技能点数', value: skillRanks },
      { source: '受训加值', value: proficiencyBonus }
    ];

    return (
      <Row gutter={8} align="middle" style={{ marginBottom: '4px' }}>
        <Col span={8}>
          <span style={{ fontWeight: skillValue.trained ? 'bold' : 'normal' }}>
            {skill.displayName}
            {skill.trainedOnly && (
              <span style={{ color: '#ff4d4f', fontSize: '12px' }}> *</span>
            )}
          </span>
          <div style={{ fontSize: '11px', color: '#666' }}>
            ({skill.keyAbility.substring(0, 3).toUpperCase()})
          </div>
        </Col>
        <Col span={5}>
          <Select
            size="small"
            value={skillValue.proficiencyLevel || 'untrained'}
            onChange={(value) => handleFieldChange(`skills.${skill.id}.proficiencyLevel`, value)}
            style={{ width: '100%' }}
          >
            <Option value="untrained">未受训 (+0)</Option>
            <Option value="trained">受训 (+2)</Option>
            <Option value="expert">专家 (+4)</Option>
            <Option value="master">大师 (+6)</Option>
            <Option value="legendary">传奇 (+8)</Option>
          </Select>
        </Col>
        <Col span={4}>
          <InputNumber
            size="small"
            min={0}
            max={20}
            value={skillRanks}
            onChange={(value) => handleFieldChange(`skills.${skill.id}.modifier`, value || 0)}
            style={{ width: '100%' }}
          />
        </Col>
        <Col span={4} style={{ textAlign: 'center', fontWeight: 'bold' }}>
          <span style={{ 
            color: totalModifier >= 0 ? '#52c41a' : '#ff4d4f',
            fontSize: '14px'
          }}>
            {totalModifier >= 0 ? '+' : ''}{totalModifier}
          </span>
        </Col>
        <Col span={3} style={{ textAlign: 'center' }}>
          <Button
            type="text"
            size="small"
            style={{ padding: '0 4px', height: '20px' }}
            title={`修正值详情:\n${modifierBreakdown.map(item => `${item.source}: ${item.value >= 0 ? '+' : ''}${item.value}`).join('\n')}`}
          >
            ℹ️
          </Button>
        </Col>
      </Row>
    );
  };

  // 根据类别分组属性
  const groupAttributesByCategory = () => {
    if (!ruleSystem) return {};
    
    const groups: Record<string, AttributeDefinition[]> = {};
    
    ruleSystem.characterSchema.attributes.forEach(attr => {
      if (!groups[attr.category]) {
        groups[attr.category] = [];
      }
      groups[attr.category].push(attr);
    });
    
    return groups;
  };

  // 根据类别分组技能
  const groupSkillsByCategory = () => {
    if (!ruleSystem) return {};
    
    const groups: Record<string, SkillDefinition[]> = {};
    
    ruleSystem.characterSchema.skills.forEach(skill => {
      if (!groups[skill.category]) {
        groups[skill.category] = [];
      }
      groups[skill.category].push(skill);
    });
    
    return groups;
  };

  if (loading) {
    return (
      <div style={{ textAlign: 'center', padding: '50px' }}>
        <Spin size="large" />
        <p>加载角色卡...</p>
      </div>
    );
  }

  if (!ruleSystem || !character) {
    return (
      <div style={{ textAlign: 'center', padding: '50px' }}>
        <p>无法加载角色卡</p>
      </div>
    );
  }

  const attributeGroups = groupAttributesByCategory();
  const skillGroups = groupSkillsByCategory();

  return (
    <div style={{ padding: '16px' }}>
      <Card
        title={
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span>
              <UserOutlined style={{ marginRight: '8px' }} />
              {character.name} - {ruleSystem.name}
            </span>
            <div>
              <Button 
                icon={<ReloadOutlined />} 
                onClick={handleReset}
                style={{ marginRight: '8px' }}
              >
                重置
              </Button>
              <Button 
                type="primary" 
                icon={<SaveOutlined />} 
                loading={saving}
                onClick={handleSave}
              >
                保存
              </Button>
            </div>
          </div>
        }
      >
        <Form form={form} layout="vertical">
          <Tabs defaultActiveKey="basic">
            <TabPane tab="基本信息" key="basic">
              <Row gutter={16}>
                {/* 身份信息 */}
                {attributeGroups.identity && (
                  <Col span={24}>
                    <Card size="small" title="身份信息" style={{ marginBottom: '16px' }}>
                      <Row gutter={16}>
                        {attributeGroups.identity.map(attr => (
                          <Col span={8} key={attr.id}>
                            <Form.Item
                              label={attr.displayName}
                              name={attr.id}
                              tooltip={attr.description}
                            >
                              {renderAttributeInput(attr)}
                            </Form.Item>
                          </Col>
                        ))}
                      </Row>
                    </Card>
                  </Col>
                )}

                {/* 物理特征 */}
                {attributeGroups.physical && (
                  <Col span={24}>
                    <Card size="small" title="物理特征" style={{ marginBottom: '16px' }}>
                      <Row gutter={16}>
                        {attributeGroups.physical.map(attr => (
                          <Col span={6} key={attr.id}>
                            <Form.Item
                              label={attr.displayName}
                              name={attr.id}
                              tooltip={attr.description}
                            >
                              {renderAttributeInput(attr)}
                            </Form.Item>
                          </Col>
                        ))}
                      </Row>
                    </Card>
                  </Col>
                )}
              </Row>
            </TabPane>

            <TabPane tab="属性" key="attributes">
              <Row gutter={16}>
                {/* 基础属性 */}
                {attributeGroups.ability && (
                  <Col span={12}>
                    <Card size="small" title="基础属性" style={{ marginBottom: '16px' }}>
                      {attributeGroups.ability.map(attr => (
                        <Form.Item
                          key={attr.id}
                          label={attr.displayName}
                          name={attr.id}
                          tooltip={attr.description}
                        >
                          {renderAttributeInput(attr)}
                        </Form.Item>
                      ))}
                    </Card>
                  </Col>
                )}

                {/* 属性调整值 */}
                {attributeGroups.modifier && (
                  <Col span={12}>
                    <Card size="small" title="属性调整值" style={{ marginBottom: '16px' }}>
                      {attributeGroups.modifier.map(attr => (
                        <Form.Item
                          key={attr.id}
                          label={attr.displayName}
                          name={attr.id}
                          tooltip={attr.description}
                        >
                          {renderAttributeInput(attr)}
                        </Form.Item>
                      ))}
                    </Card>
                  </Col>
                )}
              </Row>
            </TabPane>

            <TabPane tab="战斗" key="combat">
              <Row gutter={16}>
                {/* 战斗属性 */}
                {(attributeGroups.derived || attributeGroups.combat) && (
                  <Col span={24}>
                    <Card size="small" title="战斗属性" style={{ marginBottom: '16px' }}>
                      <Row gutter={16}>
                        {[...(attributeGroups.derived || []), ...(attributeGroups.combat || [])].map(attr => (
                          <Col span={8} key={attr.id}>
                            <Form.Item
                              label={attr.displayName}
                              name={attr.id}
                              tooltip={attr.description}
                            >
                              {renderAttributeInput(attr)}
                            </Form.Item>
                          </Col>
                        ))}
                      </Row>
                    </Card>
                  </Col>
                )}
              </Row>
            </TabPane>

            <TabPane tab="技能" key="skills">
              <Card size="small" title="技能列表">
                <Row gutter={16} style={{ marginBottom: '8px', fontWeight: 'bold', borderBottom: '1px solid #d9d9d9', paddingBottom: '4px' }}>
                  <Col span={8}>技能名称</Col>
                  <Col span={5} style={{ textAlign: 'center' }}>受训等级</Col>
                  <Col span={4} style={{ textAlign: 'center' }}>技能点</Col>
                  <Col span={4} style={{ textAlign: 'center' }}>总修正</Col>
                  <Col span={3} style={{ textAlign: 'center' }}>详情</Col>
                </Row>
                
                {Object.entries(skillGroups).map(([category, skills]) => (
                  <div key={category} style={{ marginBottom: '16px' }}>
                    <h4 style={{ 
                      color: '#1890ff', 
                      marginBottom: '8px',
                      borderLeft: '3px solid #1890ff',
                      paddingLeft: '8px'
                    }}>
                      {getCategoryDisplayName(category)}
                    </h4>
                    {skills.map(skill => (
                      <div key={skill.id}>
                        {renderSkillInput(skill)}
                      </div>
                    ))}
                  </div>
                ))}
                
                <div style={{ marginTop: '16px', padding: '8px', backgroundColor: '#f6f6f6', borderRadius: '4px' }}>
                  <Text type="secondary" style={{ fontSize: '12px' }}>
                    * 标记为仅受训的技能需要至少1点技能点数才能使用<br/>
                    总修正 = 属性修正 + 技能点数 + 其他修正
                  </Text>
                </div>
              </Card>
            </TabPane>
          </Tabs>
        </Form>
      </Card>
    </div>
  );
};

// 获取类别显示名称
const getCategoryDisplayName = (category: string): string => {
  const categoryNames: Record<string, string> = {
    physical: '物理技能',
    social: '社交技能',
    knowledge: '知识技能',
    awareness: '感知技能',
    technical: '技术技能'
  };
  
  return categoryNames[category] || category;
};

export default CharacterSheetManager;
