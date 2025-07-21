import { RuleEngine } from '../utils/RuleEngine';
import { ruleSystemManager } from '../utils/RuleSystemManager';
import { CharacterData } from '../types/ruleSystem';

/**
 * 测试 Pathfinder 规则系统
 */
async function testPathfinderRules() {
  console.log('开始测试 Pathfinder 规则系统...');

  try {
    // 加载 Pathfinder 规则
    await ruleSystemManager.setCurrentRuleSystem('pathfinder');
    const ruleConfig = ruleSystemManager.getCurrentRuleSystem();
    
    if (!ruleConfig) {
      throw new Error('无法加载 Pathfinder 规则配置');
    }

    console.log('✓ 成功加载规则配置:', ruleConfig.name);

    // 创建规则引擎
    const ruleEngine = new RuleEngine(ruleConfig);

    // 创建角色数据
    console.log('\n创建角色数据...');
    const initialCharacter = ruleEngine.createCharacter('player1', '测试角色');
    console.log('初始角色数据:');
    console.log('- 角色名:', initialCharacter.name);
    console.log('- 规则系统:', initialCharacter.ruleSystemId);
    console.log('- 属性值:', JSON.stringify(initialCharacter.attributes, null, 2));

    // 测试属性值修改和自动计算
    console.log('\n测试属性值修改和自动计算...');
    
    // 设置力量为 16
    const updatedCharacter1 = ruleEngine.updateCharacter(initialCharacter, 'attributes.strength', 16);
    console.log('设置力量为16后:');
    console.log('- 力量:', updatedCharacter1.attributes.strength);

    // 设置敏捷为 14
    const updatedCharacter2 = ruleEngine.updateCharacter(updatedCharacter1, 'attributes.dexterity', 14);
    console.log('\n设置敏捷为14后:');
    console.log('- 敏捷:', updatedCharacter2.attributes.dexterity);

    // 设置体质为 18
    const updatedCharacter3 = ruleEngine.updateCharacter(updatedCharacter2, 'attributes.constitution', 18);
    console.log('\n设置体质为18后:');
    console.log('- 体质:', updatedCharacter3.attributes.constitution);

    // 设置等级为 5
    const updatedCharacter4 = ruleEngine.updateCharacter(updatedCharacter3, 'attributes.level', 5);
    console.log('\n设置等级为5后:');
    console.log('- 等级:', updatedCharacter4.attributes.level);
    console.log('- 所有属性:', JSON.stringify(updatedCharacter4.attributes, null, 2));

    // 测试技能修改
    console.log('\n测试技能修改...');
    const skillUpdatedCharacter = ruleEngine.updateCharacter(updatedCharacter4, 'skills.acrobatics.trained', true);
    console.log('设置杂技为受训后:');
    console.log('- 杂技技能:', JSON.stringify(skillUpdatedCharacter.skills.acrobatics, null, 2));

    // 测试字段信息获取
    console.log('\n测试字段信息获取...');
    console.log('力量字段显示名称:', ruleSystemManager.getFieldDisplayName('strength'));
    console.log('力量字段描述:', ruleSystemManager.getFieldDescription('strength'));
    console.log('能力类别字段:', ruleSystemManager.getFieldsByCategory('ability'));

    // 显示最终角色状态
    console.log('\n最终角色状态:');
    console.log('属性:', JSON.stringify(skillUpdatedCharacter.attributes, null, 2));
    console.log('技能:', JSON.stringify(skillUpdatedCharacter.skills, null, 2));

    console.log('\n✓ 所有测试通过！');

  } catch (error) {
    console.error('测试失败:', error);
  }
}

// 运行测试
if (require.main === module) {
  testPathfinderRules();
}

export { testPathfinderRules };
