import React, { useState } from 'react'
import { 
  CogIcon,
  ServerIcon,
  ShieldCheckIcon,
  BellIcon,
  CloudIcon,
  DatabaseIcon
} from '@heroicons/react/24/outline'
import { Button } from '../../components/ui/Button'
import { Card } from '../../components/ui/Card'
import { Input } from '../../components/ui/Input'
import { useToast } from '../../hooks/useToast'
import { cn } from '../../utils/cn'

interface SettingSection {
  id: string
  name: string
  icon: React.ComponentType<React.SVGProps<SVGSVGElement>>
  description: string
}

const settingSections: SettingSection[] = [
  {
    id: 'general',
    name: '基本设置',
    icon: CogIcon,
    description: '系统的基本配置选项'
  },
  {
    id: 'security',
    name: '安全设置',
    icon: ShieldCheckIcon,
    description: '账户安全和权限管理'
  },
  {
    id: 'notifications',
    name: '通知设置',
    icon: BellIcon,
    description: '邮件和系统通知配置'
  },
  {
    id: 'storage',
    name: '存储设置',
    icon: CloudIcon,
    description: '文件存储和云服务配置'
  },
  {
    id: 'database',
    name: '数据库设置',
    icon: DatabaseIcon,
    description: '数据库连接和备份配置'
  },
  {
    id: 'performance',
    name: '性能设置',
    icon: ServerIcon,
    description: '缓存和性能优化配置'
  }
]

