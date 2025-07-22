import React, { useState, useEffect } from 'react';
import { Card, Row, Col, InputNumber, Input, Select, Typography, Divider, Space, Button, message, Modal, AutoComplete } from 'antd';
import featData from '../../ruleConfigs/pathfinder/feats.json';
import { 
  SaveOutlined, 
  ReloadOutlined, 
  ArrowLeftOutlined,
  ThunderboltOutlined,     // 特技 - 闪电代表敏捷和技巧
  BookOutlined,            // 奥法 - 书籍代表魔法知识
  FireOutlined,            // 运动 - 火焰代表激情和力量
  ToolOutlined,            // 手艺 - 工具代表制作技能
  SmileOutlined,           // 欺骗 - 笑脸代表伪装和魅力
  TeamOutlined,            // 交涉 - 团队代表外交
  ExclamationOutlined,     // 威吓 - 感叹号代表威胁
  MedicineBoxOutlined,     // 医疗 - 医药箱最直接
  BugOutlined,             // 自然 - 虫子代表自然生物
  EyeOutlined,             // 神秘 - 眼睛代表洞察
  CrownOutlined,           // 表演 - 皇冠代表舞台表演
  StarOutlined,            // 宗教 - 星星代表神圣
  HeartOutlined,           // 社群 - 心形代表人际关系
  EyeInvisibleOutlined,    // 隐秘 - 隐形眼代表潜行
  EnvironmentOutlined,     // 生存 - 环境代表野外生存
  KeyOutlined,             // 贼活 - 钥匙代表开锁技能
  PlusOutlined,            // 添加自定义技能
  DeleteOutlined           // 删除自定义技能
} from '@ant-design/icons';
import { useNavigate, useSearchParams } from 'react-router-dom';

const { Title, Text } = Typography;
const { Option } = Select;

interface CharacterSheetProps {
  characterId?: string;
}

// 武器数据接口
interface WeaponData {
  id: string;
  name: string;
  category: 'unarmed' | 'simple' | 'martial' | 'advanced' | 'other';
  type: 'melee' | 'ranged';
  damage: string; // 格式如 "1d6+3"
  traits: string[]; // 武器特性
}

// 专长效果接口
interface FeatEffect {
  type: 'bonus' | 'ability' | 'proficiency' | 'special';
  target: string; // 影响的目标属性，如 'hitPoints', 'speed', 'armorClass', 'initiative' 等
  value: number | string; // 效果值，可以是数字或公式字符串
  condition?: string; // 生效条件，如 'level' 表示加值等于角色等级
}

// 专长数据接口
interface FeatData {
  id: string;
  name: string;
  type: 'ancestry' | 'class' | 'general' | 'skill' | 'archetype';
  level: number; // 获得该专长时的等级
  description: string; // 专长描述
  prerequisites?: string; // 前置条件
  effects?: FeatEffect[]; // 专长效果列表
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
  
  // 技能熟练度（0=未受训，2=受训，4=专家，6=大师，8=传奇）
  acrobaticsProficiency: number;     // 特技
  arcanaProficiency: number;         // 奥法
  athleticsProficiency: number;      // 运动
  craftingProficiency: number;       // 手艺
  deceptionProficiency: number;      // 欺骗
  diplomacyProficiency: number;      // 交涉
  intimidationProficiency: number;   // 威吓
  medicineProficiency: number;       // 医疗
  natureProficiency: number;         // 自然
  occultismProficiency: number;      // 神秘
  performanceProficiency: number;    // 表演
  religionProficiency: number;       // 宗教
  societyProficiency: number;        // 社群
  stealthProficiency: number;        // 隐秘
  survivalProficiency: number;       // 生存
  thieveryProficiency: number;       // 贼活
  customSkillsProficiency: number[];  // 自定义技能熟练度
  customSkillsNames: string[];       // 自定义技能名称
  customSkillsAttributes: string[];  // 自定义技能对应属性
  
  // 豁免检定熟练度
  fortitudeProficiency: number;      // 强韧
  reflexProficiency: number;         // 反射
  willProficiency: number;           // 意志
  
  // 基础数据
  speed: number;                     // 速度（英尺）
  perceptionProficiency: number;     // 察觉熟练度
  
  // 语言
  languages: string[];               // 已掌握的语言列表
  
  // 武器熟练度
  unarmedProficiency: number;        // 无武装攻击熟练度
  simpleWeaponProficiency: number;   // 简易武器熟练度
  martialWeaponProficiency: number;  // 军用武器熟练度
  advancedWeaponProficiency: number; // 进阶武器熟练度
  
  // 武器列表
  weapons: WeaponData[];             // 武器列表
  
  // 职业DC
  classDCProficiency: number;        // 职业DC熟练度
  
  // 专长
  feats: FeatData[];                 // 专长列表
  
  // 扩展生命值数据
  temporaryHitPoints: number;        // 临时生命值
  dyingValue: number;               // 濒死值 (0-4)
  
  // 抗性和免疫
  resistances: string;              // 抗性描述
  immunities: string;               // 免疫描述
  conditions: string;               // 状态描述
}

