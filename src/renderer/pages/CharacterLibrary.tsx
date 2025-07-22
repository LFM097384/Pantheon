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
  Statistic
} from 'antd';
import {
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
  CopyOutlined,
  DownloadOutlined,
  UploadOutlined,
  FileTextOutlined,
  UserOutlined
} from '@ant-design/icons';
import { CharacterData } from '../../types/ruleSystem';
import { characterDataManager } from '../../utils/CharacterDataManager';
import { ruleSystemManager } from '../../utils/RuleSystemManager';
import CharacterSheetManager from '../components/CharacterSheetManager';

const { Option } = Select;
const { Title, Text } = Typography;

interface CharacterLibraryProps {
  playerId: string;
}

export const CharacterLibrary: React.FC<CharacterLibraryProps> = ({ playerId }) => {
  const [characters, setCharacters] = useState<CharacterData[]>([]);
  const [availableRuleSystems, setAvailableRuleSystems] = useState<string[]>([]);
  const [selectedCharacter, setSelectedCharacter] = useState<CharacterData | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showImportModal, setShowImportModal] = useState(false);
  const [loading, setLoading] = useState(true);
  const [createForm] = Form.useForm();

  // 加载数据
  useEffect(() => {
    loadCharacters();
    loadAvailableRuleSystems();
  }, [playerId]);

  const loadCharacters = () => {
    try {
      const allCharacters = characterDataManager.getCharactersByPlayer(playerId);
      setCharacters(allCharacters);
    } catch (error) {
      console.error('加载角色失败:', error);
      message.error('加载角色失败');
    } finally {
      setLoading(false);
    }
  };

  const loadAvailableRuleSystems = async () => {
    try {
      // 这里应该从配置或API获取可用的规则系统
      // 目前我们只有 pathfinder
      const systems = ['pathfinder'];
      setAvailableRuleSystems(systems);
    } catch (error) {
      console.error('加载规则系统失败:', error);
    }
  };

  // 创建新角色
  const handleCreateCharacter = async (values: any) => {
    try {
      await ruleSystemManager.setCurrentRuleSystem(values.ruleSystemId);
      const ruleConfig = ruleSystemManager.getCurrentRuleSystem();
      
      if (!ruleConfig) {
        throw new Error('无法加载规则系统');
      }

      const { RuleEngine } = await import('../../utils/RuleEngine');
      const ruleEngine = new RuleEngine(ruleConfig);
      
      const newCharacter = ruleEngine.createCharacter(playerId, values.name);
      
      // 设置基本信息
      if (values.characterClass) {
        newCharacter.attributes.characterClass = values.characterClass;
      }
      if (values.race) {
        newCharacter.attributes.race = values.race;
      }
      
      characterDataManager.saveCharacter(newCharacter);
      
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
      characterDataManager.deleteCharacter(characterId);
      loadCharacters();
      message.success('角色删除成功');
    } catch (error) {
      console.error('删除角色失败:', error);
      message.error('删除角色失败');
    }
  };

  // 复制角色
  const handleCloneCharacter = (characterId: string) => {
    try {
      const cloned = characterDataManager.cloneCharacter(characterId);
      if (cloned) {
        loadCharacters();
        message.success('角色复制成功');
      } else {
        message.error('角色复制失败');
      }
    } catch (error) {
      console.error('复制角色失败:', error);
      message.error('复制角色失败');
    }
  };

  // 导出角色
  const handleExportCharacter = (characterId: string) => {
    try {
      const exportData = characterDataManager.exportCharacter(characterId);
      if (exportData) {
        const character = characterDataManager.loadCharacter(characterId);
        const fileName = `${character?.name || 'character'}_${characterId}.json`;
        
        const blob = new Blob([exportData], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = fileName;
        link.click();
        URL.revokeObjectURL(url);
        
        message.success('角色导出成功');
      }
    } catch (error) {
      console.error('导出角色失败:', error);
      message.error('导出角色失败');
    }
  };

  // 导出所有角色
  const handleExportAll = () => {
    try {
      const exportData = characterDataManager.exportAllCharacters();
      const fileName = `all_characters_${new Date().toISOString().split('T')[0]}.json`;
      
      const blob = new Blob([exportData], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = fileName;
      link.click();
      URL.revokeObjectURL(url);
      
      message.success('所有角色导出成功');
    } catch (error) {
      console.error('导出失败:', error);
      message.error('导出失败');
    }
  };

  // 导入角色
  const handleImportCharacter = (file: File) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const content = e.target?.result as string;
        const imported = characterDataManager.importCharacter(content);
        
        if (imported) {
          loadCharacters();
          message.success('角色导入成功');
        } else {
          message.error('角色导入失败');
        }
      } catch (error) {
        console.error('导入失败:', error);
        message.error('导入失败');
      }
    };
    reader.readAsText(file);
    return false; // 阻止自动上传
  };

  // 获取规则系统显示名称
  const getRuleSystemDisplayName = (ruleSystemId: string) => {
    const names: Record<string, string> = {
      pathfinder: 'Pathfinder RPG'
    };
    return names[ruleSystemId] || ruleSystemId;
  };

  // 获取存储统计信息
  const getStorageStats = () => {
    return characterDataManager.getStorageStats();
  };

  const storageStats = getStorageStats();

  const columns = [
    {
      title: '角色名称',
      dataIndex: 'name',
      key: 'name',
      render: (name: string, record: CharacterData) => (
        <Space>
          <UserOutlined />
          <span>{name}</span>
        </Space>
      ),
    },
    {
      title: '规则系统',
      dataIndex: 'ruleSystemId',
      key: 'ruleSystemId',
      render: (ruleSystemId: string) => (
        <Tag color="blue">{getRuleSystemDisplayName(ruleSystemId)}</Tag>
      ),
    },
    {
      title: '职业',
      key: 'characterClass',
      render: (record: CharacterData) => (
        <span>{record.attributes.characterClass || '-'}</span>
      ),
    },
    {
      title: '种族',
      key: 'race',
      render: (record: CharacterData) => (
        <span>{record.attributes.race || '-'}</span>
      ),
    },
    {
      title: '等级',
      key: 'level',
      render: (record: CharacterData) => (
        <span>{record.attributes.level || 1}</span>
      ),
    },
    {
      title: '最后修改',
      dataIndex: 'updatedAt',
      key: 'updatedAt',
      render: (updatedAt: string) => (
        <span>{new Date(updatedAt).toLocaleString()}</span>
      ),
    },
    {
      title: '操作',
      key: 'actions',
      render: (record: CharacterData) => (
        <Space>
          <Button
            type="primary"
            size="small"
            icon={<EditOutlined />}
            onClick={() => setSelectedCharacter(record)}
          >
            编辑
          </Button>
          <Button
            size="small"
            icon={<CopyOutlined />}
            onClick={() => handleCloneCharacter(record.id)}
          >
            复制
          </Button>
          <Button
            size="small"
            icon={<DownloadOutlined />}
            onClick={() => handleExportCharacter(record.id)}
          >
            导出
          </Button>
          <Popconfirm
            title="确定要删除这个角色吗？"
            onConfirm={() => handleDeleteCharacter(record.id)}
            okText="确定"
            cancelText="取消"
          >
            <Button
              size="small"
              danger
              icon={<DeleteOutlined />}
            >
              删除
            </Button>
          </Popconfirm>
        </Space>
      ),
    },
  ];

  if (selectedCharacter) {
    return (
      <div>
        <Button
          style={{ marginBottom: 16 }}
          onClick={() => setSelectedCharacter(null)}
        >
          ← 返回角色库
        </Button>
        <CharacterSheetManager
          characterId={selectedCharacter.id}
          ruleSystemId={selectedCharacter.ruleSystemId}
          onSave={(character) => {
            characterDataManager.saveCharacter(character);
            message.success('角色已保存');
          }}
          onLoad={(characterId) => characterDataManager.loadCharacter(characterId)}
        />
      </div>
    );
  }

  return (
    <div style={{ padding: '24px' }}>
      <Card>
        <div style={{ marginBottom: '24px' }}>
          <Title level={2}>
            <FileTextOutlined style={{ marginRight: '8px' }} />
            角色库
          </Title>
          <Text type="secondary">管理你的角色卡，支持多种规则系统</Text>
        </div>

        {/* 统计信息 */}
        <Row gutter={16} style={{ marginBottom: '24px' }}>
          <Col span={6}>
            <Card size="small">
              <Statistic title="总角色数" value={storageStats.totalCharacters} />
            </Card>
          </Col>
          <Col span={6}>
            <Card size="small">
              <Statistic
                title="Pathfinder 角色"
                value={storageStats.ruleSystemBreakdown.pathfinder || 0}
              />
            </Card>
          </Col>
          <Col span={12}>
            <Card size="small">
              <Statistic
                title="最后修改"
                value={storageStats.lastModified ? new Date(storageStats.lastModified).toLocaleString() : '无'}
              />
            </Card>
          </Col>
        </Row>

        {/* 操作按钮 */}
        <div style={{ marginBottom: '16px' }}>
          <Space>
            <Button
              type="primary"
              icon={<PlusOutlined />}
              onClick={() => setShowCreateModal(true)}
            >
              创建新角色
            </Button>
            <Button
              icon={<UploadOutlined />}
              onClick={() => setShowImportModal(true)}
            >
              导入角色
            </Button>
            <Button
              icon={<DownloadOutlined />}
              onClick={handleExportAll}
              disabled={characters.length === 0}
            >
              导出所有角色
            </Button>
          </Space>
        </div>

        {/* 角色列表 */}
        <Table
          columns={columns}
          dataSource={characters}
          rowKey="id"
          loading={loading}
          pagination={{
            pageSize: 10,
            showSizeChanger: true,
            showQuickJumper: true,
            showTotal: (total) => `共 ${total} 个角色`,
          }}
          locale={{
            emptyText: '暂无角色，点击"创建新角色"开始吧！'
          }}
        />
      </Card>

      {/* 创建角色模态框 */}
      <Modal
        title="创建新角色"
        open={showCreateModal}
        onOk={() => createForm.submit()}
        onCancel={() => {
          setShowCreateModal(false);
          createForm.resetFields();
        }}
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
            <Input placeholder="输入角色名称" />
          </Form.Item>

          <Form.Item
            name="ruleSystemId"
            label="规则系统"
            rules={[{ required: true, message: '请选择规则系统' }]}
          >
            <Select placeholder="选择规则系统">
              {availableRuleSystems.map(system => (
                <Option key={system} value={system}>
                  {getRuleSystemDisplayName(system)}
                </Option>
              ))}
            </Select>
          </Form.Item>

          <Row gutter={16}>
            <Col span={12}>
              <Form.Item name="characterClass" label="职业">
                <Input placeholder="例如：战士、法师" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="race" label="种族">
                <Input placeholder="例如：人类、精灵" />
              </Form.Item>
            </Col>
          </Row>
        </Form>
      </Modal>

      {/* 导入角色模态框 */}
      <Modal
        title="导入角色"
        open={showImportModal}
        onCancel={() => setShowImportModal(false)}
        footer={null}
      >
        <Upload.Dragger
          accept=".json"
          beforeUpload={handleImportCharacter}
          showUploadList={false}
        >
          <p className="ant-upload-drag-icon">
            <UploadOutlined />
          </p>
          <p className="ant-upload-text">点击或拖拽 JSON 文件到此区域上传</p>
          <p className="ant-upload-hint">
            支持单个角色文件或批量导出文件
          </p>
        </Upload.Dragger>
      </Modal>
    </div>
  );
};

export default CharacterLibrary;
