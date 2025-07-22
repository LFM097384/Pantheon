import React, { useState, useEffect } from 'react';
import { Card, Select, Button, Space, Typography, Row, Col, Spin, message } from 'antd';
import { UserOutlined, SettingOutlined, BookOutlined, PlusOutlined } from '@ant-design/icons';
import CharacterLibrary from './CharacterLibrary';
import { ruleSystemManager } from '../../utils/RuleSystemManager';
import { RuleSystemConfig } from '../../types/ruleSystem';

const { Title, Text } = Typography;
const { Option } = Select;

interface CharacterSheetProps {
  playerId?: string;
}

const CharacterSheet: React.FC<CharacterSheetProps> = ({ 
  playerId = 'player1' // 默认玩家ID，实际应从用户上下文获取
}) => {
  const [currentRuleSystem, setCurrentRuleSystem] = useState<RuleSystemConfig | null>(null);
  const [availableRuleSystems, setAvailableRuleSystems] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeView, setActiveView] = useState<'overview' | 'library'>('overview');

  useEffect(() => {
    initializeRuleSystems();
  }, []);

  const initializeRuleSystems = async () => {
    try {
      setLoading(true);
      
      // 加载可用规则系统
      const systems = await loadAvailableRuleSystems();
      setAvailableRuleSystems(systems);
      
      // 默认加载第一个规则系统
      if (systems.length > 0) {
        await handleRuleSystemChange(systems[0]);
      }
    } catch (error) {
      console.error('初始化规则系统失败:', error);
      message.error('初始化失败');
    } finally {
      setLoading(false);
    }
  };

  const loadAvailableRuleSystems = async (): Promise<string[]> => {
    // 这里应该从配置或API获取可用的规则系统
    // 目前我们只有 pathfinder，但为未来扩展预留接口
    return ['pathfinder'];
  };

  const handleRuleSystemChange = async (ruleSystemId: string) => {
    try {
      await ruleSystemManager.setCurrentRuleSystem(ruleSystemId);
      const ruleConfig = ruleSystemManager.getCurrentRuleSystem();
      setCurrentRuleSystem(ruleConfig);
    } catch (error) {
      console.error('切换规则系统失败:', error);
      message.error('切换规则系统失败');
    }
  };

  const getRuleSystemDisplayName = (ruleSystemId: string) => {
    const names: Record<string, string> = {
      pathfinder: 'Pathfinder RPG',
      dnd5e: 'D&D 5th Edition', // 为未来扩展预留
      coc: 'Call of Cthulhu',   // 为未来扩展预留
      wod: 'World of Darkness'  // 为未来扩展预留
    };
    return names[ruleSystemId] || ruleSystemId;
  };

  const getRuleSystemDescription = (ruleSystemId: string) => {
    const descriptions: Record<string, string> = {
      pathfinder: '经典的战术角色扮演游戏，注重复杂的角色构建和战术战斗',
      dnd5e: '最受欢迎的桌面角色扮演游戏，平衡了简单性和深度',
      coc: '克苏鲁神话背景的调查恐怖游戏，注重剧情和调查',
      wod: '现代奇幻背景的叙事驱动游戏，注重角色扮演和道德选择'
    };
    return descriptions[ruleSystemId] || '暂无描述';
  };

  if (loading) {
    return (
      <div style={{ textAlign: 'center', padding: '50px' }}>
        <Spin size="large" />
        <p>加载车卡系统...</p>
      </div>
    );
  }

  if (activeView === 'library') {
    return (
      <div>
        <Button
          style={{ marginBottom: 16 }}
          onClick={() => setActiveView('overview')}
        >
          ← 返回概览
        </Button>
        <CharacterLibrary playerId={playerId} />
      </div>
    );
  }

  return (
    <div style={{ padding: '24px' }}>
      {/* 页面标题和规则系统选择器 */}
      <Card style={{ marginBottom: '24px' }}>
        <Row align="middle" justify="space-between">
          <Col>
            <Title level={2} style={{ margin: 0 }}>
              <UserOutlined style={{ marginRight: '8px' }} />
              多规则车卡系统
            </Title>
            <Text type="secondary">创建和管理不同规则系统的角色卡</Text>
          </Col>
          <Col>
            <Space>
              <Text>当前规则系统:</Text>
              <Select
                style={{ width: 200 }}
                value={currentRuleSystem?.id}
                onChange={handleRuleSystemChange}
                loading={loading}
              >
                {availableRuleSystems.map(systemId => (
                  <Option key={systemId} value={systemId}>
                    {getRuleSystemDisplayName(systemId)}
                  </Option>
                ))}
              </Select>
            </Space>
          </Col>
        </Row>
      </Card>

      {/* 当前规则系统信息 */}
      {currentRuleSystem && (
        <Card style={{ marginBottom: '24px' }}>
          <Row gutter={24}>
            <Col span={16}>
              <Title level={3}>
                <BookOutlined style={{ marginRight: '8px' }} />
                {currentRuleSystem.name}
              </Title>
              <Text>{currentRuleSystem.description}</Text>
              <div style={{ marginTop: '16px' }}>
                <Text type="secondary">
                  版本: {currentRuleSystem.version} | 
                  作者: {currentRuleSystem.author}
                </Text>
              </div>
              <div style={{ marginTop: '16px' }}>
                <Text>
                  {getRuleSystemDescription(currentRuleSystem.id)}
                </Text>
              </div>
            </Col>
            <Col span={8}>
              <Card size="small" title="系统特性">
                <ul style={{ margin: 0, paddingLeft: '20px' }}>
                  <li>属性数量: {currentRuleSystem.characterSchema.attributes.length}</li>
                  <li>技能数量: {currentRuleSystem.characterSchema.skills.length}</li>
                  <li>计算规则: {currentRuleSystem.calculations.length}</li>
                  <li>验证规则: {currentRuleSystem.validations.length}</li>
                  {currentRuleSystem.characterSchema.spellSystem?.enabled && (
                    <li>支持法术系统</li>
                  )}
                </ul>
              </Card>
            </Col>
          </Row>
        </Card>
      )}

      {/* 快速操作 */}
      <Row gutter={16}>
        <Col span={12}>
          <Card
            hoverable
            style={{ textAlign: 'center', height: '200px', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}
            onClick={() => setActiveView('library')}
          >
            <UserOutlined style={{ fontSize: '48px', color: '#1890ff', marginBottom: '16px' }} />
            <Title level={4}>角色库</Title>
            <Text type="secondary">查看、编辑和管理你的所有角色</Text>
          </Card>
        </Col>
        <Col span={12}>
          <Card
            hoverable
            style={{ textAlign: 'center', height: '200px', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}
            onClick={() => setActiveView('library')}
          >
            <PlusOutlined style={{ fontSize: '48px', color: '#52c41a', marginBottom: '16px' }} />
            <Title level={4}>创建新角色</Title>
            <Text type="secondary">使用当前规则系统创建新的角色卡</Text>
          </Card>
        </Col>
      </Row>

      {/* 系统设置区域（为未来扩展预留） */}
      <Card style={{ marginTop: '24px' }} title={
        <span>
          <SettingOutlined style={{ marginRight: '8px' }} />
          系统设置
        </span>
      }>
        <Row gutter={16}>
          <Col span={8}>
            <Card size="small" title="规则系统管理">
              <Text type="secondary">
                管理已安装的规则系统，导入新的规则配置
              </Text>
              <div style={{ marginTop: '8px' }}>
                <Button size="small" disabled>
                  导入规则系统
                </Button>
              </div>
            </Card>
          </Col>
          <Col span={8}>
            <Card size="small" title="数据备份">
              <Text type="secondary">
                备份和恢复角色数据，确保数据安全
              </Text>
              <div style={{ marginTop: '8px' }}>
                <Button size="small" disabled>
                  数据备份
                </Button>
              </div>
            </Card>
          </Col>
          <Col span={8}>
            <Card size="small" title="扩展功能">
              <Text type="secondary">
                安装和管理车卡系统的扩展功能
              </Text>
              <div style={{ marginTop: '8px' }}>
                <Button size="small" disabled>
                  扩展管理
                </Button>
              </div>
            </Card>
          </Col>
        </Row>
      </Card>
    </div>
  );
};

export default CharacterSheet;
