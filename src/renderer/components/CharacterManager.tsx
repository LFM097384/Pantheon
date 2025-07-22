import React, { useState, useEffect } from 'react';
import {
  Card,
  Button,
  Table,
  Modal,
  Form,
  Input,
  Select,
  message,
  Popconfirm,
  Upload,
  Space,
  Tag,
  Typography,
  Row,
  Col,
  Statistic,
  Empty,
  Tooltip
} from 'antd';
import {
  PlusOutlined,
  DeleteOutlined,
  CopyOutlined,
  DownloadOutlined,
  UploadOutlined,
  UserOutlined,
  PlayCircleOutlined,
  FileTextOutlined,
  ArrowLeftOutlined
} from '@ant-design/icons';
import SimpleCharacterSheet from './SimpleCharacterSheet';

const { Option } = Select;
const { Title, Text } = Typography;
const { Dragger } = Upload;

// 简化的角色数据接口
interface SimpleCharacterData {
  id: string;
  name: string;
  level: number;
  ancestry: string;
  class: string;
  ruleSystem: string;
  createdAt: string;
  updatedAt: string;
  stats: {
    strength: number;
    dexterity: number;
    constitution: number;
    intelligence: number;
    wisdom: number;
    charisma: number;
    hitPoints: number;
    maxHitPoints: number;
    armorClass: number;
  };
  // 护甲熟练度
  unarmoredProficiency?: number;
  lightArmorProficiency?: number;
  mediumArmorProficiency?: number;
  heavyArmorProficiency?: number;
  // 盾牌
  shieldAC?: number;
  shieldHardness?: number;
  shieldMaxHP?: number;
  shieldCurrentHP?: number;
  shieldBT?: number;
  // 技能熟练度
  acrobaticsProficiency?: number;
  arcanaProficiency?: number;
  athleticsProficiency?: number;
  craftingProficiency?: number;
  deceptionProficiency?: number;
  diplomacyProficiency?: number;
  intimidationProficiency?: number;
  medicineProficiency?: number;
  natureProficiency?: number;
  occultismProficiency?: number;
  performanceProficiency?: number;
  religionProficiency?: number;
  societyProficiency?: number;
  stealthProficiency?: number;
  survivalProficiency?: number;
  thieveryProficiency?: number;
  customSkillsProficiency?: number[];
  customSkillsNames?: string[];
  customSkillsAttributes?: string[];
  // 豁免检定熟练度
  fortitudeProficiency?: number;
  reflexProficiency?: number;
  willProficiency?: number;
  // 基础数据默认值
  speed?: number;                // 默认速度
  perceptionProficiency?: number; // 察觉默认未受训
  perceptionItem?: number;        // 察觉物品加值默认为0
  // 扩展生命值数据
  temporaryHitPoints?: number;
  dyingValue?: number;
  // 抗性和免疫
  resistances?: string;
  immunities?: string;
  conditions?: string;
}

