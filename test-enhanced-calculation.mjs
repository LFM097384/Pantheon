// 完整的实时计算系统测试
async function testEnhancedCalculation() {
  console.log('🚀 增强版实时计算系统测试');
  console.log('=====================================');

  try {
    // 加载配置
    const fs = await import('fs');
    const path = await import('path');
    
    const configPath = path.join(process.cwd(), 'src/ruleConfigs/pathfinder.json');
    const pathfinderConfig = JSON.parse(fs.readFileSync(configPath, 'utf8'));
    
    console.log('✅ 配置加载成功');
    
    // 模拟 RuleEngine 的核心计算逻辑
    function createMockCharacter() {
      const character = {
        id: 'test',
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

      // 初始化默认值
      pathfinderConfig.characterSchema.attributes.forEach(attr => {
        character.attributes[attr.id] = attr.defaultValue;
      });

      pathfinderConfig.characterSchema.skills.forEach(skill => {
        character.skills[skill.id] = {
          trained: skill.defaultTrained || false,
          modifier: 0,
          totalModifier: 0
        };
      });

      return character;
    }

    // 计算函数
    function calculateModifier(score) {
      return Math.floor((score - 10) / 2);
    }

    function recalculateAll(character) {
      // 1. 计算所有能力值修正
      const abilities = ['strength', 'dexterity', 'constitution', 'intelligence', 'wisdom', 'charisma'];
      abilities.forEach(ability => {
        const score = character.attributes[ability];
        character.attributes[`${ability}Modifier`] = calculateModifier(score);
      });

      // 2. 计算衍生属性
      const level = character.attributes.level;
      const conMod = character.attributes.constitutionModifier;
      const dexMod = character.attributes.dexterityModifier;

      // 生命值 (假设d8生命骰)
      character.attributes.hitPoints = (8 + conMod) + (level - 1) * (5 + conMod);
      
      // 基础攻击加值 (3/4 BAB职业)
      character.attributes.baseAttackBonus = Math.floor(level * 3 / 4);
      
      // 护甲等级
      character.attributes.armorClass = 10 + dexMod;
      
      // 豁免检定
      character.attributes.fortitudeSave = Math.floor(level / 2) + conMod;
      character.attributes.reflexSave = Math.floor(level / 3) + dexMod;
      character.attributes.willSave = Math.floor(level / 2) + character.attributes.wisdomModifier;

      // 3. 重新计算技能
      pathfinderConfig.characterSchema.skills.forEach(skillDef => {
        const skill = character.skills[skillDef.id];
        if (skill) {
          const abilityMod = character.attributes[`${skillDef.keyAbility}Modifier`];
          skill.totalModifier = abilityMod + skill.modifier;
        }
      });
    }

    // 创建测试角色
    const character = createMockCharacter();
    console.log('\n📝 初始角色状态:');
    console.log(`   力量: ${character.attributes.strength} (修正: ${character.attributes.strengthModifier})`);
    console.log(`   敏捷: ${character.attributes.dexterity} (修正: ${character.attributes.dexterityModifier})`);
    console.log(`   等级: ${character.attributes.level}`);

    // 测试1: 修改力量属性
    console.log('\n🔄 测试1: 力量 10 → 18');
    character.attributes.strength = 18;
    recalculateAll(character);
    
    console.log(`   力量修正: ${character.attributes.strengthModifier}`);
    console.log(`   攀爬技能总修正: ${character.skills.climb.totalModifier}`);

    // 测试2: 修改敏捷属性
    console.log('\n🔄 测试2: 敏捷 10 → 16');
    character.attributes.dexterity = 16;
    recalculateAll(character);
    
    console.log(`   敏捷修正: ${character.attributes.dexterityModifier}`);
    console.log(`   护甲等级: ${character.attributes.armorClass}`);
    console.log(`   杂技技能总修正: ${character.skills.acrobatics.totalModifier}`);
    console.log(`   潜行技能总修正: ${character.skills.stealth.totalModifier}`);

    // 测试3: 修改等级
    console.log('\n🔄 测试3: 等级 1 → 5');
    character.attributes.level = 5;
    recalculateAll(character);
    
    console.log(`   基础攻击加值: +${character.attributes.baseAttackBonus}`);
    console.log(`   生命值: ${character.attributes.hitPoints}`);
    console.log(`   强韧豁免: +${character.attributes.fortitudeSave}`);

    // 测试4: 添加技能点数
    console.log('\n🔄 测试4: 杂技技能添加5点技能点数');
    character.skills.acrobatics.modifier = 5;
    character.skills.acrobatics.trained = true;
    recalculateAll(character);
    
    console.log(`   杂技技能: 受训=${character.skills.acrobatics.trained}, 技能点=${character.skills.acrobatics.modifier}, 总修正=+${character.skills.acrobatics.totalModifier}`);

    // 验证计算链
    console.log('\n✅ 计算链验证:');
    const expectedDexMod = Math.floor((16 - 10) / 2); // = 3
    const expectedAC = 10 + expectedDexMod; // = 13
    const expectedAcrobatics = expectedDexMod + 5; // = 8
    
    console.log(`   敏捷修正: 期望=${expectedDexMod}, 实际=${character.attributes.dexterityModifier}`);
    console.log(`   护甲等级: 期望=${expectedAC}, 实际=${character.attributes.armorClass}`);
    console.log(`   杂技总修正: 期望=${expectedAcrobatics}, 实际=${character.skills.acrobatics.totalModifier}`);

    const allCorrect = 
      character.attributes.dexterityModifier === expectedDexMod &&
      character.attributes.armorClass === expectedAC &&
      character.skills.acrobatics.totalModifier === expectedAcrobatics;

    if (allCorrect) {
      console.log('\n🎉 所有计算链测试通过！');
    } else {
      console.log('\n❌ 计算链存在问题');
    }

    // 展示最终状态
    console.log('\n📊 最终角色状态:');
    console.log('   基础属性:');
    ['strength', 'dexterity', 'constitution', 'intelligence', 'wisdom', 'charisma'].forEach(attr => {
      const score = character.attributes[attr];
      const mod = character.attributes[`${attr}Modifier`];
      console.log(`     ${attr}: ${score} (${mod >= 0 ? '+' : ''}${mod})`);
    });
    
    console.log('   衍生属性:');
    console.log(`     护甲等级: ${character.attributes.armorClass}`);
    console.log(`     生命值: ${character.attributes.hitPoints}`);
    console.log(`     基础攻击加值: +${character.attributes.baseAttackBonus}`);
    
    console.log('   示例技能:');
    ['acrobatics', 'climb', 'stealth', 'perception'].forEach(skillId => {
      const skill = character.skills[skillId];
      const skillNames = {
        acrobatics: '杂技',
        climb: '攀爬', 
        stealth: '潜行',
        perception: '察觉'
      };
      console.log(`     ${skillNames[skillId]}: +${skill.totalModifier} (技能点${skill.modifier})`);
    });

  } catch (error) {
    console.error('❌ 测试失败:', error);
  }
}

testEnhancedCalculation();
