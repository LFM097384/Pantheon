// 实时计算测试脚本
const { RuleEngine } = require('./dist/utils/RuleEngine.js');
const ruleSystemManager = require('./dist/utils/RuleSystemManager.js').ruleSystemManager;

async function testRealtimeCalculations() {
  console.log('🧪 开始实时计算测试...\n');

  try {
    // 1. 加载规则系统
    await ruleSystemManager.setCurrentRuleSystem('pathfinder');
    const ruleSystem = ruleSystemManager.getCurrentRuleSystem();
    console.log('✅ 规则系统加载成功');

    // 2. 创建规则引擎和角色
    const engine = new RuleEngine(ruleSystem);
    let character = engine.createCharacter('test-player', '测试角色');
    
    console.log('\n📊 初始状态:');
    console.log(`力量: ${character.attributes.strength}, 修正: ${character.attributes.strengthModifier}`);
    console.log(`杂技技能: 受训等级=${character.skills.acrobatics?.proficiencyLevel}, 技能点=${character.skills.acrobatics?.modifier}, 总修正=${character.skills.acrobatics?.totalModifier}`);

    // 3. 测试属性变化是否影响技能
    console.log('\n🔧 测试1: 修改力量属性 10 → 16');
    character = engine.updateCharacter(character, 'attributes.strength', 16);
    
    console.log(`力量: ${character.attributes.strength}, 修正: ${character.attributes.strengthModifier}`);
    console.log(`杂技技能总修正: ${character.skills.acrobatics?.totalModifier}`);

    // 4. 测试技能受训等级变化
    console.log('\n🔧 测试2: 修改杂技受训等级 untrained → trained');
    character = engine.updateCharacter(character, 'skills.acrobatics.proficiencyLevel', 'trained');
    
    console.log(`杂技: 受训等级=${character.skills.acrobatics?.proficiencyLevel}, 总修正=${character.skills.acrobatics?.totalModifier}`);

    // 5. 测试技能点数变化
    console.log('\n🔧 测试3: 修改杂技技能点 0 → 3');
    character = engine.updateCharacter(character, 'skills.acrobatics.modifier', 3);
    
    console.log(`杂技: 技能点=${character.skills.acrobatics?.modifier}, 总修正=${character.skills.acrobatics?.totalModifier}`);

    // 6. 手动验证计算
    const dexMod = Math.floor((character.attributes.dexterity - 10) / 2);
    const proficiencyBonus = character.skills.acrobatics.proficiencyLevel === 'trained' ? 2 : 0;
    const skillRanks = character.skills.acrobatics.modifier;
    const expectedTotal = dexMod + proficiencyBonus + skillRanks;
    
    console.log('\n✅ 计算验证:');
    console.log(`敏捷修正: ${dexMod}`);
    console.log(`受训加值: ${proficiencyBonus}`);
    console.log(`技能点数: ${skillRanks}`);
    console.log(`期望总修正: ${expectedTotal}`);
    console.log(`实际总修正: ${character.skills.acrobatics.totalModifier}`);
    console.log(`计算正确: ${expectedTotal === character.skills.acrobatics.totalModifier ? '✅' : '❌'}`);

    // 7. 测试多个技能的连锁更新
    console.log('\n🔧 测试4: 修改敏捷影响多个技能');
    character = engine.updateCharacter(character, 'attributes.dexterity', 18);
    
    const newDexMod = Math.floor((character.attributes.dexterity - 10) / 2);
    console.log(`敏捷: ${character.attributes.dexterity}, 修正: ${character.attributes.dexterityModifier}`);
    console.log(`杂技总修正: ${character.skills.acrobatics?.totalModifier} (期望: ${newDexMod + proficiencyBonus + skillRanks})`);
    
    if (character.skills.stealth) {
      console.log(`潜行总修正: ${character.skills.stealth?.totalModifier} (期望: ${newDexMod + (character.skills.stealth.proficiencyLevel === 'trained' ? 2 : 0) + character.skills.stealth.modifier})`);
    }

    console.log('\n🎉 实时计算测试完成!');

  } catch (error) {
    console.error('❌ 测试失败:', error);
  }
}

// 运行测试
testRealtimeCalculations();
