import React, { useState, useEffect } from 'react';
import { Card, Row, Col, InputNumber, Input, Select, Typography, Divider, Space, Button, message } from 'antd';
import { SaveOutlined, ReloadOutlined, ArrowLeftOutlined } from '@ant-design/icons';
import { useNavigate, useSearchParams } from 'react-router-dom';

const { Title, Text } = Typography;
const { Option } = Select;

interface CharacterSheetProps {
  characterId?: string;
}

interface CharacterData {
  // 基本信息
  name: string;
  level: number;
  ancestry: string;
  class: string;
  
  // 六大属性
  strength: number;
  dexterity: number;
  constitution: number;
  intelligence: number;
  wisdom: number;
  charisma: number;
  
  // 属性调整值（自动计算）
  strengthModifier: number;
  dexterityModifier: number;
  constitutionModifier: number;
  intelligenceModifier: number;
  wisdomModifier: number;
  charismaModifier: number;
  
  // 战斗数据
  armorClass: number;
  hitPoints: number;
  maxHitPoints: number;
  
  // 护甲熟练度（0=未受训，2=受训，4=专家，6=大师，8=传奇）
  unarmoredProficiency: number;
  lightArmorProficiency: number;
  mediumArmorProficiency: number;
  heavyArmorProficiency: number;
  
  // 盾牌相关
  shieldAC: number;
  shieldHardness: number;
  shieldMaxHP: number;
  shieldCurrentHP: number;
  shieldBT: number; // 破损阈值
}

