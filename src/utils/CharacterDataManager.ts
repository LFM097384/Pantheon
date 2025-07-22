import { CharacterData } from '../types/ruleSystem';

/**
 * 角色数据存储管理器
 * 负责角色数据的本地存储、加载和同步
 */
export class CharacterDataManager {
  private static instance: CharacterDataManager;
  private characters: Map<string, CharacterData> = new Map();
  private readonly STORAGE_KEY = 'pantheon_characters';

  private constructor() {
    this.loadFromStorage();
  }

  public static getInstance(): CharacterDataManager {
    if (!CharacterDataManager.instance) {
      CharacterDataManager.instance = new CharacterDataManager();
    }
    return CharacterDataManager.instance;
  }

  /**
   * 保存角色数据
   */
  public saveCharacter(character: CharacterData): void {
    character.updatedAt = new Date().toISOString();
    this.characters.set(character.id, { ...character });
    this.saveToStorage();
  }

  /**
   * 加载角色数据
   */
  public loadCharacter(characterId: string): CharacterData | null {
    return this.characters.get(characterId) || null;
  }

  /**
   * 获取所有角色列表
   */
  public getAllCharacters(): CharacterData[] {
    return Array.from(this.characters.values());
  }

  /**
   * 根据玩家ID获取角色列表
   */
  public getCharactersByPlayer(playerId: string): CharacterData[] {
    return Array.from(this.characters.values()).filter(
      char => char.playerId === playerId
    );
  }

  /**
   * 根据规则系统获取角色列表
   */
  public getCharactersByRuleSystem(ruleSystemId: string): CharacterData[] {
    return Array.from(this.characters.values()).filter(
      char => char.ruleSystemId === ruleSystemId
    );
  }

  /**
   * 删除角色
   */
  public deleteCharacter(characterId: string): boolean {
    const deleted = this.characters.delete(characterId);
    if (deleted) {
      this.saveToStorage();
    }
    return deleted;
  }

  /**
   * 复制角色
   */
  public cloneCharacter(characterId: string, newName?: string): CharacterData | null {
    const original = this.characters.get(characterId);
    if (!original) return null;

    const cloned: CharacterData = {
      ...original,
      id: this.generateId(),
      name: newName || `${original.name} (副本)`,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    this.characters.set(cloned.id, cloned);
    this.saveToStorage();
    return cloned;
  }

  /**
   * 导出角色数据
   */
  public exportCharacter(characterId: string): string | null {
    const character = this.characters.get(characterId);
    if (!character) return null;

    return JSON.stringify(character, null, 2);
  }

  /**
   * 导入角色数据
   */
  public importCharacter(characterData: string): CharacterData | null {
    try {
      const character: CharacterData = JSON.parse(characterData);
      
      // 验证数据结构
      if (!this.validateCharacterData(character)) {
        throw new Error('无效的角色数据格式');
      }

      // 生成新ID避免冲突
      character.id = this.generateId();
      character.createdAt = new Date().toISOString();
      character.updatedAt = new Date().toISOString();

      this.characters.set(character.id, character);
      this.saveToStorage();
      
      return character;
    } catch (error) {
      console.error('导入角色失败:', error);
      return null;
    }
  }

  /**
   * 批量导出所有角色
   */
  public exportAllCharacters(): string {
    const allCharacters = Array.from(this.characters.values());
    return JSON.stringify({
      exportDate: new Date().toISOString(),
      version: '1.0',
      characters: allCharacters
    }, null, 2);
  }

  /**
   * 批量导入角色
   */
  public importAllCharacters(exportData: string): number {
    try {
      const data = JSON.parse(exportData);
      
      if (!data.characters || !Array.isArray(data.characters)) {
        throw new Error('无效的导出数据格式');
      }

      let importedCount = 0;
      
      for (const characterData of data.characters) {
        if (this.validateCharacterData(characterData)) {
          // 生成新ID避免冲突
          characterData.id = this.generateId();
          characterData.createdAt = new Date().toISOString();
          characterData.updatedAt = new Date().toISOString();
          
          this.characters.set(characterData.id, characterData);
          importedCount++;
        }
      }

      if (importedCount > 0) {
        this.saveToStorage();
      }

      return importedCount;
    } catch (error) {
      console.error('批量导入失败:', error);
      return 0;
    }
  }

  /**
   * 清空所有角色数据
   */
  public clearAllCharacters(): void {
    this.characters.clear();
    this.saveToStorage();
  }

  /**
   * 获取存储统计信息
   */
  public getStorageStats(): {
    totalCharacters: number;
    ruleSystemBreakdown: Record<string, number>;
    lastModified: string | null;
  } {
    const ruleSystemBreakdown: Record<string, number> = {};
    let lastModified: string | null = null;

    for (const character of this.characters.values()) {
      // 统计规则系统分布
      if (!ruleSystemBreakdown[character.ruleSystemId]) {
        ruleSystemBreakdown[character.ruleSystemId] = 0;
      }
      ruleSystemBreakdown[character.ruleSystemId]++;

      // 找到最后修改时间
      if (!lastModified || character.updatedAt > lastModified) {
        lastModified = character.updatedAt;
      }
    }

    return {
      totalCharacters: this.characters.size,
      ruleSystemBreakdown,
      lastModified
    };
  }

  /**
   * 从本地存储加载数据
   */
  private loadFromStorage(): void {
    try {
      const stored = localStorage.getItem(this.STORAGE_KEY);
      if (stored) {
        const data = JSON.parse(stored);
        if (data.characters && Array.isArray(data.characters)) {
          this.characters.clear();
          for (const character of data.characters) {
            if (this.validateCharacterData(character)) {
              this.characters.set(character.id, character);
            }
          }
        }
      }
    } catch (error) {
      console.error('从本地存储加载角色数据失败:', error);
    }
  }

  /**
   * 保存数据到本地存储
   */
  private saveToStorage(): void {
    try {
      const data = {
        version: '1.0',
        lastSaved: new Date().toISOString(),
        characters: Array.from(this.characters.values())
      };
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(data));
    } catch (error) {
      console.error('保存到本地存储失败:', error);
    }
  }

  /**
   * 验证角色数据完整性
   */
  private validateCharacterData(character: any): character is CharacterData {
    return (
      character &&
      typeof character.id === 'string' &&
      typeof character.name === 'string' &&
      typeof character.ruleSystemId === 'string' &&
      typeof character.playerId === 'string' &&
      character.attributes &&
      character.skills &&
      typeof character.createdAt === 'string' &&
      typeof character.updatedAt === 'string'
    );
  }

  /**
   * 生成唯一ID
   */
  private generateId(): string {
    return `char_${Date.now()}_${Math.random().toString(36).substring(2, 15)}`;
  }
}

// 导出单例实例
export const characterDataManager = CharacterDataManager.getInstance();