const SimpleCharacterSheet: React.FC<CharacterSheetProps> = ({ characterId: propCharacterId }) => {
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
    shieldBT: 0,
    // 技能熟练度默认值（未受训）
    acrobaticsProficiency: 0,
    arcanaProficiency: 0,
    athleticsProficiency: 0,
    craftingProficiency: 0,
    deceptionProficiency: 0,
    diplomacyProficiency: 0,
    intimidationProficiency: 0,
    medicineProficiency: 0,
    natureProficiency: 0,
    occultismProficiency: 0,
    performanceProficiency: 0,
    religionProficiency: 0,
    societyProficiency: 0,
    stealthProficiency: 0,
    survivalProficiency: 0,
    thieveryProficiency: 0,
    customSkillsProficiency: [],
    customSkillsNames: [],
    customSkillsAttributes: [],
    // 豁免检定熟练度默认值
    fortitudeProficiency: 2,  // 战士强韧受训
    reflexProficiency: 2,     // 战士反射受训
    willProficiency: 0,       // 战士意志未受训
    // 基础数据
    speed: 25,                // 默认速度 25 英尺
    perceptionProficiency: 0,  // 默认未受训
    
    // 语言默认值
    languages: ['通用语'],     // 默认掌握通用语
    
    // 武器熟练度默认值
    unarmedProficiency: 2,        // 无武装默认受训
    simpleWeaponProficiency: 2,   // 简易武器默认受训  
    martialWeaponProficiency: 2,  // 军用武器默认受训
    advancedWeaponProficiency: 0, // 进阶武器默认未受训
    
    // 武器列表默认值
    weapons: [],
    
    // 职业DC默认值
    classDCProficiency: 2,  // 职业DC默认受训
    
    // 专长默认值
    feats: [],
    
    // 扩展生命值数据
    temporaryHitPoints: 0,
    dyingValue: 0,
    // 抗性和免疫
    resistances: '',
    immunities: '',
    conditions: ''
  });

  // 技能配置数据
  const skillsConfig = [
    { key: 'acrobaticsProficiency', name: '特技', attribute: 'dexterity', icon: <ThunderboltOutlined /> },
    { key: 'arcanaProficiency', name: '奥法', attribute: 'intelligence', icon: <BookOutlined /> },
    { key: 'athleticsProficiency', name: '运动', attribute: 'strength', icon: <FireOutlined /> },
    { key: 'craftingProficiency', name: '手艺', attribute: 'intelligence', icon: <ToolOutlined /> },
    { key: 'deceptionProficiency', name: '欺骗', attribute: 'charisma', icon: <SmileOutlined /> },
    { key: 'diplomacyProficiency', name: '交涉', attribute: 'charisma', icon: <TeamOutlined /> },
    { key: 'intimidationProficiency', name: '威吓', attribute: 'charisma', icon: <ExclamationOutlined /> },
    { key: 'medicineProficiency', name: '医疗', attribute: 'wisdom', icon: <MedicineBoxOutlined /> },
    { key: 'natureProficiency', name: '自然', attribute: 'wisdom', icon: <BugOutlined /> },
    { key: 'occultismProficiency', name: '神秘', attribute: 'intelligence', icon: <EyeOutlined /> },
    { key: 'performanceProficiency', name: '表演', attribute: 'charisma', icon: <CrownOutlined /> },
    { key: 'religionProficiency', name: '宗教', attribute: 'wisdom', icon: <StarOutlined /> },
    { key: 'societyProficiency', name: '社群', attribute: 'intelligence', icon: <HeartOutlined /> },
    { key: 'stealthProficiency', name: '隐秘', attribute: 'dexterity', icon: <EyeInvisibleOutlined /> },
    { key: 'survivalProficiency', name: '生存', attribute: 'wisdom', icon: <EnvironmentOutlined /> },
    { key: 'thieveryProficiency', name: '贼活', attribute: 'dexterity', icon: <KeyOutlined /> },
  ];

  // 常用语言列表
  const commonLanguages = [
    '通用语', '矮人语', '精灵语', '侏儒语', '哥布林语', '半身人语',
    '兽人语', '龙族语', '天界语', '深渊语', '地狱语', '原初语',
    '木族语', '水族语', '火族语', '土族语', '风族语', '阴影语',
    '死灵语', '奥术语', '德鲁伊语'
  ];

  // 预设武器列表
  const weaponTemplates = {
    // 无武装
    unarmed: [
      { name: '拳头', damage: '1d4', traits: ['灵巧', '非致命', '无武装'] },
      { name: '爪击', damage: '1d4', traits: ['灵巧', '无武装'] }
    ],
    // 简易武器
    simple: {
      melee: [
        { name: '匕首', damage: '1d4', traits: ['灵巧', '投掷'] },
        { name: '手杖', damage: '1d4', traits: ['双手1d8'] },
        { name: '钉头锤', damage: '1d6', traits: [] },
        { name: '长矛', damage: '1d6', traits: ['投掷'] }
      ],
      ranged: [
        { name: '轻弩', damage: '1d8', traits: ['装填'] },
        { name: '短弓', damage: '1d6', traits: ['双手'] },
        { name: '投掷匕首', damage: '1d4', traits: ['灵巧', '投掷'] }
      ]
    },
    // 军用武器
    martial: {
      melee: [
        { name: '长剑', damage: '1d8', traits: ['多用'] },
        { name: '巨剑', damage: '1d12', traits: ['双手'] },
        { name: '战斧', damage: '1d8', traits: [] },
        { name: '长枪', damage: '1d8', traits: ['触及'] }
      ],
      ranged: [
        { name: '长弓', damage: '1d8', traits: ['双手', '致命d10'] },
        { name: '重弩', damage: '1d10', traits: ['装填'] }
      ]
    },
    // 进阶武器
    advanced: {
      melee: [
        { name: '双刃剑', damage: '1d8', traits: ['双手', '双武器'] },
        { name: '连枷', damage: '1d6', traits: ['击倒', '破甲'] }
      ],
      ranged: [
        { name: '复合弓', damage: '1d8', traits: ['双手', '致命d10', '强力'] }
      ]
    }
  };

  // 自定义技能管理状态
  const [newCustomSkill, setNewCustomSkill] = useState({ name: '', attribute: 'strength' });
  const [showAddSkillModal, setShowAddSkillModal] = useState(false);
  const [showDeleteSkillModal, setShowDeleteSkillModal] = useState(false);
  const [deletingSkillIndex, setDeletingSkillIndex] = useState<number | null>(null);

  // 武器管理状态
  const [showAddWeaponModal, setShowAddWeaponModal] = useState(false);
  const [newWeapon, setNewWeapon] = useState<{
    name: string;
    category: 'unarmed' | 'simple' | 'martial' | 'advanced' | 'other';
    type: 'melee' | 'ranged';
    damage: string;
    traits: string[];
  }>({
    name: '',
    category: 'simple',
    type: 'melee',
    damage: '1d6',
    traits: []
  });

  // 专长管理状态
  const [showAddFeatModal, setShowAddFeatModal] = useState(false);
  const [isCustomFeat, setIsCustomFeat] = useState(false);
  const [selectedPresetFeat, setSelectedPresetFeat] = useState<string>('');
  const [featSearchText, setFeatSearchText] = useState('');
  const [newFeat, setNewFeat] = useState<{
    name: string;
    type: 'ancestry' | 'class' | 'general' | 'skill' | 'archetype';
    level: number;
    description: string;
    prerequisites: string;
  }>({
    name: '',
    type: 'general',
    level: 1,
    description: '',
    prerequisites: ''
  });

  // 添加自定义技能
  const addCustomSkill = () => {
    if (!newCustomSkill.name.trim()) {
      message.error('请输入技能名称');
      return;
    }
    
    setCharacter(prev => ({
      ...prev,
      customSkillsNames: [...prev.customSkillsNames, newCustomSkill.name],
      customSkillsAttributes: [...prev.customSkillsAttributes, newCustomSkill.attribute],
      customSkillsProficiency: [...prev.customSkillsProficiency, 0]
    }));
    
    setNewCustomSkill({ name: '', attribute: 'strength' });
    setShowAddSkillModal(false);
    message.success('自定义技能添加成功');
  };

  // 删除自定义技能
  const removeCustomSkill = (index: number) => {
    setCharacter(prev => ({
      ...prev,
      customSkillsNames: prev.customSkillsNames.filter((_, i) => i !== index),
      customSkillsAttributes: prev.customSkillsAttributes.filter((_, i) => i !== index),
      customSkillsProficiency: prev.customSkillsProficiency.filter((_, i) => i !== index)
    }));
    message.success('自定义技能删除成功');
  };

  // 更新自定义技能熟练度
  const updateCustomSkillProficiency = (index: number, proficiency: number) => {
    setCharacter(prev => ({
      ...prev,
      customSkillsProficiency: prev.customSkillsProficiency.map((p, i) => i === index ? proficiency : p)
    }));
  };

  // 添加武器
  const addWeapon = () => {
    if (!newWeapon.name.trim()) {
      message.error('请输入武器名称');
      return;
    }
    
    const weaponToAdd: WeaponData = {
      id: Date.now().toString(),
      name: newWeapon.name,
      category: newWeapon.category,
      type: newWeapon.type,
      damage: newWeapon.damage,
      traits: newWeapon.traits
    };
    
    setCharacter(prev => ({
      ...prev,
      weapons: [...(prev.weapons || []), weaponToAdd]
    }));
    
    setNewWeapon({
      name: '',
      category: 'simple',
      type: 'melee',
      damage: '1d6',
      traits: []
    });
    setShowAddWeaponModal(false);
    message.success('武器添加成功');
  };

  // 删除武器
  const removeWeapon = (weaponId: string) => {
    setCharacter(prev => ({
      ...prev,
      weapons: (prev.weapons || []).filter(weapon => weapon.id !== weaponId)
    }));
    message.success('武器删除成功');
  };

  // 添加专长
  const addFeat = () => {
    if (!isCustomFeat && selectedPresetFeat) {
      // 从预设专长添加
      const presetFeat = featData.generalFeats.find(f => f.id === selectedPresetFeat);
      if (!presetFeat) {
        message.error('未找到选中的预设专长');
        return;
      }
      
      const featToAdd: FeatData = {
        id: Date.now().toString(),
        name: presetFeat.name,
        type: 'general',
        level: presetFeat.level,
        description: presetFeat.description,
        prerequisites: presetFeat.prerequisites
      };
      
      const newFeats = [...(character.feats || []), featToAdd];
      updateFeats(newFeats);
      
      message.success(`已添加专长：${presetFeat.name}`);
    } else if (isCustomFeat) {
      // 自定义专长
      if (!newFeat.name.trim()) {
        message.error('请输入专长名称');
        return;
      }
      
      const featToAdd: FeatData = {
        id: Date.now().toString(),
        name: newFeat.name,
        type: newFeat.type,
        level: newFeat.level,
        description: newFeat.description,
        prerequisites: newFeat.prerequisites || undefined
      };
      
      const newFeats = [...(character.feats || []), featToAdd];
      updateFeats(newFeats);
      
      message.success('专长添加成功');
    } else {
      message.error('请选择预设专长或切换到自定义模式');
      return;
    }
    
    // 重置状态
    setNewFeat({
      name: '',
      type: 'general',
      level: 1,
      description: '',
      prerequisites: ''
    });
    setSelectedPresetFeat('');
    setFeatSearchText('');
    setIsCustomFeat(false);
    setShowAddFeatModal(false);
  };

  // 删除专长
  const removeFeat = (featId: string) => {
    const newFeats = (character.feats || []).filter(feat => feat.id !== featId);
    updateFeats(newFeats);
    message.success('专长删除成功');
  };

  // 从模板添加武器
  const addWeaponFromTemplate = (template: any, category: string, type: string) => {
    const weaponToAdd: WeaponData = {
      id: Date.now().toString(),
      name: template.name,
      category: category as 'unarmed' | 'simple' | 'martial' | 'advanced' | 'other',
      type: type as 'melee' | 'ranged',
      damage: template.damage,
      traits: template.traits
    };
    
    setCharacter(prev => ({
      ...prev,
      weapons: [...(prev.weapons || []), weaponToAdd]
    }));
    
    message.success(`已添加${template.name}`);
  };

  // 计算武器攻击加值
  const calculateWeaponAttack = (weapon: WeaponData): number => {
    let proficiency = 0;
    
    // 根据武器类型获取对应熟练度
    switch (weapon.category) {
      case 'unarmed':
        proficiency = character.unarmedProficiency;
        break;
      case 'simple':
        proficiency = character.simpleWeaponProficiency;
        break;
      case 'martial':
        proficiency = character.martialWeaponProficiency;
        break;
      case 'advanced':
        proficiency = character.advancedWeaponProficiency;
        break;
      default:
        proficiency = 0;
    }
    
    // 近战武器使用力量，远程武器使用敏捷
    const attributeModifier = weapon.type === 'melee' ? character.strengthModifier : character.dexterityModifier;
    
    return attributeModifier + (proficiency > 0 ? proficiency + character.level : 0);
  };

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

  // 计算专长提供的加值详情 - 包含来源信息
  const getFeatBonusDetails = (character: CharacterData, target: string): { total: number; sources: Array<{ name: string; value: number }> } => {
    let totalBonus = 0;
    const sources: Array<{ name: string; value: number }> = [];
    
    character.feats?.forEach(feat => {
      // 检查预设专长的效果
      const presetFeat = featData.generalFeats.find(f => f.name === feat.name);
      if (presetFeat?.effects) {
        presetFeat.effects.forEach(effect => {
          if (effect.target === target && effect.type === 'bonus') {
            const value = calculateEffectValue(effect.value, character);
            if (value > 0) {
              totalBonus += value;
              sources.push({ name: feat.name, value });
            }
          }
        });
      }
      
      // 检查角色专长自身的效果（如果是自定义专长）
      if (feat.effects) {
        feat.effects.forEach(effect => {
          if (effect.target === target && effect.type === 'bonus') {
            const value = calculateEffectValue(effect.value, character);
            if (value > 0) {
              totalBonus += value;
              sources.push({ name: feat.name, value });
            }
          }
        });
      }
    });
    
    return { total: totalBonus, sources };
  };

  // 计算专长提供的加值 - 兼容性函数
  const calculateFeatBonuses = (character: CharacterData, target: string): number => {
    return getFeatBonusDetails(character, target).total;
  };

  // 计算效果值 - 支持数字、字符串公式等
  const calculateEffectValue = (value: number | string, character: CharacterData): number => {
    if (typeof value === 'number') {
      return value;
    }
    
    switch (value) {
      case 'level':
        return character.level;
      case 'halfLevel':
        return Math.max(1, Math.floor(character.level / 2));
      case 'constitutionModifier':
        return character.constitutionModifier;
      case 'strengthModifier':
        return character.strengthModifier;
      case 'dexterityModifier':
        return character.dexterityModifier;
      case 'intelligenceModifier':
        return character.intelligenceModifier;
      case 'wisdomModifier':
        return character.wisdomModifier;
      case 'charismaModifier':
        return character.charismaModifier;
      default:
        return 0;
    }
  };

  // 获取专长的显示效果文本
  const getFeatEffectText = (feat: FeatData): string[] => {
    const effects: string[] = [];
    
    // 检查预设专长的效果
    const presetFeat = featData.generalFeats.find(f => f.name === feat.name);
    const featEffects = presetFeat?.effects || feat.effects || [];
    
    featEffects.forEach(effect => {
      const value = calculateEffectValue(effect.value, character);
      const targetName = getEffectTargetName(effect.target);
      
      if (effect.type === 'bonus' && value !== 0) {
        const sign = value > 0 ? '+' : '';
        if ('condition' in effect && effect.condition) {
          effects.push(`${targetName}${sign}${value}（${effect.condition}）`);
        } else {
          effects.push(`${targetName}${sign}${value}`);
        }
      } else if (effect.type === 'proficiency') {
        effects.push(`${targetName}熟练度提升`);
      } else if (effect.type === 'special') {
        effects.push(`特殊效果：${effect.target}`);
      }
    });
    
    return effects;
  };

  // 获取效果目标的中文名称
  const getEffectTargetName = (target: string): string => {
    const targetNames: { [key: string]: string } = {
      'hitPoints': '最大生命值',
      'speed': '速度',
      'initiative': '先攻',
      'armorClass': '护甲等级',
      'fortitude': '强韧豁免',
      'reflex': '反射豁免',
      'will': '意志豁免',
      'perception': '察觉',
      'acrobatics': '特技',
      'arcana': '奥法',
      'athletics': '运动',
      'crafting': '手艺',
      'deception': '欺骗',
      'diplomacy': '交涉',
      'intimidation': '威吓',
      'medicine': '医疗',
      'nature': '自然',
      'occultism': '神秘',
      'performance': '表演',
      'religion': '宗教',
      'society': '社群',
      'stealth': '隐秘',
      'survival': '生存',
      'thievery': '贼活',
      'dyingThreshold': '濒死阈值',
      'untrainedSkills': '未受训技能'
    };
    return targetNames[target] || target;
  };

  // 计算最大生命值（包含专长加值）
  const calculateMaxHitPoints = (level: number, conMod: number, character: CharacterData): number => {
    // 基础：8 + 体质调整值，每级增加 6 + 体质调整值
    const baseHitPoints = 8 + conMod + (level - 1) * (6 + conMod);
    const featBonus = calculateFeatBonuses(character, 'hitPoints');
    return baseHitPoints + featBonus;
  };

  // 计算速度（包含专长加值）
  const calculateSpeed = (baseSpeed: number, character: CharacterData): number => {
    const featBonus = calculateFeatBonuses(character, 'speed');
    return baseSpeed + featBonus;
  };

  // 获取熟练度名称
  const getProficiencyName = (proficiency: number) => {
    switch (proficiency) {
      case 0: return '未受训';
      case 2: return '受训';
      case 4: return '专家';
      case 6: return '大师';
      case 8: return '传奇';
      default: return '未受训';
    }
  };

  // 获取熟练度颜色
  const getProficiencyColor = (proficiency: number) => {
    switch (proficiency) {
      case 0: return '#d9d9d9';    // 未受训 - 灰色
      case 2: return '#52c41a';    // 受训 - 绿色
      case 4: return '#1890ff';    // 专家 - 蓝色
      case 6: return '#722ed1';    // 大师 - 紫色
      case 8: return '#fa8c16';    // 橙色 - 传奇
      default: return '#d9d9d9';
    }
  };

  // 获取属性名称
  const getAttributeName = (attribute: string) => {
    switch (attribute) {
      case 'strength': return '力量';
      case 'dexterity': return '敏捷';
      case 'constitution': return '体质';
      case 'intelligence': return '智力';
      case 'wisdom': return '感知';
      case 'charisma': return '魅力';
      default: return '力量';
    }
  };

  // 计算技能加值（包含专长加值）
  const calculateSkillBonus = (proficiency: number, attributeModifier: number, level: number, skillName?: string, character?: CharacterData): number => {
    const baseBonus = attributeModifier + (proficiency > 0 ? proficiency + level : 0);
    
    // 如果提供了技能名称和角色数据，计算专长加值
    if (skillName && character) {
      const featBonus = calculateFeatBonuses(character, skillName);
      return baseBonus + featBonus;
    }
    
    return baseBonus;
  };

  // 获取技能的专长加值详情
  const getSkillFeatBonusDetails = (skillName: string, character: CharacterData) => {
    return getFeatBonusDetails(character, skillName);
  };

  // 计算察觉加值
  const calculatePerception = (perceptionProficiency: number, wisdomModifier: number, level: number): number => {
    return wisdomModifier + (perceptionProficiency > 0 ? perceptionProficiency + level : 0);
  };

  // 根据种族获取默认速度
  const getDefaultSpeedByAncestry = (ancestry: string): number => {
    const speedMap: { [key: string]: number } = {
      'human': 25,      // 人类
      'elf': 30,        // 精灵
      'dwarf': 20,      // 矮人  
      'halfling': 20,   // 半身人
      'gnome': 20,      // 侏儒
      'goblin': 25,     // 哥布林
      'orc': 25,        // 兽人
      'catfolk': 25,    // 猫人
      'leshy': 25,      // 莱西
      'lizardfolk': 25, // 蜥蜴人
    };
    return speedMap[ancestry] || 25; // 默认 25 英尺
  };

  // 根据职业获取职业DC的关键属性
  const getClassDCAttribute = (characterClass: string): string => {
    const classDCMap: { [key: string]: string } = {
      'fighter': 'strength',      // 战士 - 力量
      'wizard': 'intelligence',   // 法师 - 智力
      'rogue': 'dexterity',      // 游荡者 - 敏捷
      'cleric': 'wisdom',        // 牧师 - 感知
      'barbarian': 'strength',   // 野蛮人 - 力量
      'bard': 'charisma',        // 诗人 - 魅力
      'champion': 'charisma',    // 冠军 - 魅力
      'druid': 'wisdom',         // 德鲁伊 - 感知
      'monk': 'dexterity',       // 武僧 - 敏捷
      'ranger': 'wisdom',        // 游侠 - 感知
      'sorcerer': 'charisma',    // 术士 - 魅力
      'witch': 'intelligence',   // 女巫 - 智力
      'alchemist': 'intelligence', // 炼金术师 - 智力
      'oracle': 'charisma',      // 先知 - 魅力
      'swashbuckler': 'charisma', // 剑客 - 魅力
      'investigator': 'intelligence', // 调查员 - 智力
    };
    return classDCMap[characterClass] || 'strength'; // 默认力量
  };

  // 计算职业DC
  const calculateClassDC = (characterClass: string, classDCProficiency: number, level: number, character: CharacterData): number => {
    const keyAttribute = getClassDCAttribute(characterClass);
    const attributeModifier = character[`${keyAttribute}Modifier` as keyof CharacterData] as number;
    return 10 + attributeModifier + (classDCProficiency > 0 ? classDCProficiency + level : 0);
  };

  // 渲染彩色熟练度选择器
  const renderProficiencySelect = (
    value: number, 
    onChange: (value: number) => void, 
    size: 'small' | 'middle' = 'small'
  ) => (
    <Select
      value={value}
      onChange={onChange}
      size={size}
      style={{ width: '100%' }}
    >
      <Option value={0}>
        <span style={{ color: getProficiencyColor(0) }}>未受训</span>
      </Option>
      <Option value={2}>
        <span style={{ color: getProficiencyColor(2) }}>受训</span>
      </Option>
      <Option value={4}>
        <span style={{ color: getProficiencyColor(4) }}>专家</span>
      </Option>
      <Option value={6}>
        <span style={{ color: getProficiencyColor(6) }}>大师</span>
      </Option>
      <Option value={8}>
        <span style={{ color: getProficiencyColor(8) }}>传奇</span>
      </Option>
    </Select>
  );

  // 计算豁免检定加值
  const calculateSave = (proficiency: number, attributeModifier: number, level: number, itemBonus: number = 0): number => {
    return attributeModifier + (proficiency > 0 ? proficiency + level : 0) + itemBonus;
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
      
      // 重新计算最大生命值（包含专长效果）
      updated.maxHitPoints = calculateMaxHitPoints(updated.level, updated.constitutionModifier, updated);
      
      // 如果当前生命值超过最大值，调整当前生命值
      if (updated.hitPoints > updated.maxHitPoints) {
        updated.hitPoints = updated.maxHitPoints;
      }
      
      return updated;
    });
  };

  // 更新专长数据并重新计算所有受影响的属性
  const updateFeats = (newFeats: FeatData[]) => {
    setCharacter(prev => {
      const updated = { ...prev, feats: newFeats };
      
      // 重新计算所有调整值
      updated.strengthModifier = calculateModifier(updated.strength);
      updated.dexterityModifier = calculateModifier(updated.dexterity);
      updated.constitutionModifier = calculateModifier(updated.constitution);
      updated.intelligenceModifier = calculateModifier(updated.intelligence);
      updated.wisdomModifier = calculateModifier(updated.wisdom);
      updated.charismaModifier = calculateModifier(updated.charisma);
      
      // 重新计算护甲等级（可能受专长影响）
      updated.armorClass = calculateArmorClass(updated);
      
      // 重新计算最大生命值（包含专长效果）
      updated.maxHitPoints = calculateMaxHitPoints(updated.level, updated.constitutionModifier, updated);
      
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
      shieldBT: 0,
      // 技能熟练度默认值（未受训）
      acrobaticsProficiency: 0,
      arcanaProficiency: 0,
      athleticsProficiency: 0,
      craftingProficiency: 0,
      deceptionProficiency: 0,
      diplomacyProficiency: 0,
      intimidationProficiency: 0,
      medicineProficiency: 0,
      natureProficiency: 0,
      occultismProficiency: 0,
      performanceProficiency: 0,
      religionProficiency: 0,
      societyProficiency: 0,
      stealthProficiency: 0,
      survivalProficiency: 0,
      thieveryProficiency: 0,
      customSkillsProficiency: [],
      customSkillsNames: [],
      customSkillsAttributes: [],
      // 豁免检定熟练度默认值
      fortitudeProficiency: 2,
      reflexProficiency: 2,
      willProficiency: 0,
      // 基础数据
      speed: 25,
      perceptionProficiency: 0,
      // 语言默认值
      languages: ['通用语'],     // 默认掌握通用语
      // 武器熟练度默认值
      unarmedProficiency: 2,        // 无武装默认受训
      simpleWeaponProficiency: 2,   // 简易武器默认受训  
      martialWeaponProficiency: 2,  // 军用武器默认受训
      advancedWeaponProficiency: 0, // 进阶武器默认未受训
      // 武器列表默认值
      weapons: [],
      // 职业DC默认值
      classDCProficiency: 2,  // 职业DC默认受训
      // 专长默认值
      feats: [],
      // 扩展生命值数据
      temporaryHitPoints: 0,
      dyingValue: 0,
      // 抗性和免疫
      resistances: '',
      immunities: '',
      conditions: ''
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
          // 确保自定义技能字段存在
          const mergedCharacter = {
            ...savedCharacter,
            customSkillsNames: savedCharacter.customSkillsNames || [],
            customSkillsAttributes: savedCharacter.customSkillsAttributes || [],
            customSkillsProficiency: savedCharacter.customSkillsProficiency || [],
            // 确保新增字段存在
            speed: savedCharacter.speed ?? 25,
            perceptionProficiency: savedCharacter.perceptionProficiency ?? 0,
            languages: savedCharacter.languages || ['通用语'],
            unarmedProficiency: savedCharacter.unarmedProficiency ?? 2,
            simpleWeaponProficiency: savedCharacter.simpleWeaponProficiency ?? 2,
            martialWeaponProficiency: savedCharacter.martialWeaponProficiency ?? 2,
            advancedWeaponProficiency: savedCharacter.advancedWeaponProficiency ?? 0,
            weapons: savedCharacter.weapons || [],
            classDCProficiency: savedCharacter.classDCProficiency ?? 2,
            feats: savedCharacter.feats || []
          };
          setCharacter(mergedCharacter);
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
          // 确保自定义技能字段存在
          const mergedCharacter = {
            ...savedCharacter,
            customSkillsNames: savedCharacter.customSkillsNames || [],
            customSkillsAttributes: savedCharacter.customSkillsAttributes || [],
            customSkillsProficiency: savedCharacter.customSkillsProficiency || [],
            // 确保新增字段存在
            speed: savedCharacter.speed ?? 25,
            perceptionProficiency: savedCharacter.perceptionProficiency ?? 0,
            languages: savedCharacter.languages || ['通用语'],
            unarmedProficiency: savedCharacter.unarmedProficiency ?? 2,
            simpleWeaponProficiency: savedCharacter.simpleWeaponProficiency ?? 2,
            martialWeaponProficiency: savedCharacter.martialWeaponProficiency ?? 2,
            advancedWeaponProficiency: savedCharacter.advancedWeaponProficiency ?? 0,
            weapons: savedCharacter.weapons || [],
            classDCProficiency: savedCharacter.classDCProficiency ?? 2,
            feats: savedCharacter.feats || []
          };
          setCharacter(mergedCharacter);
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
                <Option value="barbarian">野蛮人</Option>
                <Option value="bard">诗人</Option>
                <Option value="champion">冠军</Option>
                <Option value="druid">德鲁伊</Option>
                <Option value="monk">武僧</Option>
                <Option value="ranger">游侠</Option>
                <Option value="sorcerer">术士</Option>
                <Option value="witch">女巫</Option>
                <Option value="alchemist">炼金术师</Option>
                <Option value="oracle">先知</Option>
                <Option value="swashbuckler">剑客</Option>
                <Option value="investigator">调查员</Option>
              </Select>
            </Card>
          </Col>
        </Row>

        {/* 速度、察觉和职业DC */}
        <Row gutter={16} style={{ marginBottom: 24 }}>
          <Col span={5}>
            <Card size="small" title="速度" style={{ textAlign: 'center' }}>
              <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#52c41a', marginBottom: '8px' }}>
                {calculateSpeed(character.speed, character)} 英尺
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <InputNumber
                  value={character.speed}
                  onChange={(value) => updateCharacter('speed', value || 25)}
                  min={0}
                  max={80}
                  size="small"
                  style={{ flex: 1 }}
                />
                <Button
                  size="small"
                  onClick={() => {
                    const defaultSpeed = getDefaultSpeedByAncestry(character.ancestry);
                    updateCharacter('speed', defaultSpeed);
                    message.success(`已重置为${character.ancestry === 'human' ? '人类' : character.ancestry}默认速度: ${defaultSpeed}英尺`);
                  }}
                  title="重置为种族默认速度"
                >
                  重置
                </Button>
              </div>
              <Text type="secondary" style={{ fontSize: '12px', marginTop: '4px', display: 'block' }}>
                基础: {character.speed}英尺
                {(() => {
                  const speedBonusDetails = getFeatBonusDetails(character, 'speed');
                  if (speedBonusDetails.total > 0) {
                    return (
                      <span style={{ color: '#52c41a' }}>
                        {' + 专长({speedBonusDetails.total}'}
                        {speedBonusDetails.sources.length > 0 && (
                          <span title={speedBonusDetails.sources.map(s => `${s.name}: +${s.value}`).join(', ')}>
                            ): {speedBonusDetails.sources.map(s => s.name).join(', ')}
                          </span>
                        )}
                        )
                      </span>
                    );
                  }
                  return null;
                })()}
              </Text>
            </Card>
          </Col>
          <Col span={5}>
            <Card size="small" title="察觉" style={{ textAlign: 'center' }}>
              <div style={{ fontSize: '24px', fontWeight: 'bold', marginBottom: '8px', color: '#1890ff' }}>
                {calculatePerception(character.perceptionProficiency, character.wisdomModifier, character.level) >= 0 ? '+' : ''}
                {calculatePerception(character.perceptionProficiency, character.wisdomModifier, character.level)}
              </div>
              {renderProficiencySelect(
                character.perceptionProficiency,
                (value) => updateCharacter('perceptionProficiency', value)
              )}
              <Text type="secondary" style={{ fontSize: '12px', marginTop: '4px', display: 'block' }}>
                感知({character.wisdomModifier >= 0 ? '+' : ''}{character.wisdomModifier}) + 
                <span style={{ color: getProficiencyColor(character.perceptionProficiency), fontWeight: 'bold' }}>
                  {getProficiencyName(character.perceptionProficiency)}
                </span>
                {character.perceptionProficiency > 0 && `(${character.perceptionProficiency}+${character.level})`}
              </Text>
            </Card>
          </Col>
          <Col span={5}>
            <Card size="small" title="职业DC" style={{ textAlign: 'center' }}>
              <div style={{ fontSize: '24px', fontWeight: 'bold', marginBottom: '8px', color: '#fa8c16' }}>
                {calculateClassDC(character.class, character.classDCProficiency, character.level, character)}
              </div>
              {renderProficiencySelect(
                character.classDCProficiency,
                (value) => updateCharacter('classDCProficiency', value)
              )}
              <Text type="secondary" style={{ fontSize: '12px', marginTop: '4px', display: 'block' }}>
                {getAttributeName(getClassDCAttribute(character.class))}
                ({(character[`${getClassDCAttribute(character.class)}Modifier` as keyof CharacterData] as number) >= 0 ? '+' : ''}
                {character[`${getClassDCAttribute(character.class)}Modifier` as keyof CharacterData] as number}) + 
                <span style={{ color: getProficiencyColor(character.classDCProficiency), fontWeight: 'bold' }}>
                  {getProficiencyName(character.classDCProficiency)}
                </span>
                {character.classDCProficiency > 0 && `(${character.classDCProficiency}+${character.level})`}
              </Text>
            </Card>
          </Col>
          <Col span={9}>
            <Card size="small" title="语言" style={{ textAlign: 'left' }}>
              <div style={{ marginBottom: '8px' }}>
                <Select
                  mode="tags"
                  style={{ width: '100%' }}
                  placeholder="选择或输入语言"
                  value={character.languages}
                  onChange={(value) => updateCharacter('languages', value)}
                  options={commonLanguages.map(lang => ({ label: lang, value: lang }))}
                  tokenSeparators={[',']}
                  size="small"
                  showSearch
                  filterOption={(input, option) =>
                    (option?.label ?? '').toLowerCase().includes(input.toLowerCase())
                  }
                  notFoundContent="输入语言名称后按回车添加"
                >
                </Select>
              </div>
              <Text type="secondary" style={{ fontSize: '12px' }}>
                💡 可搜索选择常用语言，也可直接输入自定义语言后按回车添加
              </Text>
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

        <Divider orientation="left">武器熟练度</Divider>
        
        {/* 武器熟练度选择 */}
        <Row gutter={16} style={{ marginBottom: 24 }}>
          <Col span={6}>
            <Card size="small" title="无武装攻击" style={{ textAlign: 'center' }}>
              <div style={{ fontSize: '20px', fontWeight: 'bold', marginBottom: '8px', color: '#fa8c16' }}>
                <span style={{ color: getProficiencyColor(character.unarmedProficiency) }}>
                  {getProficiencyName(character.unarmedProficiency)}
                </span>
              </div>
              {renderProficiencySelect(
                character.unarmedProficiency,
                (value) => updateCharacter('unarmedProficiency', value)
              )}
            </Card>
          </Col>
          <Col span={6}>
            <Card size="small" title="简易武器" style={{ textAlign: 'center' }}>
              <div style={{ fontSize: '20px', fontWeight: 'bold', marginBottom: '8px' }}>
                <span style={{ color: getProficiencyColor(character.simpleWeaponProficiency) }}>
                  {getProficiencyName(character.simpleWeaponProficiency)}
                </span>
              </div>
              {renderProficiencySelect(
                character.simpleWeaponProficiency,
                (value) => updateCharacter('simpleWeaponProficiency', value)
              )}
            </Card>
          </Col>
          <Col span={6}>
            <Card size="small" title="军用武器" style={{ textAlign: 'center' }}>
              <div style={{ fontSize: '20px', fontWeight: 'bold', marginBottom: '8px' }}>
                <span style={{ color: getProficiencyColor(character.martialWeaponProficiency) }}>
                  {getProficiencyName(character.martialWeaponProficiency)}
                </span>
              </div>
              {renderProficiencySelect(
                character.martialWeaponProficiency,
                (value) => updateCharacter('martialWeaponProficiency', value)
              )}
            </Card>
          </Col>
          <Col span={6}>
            <Card size="small" title="进阶武器" style={{ textAlign: 'center' }}>
              <div style={{ fontSize: '20px', fontWeight: 'bold', marginBottom: '8px' }}>
                <span style={{ color: getProficiencyColor(character.advancedWeaponProficiency) }}>
                  {getProficiencyName(character.advancedWeaponProficiency)}
                </span>
              </div>
              {renderProficiencySelect(
                character.advancedWeaponProficiency,
                (value) => updateCharacter('advancedWeaponProficiency', value)
              )}
            </Card>
          </Col>
        </Row>

        <Divider orientation="left">打击栏</Divider>
        
        {/* 武器列表和添加武器 */}
        <Row gutter={16} style={{ marginBottom: 24 }}>
          <Col span={24}>
            <Card size="small" title="武器列表">
              {(character.weapons && character.weapons.length === 0) || !character.weapons ? (
                <div style={{ textAlign: 'center', color: '#999', padding: '20px' }}>
                  暂无武器，点击下方按钮添加武器
                </div>
              ) : (
                <Row gutter={16}>
                  {(character.weapons || []).map((weapon) => (
                    <Col span={8} key={weapon.id} style={{ marginBottom: '16px' }}>
                      <Card 
                        size="small" 
                        style={{ border: '1px solid #d9d9d9' }}
                        extra={
                          <Button 
                            type="text" 
                            danger 
                            size="small"
                            onClick={() => removeWeapon(weapon.id)}
                          >
                            删除
                          </Button>
                        }
                      >
                        <div style={{ textAlign: 'center' }}>
                          <div style={{ fontWeight: 'bold', fontSize: '16px', marginBottom: '4px' }}>
                            {weapon.name}
                          </div>
                          <div style={{ color: '#666', fontSize: '12px', marginBottom: '8px' }}>
                            {weapon.type === 'melee' ? '近战' : '远程'} · 
                            {weapon.category === 'unarmed' ? '无武装' : 
                             weapon.category === 'simple' ? '简易' :
                             weapon.category === 'martial' ? '军用' :
                             weapon.category === 'advanced' ? '进阶' : '其他'}
                          </div>
                          <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#1890ff', marginBottom: '4px' }}>
                            {calculateWeaponAttack(weapon) >= 0 ? '+' : ''}{calculateWeaponAttack(weapon)}
                          </div>
                          <div style={{ fontSize: '14px', color: '#52c41a', marginBottom: '4px' }}>
                            {weapon.damage}
                          </div>
                          {weapon.traits.length > 0 && (
                            <div style={{ fontSize: '12px', color: '#666' }}>
                              {weapon.traits.join(', ')}
                            </div>
                          )}
                        </div>
                      </Card>
                    </Col>
                  ))}
                </Row>
              )}
              
              {/* 添加武器按钮 */}
              <div style={{ textAlign: 'center', marginTop: '16px' }}>
                <Space>
                  <Button 
                    type="primary" 
                    onClick={() => setShowAddWeaponModal(true)}
                    icon={<PlusOutlined />}
                  >
                    自定义武器
                  </Button>
                  <Select
                    placeholder="从模板添加"
                    style={{ width: 200 }}
                    onChange={(value: string) => {
                      if (!value) return;
                      const [category, type, index] = value.split('-');
                      let template;
                      
                      if (category === 'unarmed') {
                        template = weaponTemplates.unarmed[parseInt(index)];
                      } else {
                        const categoryTemplates = weaponTemplates[category as keyof typeof weaponTemplates] as any;
                        template = categoryTemplates[type][parseInt(index)];
                      }
                      
                      if (template) {
                        addWeaponFromTemplate(template, category, type);
                      }
                    }}
                    value={undefined}
                  >
                    <Select.OptGroup label="无武装">
                      {weaponTemplates.unarmed.map((weapon, index) => (
                        <Option key={`unarmed-melee-${index}`} value={`unarmed-melee-${index}`}>
                          {weapon.name} ({weapon.damage})
                        </Option>
                      ))}
                    </Select.OptGroup>
                    <Select.OptGroup label="简易近战武器">
                      {weaponTemplates.simple.melee.map((weapon, index) => (
                        <Option key={`simple-melee-${index}`} value={`simple-melee-${index}`}>
                          {weapon.name} ({weapon.damage})
                        </Option>
                      ))}
                    </Select.OptGroup>
                    <Select.OptGroup label="简易远程武器">
                      {weaponTemplates.simple.ranged.map((weapon, index) => (
                        <Option key={`simple-ranged-${index}`} value={`simple-ranged-${index}`}>
                          {weapon.name} ({weapon.damage})
                        </Option>
                      ))}
                    </Select.OptGroup>
                    <Select.OptGroup label="军用近战武器">
                      {weaponTemplates.martial.melee.map((weapon, index) => (
                        <Option key={`martial-melee-${index}`} value={`martial-melee-${index}`}>
                          {weapon.name} ({weapon.damage})
                        </Option>
                      ))}
                    </Select.OptGroup>
                    <Select.OptGroup label="军用远程武器">
                      {weaponTemplates.martial.ranged.map((weapon, index) => (
                        <Option key={`martial-ranged-${index}`} value={`martial-ranged-${index}`}>
                          {weapon.name} ({weapon.damage})
                        </Option>
                      ))}
                    </Select.OptGroup>
                    <Select.OptGroup label="进阶近战武器">
                      {weaponTemplates.advanced.melee.map((weapon, index) => (
                        <Option key={`advanced-melee-${index}`} value={`advanced-melee-${index}`}>
                          {weapon.name} ({weapon.damage})
                        </Option>
                      ))}
                    </Select.OptGroup>
                    <Select.OptGroup label="进阶远程武器">
                      {weaponTemplates.advanced.ranged.map((weapon, index) => (
                        <Option key={`advanced-ranged-${index}`} value={`advanced-ranged-${index}`}>
                          {weapon.name} ({weapon.damage})
                        </Option>
                      ))}
                    </Select.OptGroup>
                  </Select>
                </Space>
              </div>
            </Card>
          </Col>
        </Row>

        <Divider orientation="left">技能</Divider>

        {/* 技能部分 */}
        <Row gutter={16} style={{ marginBottom: 24 }}>
          {skillsConfig.map((skill) => {
            const proficiency = character[skill.key as keyof CharacterData] as number;
            const attributeModifier = character[`${skill.attribute}Modifier` as keyof CharacterData] as number;
            // 获取技能的英文名称用于专长匹配
            const skillEnglishName = skill.key.replace('Proficiency', ''); // 移除Proficiency后缀
            const skillBonus = calculateSkillBonus(proficiency, attributeModifier, character.level, skillEnglishName, character);
            const featBonusDetails = getSkillFeatBonusDetails(skillEnglishName, character);
            
            return (
              <Col span={6} key={skill.key} style={{ marginBottom: '16px' }}>
                <Card size="small" style={{ textAlign: 'center' }}>
                  <div style={{ marginBottom: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
                    <span style={{ fontSize: '16px', color: '#1890ff' }}>{skill.icon}</span>
                    <Text strong style={{ fontSize: '14px' }}>{skill.name}</Text>
                  </div>
                  <div style={{ fontSize: '24px', fontWeight: 'bold', marginBottom: '8px' }}>
                    {skillBonus >= 0 ? '+' : ''}{skillBonus}
                  </div>
                  <Select
                    value={proficiency}
                    onChange={(value) => updateCharacter(skill.key as keyof CharacterData, value)}
                    size="small"
                    style={{ width: '100%' }}
                  >
                    <Option value={0}>
                      <span style={{ color: getProficiencyColor(0) }}>未受训</span>
                    </Option>
                    <Option value={2}>
                      <span style={{ color: getProficiencyColor(2) }}>受训</span>
                    </Option>
                    <Option value={4}>
                      <span style={{ color: getProficiencyColor(4) }}>专家</span>
                    </Option>
                    <Option value={6}>
                      <span style={{ color: getProficiencyColor(6) }}>大师</span>
                    </Option>
                    <Option value={8}>
                      <span style={{ color: getProficiencyColor(8) }}>传奇</span>
                    </Option>
                  </Select>
                  <div style={{ marginTop: '4px', fontSize: '12px' }}>
                    <Text type="secondary">
                      {skill.attribute.charAt(0).toUpperCase() + skill.attribute.slice(1).slice(0, 3)}
                      ({attributeModifier >= 0 ? '+' : ''}{attributeModifier}) + 
                      <span style={{ color: getProficiencyColor(proficiency), fontWeight: 'bold' }}>
                        {getProficiencyName(proficiency)}
                      </span>
                      {proficiency > 0 && `(${proficiency}+${character.level})`}
                      {featBonusDetails.total > 0 && (
                        <span style={{ color: '#52c41a' }}>
                          {' + 专长('}
                          <span title={featBonusDetails.sources.map(s => `${s.name}: +${s.value}`).join(', ')}>
                            {featBonusDetails.total}
                          </span>
                          )
                        </span>
                      )}
                    </Text>
                  </div>
                </Card>
              </Col>
            );
          })}
        </Row>

        <Divider orientation="left">
          自定义技能
          <Button
            type="dashed"
            size="small"
            icon={<PlusOutlined />}
            onClick={() => setShowAddSkillModal(true)}
            style={{ marginLeft: '16px' }}
          >
            添加技能
          </Button>
        </Divider>

        {/* 自定义技能列表 */}
        {character.customSkillsNames && character.customSkillsNames.length > 0 && (
          <Row gutter={16} style={{ marginBottom: 24 }}>
            {character.customSkillsNames.map((skillName, index) => {
              const proficiency = character.customSkillsProficiency?.[index] || 0;
              const attribute = character.customSkillsAttributes?.[index] || 'strength';
              const attributeModifier = character[`${attribute}Modifier` as keyof CharacterData] as number;
              // 对于自定义技能，使用技能名称本身尝试匹配专长
              const skillBonus = calculateSkillBonus(proficiency, attributeModifier, character.level, skillName, character);
              
              return (
                <Col span={6} key={`custom-${index}`} style={{ marginBottom: '16px' }}>
                  <Card 
                    size="small" 
                    style={{ 
                      textAlign: 'center', 
                      border: '2px dashed #722ed1',
                      background: 'linear-gradient(145deg, #fafafa 0%, #f0f0f0 100%)'
                    }}
                    extra={
                      <Button
                        type="text"
                        size="small"
                        icon={<DeleteOutlined />}
                        onClick={() => {
                          setDeletingSkillIndex(index);
                          setShowDeleteSkillModal(true);
                        }}
                        style={{ color: '#ff4d4f' }}
                      />
                    }
                  >
                    <div style={{ marginBottom: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
                      <span style={{ fontSize: '16px', color: '#722ed1' }}>⚙️</span>
                      <Text strong style={{ fontSize: '14px', color: '#722ed1' }}>
                        {skillName}
                      </Text>
                    </div>
                    <div style={{ fontSize: '24px', fontWeight: 'bold', marginBottom: '8px', color: '#722ed1' }}>
                      {skillBonus >= 0 ? '+' : ''}{skillBonus}
                    </div>
                    <Select
                      value={proficiency}
                      onChange={(value) => updateCustomSkillProficiency(index, value)}
                      size="small"
                      style={{ width: '100%' }}
                    >
                      <Option value={0}>
                        <span style={{ color: getProficiencyColor(0) }}>未受训</span>
                      </Option>
                      <Option value={2}>
                        <span style={{ color: getProficiencyColor(2) }}>受训</span>
                      </Option>
                      <Option value={4}>
                        <span style={{ color: getProficiencyColor(4) }}>专家</span>
                      </Option>
                      <Option value={6}>
                        <span style={{ color: getProficiencyColor(6) }}>大师</span>
                      </Option>
                      <Option value={8}>
                        <span style={{ color: getProficiencyColor(8) }}>传奇</span>
                      </Option>
                    </Select>
                    <div style={{ marginTop: '4px', fontSize: '12px' }}>
                      <Text type="secondary">
                        {getAttributeName(attribute)}
                        ({attributeModifier >= 0 ? '+' : ''}{attributeModifier}) + 
                        <span style={{ color: getProficiencyColor(proficiency), fontWeight: 'bold' }}>
                          {getProficiencyName(proficiency)}
                        </span>
                        {proficiency > 0 && `(${proficiency}+${character.level})`}
                      </Text>
                    </div>
                  </Card>
                </Col>
              );
            })}
          </Row>
        )}

        <Divider orientation="left">战斗数据</Divider>

        {/* 武器熟练度 */}
        <Row gutter={16} style={{ marginBottom: 24 }}>
          <Col span={6}>
            <Card size="small" title="无武装攻击" style={{ textAlign: 'center' }}>
              <div style={{ fontSize: '20px', fontWeight: 'bold', marginBottom: '8px', color: '#722ed1' }}>
                {character.strengthModifier + (character.unarmedProficiency > 0 ? character.unarmedProficiency + character.level : 0) >= 0 ? '+' : ''}
                {character.strengthModifier + (character.unarmedProficiency > 0 ? character.unarmedProficiency + character.level : 0)}
              </div>
              {renderProficiencySelect(
                character.unarmedProficiency,
                (value) => updateCharacter('unarmedProficiency', value)
              )}
              <Text type="secondary" style={{ fontSize: '12px', marginTop: '4px', display: 'block' }}>
                力量({character.strengthModifier >= 0 ? '+' : ''}{character.strengthModifier}) + 
                <span style={{ color: getProficiencyColor(character.unarmedProficiency), fontWeight: 'bold' }}>
                  {getProficiencyName(character.unarmedProficiency)}
                </span>
                {character.unarmedProficiency > 0 && `(${character.unarmedProficiency}+${character.level})`}
              </Text>
            </Card>
          </Col>
          <Col span={6}>
            <Card size="small" title="简易武器" style={{ textAlign: 'center' }}>
              <div style={{ fontSize: '20px', fontWeight: 'bold', marginBottom: '8px', color: '#52c41a' }}>
                {character.strengthModifier + (character.simpleWeaponProficiency > 0 ? character.simpleWeaponProficiency + character.level : 0) >= 0 ? '+' : ''}
                {character.strengthModifier + (character.simpleWeaponProficiency > 0 ? character.simpleWeaponProficiency + character.level : 0)}
              </div>
              {renderProficiencySelect(
                character.simpleWeaponProficiency,
                (value) => updateCharacter('simpleWeaponProficiency', value)
              )}
              <Text type="secondary" style={{ fontSize: '12px', marginTop: '4px', display: 'block' }}>
                力量({character.strengthModifier >= 0 ? '+' : ''}{character.strengthModifier}) + 
                <span style={{ color: getProficiencyColor(character.simpleWeaponProficiency), fontWeight: 'bold' }}>
                  {getProficiencyName(character.simpleWeaponProficiency)}
                </span>
                {character.simpleWeaponProficiency > 0 && `(${character.simpleWeaponProficiency}+${character.level})`}
              </Text>
            </Card>
          </Col>
          <Col span={6}>
            <Card size="small" title="军用武器" style={{ textAlign: 'center' }}>
              <div style={{ fontSize: '20px', fontWeight: 'bold', marginBottom: '8px', color: '#1890ff' }}>
                {character.strengthModifier + (character.martialWeaponProficiency > 0 ? character.martialWeaponProficiency + character.level : 0) >= 0 ? '+' : ''}
                {character.strengthModifier + (character.martialWeaponProficiency > 0 ? character.martialWeaponProficiency + character.level : 0)}
              </div>
              {renderProficiencySelect(
                character.martialWeaponProficiency,
                (value) => updateCharacter('martialWeaponProficiency', value)
              )}
              <Text type="secondary" style={{ fontSize: '12px', marginTop: '4px', display: 'block' }}>
                力量({character.strengthModifier >= 0 ? '+' : ''}{character.strengthModifier}) + 
                <span style={{ color: getProficiencyColor(character.martialWeaponProficiency), fontWeight: 'bold' }}>
                  {getProficiencyName(character.martialWeaponProficiency)}
                </span>
                {character.martialWeaponProficiency > 0 && `(${character.martialWeaponProficiency}+${character.level})`}
              </Text>
            </Card>
          </Col>
          <Col span={6}>
            <Card size="small" title="进阶武器" style={{ textAlign: 'center' }}>
              <div style={{ fontSize: '20px', fontWeight: 'bold', marginBottom: '8px', color: '#fa8c16' }}>
                {character.strengthModifier + (character.advancedWeaponProficiency > 0 ? character.advancedWeaponProficiency + character.level : 0) >= 0 ? '+' : ''}
                {character.strengthModifier + (character.advancedWeaponProficiency > 0 ? character.advancedWeaponProficiency + character.level : 0)}
              </div>
              {renderProficiencySelect(
                character.advancedWeaponProficiency,
                (value) => updateCharacter('advancedWeaponProficiency', value)
              )}
              <Text type="secondary" style={{ fontSize: '12px', marginTop: '4px', display: 'block' }}>
                力量({character.strengthModifier >= 0 ? '+' : ''}{character.strengthModifier}) + 
                <span style={{ color: getProficiencyColor(character.advancedWeaponProficiency), fontWeight: 'bold' }}>
                  {getProficiencyName(character.advancedWeaponProficiency)}
                </span>
                {character.advancedWeaponProficiency > 0 && `(${character.advancedWeaponProficiency}+${character.level})`}
              </Text>
            </Card>
          </Col>
        </Row>

        {/* 战斗数据 */}
        <Row gutter={24}>
          <Col span={8}>
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
                  {renderProficiencySelect(
                    character.unarmoredProficiency,
                    (value) => updateCharacter('unarmoredProficiency', value)
                  )}
                </Col>
                <Col span={6}>
                  <Text type="secondary" style={{ fontSize: '12px' }}>轻甲</Text>
                  {renderProficiencySelect(
                    character.lightArmorProficiency,
                    (value) => updateCharacter('lightArmorProficiency', value)
                  )}
                </Col>
                <Col span={6}>
                  <Text type="secondary" style={{ fontSize: '12px' }}>中甲</Text>
                  {renderProficiencySelect(
                    character.mediumArmorProficiency,
                    (value) => updateCharacter('mediumArmorProficiency', value)
                  )}
                </Col>
                <Col span={6}>
                  <Text type="secondary" style={{ fontSize: '12px' }}>重甲</Text>
                  {renderProficiencySelect(
                    character.heavyArmorProficiency,
                    (value) => updateCharacter('heavyArmorProficiency', value)
                  )}
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
          <Col span={8}>
            <Card size="small" title="生命值" style={{ textAlign: 'center' }}>
              {/* 当前生命值和最大生命值 */}
              <Row gutter={8} style={{ marginBottom: '8px' }}>
                <Col span={12}>
                  <Text type="secondary" style={{ fontSize: '12px' }}>当前HP</Text>
                  <InputNumber
                    value={character.hitPoints}
                    onChange={(value) => updateCharacter('hitPoints', Math.min(value || 0, character.maxHitPoints))}
                    min={0}
                    max={character.maxHitPoints}
                    style={{ width: '100%', fontSize: '16px' }}
                  />
                </Col>
                <Col span={12}>
                  <Text type="secondary" style={{ fontSize: '12px' }}>最大HP</Text>
                  <div style={{ fontSize: '16px', fontWeight: 'bold', color: '#52c41a', padding: '4px 0' }}>
                    {character.maxHitPoints}
                  </div>
                  {/* 最大生命值计算详情 */}
                  <div style={{ fontSize: '10px', color: '#666', lineHeight: '1.2' }}>
                    基础: {8 + character.constitutionModifier + (character.level - 1) * (6 + character.constitutionModifier)}
                    {(() => {
                      const hpBonusDetails = getFeatBonusDetails(character, 'hitPoints');
                      if (hpBonusDetails.total > 0) {
                        return (
                          <span style={{ color: '#52c41a' }}>
                            <br />
                            专长: +{hpBonusDetails.total}
                            {hpBonusDetails.sources.length > 0 && (
                              <span title={hpBonusDetails.sources.map(s => `${s.name}: +${s.value}`).join(', ')}>
                                ({hpBonusDetails.sources.map(s => s.name).join(', ')})
                              </span>
                            )}
                          </span>
                        );
                      }
                      return null;
                    })()}
                  </div>
                </Col>
              </Row>

              {/* 临时生命值 */}
              <Row style={{ marginBottom: '8px' }}>
                <Col span={24}>
                  <Text type="secondary" style={{ fontSize: '12px' }}>临时HP</Text>
                  <InputNumber
                    value={character.temporaryHitPoints}
                    onChange={(value) => updateCharacter('temporaryHitPoints', value || 0)}
                    min={0}
                    style={{ width: '100%' }}
                  />
                </Col>
              </Row>

              {/* 濒死印记 */}
              <Divider style={{ margin: '8px 0' }} />
              <Text strong style={{ fontSize: '12px' }}>濒死印记</Text>
              <Row gutter={4} style={{ marginTop: '4px', justifyContent: 'center' }}>
                {[1, 2, 3, 4].map(level => (
                  <Col span={6} key={level}>
                    <div
                      style={{
                        width: '20px',
                        height: '20px',
                        border: '2px solid #ff4d4f',
                        backgroundColor: character.dyingValue >= level ? '#ff4d4f' : 'transparent',
                        cursor: 'pointer',
                        margin: '0 auto',
                        borderRadius: '2px'
                      }}
                      onClick={() => updateCharacter('dyingValue', character.dyingValue === level ? level - 1 : level)}
                    />
                    <Text type="secondary" style={{ fontSize: '10px', display: 'block', textAlign: 'center' }}>
                      {level}
                    </Text>
                  </Col>
                ))}
              </Row>

              {/* 抗性和免疫 */}
              <Divider style={{ margin: '8px 0' }} />
              <Row gutter={8}>
                <Col span={12}>
                  <Text type="secondary" style={{ fontSize: '12px' }}>抗性</Text>
                  <Input.TextArea
                    value={character.resistances}
                    onChange={(e) => updateCharacter('resistances', e.target.value)}
                    rows={2}
                    placeholder="抗性描述"
                    style={{ fontSize: '12px' }}
                  />
                </Col>
                <Col span={12}>
                  <Text type="secondary" style={{ fontSize: '12px' }}>免疫</Text>
                  <Input.TextArea
                    value={character.immunities}
                    onChange={(e) => updateCharacter('immunities', e.target.value)}
                    rows={2}
                    placeholder="免疫描述"
                    style={{ fontSize: '12px' }}
                  />
                </Col>
              </Row>

              {/* 状态 */}
              <Row style={{ marginTop: '8px' }}>
                <Col span={24}>
                  <Text type="secondary" style={{ fontSize: '12px' }}>状态</Text>
                  <Input.TextArea
                    value={character.conditions}
                    onChange={(e) => updateCharacter('conditions', e.target.value)}
                    rows={2}
                    placeholder="当前状态"
                    style={{ fontSize: '12px' }}
                  />
                </Col>
              </Row>
            </Card>
          </Col>
          
          <Col span={8}>
            <Card size="small" title="豁免检定" style={{ textAlign: 'center' }}>
              {/* 强韧 */}
              <Row style={{ marginBottom: '12px' }}>
                <Col span={24}>
                  <Text strong style={{ color: '#52c41a' }}>强韧</Text>
                  <div style={{ fontSize: '24px', fontWeight: 'bold', marginBottom: '4px' }}>
                    {calculateSave(character.fortitudeProficiency, character.constitutionModifier, character.level) >= 0 ? '+' : ''}
                    {calculateSave(character.fortitudeProficiency, character.constitutionModifier, character.level)}
                  </div>
                  {renderProficiencySelect(
                    character.fortitudeProficiency,
                    (value) => updateCharacter('fortitudeProficiency', value)
                  )}
                  <Text type="secondary" style={{ fontSize: '12px', marginTop: '4px', display: 'block' }}>
                    体质({character.constitutionModifier >= 0 ? '+' : ''}{character.constitutionModifier}) + 
                    <span style={{ color: getProficiencyColor(character.fortitudeProficiency), fontWeight: 'bold' }}>
                      {getProficiencyName(character.fortitudeProficiency)}
                    </span>
                    {character.fortitudeProficiency > 0 && `(${character.fortitudeProficiency}+${character.level})`}
                  </Text>
                </Col>
              </Row>

              {/* 反射 */}
              <Row style={{ marginBottom: '12px' }}>
                <Col span={24}>
                  <Text strong style={{ color: '#73d13d' }}>反射</Text>
                  <div style={{ fontSize: '24px', fontWeight: 'bold', marginBottom: '4px' }}>
                    {calculateSave(character.reflexProficiency, character.dexterityModifier, character.level) >= 0 ? '+' : ''}
                    {calculateSave(character.reflexProficiency, character.dexterityModifier, character.level)}
                  </div>
                  {renderProficiencySelect(
                    character.reflexProficiency,
                    (value) => updateCharacter('reflexProficiency', value)
                  )}
                  <Text type="secondary" style={{ fontSize: '12px', marginTop: '4px', display: 'block' }}>
                    敏捷({character.dexterityModifier >= 0 ? '+' : ''}{character.dexterityModifier}) + 
                    <span style={{ color: getProficiencyColor(character.reflexProficiency), fontWeight: 'bold' }}>
                      {getProficiencyName(character.reflexProficiency)}
                    </span>
                    {character.reflexProficiency > 0 && `(${character.reflexProficiency}+${character.level})`}
                  </Text>
                </Col>
              </Row>

              {/* 意志 */}
              <Row>
                <Col span={24}>
                  <Text strong style={{ color: '#ffc53d' }}>意志</Text>
                  <div style={{ fontSize: '24px', fontWeight: 'bold', marginBottom: '4px' }}>
                    {calculateSave(character.willProficiency, character.wisdomModifier, character.level) >= 0 ? '+' : ''}
                    {calculateSave(character.willProficiency, character.wisdomModifier, character.level)}
                  </div>
                  {renderProficiencySelect(
                    character.willProficiency,
                    (value) => updateCharacter('willProficiency', value)
                  )}
                  <Text type="secondary" style={{ fontSize: '12px', marginTop: '4px', display: 'block' }}>
                    感知({character.wisdomModifier >= 0 ? '+' : ''}{character.wisdomModifier}) + 
                    <span style={{ color: getProficiencyColor(character.willProficiency), fontWeight: 'bold' }}>
                      {getProficiencyName(character.willProficiency)}
                    </span>
                    {character.willProficiency > 0 && `(${character.willProficiency}+${character.level})`}
                  </Text>
                </Col>
              </Row>
            </Card>
          </Col>
        </Row>

        <Divider orientation="left">
          专长
          <Button
            type="dashed"
            size="small"
            icon={<PlusOutlined />}
            onClick={() => setShowAddFeatModal(true)}
            style={{ marginLeft: '16px' }}
          >
            添加专长
          </Button>
        </Divider>

        {/* 专长列表 */}
        <Row gutter={16} style={{ marginBottom: 24 }}>
          <Col span={24}>
            <Card size="small" title="专长列表">
              {(character.feats && character.feats.length === 0) || !character.feats ? (
                <div style={{ textAlign: 'center', color: '#999', padding: '20px' }}>
                  暂无专长，点击上方按钮添加专长
                </div>
              ) : (
                <Row gutter={16}>
                  {(character.feats || []).map((feat) => (
                    <Col span={8} key={feat.id} style={{ marginBottom: '16px' }}>
                      <Card 
                        size="small" 
                        style={{ 
                          border: '1px solid #d9d9d9',
                          background: feat.type === 'ancestry' ? '#fff7e6' :
                                     feat.type === 'class' ? '#e6f7ff' :
                                     feat.type === 'general' ? '#f6ffed' :
                                     feat.type === 'skill' ? '#fff0f6' :
                                     feat.type === 'archetype' ? '#f9f0ff' : '#ffffff'
                        }}
                        extra={
                          <Button 
                            type="text" 
                            danger 
                            size="small"
                            onClick={() => removeFeat(feat.id)}
                          >
                            删除
                          </Button>
                        }
                      >
                        <div>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                            <Text strong style={{ fontSize: '16px' }}>{feat.name}</Text>
                            <div>
                              <span style={{ 
                                fontSize: '12px', 
                                color: feat.type === 'ancestry' ? '#fa8c16' :
                                       feat.type === 'class' ? '#1890ff' :
                                       feat.type === 'general' ? '#52c41a' :
                                       feat.type === 'skill' ? '#eb2f96' :
                                       feat.type === 'archetype' ? '#722ed1' : '#666',
                                fontWeight: 'bold'
                              }}>
                                {feat.type === 'ancestry' ? '族裔' :
                                 feat.type === 'class' ? '职业' :
                                 feat.type === 'general' ? '通用' :
                                 feat.type === 'skill' ? '技能' :
                                 feat.type === 'archetype' ? '原型' : '其他'}
                              </span>
                              <span style={{ fontSize: '12px', color: '#666', marginLeft: '8px' }}>
                                {feat.level}级
                              </span>
                            </div>
                          </div>
                          {feat.prerequisites && (
                            <div style={{ fontSize: '12px', color: '#ff4d4f', marginBottom: '4px' }}>
                              前置: {feat.prerequisites}
                            </div>
                          )}
                          <div style={{ fontSize: '13px', color: '#666', lineHeight: '1.4', marginBottom: '8px' }}>
                            {feat.description}
                          </div>
                          {/* 显示专长效果 */}
                          {getFeatEffectText(feat).length > 0 && (
                            <div style={{ 
                              borderTop: '1px dashed #d9d9d9', 
                              paddingTop: '8px',
                              fontSize: '12px',
                              color: '#52c41a',
                              fontWeight: 'bold'
                            }}>
                              <div style={{ marginBottom: '4px', color: '#666' }}>
                                📊 效果：
                              </div>
                              {getFeatEffectText(feat).map((effect, index) => (
                                <div key={index} style={{ marginLeft: '16px', marginBottom: '2px' }}>
                                  • {effect}
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      </Card>
                    </Col>
                  ))}
                </Row>
              )}
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

      {/* 添加自定义技能的 Modal */}
      <Modal
        title="添加自定义技能"
        open={showAddSkillModal}
        onOk={addCustomSkill}
        onCancel={() => {
          setShowAddSkillModal(false);
          setNewCustomSkill({ name: '', attribute: 'strength' });
        }}
        okText="添加"
        cancelText="取消"
        width={400}
      >
        <div>
          <div style={{ marginBottom: '12px' }}>
            <Text strong>技能名称：</Text>
            <Input
              placeholder="请输入技能名称（如：驾驶、骑术、表演等）"
              value={newCustomSkill.name}
              onChange={(e) => setNewCustomSkill({ ...newCustomSkill, name: e.target.value })}
              style={{ marginTop: '4px' }}
            />
          </div>
          <div>
            <Text strong>关联属性：</Text>
            <Select
              placeholder="选择关联属性"
              value={newCustomSkill.attribute}
              onChange={(value) => setNewCustomSkill({ ...newCustomSkill, attribute: value })}
              style={{ width: '100%', marginTop: '4px' }}
            >
              <Option value="strength">力量 (Strength)</Option>
              <Option value="dexterity">敏捷 (Dexterity)</Option>
              <Option value="constitution">体质 (Constitution)</Option>
              <Option value="intelligence">智力 (Intelligence)</Option>
              <Option value="wisdom">感知 (Wisdom)</Option>
              <Option value="charisma">魅力 (Charisma)</Option>
            </Select>
          </div>
          <div style={{ marginTop: '8px', fontSize: '12px', color: '#666' }}>
            💡 提示：自定义技能可用于添加官方规则之外的特殊技能，如驾驶载具、操作特殊设备等。
          </div>
        </div>
      </Modal>

      {/* 删除自定义技能的 Modal */}
      <Modal
        title="删除自定义技能"
        open={showDeleteSkillModal}
        onOk={() => {
          if (deletingSkillIndex !== null) {
            removeCustomSkill(deletingSkillIndex);
          }
          setShowDeleteSkillModal(false);
          setDeletingSkillIndex(null);
        }}
        onCancel={() => {
          setShowDeleteSkillModal(false);
          setDeletingSkillIndex(null);
        }}
        okText="删除"
        cancelText="取消"
        okButtonProps={{ danger: true }}
      >
        <p>
          确定要删除技能"
          {deletingSkillIndex !== null && character.customSkillsNames && character.customSkillsNames[deletingSkillIndex]}
          "吗？
        </p>
      </Modal>

      {/* 添加自定义武器的 Modal */}
      <Modal
        title="添加自定义武器"
        open={showAddWeaponModal}
        onOk={addWeapon}
        onCancel={() => {
          setShowAddWeaponModal(false);
          setNewWeapon({
            name: '',
            category: 'simple',
            type: 'melee',
            damage: '1d6',
            traits: []
          });
        }}
        okText="添加"
        cancelText="取消"
        width={500}
      >
        <div>
          <Row gutter={16} style={{ marginBottom: '12px' }}>
            <Col span={12}>
              <Text strong>武器名称：</Text>
              <Input
                placeholder="请输入武器名称"
                value={newWeapon.name}
                onChange={(e) => setNewWeapon({ ...newWeapon, name: e.target.value })}
                style={{ marginTop: '4px' }}
              />
            </Col>
            <Col span={12}>
              <Text strong>武器类型：</Text>
              <Select
                value={newWeapon.type}
                onChange={(value) => setNewWeapon({ ...newWeapon, type: value })}
                style={{ width: '100%', marginTop: '4px' }}
              >
                <Option value="melee">近战</Option>
                <Option value="ranged">远程</Option>
              </Select>
            </Col>
          </Row>
          
          <Row gutter={16} style={{ marginBottom: '12px' }}>
            <Col span={12}>
              <Text strong>武器属性：</Text>
              <Select
                value={newWeapon.category}
                onChange={(value) => setNewWeapon({ ...newWeapon, category: value })}
                style={{ width: '100%', marginTop: '4px' }}
              >
                <Option value="unarmed">无武装</Option>
                <Option value="simple">简易</Option>
                <Option value="martial">军用</Option>
                <Option value="advanced">进阶</Option>
                <Option value="other">其他</Option>
              </Select>
            </Col>
            <Col span={12}>
              <Text strong>伤害值：</Text>
              <Input
                placeholder="如：1d6、1d8+2、2d4等"
                value={newWeapon.damage}
                onChange={(e) => setNewWeapon({ ...newWeapon, damage: e.target.value })}
                style={{ marginTop: '4px' }}
              />
            </Col>
          </Row>
          
          <div style={{ marginBottom: '12px' }}>
            <Text strong>武器特性：</Text>
            <Select
              mode="tags"
              style={{ width: '100%', marginTop: '4px' }}
              placeholder="选择或输入武器特性"
              value={newWeapon.traits}
              onChange={(value) => setNewWeapon({ ...newWeapon, traits: value })}
              options={[
                { label: '灵巧', value: '灵巧' },
                { label: '双手', value: '双手' },
                { label: '投掷', value: '投掷' },
                { label: '触及', value: '触及' },
                { label: '多用', value: '多用' },
                { label: '致命', value: '致命' },
                { label: '装填', value: '装填' },
                { label: '非致命', value: '非致命' },
                { label: '击倒', value: '击倒' },
                { label: '破甲', value: '破甲' }
              ]}
              tokenSeparators={[',']}
            />
          </div>
          
          <div style={{ fontSize: '12px', color: '#666' }}>
            💡 提示：武器属性决定使用哪个熟练度等级。近战武器使用力量修正，远程武器使用敏捷修正。
          </div>
        </div>
      </Modal>

      {/* 添加专长的 Modal */}
      <Modal
        title="添加专长"
        open={showAddFeatModal}
        onOk={addFeat}
        onCancel={() => {
          setShowAddFeatModal(false);
          setNewFeat({
            name: '',
            type: 'general',
            level: 1,
            description: '',
            prerequisites: ''
          });
          setSelectedPresetFeat('');
          setFeatSearchText('');
          setIsCustomFeat(false);
        }}
        okText="添加"
        cancelText="取消"
        width={800}
      >
        <div>
          <div style={{ marginBottom: '16px' }}>
            <Text strong>专长来源：</Text>
            <Select
              value={isCustomFeat ? 'custom' : 'preset'}
              onChange={(value) => {
                setIsCustomFeat(value === 'custom');
                if (value === 'preset') {
                  setNewFeat({
                    name: '',
                    type: 'general',
                    level: 1,
                    description: '',
                    prerequisites: ''
                  });
                } else {
                  setSelectedPresetFeat('');
                  setFeatSearchText('');
                }
              }}
              style={{ width: '100%', marginTop: '4px' }}
            >
              <Option value="preset">从预设专长选择</Option>
              <Option value="custom">自定义专长</Option>
            </Select>
          </div>

          {!isCustomFeat ? (
            // 预设专长选择器
            <div>
              <div style={{ marginBottom: '12px' }}>
                <Text strong>选择专长：</Text>
                <AutoComplete
                  style={{ width: '100%', marginTop: '4px' }}
                  placeholder="搜索或选择专长"
                  value={featSearchText}
                  onChange={setFeatSearchText}
                  onSelect={(value) => {
                    setSelectedPresetFeat(value);
                    const selectedFeat = featData.generalFeats.find(f => f.id === value);
                    if (selectedFeat) {
                      setFeatSearchText(selectedFeat.name);
                    }
                  }}
                  options={featData.generalFeats
                    .filter(feat => 
                      feat.name.toLowerCase().includes(featSearchText.toLowerCase()) ||
                      feat.englishName?.toLowerCase().includes(featSearchText.toLowerCase())
                    )
                    .map(feat => ({
                      value: feat.id,
                      label: (
                        <div>
                          <div style={{ fontWeight: 'bold' }}>
                            {feat.name} ({feat.englishName})
                          </div>
                          <div style={{ fontSize: '12px', color: '#666' }}>
                            {feat.level}级 - {feat.prerequisites || '无前置条件'}
                          </div>
                        </div>
                      )
                    }))
                  }
                  filterOption={false}
                />
              </div>
              
              {selectedPresetFeat && (
                <div style={{ 
                  padding: '12px', 
                  backgroundColor: '#f0f2f5', 
                  borderRadius: '6px',
                  marginBottom: '12px'
                }}>
                  {(() => {
                    const feat = featData.generalFeats.find(f => f.id === selectedPresetFeat);
                    return feat ? (
                      <div>
                        <div style={{ fontWeight: 'bold', marginBottom: '8px' }}>
                          {feat.name} ({feat.englishName})
                        </div>
                        <div style={{ marginBottom: '4px' }}>
                          <Text strong>等级：</Text> {feat.level}
                        </div>
                        {feat.prerequisites && (
                          <div style={{ marginBottom: '4px' }}>
                            <Text strong>前置条件：</Text> {feat.prerequisites}
                          </div>
                        )}
                        <div style={{ marginBottom: '4px' }}>
                          <Text strong>描述：</Text> {feat.description}
                        </div>
                        {feat.action && (
                          <div>
                            <Text strong>动作：</Text> {feat.action}
                          </div>
                        )}
                      </div>
                    ) : null;
                  })()}
                </div>
              )}
            </div>
          ) : (
            // 自定义专长输入
            <div>
              <Row gutter={16} style={{ marginBottom: '12px' }}>
                <Col span={12}>
                  <Text strong>专长名称：</Text>
                  <Input
                    placeholder="请输入专长名称"
                    value={newFeat.name}
                    onChange={(e) => setNewFeat({ ...newFeat, name: e.target.value })}
                    style={{ marginTop: '4px' }}
                  />
                </Col>
                <Col span={12}>
                  <Text strong>专长类型：</Text>
                  <Select
                    value={newFeat.type}
                    onChange={(value) => setNewFeat({ ...newFeat, type: value })}
                    style={{ width: '100%', marginTop: '4px' }}
                  >
                    <Option value="ancestry">族裔专长</Option>
                    <Option value="class">职业专长</Option>
                    <Option value="general">通用专长</Option>
                    <Option value="skill">技能专长</Option>
                    <Option value="archetype">原型专长</Option>
                  </Select>
                </Col>
              </Row>
              
              <Row gutter={16} style={{ marginBottom: '12px' }}>
                <Col span={12}>
                  <Text strong>获得等级：</Text>
                  <InputNumber
                    min={1}
                    max={20}
                    value={newFeat.level}
                    onChange={(value) => setNewFeat({ ...newFeat, level: value || 1 })}
                    style={{ width: '100%', marginTop: '4px' }}
                  />
                </Col>
                <Col span={12}>
                  <Text strong>前置条件：</Text>
                  <Input
                    placeholder="如：力量 14，战士"
                    value={newFeat.prerequisites}
                    onChange={(e) => setNewFeat({ ...newFeat, prerequisites: e.target.value })}
                    style={{ marginTop: '4px' }}
                  />
                </Col>
              </Row>
              
              <div style={{ marginBottom: '12px' }}>
                <Text strong>专长描述：</Text>
                <Input.TextArea
                  rows={4}
                  placeholder="请输入专长的详细描述和效果"
                  value={newFeat.description}
                  onChange={(e) => setNewFeat({ ...newFeat, description: e.target.value })}
                  style={{ marginTop: '4px' }}
                />
              </div>
            </div>
          )}
          
          <div style={{ fontSize: '12px', color: '#666' }}>
            💡 提示：推荐优先使用预设专长，这些专长来自PF2E官方规则。自定义专长适用于特殊规则或房规。
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default SimpleCharacterSheet;
