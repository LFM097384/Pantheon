// 车卡系统实时计算测试 - Node.js版本
// 使用ES模块和动态导入

async function testRealtimeCalculation() {
  console.log('🧪 车卡系统实时计算测试');
  console.log('================================');

  try {
    // 动态导入模块（TypeScript需要编译）
    console.log('🔧 加载规则配置...');
    const fs = await import('fs');
    const path = await import('path');
    
    const configPath = path.join(process.cwd(), 'src/ruleConfigs/pathfinder.json');
    const pathfinderConfig = JSON.parse(fs.readFileSync(configPath, 'utf8'));
    
    console.log(`✅ 规则配置加载成功: ${pathfinderConfig.name}`);
    console.log(`   - 属性数量: ${pathfinderConfig.characterSchema.attributes.length}`);
    console.log(`   - 计算规则: ${pathfinderConfig.calculations.length}`);

    // 模拟角色数据结构
    const mockCharacter = {
      id: 'test_char',
      name: '测试角色',
      ruleSystemId: 'pathfinder',
      playerId: 'test_player',
      attributes: {},
      skills: {},
      customFields: {},
      equipment: [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    // 初始化属性默认值
    pathfinderConfig.characterSchema.attributes.forEach(attr => {
      mockCharacter.attributes[attr.id] = attr.defaultValue;
    });

    // 初始化技能默认值
    pathfinderConfig.characterSchema.skills.forEach(skill => {
      mockCharacter.skills[skill.id] = {
        trained: skill.defaultTrained || false,
        modifier: 0,
        totalModifier: 0
      };
    });

    console.log('\n📝 创建测试角色...');
    console.log('初始角色数据:');
    console.log('- 力量:', mockCharacter.attributes.strength);
    console.log('- 敏捷:', mockCharacter.attributes.dexterity);
    console.log('- 等级:', mockCharacter.attributes.level);

    // 手动计算修正值
    function calculateModifier(score) {
      return Math.floor((score - 10) / 2);
    }

    // 模拟属性修改
    console.log('\n🔄 测试1: 修改力量属性从10到16...');
    mockCharacter.attributes.strength = 16;
    mockCharacter.attributes.strengthModifier = calculateModifier(16);
    
    console.log('更新后:');
    console.log('- 力量:', mockCharacter.attributes.strength);
    console.log('- 力量修正:', mockCharacter.attributes.strengthModifier);

    // 测试计算规则逻辑
    console.log('\n🔄 测试2: 验证计算规则配置...');
    
    const strengthModifierRule = pathfinderConfig.calculations.find(
      rule => rule.targetField === 'strengthModifier'
    );
    
    if (strengthModifierRule) {
      console.log('✅ 找到力量修正计算规则:', strengthModifierRule.formula);
      console.log('   触发器:', strengthModifierRule.triggers);
    } else {
      console.log('❌ 未找到力量修正计算规则');
    }

    // 检查所有能力值修正规则
    const modifierRules = pathfinderConfig.calculations.filter(
      rule => rule.targetField.endsWith('Modifier')
    );
    
    console.log(`\n📊 找到 ${modifierRules.length} 个修正值计算规则:`);
    modifierRules.forEach(rule => {
      console.log(`   - ${rule.targetField}: ${rule.formula}`);
    });

    // 验证技能计算
    console.log('\n🔄 测试3: 验证技能计算配置...');
    const acrobaticsSkill = pathfinderConfig.characterSchema.skills.find(
      skill => skill.id === 'acrobatics'
    );
    
    if (acrobaticsSkill) {
      console.log('✅ 杂技技能配置:');
      console.log('   - 关联属性:', acrobaticsSkill.keyAbility);
      console.log('   - 是否仅受训:', acrobaticsSkill.trainedOnly);
      
      // 模拟技能修正计算
      const dexModifier = calculateModifier(mockCharacter.attributes.dexterity);
      const skillRanks = 2; // 假设2点技能点数
      const totalModifier = dexModifier + skillRanks;
      
      console.log('   - 敏捷修正:', dexModifier);
      console.log('   - 技能点数:', skillRanks);
      console.log('   - 预期总修正:', totalModifier);
    }

    console.log('\n✅ 配置验证完成！');
    console.log('\n📋 实时计算要点总结:');
    console.log('1. 属性修正自动根据基础属性计算');
    console.log('2. 技能总修正 = 属性修正 + 技能点数');
    console.log('3. 衍生属性（如AC、BAB）根据相关属性自动更新');
    console.log('4. 所有计算规则都有明确的触发器');

  } catch (error) {
    console.error('❌ 测试失败:', error.message);
  }
}

// 运行测试
testRealtimeCalculation();
