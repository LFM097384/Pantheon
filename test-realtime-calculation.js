#!/usr/bin/env node

// 车卡系统实时计算测试脚本
const { RuleEngine } = require('./dist/utils/RuleEngine.js');
const pathfinderConfig = require('./src/ruleConfigs/pathfinder.json');

console.log('🧪 车卡系统实时计算测试');
console.log('================================');

// 创建规则引擎
const ruleEngine = new RuleEngine(pathfinderConfig);

// 创建测试角色
console.log('📝 创建测试角色...');
const testCharacter = ruleEngine.createCharacter('test_player', '测试角色');

console.log('初始角色数据:');
console.log('- 力量:', testCharacter.attributes.strength);
console.log('- 力量修正:', testCharacter.attributes.strengthModifier);
console.log('- 基础攻击加值:', testCharacter.attributes.baseAttackBonus);
console.log('- 护甲等级:', testCharacter.attributes.armorClass);

// 测试1: 修改力量属性
console.log('\n🔄 测试1: 修改力量属性从10到16...');
const updatedCharacter1 = ruleEngine.updateCharacter(testCharacter, 'attributes.strength', 16);

console.log('更新后的角色数据:');
console.log('- 力量:', updatedCharacter1.attributes.strength);
console.log('- 力量修正:', updatedCharacter1.attributes.strengthModifier);
console.log('- 基础攻击加值:', updatedCharacter1.attributes.baseAttackBonus);
console.log('- 护甲等级:', updatedCharacter1.attributes.armorClass);

// 测试2: 修改等级
console.log('\n🔄 测试2: 修改等级从1到5...');
const updatedCharacter2 = ruleEngine.updateCharacter(updatedCharacter1, 'attributes.level', 5);

console.log('更新后的角色数据:');
console.log('- 等级:', updatedCharacter2.attributes.level);
console.log('- 基础攻击加值:', updatedCharacter2.attributes.baseAttackBonus);
console.log('- 生命值:', updatedCharacter2.attributes.hitPoints);
console.log('- 强韧豁免:', updatedCharacter2.attributes.fortitudeSave);

// 测试3: 技能计算
console.log('\n🔄 测试3: 检查技能计算...');
const acrobaticsSkill = updatedCharacter2.skills.acrobatics;
if (acrobaticsSkill) {
  console.log('杂技技能:');
  console.log('- 受训:', acrobaticsSkill.trained);
  console.log('- 技能点数:', acrobaticsSkill.modifier);
  console.log('- 总修正:', acrobaticsSkill.totalModifier);
  console.log('- 敏捷修正:', updatedCharacter2.attributes.dexterityModifier);
}

// 测试4: 修改敏捷并观察技能变化
console.log('\n🔄 测试4: 修改敏捷属性并观察技能变化...');
const updatedCharacter3 = ruleEngine.updateCharacter(updatedCharacter2, 'attributes.dexterity', 18);

console.log('修改敏捷后:');
console.log('- 敏捷:', updatedCharacter3.attributes.dexterity);
console.log('- 敏捷修正:', updatedCharacter3.attributes.dexterityModifier);
console.log('- 杂技总修正:', updatedCharacter3.skills.acrobatics.totalModifier);
console.log('- 护甲等级:', updatedCharacter3.attributes.armorClass);

// 验证计算正确性
console.log('\n✅ 验证计算正确性...');
const expectedStrModifier = Math.floor((16 - 10) / 2); // = 3
const expectedDexModifier = Math.floor((18 - 10) / 2); // = 4
const expectedBAB = Math.floor(5 * 3 / 4); // = 3
const expectedAC = 10 + expectedDexModifier; // = 14

console.log('预期值 vs 实际值:');
console.log(`- 力量修正: ${expectedStrModifier} vs ${updatedCharacter3.attributes.strengthModifier}`);
console.log(`- 敏捷修正: ${expectedDexModifier} vs ${updatedCharacter3.attributes.dexterityModifier}`);
console.log(`- 基础攻击加值: ${expectedBAB} vs ${updatedCharacter3.attributes.baseAttackBonus}`);
console.log(`- 护甲等级: ${expectedAC} vs ${updatedCharacter3.attributes.armorClass}`);

const allCorrect = 
  updatedCharacter3.attributes.strengthModifier === expectedStrModifier &&
  updatedCharacter3.attributes.dexterityModifier === expectedDexModifier &&
  updatedCharacter3.attributes.baseAttackBonus === expectedBAB &&
  updatedCharacter3.attributes.armorClass === expectedAC;

if (allCorrect) {
  console.log('\n🎉 所有计算都正确！实时同步工作正常。');
} else {
  console.log('\n❌ 部分计算不正确，需要调试。');
}

console.log('\n📊 测试完成！');