const CharacterManager: React.FC = () => {
  const [characters, setCharacters] = useState<SimpleCharacterData[]>([]);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showImportModal, setShowImportModal] = useState(false);
  const [createForm] = Form.useForm();
  const [editingCharacterId, setEditingCharacterId] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<'list' | 'edit'>('list');

  // 从本地存储加载角色列表
  const loadCharacters = () => {
    console.log('加载角色列表...');
    try {
      const keys = Object.keys(localStorage).filter(key => key.startsWith('pf_character_'));
      const characterList: SimpleCharacterData[] = [];

      keys.forEach(key => {
        try {
          const data = JSON.parse(localStorage.getItem(key) || '{}');
          if (data.name) {
            characterList.push({
              id: data.id || key.replace('pf_character_', ''),
              name: data.name,
              level: data.level || 1,
              ancestry: data.ancestry || 'human',
              class: data.class || 'fighter',
              ruleSystem: 'pathfinder',
              createdAt: data.createdAt || new Date().toISOString(),
              updatedAt: data.updatedAt || new Date().toISOString(),
              stats: {
                strength: data.strength || 10,
                dexterity: data.dexterity || 10,
                constitution: data.constitution || 10,
                intelligence: data.intelligence || 10,
                wisdom: data.wisdom || 10,
                charisma: data.charisma || 10,
                hitPoints: data.hitPoints || 8,
                maxHitPoints: data.maxHitPoints || 8,
                armorClass: data.armorClass || 10
              },
              // 护甲熟练度默认值
              unarmoredProficiency: data.unarmoredProficiency || 2,
              lightArmorProficiency: data.lightArmorProficiency || 2,
              mediumArmorProficiency: data.mediumArmorProficiency || 2,
              heavyArmorProficiency: data.heavyArmorProficiency || 2,
              // 盾牌默认值
              shieldAC: data.shieldAC || 0,
              shieldHardness: data.shieldHardness || 0,
              shieldMaxHP: data.shieldMaxHP || 0,
              shieldCurrentHP: data.shieldCurrentHP || 0,
              shieldBT: data.shieldBT || 0
            });
          }
        } catch (error) {
          console.error(`解析角色数据失败: ${key}`, error);
        }
      });

      // 按创建时间排序
      characterList.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
      setCharacters(characterList);
    } catch (error) {
      console.error('加载角色列表失败:', error);
      message.error('加载角色列表失败');
    }
  };

  // 页面加载时获取角色列表
  useEffect(() => {
    loadCharacters();
  }, []);

  // 创建新角色
  const handleCreateCharacter = (values: any) => {
    try {
      const newCharacter: SimpleCharacterData = {
        id: `char_${Date.now()}`,
        name: values.name,
        level: 1,
        ancestry: values.ancestry,
        class: values.class,
        ruleSystem: 'pathfinder',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        stats: {
          strength: 10,
          dexterity: 10,
          constitution: 10,
          intelligence: 10,
          wisdom: 10,
          charisma: 10,
          hitPoints: 8,
          maxHitPoints: 8,
          armorClass: 10
        },
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
        // 基础数据默认值
        speed: 25,                // 默认速度
        perceptionProficiency: 0, // 察觉默认未受训
        perceptionItem: 0,        // 察觉物品加值默认为0
        // 扩展生命值数据
        temporaryHitPoints: 0,
        dyingValue: 0,
        // 抗性和免疫
        resistances: '',
        immunities: '',
        conditions: ''
      };

      // 保存到本地存储
      const storageKey = `pf_character_${newCharacter.id}`;
      localStorage.setItem(storageKey, JSON.stringify(newCharacter));
      
      setShowCreateModal(false);
      createForm.resetFields();
      loadCharacters();
      message.success('角色创建成功');
    } catch (error) {
      console.error('创建角色失败:', error);
      message.error('创建角色失败');
    }
  };

  // 删除角色
  const handleDeleteCharacter = (characterId: string) => {
    try {
      const storageKey = `pf_character_${characterId}`;
      localStorage.removeItem(storageKey);
      loadCharacters();
      message.success('角色删除成功');
    } catch (error) {
      console.error('删除角色失败:', error);
      message.error('删除角色失败');
    }
  };

  // 复制角色
  const handleCloneCharacter = (character: SimpleCharacterData) => {
    try {
      const clonedCharacter: SimpleCharacterData = {
        ...character,
        id: `char_${Date.now()}`,
        name: `${character.name} (副本)`,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };

      const storageKey = `pf_character_${clonedCharacter.id}`;
      localStorage.setItem(storageKey, JSON.stringify(clonedCharacter));
      
      loadCharacters();
      message.success('角色复制成功');
    } catch (error) {
      console.error('复制角色失败:', error);
      message.error('复制角色失败');
    }
  };

  // 编辑角色（在当前页面嵌入角色卡）
  const handleEditCharacter = (characterId: string) => {
    setEditingCharacterId(characterId);
    setViewMode('edit');
  };

  // 返回角色列表
  const handleBackToList = () => {
    setEditingCharacterId(null);
    setViewMode('list');
    // 重新加载角色列表以获取最新数据
    loadCharacters();
  };

  // 导出单个角色
  const handleExportCharacter = (character: SimpleCharacterData) => {
    try {
      const exportData = {
        formatVersion: '1.0',
        exportedAt: new Date().toISOString(),
        character: character
      };

      const dataStr = JSON.stringify(exportData, null, 2);
      const blob = new Blob([dataStr], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      
      const link = document.createElement('a');
      link.href = url;
      link.download = `${character.name}_${character.id}.json`;
      link.click();
      
      URL.revokeObjectURL(url);
      message.success('角色导出成功');
    } catch (error) {
      console.error('导出角色失败:', error);
      message.error('导出角色失败');
    }
  };

  // 导出所有角色
  const handleExportAll = () => {
    try {
      const exportData = {
        formatVersion: '1.0',
        exportedAt: new Date().toISOString(),
        characters: characters
      };

      const dataStr = JSON.stringify(exportData, null, 2);
      const blob = new Blob([dataStr], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      
      const link = document.createElement('a');
      link.href = url;
      link.download = `all_characters_${new Date().toISOString().split('T')[0]}.json`;
      link.click();
      
      URL.revokeObjectURL(url);
      message.success('所有角色导出成功');
    } catch (error) {
      console.error('导出失败:', error);
      message.error('导出失败');
    }
  };

  // 导入角色
  const handleImport = (file: File) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const content = e.target?.result as string;
        const importData = JSON.parse(content);

        if (importData.character) {
          // 单个角色导入
          const character = importData.character;
          const newId = `char_${Date.now()}`;
          const importedCharacter: SimpleCharacterData = {
            ...character,
            id: newId,
            name: `${character.name} (导入)`,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
          };

          const storageKey = `pf_character_${newId}`;
          localStorage.setItem(storageKey, JSON.stringify(importedCharacter));
          
          loadCharacters();
          message.success('角色导入成功');
        } else if (importData.characters && Array.isArray(importData.characters)) {
          // 多个角色导入
          importData.characters.forEach((character: SimpleCharacterData, index: number) => {
            const newId = `char_${Date.now()}_${index}`;
            const importedCharacter: SimpleCharacterData = {
              ...character,
              id: newId,
              name: `${character.name} (导入)`,
              createdAt: new Date().toISOString(),
              updatedAt: new Date().toISOString()
            };

            const storageKey = `pf_character_${newId}`;
            localStorage.setItem(storageKey, JSON.stringify(importedCharacter));
          });

          loadCharacters();
          message.success(`成功导入 ${importData.characters.length} 个角色`);
        } else {
          message.error('不支持的文件格式');
        }

        setShowImportModal(false);
      } catch (error) {
        console.error('导入失败:', error);
        message.error('文件格式错误，导入失败');
      }
    };
    reader.readAsText(file);
    return false;
  };

  // 获取族裔和职业的显示名称
  const getAncestryName = (ancestry: string) => {
    const names: Record<string, string> = {
      human: '人类',
      elf: '精灵',
      dwarf: '矮人',
      halfling: '半身人',
      gnome: '侏儒'
    };
    return names[ancestry] || ancestry;
  };

  const getClassName = (className: string) => {
    const names: Record<string, string> = {
      fighter: '战士',
      wizard: '法师',
      rogue: '游荡者',
      cleric: '牧师'
    };
    return names[className] || className;
  };

  // 表格列定义
  const columns = [
    {
      title: '角色名称',
      dataIndex: 'name',
      key: 'name',
      render: (name: string) => (
        <Space>
          <UserOutlined style={{ color: '#1890ff' }} />
          <Text strong>{name}</Text>
        </Space>
      ),
    },
    {
      title: '等级',
      dataIndex: 'level',
      key: 'level',
      width: 80,
      render: (level: number) => (
        <Tag color="green">{level}级</Tag>
      ),
    },
    {
      title: '族裔',
      dataIndex: 'ancestry',
      key: 'ancestry',
      render: (ancestry: string) => getAncestryName(ancestry),
    },
    {
      title: '职业',
      dataIndex: 'class',
      key: 'class',
      render: (className: string) => (
        <Tag color="blue">{getClassName(className)}</Tag>
      ),
    },
    {
      title: '生命值',
      key: 'hitPoints',
      render: (record: SimpleCharacterData) => (
        <span>{record.stats.hitPoints}/{record.stats.maxHitPoints}</span>
      ),
    },
    {
      title: 'AC',
      key: 'armorClass',
      render: (record: SimpleCharacterData) => record.stats.armorClass,
    },
    {
      title: '最后修改',
      dataIndex: 'updatedAt',
      key: 'updatedAt',
      render: (date: string) => new Date(date).toLocaleDateString(),
    },
    {
      title: '操作',
      key: 'actions',
      width: 200,
      render: (record: SimpleCharacterData) => (
        <Space size="small">
          <Tooltip title="编辑角色">
            <Button
              type="primary"
              icon={<PlayCircleOutlined />}
              size="small"
              onClick={() => handleEditCharacter(record.id)}
            >
              编辑
            </Button>
          </Tooltip>
          <Tooltip title="复制角色">
            <Button
              icon={<CopyOutlined />}
              size="small"
              onClick={() => handleCloneCharacter(record)}
            />
          </Tooltip>
          <Tooltip title="导出角色">
            <Button
              icon={<DownloadOutlined />}
              size="small"
              onClick={() => handleExportCharacter(record)}
            />
          </Tooltip>
          <Popconfirm
            title="确定删除这个角色吗？"
            onConfirm={() => handleDeleteCharacter(record.id)}
            okText="确定"
            cancelText="取消"
          >
            <Tooltip title="删除角色">
              <Button
                danger
                icon={<DeleteOutlined />}
                size="small"
              />
            </Tooltip>
          </Popconfirm>
        </Space>
      ),
    },
  ];

  return (
    <div style={{ padding: '24px' }}>
      {viewMode === 'edit' && editingCharacterId ? (
        // 角色卡编辑视图
        <Card>
          <div style={{ marginBottom: '16px' }}>
            <Button
              icon={<ArrowLeftOutlined />}
              onClick={handleBackToList}
              type="link"
              style={{ paddingLeft: 0 }}
            >
              返回角色列表
            </Button>
          </div>
          <SimpleCharacterSheet characterId={editingCharacterId} />
        </Card>
      ) : (
        // 角色列表视图
        <Card>
          <div style={{ marginBottom: '24px' }}>
            <Row justify="space-between" align="middle">
              <Col>
                <Title level={2} style={{ margin: 0 }}>
                  <UserOutlined style={{ marginRight: '8px' }} />
                  角色管理
                </Title>
                <Text type="secondary">
                  当前共 {characters.length} 个角色
                </Text>
              </Col>
              <Col>
                <Space>
                  {/* 测试按钮 - 仅用于开发 */}
                  <Button
                    type="dashed"
                    onClick={() => {
                      const testCharacter: SimpleCharacterData = {
                        id: `test_${Date.now()}`,
                        name: '测试角色',
                        level: 1,
                        ancestry: 'human',
                        class: 'fighter',
                        ruleSystem: 'pathfinder',
                        createdAt: new Date().toISOString(),
                        updatedAt: new Date().toISOString(),
                        stats: {
                          strength: 10,
                          dexterity: 10,
                          constitution: 10,
                          intelligence: 10,
                          wisdom: 10,
                          charisma: 10,
                          hitPoints: 8,
                          maxHitPoints: 8,
                          armorClass: 10
                        },
                        customSkillsNames: [],
                        customSkillsAttributes: [],
                        customSkillsProficiency: []
                      };
                      
                      const newCharacters = [...characters, testCharacter];
                      setCharacters(newCharacters);
                      localStorage.setItem('characters', JSON.stringify(newCharacters));
                      message.success('测试角色已创建');
                    }}
                  >
                    创建测试角色
                  </Button>
                  <Button
                    type="primary"
                    icon={<PlusOutlined />}
                    onClick={() => setShowCreateModal(true)}
                  >
                    创建角色
                  </Button>
                </Space>
              </Col>
            </Row>
          </div>

          {/* 统计信息 */}
          <Row gutter={16} style={{ marginBottom: '24px' }}>
            <Col span={6}>
              <Statistic
                title="总角色数"
                value={characters.length}
                prefix={<UserOutlined />}
              />
            </Col>
            <Col span={6}>
              <Statistic
                title="平均等级"
                value={characters.length > 0 ? 
                  (characters.reduce((sum, char) => sum + char.level, 0) / characters.length).toFixed(1) : 
                  0
                }
              />
            </Col>
            <Col span={6}>
              <Statistic
                title="最高等级"
                value={characters.length > 0 ? Math.max(...characters.map(char => char.level)) : 0}
              />
            </Col>
            <Col span={6}>
              <Statistic
                title="存储占用"
                value={`${Math.round(JSON.stringify(characters).length / 1024)}KB`}
                prefix={<FileTextOutlined />}
              />
            </Col>
          </Row>

          {/* 角色列表 */}
          <Table
            columns={columns}
            dataSource={characters}
            rowKey="id"
            locale={{
              emptyText: (
                <Empty
                  description="还没有创建任何角色"
                  image={Empty.PRESENTED_IMAGE_SIMPLE}
                >
                  <Button
                    type="primary"
                    icon={<PlusOutlined />}
                    onClick={() => setShowCreateModal(true)}
                  >
                    创建第一个角色
                  </Button>
                </Empty>
              )
            }}
            pagination={{
              pageSize: 10,
              showSizeChanger: true,
              showQuickJumper: true,
              showTotal: (total) => `共 ${total} 个角色`
            }}
          />
        </Card>
      )}

      {/* 创建角色模态框 */}
      <Modal
        title="创建新角色"
        open={showCreateModal}
        onCancel={() => {
          setShowCreateModal(false);
          createForm.resetFields();
        }}
        onOk={() => createForm.submit()}
        okText="创建"
        cancelText="取消"
      >
        <Form
          form={createForm}
          layout="vertical"
          onFinish={handleCreateCharacter}
        >
          <Form.Item
            name="name"
            label="角色名称"
            rules={[{ required: true, message: '请输入角色名称' }]}
          >
            <Input placeholder="请输入角色名称" />
          </Form.Item>

          <Form.Item
            name="ancestry"
            label="族裔"
            rules={[{ required: true, message: '请选择族裔' }]}
            initialValue="human"
          >
            <Select placeholder="请选择族裔">
              <Option value="human">人类</Option>
              <Option value="elf">精灵</Option>
              <Option value="dwarf">矮人</Option>
              <Option value="halfling">半身人</Option>
              <Option value="gnome">侏儒</Option>
            </Select>
          </Form.Item>

          <Form.Item
            name="class"
            label="职业"
            rules={[{ required: true, message: '请选择职业' }]}
            initialValue="fighter"
          >
            <Select placeholder="请选择职业">
              <Option value="fighter">战士</Option>
              <Option value="wizard">法师</Option>
              <Option value="rogue">游荡者</Option>
              <Option value="cleric">牧师</Option>
            </Select>
          </Form.Item>
        </Form>
      </Modal>

      {/* 导入角色模态框 */}
      <Modal
        title="导入角色"
        open={showImportModal}
        onCancel={() => setShowImportModal(false)}
        footer={null}
      >
        <Dragger
          accept=".json"
          multiple={false}
          beforeUpload={handleImport}
          showUploadList={false}
        >
          <p className="ant-upload-drag-icon">
            <UploadOutlined style={{ fontSize: '48px', color: '#1890ff' }} />
          </p>
          <p className="ant-upload-text">点击或拖拽文件到此区域上传</p>
          <p className="ant-upload-hint">
            支持单个角色文件或包含多个角色的文件<br />
            文件格式：JSON (.json)
          </p>
        </Dragger>
      </Modal>
    </div>
  );
};

export default CharacterManager;
