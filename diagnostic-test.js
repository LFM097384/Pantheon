/**
 * 测试属性调整值计算和技能受训等级问题
 */

import fs from 'fs';

console.log('=== 诊断属性计算和技能受训问题 ===\n');

// 读取PF规则配置
const ruleConfig = JSON.parse(fs.readFileSync('./src/ruleConfigs/pathfinder.json', 'utf8'));

console.log('1. 检查属性调整值计算规则配置...');
const modifierRules = ruleConfig.calculations.filter(rule => 
  rule.name.includes('调整值') || rule.targetField.includes('Modifier')
);

console.log(`找到 ${modifierRules.length} 个属性调整值计算规则:`);
modifierRules.forEach(rule => {
  console.log(`- ${rule.name}:`);
  console.log(`  目标字段: ${rule.targetField}`);
  console.log(`  公式: ${rule.formula}`);
  console.log(`  触发器: [${rule.triggers.join(', ')}]`);
});

console.log('\n2. 检查基础属性定义...');
const baseAttributes = ruleConfig.characterSchema.attributes.filter(attr => 
  attr.category === 'ability'
);

console.log(`找到 ${baseAttributes.length} 个基础属性:`);
baseAttributes.forEach(attr => {
  console.log(`- ${attr.displayName} (${attr.id}): 默认值=${attr.defaultValue}, 类别=${attr.category}`);
});

console.log('\n3. 检查衍生属性定义...');
const derivedAttributes = ruleConfig.characterSchema.attributes.filter(attr => 
  attr.category === 'modifier'
);

console.log(`找到 ${derivedAttributes.length} 个衍生属性:`);
derivedAttributes.forEach(attr => {
  console.log(`- ${attr.displayName} (${attr.id}): 默认值=${attr.defaultValue}, 类别=${attr.category}`);
});

console.log('\n4. 验证属性调整值计算逻辑...');
const testStrength = 16;
const expectedModifier = Math.floor((testStrength - 10) / 2);
console.log(`力量值 ${testStrength} 的预期调整值: ${expectedModifier}`);

console.log('\n5. 检查技能定义的受训等级支持...');
const sampleSkills = ruleConfig.characterSchema.skills.slice(0, 3);
sampleSkills.forEach(skill => {
  console.log(`- ${skill.displayName}:`);
  console.log(`  关键属性: ${skill.keyAbility}`);
  console.log(`  仅受训: ${skill.trainedOnly}`);
  console.log(`  默认受训: ${skill.defaultTrained || '未定义'}`);
});

console.log('\n=== 问题诊断完成 ===');