export const AdminSettings: React.FC = () => {
  const [activeSection, setActiveSection] = useState('general')
  const [settings, setSettings] = useState({
    general: {
      siteName: '摩托车数据库',
      siteDescription: '专业的摩托车性能数据平台',
      maintenanceMode: false,
      enableRegistration: true,
      defaultLanguage: 'zh-CN',
      timezone: 'Asia/Shanghai'
    },
    security: {
      passwordMinLength: 8,
      requireStrongPassword: true,
      enableTwoFactor: false,
      sessionTimeout: 24,
      maxLoginAttempts: 5,
      enableCaptcha: true
    },
    notifications: {
      enableEmail: true,
      smtpHost: 'smtp.gmail.com',
      smtpPort: 587,
      smtpUser: '',
      smtpPassword: '',
      enablePush: false,
      adminEmail: 'admin@example.com'
    },
    storage: {
      provider: 'local',
      maxFileSize: 5,
      allowedTypes: ['jpg', 'jpeg', 'png', 'gif', 'webp'],
      cloudinaryName: '',
      cloudinaryKey: '',
      cloudinarySecret: ''
    },
    database: {
      mongoUri: 'mongodb://localhost:27017/motorcycle',
      backupEnabled: true,
      backupInterval: 'daily',
      retentionDays: 30
    },
    performance: {
      enableCache: true,
      cacheProvider: 'redis',
      redisHost: 'localhost',
      redisPort: 6379,
      enableGzip: true,
      enableMinification: true
    }
  })
  const { showToast } = useToast()
  const [loading, setLoading] = useState(false)

  const handleSave = async (section: string) => {
    setLoading(true)
    try {
      // 模拟 API 调用
      await new Promise(resolve => setTimeout(resolve, 1000))
      showToast(`${settingSections.find(s => s.id === section)?.name}已保存`, 'success')
    } catch (error) {
      showToast('保存失败，请稍后重试', 'error')
    } finally {
      setLoading(false)
    }
  }

  const updateSetting = (section: string, key: string, value: any) => {
    setSettings(prev => ({
      ...prev,
      [section]: {
        ...prev[section as keyof typeof prev],
        [key]: value
      }
    }))
  }

  const renderGeneralSettings = () => (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Input
          label="站点名称"
          value={settings.general.siteName}
          onChange={(e) => updateSetting('general', 'siteName', e.target.value)}
        />
        <Input
          label="默认语言"
          value={settings.general.defaultLanguage}
          onChange={(e) => updateSetting('general', 'defaultLanguage', e.target.value)}
        />
      </div>
      
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">站点描述</label>
        <textarea
          rows={3}
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
          value={settings.general.siteDescription}
          onChange={(e) => updateSetting('general', 'siteDescription', e.target.value)}
        />
      </div>

      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <label className="text-sm font-medium text-gray-900">维护模式</label>
            <p className="text-sm text-gray-500">启用后用户无法访问站点</p>
          </div>
          <input
            type="checkbox"
            className="rounded"
            checked={settings.general.maintenanceMode}
            onChange={(e) => updateSetting('general', 'maintenanceMode', e.target.checked)}
          />
        </div>

        <div className="flex items-center justify-between">
          <div>
            <label className="text-sm font-medium text-gray-900">允许用户注册</label>
            <p className="text-sm text-gray-500">禁用后新用户无法注册</p>
          </div>
          <input
            type="checkbox"
            className="rounded"
            checked={settings.general.enableRegistration}
            onChange={(e) => updateSetting('general', 'enableRegistration', e.target.checked)}
          />
        </div>
      </div>
    </div>
  )

  const renderSecuritySettings = () => (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">最少密码长度</label>
          <input
            type="number"
            min="6"
            max="32"
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
            value={settings.security.passwordMinLength}
            onChange={(e) => updateSetting('security', 'passwordMinLength', parseInt(e.target.value))}
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">会话超时(小时)</label>
          <input
            type="number"
            min="1"
            max="168"
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
            value={settings.security.sessionTimeout}
            onChange={(e) => updateSetting('security', 'sessionTimeout', parseInt(e.target.value))}
          />
        </div>
      </div>

      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <label className="text-sm font-medium text-gray-900">强密码策略</label>
            <p className="text-sm text-gray-500">要求密码包含数字、字母和特殊字符</p>
          </div>
          <input
            type="checkbox"
            className="rounded"
            checked={settings.security.requireStrongPassword}
            onChange={(e) => updateSetting('security', 'requireStrongPassword', e.target.checked)}
          />
        </div>

        <div className="flex items-center justify-between">
          <div>
            <label className="text-sm font-medium text-gray-900">启用两步验证</label>
            <p className="text-sm text-gray-500">增强账户安全性</p>
          </div>
          <input
            type="checkbox"
            className="rounded"
            checked={settings.security.enableTwoFactor}
            onChange={(e) => updateSetting('security', 'enableTwoFactor', e.target.checked)}
          />
        </div>

        <div className="flex items-center justify-between">
          <div>
            <label className="text-sm font-medium text-gray-900">启用验证码</label>
            <p className="text-sm text-gray-500">登录时要求输入验证码</p>
          </div>
          <input
            type="checkbox"
            className="rounded"
            checked={settings.security.enableCaptcha}
            onChange={(e) => updateSetting('security', 'enableCaptcha', e.target.checked)}
          />
        </div>
      </div>
    </div>
  )

  const renderNotificationSettings = () => (
    <div className="space-y-6">
      <div className="flex items-center justify-between p-4 bg-blue-50 rounded-lg">
        <div>
          <label className="text-sm font-medium text-gray-900">启用邮件通知</label>
          <p className="text-sm text-gray-500">系统事件和用户通知</p>
        </div>
        <input
          type="checkbox"
          className="rounded"
          checked={settings.notifications.enableEmail}
          onChange={(e) => updateSetting('notifications', 'enableEmail', e.target.checked)}
        />
      </div>

      {settings.notifications.enableEmail && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Input
            label="SMTP 主机"
            value={settings.notifications.smtpHost}
            onChange={(e) => updateSetting('notifications', 'smtpHost', e.target.value)}
          />
          <Input
            label="SMTP 端口"
            type="number"
            value={settings.notifications.smtpPort.toString()}
            onChange={(e) => updateSetting('notifications', 'smtpPort', parseInt(e.target.value))}
          />
          <Input
            label="SMTP 用户名"
            value={settings.notifications.smtpUser}
            onChange={(e) => updateSetting('notifications', 'smtpUser', e.target.value)}
          />
          <Input
            label="SMTP 密码"
            type="password"
            value={settings.notifications.smtpPassword}
            onChange={(e) => updateSetting('notifications', 'smtpPassword', e.target.value)}
          />
        </div>
      )}

      <Input
        label="管理员邮箱"
        type="email"
        value={settings.notifications.adminEmail}
        onChange={(e) => updateSetting('notifications', 'adminEmail', e.target.value)}
      />
    </div>
  )

  const renderStorageSettings = () => (
    <div className="space-y-6">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">存储提供商</label>
        <select
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
          value={settings.storage.provider}
          onChange={(e) => updateSetting('storage', 'provider', e.target.value)}
        >
          <option value="local">本地存储</option>
          <option value="cloudinary">Cloudinary</option>
          <option value="aws">AWS S3</option>
        </select>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">最大文件大小 (MB)</label>
          <input
            type="number"
            min="1"
            max="100"
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
            value={settings.storage.maxFileSize}
            onChange={(e) => updateSetting('storage', 'maxFileSize', parseInt(e.target.value))}
          />
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">允许的文件类型</label>
        <p className="text-sm text-gray-500 mb-2">用逗号分隔多个扩展名</p>
        <input
          type="text"
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
          value={settings.storage.allowedTypes.join(', ')}
          onChange={(e) => updateSetting('storage', 'allowedTypes', e.target.value.split(',').map(t => t.trim()))}
        />
      </div>

      {settings.storage.provider === 'cloudinary' && (
        <div className="grid grid-cols-1 gap-6 p-4 bg-gray-50 rounded-lg">
          <h4 className="font-medium text-gray-900">Cloudinary 配置</h4>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Input
              label="Cloud Name"
              value={settings.storage.cloudinaryName}
              onChange={(e) => updateSetting('storage', 'cloudinaryName', e.target.value)}
            />
            <Input
              label="API Key"
              value={settings.storage.cloudinaryKey}
              onChange={(e) => updateSetting('storage', 'cloudinaryKey', e.target.value)}
            />
            <Input
              label="API Secret"
              type="password"
              value={settings.storage.cloudinarySecret}
              onChange={(e) => updateSetting('storage', 'cloudinarySecret', e.target.value)}
            />
          </div>
        </div>
      )}
    </div>
  )

  const renderSection = () => {
    switch (activeSection) {
      case 'general':
        return renderGeneralSettings()
      case 'security':
        return renderSecuritySettings()
      case 'notifications':
        return renderNotificationSettings()
      case 'storage':
        return renderStorageSettings()
      default:
        return <div>功能开发中...</div>
    }
  }

  return (
    <div>
      {/* 头部 */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">系统设置</h1>
        <p className="mt-2 text-gray-600">管理系统的各项配置选项</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        {/* 设置分类 */}
        <div className="lg:col-span-1">
          <nav className="space-y-1">
            {settingSections.map((section) => {
              const isActive = activeSection === section.id
              return (
                <button
                  key={section.id}
                  onClick={() => setActiveSection(section.id)}
                  className={cn(
                    'w-full text-left px-3 py-2 rounded-md text-sm font-medium transition-colors',
                    isActive
                      ? 'bg-primary-100 text-primary-700'
                      : 'text-gray-700 hover:bg-gray-50 hover:text-gray-900'
                  )}
                >
                  <div className="flex items-center">
                    <section.icon className={cn(
                      'mr-3 h-5 w-5',
                      isActive ? 'text-primary-500' : 'text-gray-400'
                    )} />
                    <div>
                      <div>{section.name}</div>
                      <div className="text-xs text-gray-500 mt-1">
                        {section.description}
                      </div>
                    </div>
                  </div>
                </button>
              )
            })}
          </nav>
        </div>

        {/* 设置内容 */}
        <div className="lg:col-span-3">
          <Card className="p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg font-medium text-gray-900">
                {settingSections.find(s => s.id === activeSection)?.name}
              </h2>
              <Button 
                onClick={() => handleSave(activeSection)}
                isLoading={loading}
              >
                保存设置
              </Button>
            </div>
            
            {renderSection()}
          </Card>
        </div>
      </div>
    </div>
  )
}