const CharacterSheet: React.FC<CharacterSheetProps> = ({ characterId: propCharacterId }) => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const urlCharacterId = searchParams.get('id');
  
  // 优先使用props传递的characterId，否则使用URL参数
  const characterId = propCharacterId || urlCharacterId;

  const [character, setCharacter] = useState<CharacterData>({
    name: '新角色',
    level: 1,
    ancestry: 'human',
    class: 'fighter',
    strength: 10,
    dexterity: 10,
    constitution: 10,
    intelligence: 10,
    wisdom: 10,
    charisma: 10,
    strengthModifier: 0,
    dexterityModifier: 0,
    constitutionModifier: 0,
    intelligenceModifier: 0,
    wisdomModifier: 0,
    charismaModifier: 0,
    armorClass: 10,
    hitPoints: 8,
    maxHitPoints: 8,
    // 护甲熟练度默认值
    unarmoredProficiency: 2, // 战士默认受训
    lightArmorProficiency: 2,
    mediumArmorProficiency: 2,
    heavyArmorProficiency: 2,
    // 盾牌默认值
    shieldAC: 0,
    shieldHardness: 0,
    shieldMaxHP: 0,
    shieldCurrentHP: 0,
    shieldBT: 0
  });

  // 计算属性调整值
  const calculateModifier = (score: number): number => {
    return Math.floor((score - 10) / 2);
  };

  // 计算护甲等级
  const calculateArmorClass = (character: CharacterData): number => {
    // 基础AC: 10 + 敏捷调整值 + 护甲熟练度 + 等级 + 盾牌AC
    const proficiencyBonus = character.unarmoredProficiency + character.level; // 暂时使用无甲熟练度
    return 10 + character.dexterityModifier + proficiencyBonus + character.shieldAC;
  };

  // 计算最大生命值
  const calculateMaxHitPoints = (level: number, conMod: number): number => {
    // 基础：8 + 体质调整值，每级增加 6 + 体质调整值
    return 8 + conMod + (level - 1) * (6 + conMod);
  };

  // 更新角色数据并重新计算
  const updateCharacter = (field: keyof CharacterData, value: any) => {
    setCharacter(prev => {
      const updated = { ...prev, [field]: value };
      
      // 重新计算所有调整值
      updated.strengthModifier = calculateModifier(updated.strength);
      updated.dexterityModifier = calculateModifier(updated.dexterity);
      updated.constitutionModifier = calculateModifier(updated.constitution);
      updated.intelligenceModifier = calculateModifier(updated.intelligence);
      updated.wisdomModifier = calculateModifier(updated.wisdom);
      updated.charismaModifier = calculateModifier(updated.charisma);
      
      // 重新计算护甲等级
      updated.armorClass = calculateArmorClass(updated);
      
      // 重新计算最大生命值
      updated.maxHitPoints = calculateMaxHitPoints(updated.level, updated.constitutionModifier);
      
      // 如果当前生命值超过最大值，调整当前生命值
      if (updated.hitPoints > updated.maxHitPoints) {
        updated.hitPoints = updated.maxHitPoints;
      }
      
      return updated;
    });
  };

  // 重置角色
  const resetCharacter = () => {
    setCharacter({
      name: '新角色',
      level: 1,
      ancestry: 'human',
      class: 'fighter',
      strength: 10,
      dexterity: 10,
      constitution: 10,
      intelligence: 10,
      wisdom: 10,
      charisma: 10,
      strengthModifier: 0,
      dexterityModifier: 0,
      constitutionModifier: 0,
      intelligenceModifier: 0,
      wisdomModifier: 0,
      charismaModifier: 0,
      armorClass: 10,
      hitPoints: 8,
      maxHitPoints: 8,
      // 护甲熟练度默认值
      unarmoredProficiency: 2,
      lightArmorProficiency: 2,
      mediumArmorProficiency: 2,
      heavyArmorProficiency: 2,
      // 盾牌默认值
      shieldAC: 0,
      shieldHardness: 0,
      shieldMaxHP: 0,
      shieldCurrentHP: 0,
      shieldBT: 0
    });
    message.info('角色已重置');
  };

  // 保存角色
  const saveCharacter = () => {
    const storageKey = characterId ? `pf_character_${characterId}` : 'pf_character';
    const dataToSave = {
      ...character,
      id: characterId || `char_${Date.now()}`,
      updatedAt: new Date().toISOString()
    };
    localStorage.setItem(storageKey, JSON.stringify(dataToSave));
    message.success('角色已保存');
  };

  // 返回角色管理页面
  const handleBack = () => {
    navigate('/character-manager');
  };

  // 加载时尝试恢复角色数据
  useEffect(() => {
    if (characterId) {
      // 编辑现有角色
      const storageKey = `pf_character_${characterId}`;
      const saved = localStorage.getItem(storageKey);
      if (saved) {
        try {
          const savedCharacter = JSON.parse(saved);
          setCharacter(savedCharacter);
        } catch (error) {
          console.error('加载角色数据失败:', error);
          message.error('加载角色数据失败');
        }
      }
    } else {
      // 新建角色或从默认存储加载
      const saved = localStorage.getItem('pf_character');
      if (saved) {
        try {
          const savedCharacter = JSON.parse(saved);
          setCharacter(savedCharacter);
        } catch (error) {
          console.error('加载角色数据失败:', error);
        }
      }
    }
  }, [characterId]);

  // 渲染属性输入框
  const renderAbilityScore = (
    ability: keyof CharacterData,
    modifier: keyof CharacterData,
    label: string,
    color: string
  ) => (
    <Card size="small" style={{ textAlign: 'center', borderColor: color }}>
      <div style={{ marginBottom: 8 }}>
        <Text strong style={{ color }}>{label}</Text>
      </div>
      <InputNumber
        value={character[ability] as number}
        onChange={(value) => updateCharacter(ability, value || 10)}
        min={1}
        max={30}
        style={{ width: '100%', marginBottom: 8 }}
      />
      <div style={{ 
        fontSize: '18px', 
        fontWeight: 'bold', 
        color: (character[modifier] as number) >= 0 ? '#52c41a' : '#ff4d4f'
      }}>
        {(character[modifier] as number) >= 0 ? '+' : ''}{character[modifier] as number}
      </div>
    </Card>
  );

  return (
    <div style={{ padding: 24, maxWidth: 1200, margin: '0 auto' }}>
      <Card 
        title={
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              {/* 只在独立页面模式显示返回按钮 */}
              {!propCharacterId && (
                <Button 
                  icon={<ArrowLeftOutlined />} 
                  onClick={handleBack}
                  style={{ marginRight: 16 }}
                >
                  返回
                </Button>
              )}
              <Title level={2} style={{ margin: 0, display: 'inline' }}>
                {characterId ? '编辑角色' : 'Pathfinder 2E 角色卡'}
              </Title>
            </div>
            <Space>
              <Button icon={<ReloadOutlined />} onClick={resetCharacter}>重置</Button>
              <Button type="primary" icon={<SaveOutlined />} onClick={saveCharacter}>保存</Button>
            </Space>
          </div>
        }
      >
        {/* 基本信息 */}
        <Row gutter={24} style={{ marginBottom: 24 }}>
          <Col span={6}>
            <Card size="small" title="角色名">
              <Input
                value={character.name}
                onChange={(e) => updateCharacter('name', e.target.value)}
                placeholder="输入角色名"
              />
            </Card>
          </Col>
          <Col span={6}>
            <Card size="small" title="等级">
              <InputNumber
                value={character.level}
                onChange={(value) => updateCharacter('level', value || 1)}
                min={1}
                max={20}
                style={{ width: '100%' }}
              />
            </Card>
          </Col>
          <Col span={6}>
            <Card size="small" title="族裔">
              <Select
                value={character.ancestry}
                onChange={(value) => updateCharacter('ancestry', value)}
                style={{ width: '100%' }}
              >
                <Option value="human">人类</Option>
                <Option value="elf">精灵</Option>
                <Option value="dwarf">矮人</Option>
                <Option value="halfling">半身人</Option>
                <Option value="gnome">侏儒</Option>
              </Select>
            </Card>
          </Col>
          <Col span={6}>
            <Card size="small" title="职业">
              <Select
                value={character.class}
                onChange={(value) => updateCharacter('class', value)}
                style={{ width: '100%' }}
              >
                <Option value="fighter">战士</Option>
                <Option value="wizard">法师</Option>
                <Option value="rogue">游荡者</Option>
                <Option value="cleric">牧师</Option>
              </Select>
            </Card>
          </Col>
        </Row>

        <Divider orientation="left">属性值</Divider>

        {/* 六大属性 */}
        <Row gutter={16} style={{ marginBottom: 24 }}>
          <Col span={4}>
            {renderAbilityScore('strength', 'strengthModifier', '力量', '#ff7875')}
          </Col>
          <Col span={4}>
            {renderAbilityScore('dexterity', 'dexterityModifier', '敏捷', '#73d13d')}
          </Col>
          <Col span={4}>
            {renderAbilityScore('constitution', 'constitutionModifier', '体质', '#40a9ff')}
          </Col>
          <Col span={4}>
            {renderAbilityScore('intelligence', 'intelligenceModifier', '智力', '#b37feb')}
          </Col>
          <Col span={4}>
            {renderAbilityScore('wisdom', 'wisdomModifier', '感知', '#ffc53d')}
          </Col>
          <Col span={4}>
            {renderAbilityScore('charisma', 'charismaModifier', '魅力', '#ff85c0')}
          </Col>
        </Row>

        <Divider orientation="left">战斗数据</Divider>

        {/* 战斗数据 */}
        <Row gutter={24}>
          <Col span={12}>
            <Card size="small" title="护甲等级 (AC)" style={{ textAlign: 'center' }}>
              <div style={{ fontSize: '32px', fontWeight: 'bold', color: '#1890ff', marginBottom: '16px' }}>
                {character.armorClass}
              </div>
              
              {/* 护甲熟练度 */}
              <Divider style={{ margin: '8px 0' }} />
              <Text strong>护甲熟练度</Text>
              <Row gutter={8} style={{ marginTop: '8px' }}>
                <Col span={6}>
                  <Text type="secondary" style={{ fontSize: '12px' }}>无甲</Text>
                  <Select
                    value={character.unarmoredProficiency}
                    onChange={(value) => updateCharacter('unarmoredProficiency', value)}
                    size="small"
                    style={{ width: '100%' }}
                  >
                    <Option value={0}>未受训</Option>
                    <Option value={2}>受训</Option>
                    <Option value={4}>专家</Option>
                    <Option value={6}>大师</Option>
                    <Option value={8}>传奇</Option>
                  </Select>
                </Col>
                <Col span={6}>
                  <Text type="secondary" style={{ fontSize: '12px' }}>轻甲</Text>
                  <Select
                    value={character.lightArmorProficiency}
                    onChange={(value) => updateCharacter('lightArmorProficiency', value)}
                    size="small"
                    style={{ width: '100%' }}
                  >
                    <Option value={0}>未受训</Option>
                    <Option value={2}>受训</Option>
                    <Option value={4}>专家</Option>
                    <Option value={6}>大师</Option>
                    <Option value={8}>传奇</Option>
                  </Select>
                </Col>
                <Col span={6}>
                  <Text type="secondary" style={{ fontSize: '12px' }}>中甲</Text>
                  <Select
                    value={character.mediumArmorProficiency}
                    onChange={(value) => updateCharacter('mediumArmorProficiency', value)}
                    size="small"
                    style={{ width: '100%' }}
                  >
                    <Option value={0}>未受训</Option>
                    <Option value={2}>受训</Option>
                    <Option value={4}>专家</Option>
                    <Option value={6}>大师</Option>
                    <Option value={8}>传奇</Option>
                  </Select>
                </Col>
                <Col span={6}>
                  <Text type="secondary" style={{ fontSize: '12px' }}>重甲</Text>
                  <Select
                    value={character.heavyArmorProficiency}
                    onChange={(value) => updateCharacter('heavyArmorProficiency', value)}
                    size="small"
                    style={{ width: '100%' }}
                  >
                    <Option value={0}>未受训</Option>
                    <Option value={2}>受训</Option>
                    <Option value={4}>专家</Option>
                    <Option value={6}>大师</Option>
                    <Option value={8}>传奇</Option>
                  </Select>
                </Col>
              </Row>
              
              {/* 盾牌信息 */}
              <Divider style={{ margin: '8px 0' }} />
              <Text strong>盾牌</Text>
              <Row gutter={8} style={{ marginTop: '8px' }}>
                <Col span={8}>
                  <Text type="secondary" style={{ fontSize: '12px' }}>AC加值</Text>
                  <InputNumber
                    value={character.shieldAC}
                    onChange={(value) => updateCharacter('shieldAC', value || 0)}
                    min={0}
                    max={5}
                    size="small"
                    style={{ width: '100%' }}
                  />
                </Col>
                <Col span={8}>
                  <Text type="secondary" style={{ fontSize: '12px' }}>硬度</Text>
                  <InputNumber
                    value={character.shieldHardness}
                    onChange={(value) => updateCharacter('shieldHardness', value || 0)}
                    min={0}
                    size="small"
                    style={{ width: '100%' }}
                  />
                </Col>
                <Col span={8}>
                  <Text type="secondary" style={{ fontSize: '12px' }}>HP上限</Text>
                  <InputNumber
                    value={character.shieldMaxHP}
                    onChange={(value) => updateCharacter('shieldMaxHP', value || 0)}
                    min={0}
                    size="small"
                    style={{ width: '100%' }}
                  />
                </Col>
              </Row>
              <Row gutter={8} style={{ marginTop: '4px' }}>
                <Col span={12}>
                  <Text type="secondary" style={{ fontSize: '12px' }}>当前HP</Text>
                  <InputNumber
                    value={character.shieldCurrentHP}
                    onChange={(value) => updateCharacter('shieldCurrentHP', Math.min(value || 0, character.shieldMaxHP))}
                    min={0}
                    max={character.shieldMaxHP}
                    size="small"
                    style={{ width: '100%' }}
                  />
                </Col>
                <Col span={12}>
                  <Text type="secondary" style={{ fontSize: '12px' }}>破损阈值</Text>
                  <InputNumber
                    value={character.shieldBT}
                    onChange={(value) => updateCharacter('shieldBT', value || 0)}
                    min={0}
                    size="small"
                    style={{ width: '100%' }}
                  />
                </Col>
              </Row>
              
              <Text type="secondary" style={{ fontSize: '12px', marginTop: '8px', display: 'block' }}>
                AC = 10 + 敏捷({character.dexterityModifier >= 0 ? '+' : ''}{character.dexterityModifier}) + 熟练度({character.unarmoredProficiency + character.level}) + 盾牌({character.shieldAC})
              </Text>
            </Card>
          </Col>
          <Col span={6}>
            <Card size="small" title="当前生命值" style={{ textAlign: 'center' }}>
              <InputNumber
                value={character.hitPoints}
                onChange={(value) => updateCharacter('hitPoints', Math.min(value || 0, character.maxHitPoints))}
                min={0}
                max={character.maxHitPoints}
                style={{ width: '80%', fontSize: '20px' }}
              />
              <div style={{ marginTop: 8 }}>
                <Text type="secondary">/ {character.maxHitPoints}</Text>
              </div>
            </Card>
          </Col>
          <Col span={6}>
            <Card size="small" title="最大生命值" style={{ textAlign: 'center' }}>
              <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#52c41a' }}>
                {character.maxHitPoints}
              </div>
              <Text type="secondary" style={{ fontSize: '12px' }}>
                基础8 + 体质({character.constitutionModifier >= 0 ? '+' : ''}{character.constitutionModifier}) + 等级加值
              </Text>
            </Card>
          </Col>
        </Row>

        {/* 计算说明 */}
        <Divider />
        <div style={{ background: '#f6f6f6', padding: 16, borderRadius: 6 }}>
          <Title level={5}>计算说明：</Title>
          <ul>
            <li><strong>属性调整值</strong>：(属性值 - 10) ÷ 2（向下取整）</li>
            <li><strong>护甲等级</strong>：10 + 敏捷调整值 + 熟练度加值 + 等级 + 盾牌AC</li>
            <li><strong>熟练度等级</strong>：未受训(0)、受训(+2)、专家(+4)、大师(+6)、传奇(+8)</li>
            <li><strong>最大生命值</strong>：8 + 体质调整值 + (等级-1) × (6 + 体质调整值)</li>
            <li><strong>盾牌破损</strong>：当盾牌HP降至破损阈值以下时，AC加值减半</li>
            <li>所有数值都会根据属性变化实时更新</li>
          </ul>
        </div>
      </Card>
    </div>
  );
};

export default CharacterSheet;
