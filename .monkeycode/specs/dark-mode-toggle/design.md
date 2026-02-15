# 深色模式切换功能技术设计文档

## 架构设计

### 技术方案选择

使用 `next-themes` 库实现主题切换，原因：
1. 与 Tailwind CSS class 模式完美集成
2. 自动处理 localStorage 持久化
3. 支持平滑过渡动画
4. 提供 React Hook 便于使用

### 整体架构图

```
┌─────────────────────────────────────────────────┐
│                  App.jsx                      │
│  ┌─────────────────────────────────────────┐  │
│  │  ThemeProvider (next-themes)          │  │
│  │  ┌─────────────────────────────────┐  │  │
│  │  │    Layout.jsx                  │  │  │
│  │  │  ┌──────────────────────────┐  │  │  │
│  │  │  │  Header.jsx             │  │  │  │
│  │  │  │  ├── Logo              │  │  │  │
│  │  │  │  ├── Nav Items         │  │  │  │
│  │  │  │  └── ThemeToggleBtn    │  │  │  │
│  │  │  └──────────────────────────┘  │  │  │
│  │  └─────────────────────────────────┘  │  │
│  └─────────────────────────────────────────┘  │
└─────────────────────────────────────────────────┘
```

## 模块划分

### 1. 主题上下文 (Theme Context)
**文件**: `src/contexts/ThemeContext.jsx`（使用 next-themes）

**职责**:
- 管理主题状态（light/dark）
- 提供主题切换方法
- 处理 localStorage 持久化

**使用方法**:
```javascript
import { useTheme } from 'next-themes';

function MyComponent() {
  const { theme, setTheme } = useTheme();
  return (
    <button onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}>
      切换主题
    </button>
  );
}
```

### 2. 主题切换按钮组件 (ThemeToggle)
**文件**: `src/components/ThemeToggle.jsx`

**职责**:
- 提供主题切换 UI
- 显示当前主题图标（太阳/月亮）
- 提供悬浮提示

**Props**:
- 无

**实现要点**:
- 使用 `lucide-react` 的 Sun 和 Moon 图标
- 使用 shadcn/ui 的 Button 组件
- 使用 shadcn/ui 的 Tooltip 组件

### 3. 全局主题提供者 (Theme Provider)
**文件**: `src/providers/ThemeProvider.jsx`

**职责**:
- 包装 next-themes 的 ThemeProvider
- 配置默认主题
- 避免 SSR 水合问题

## 接口设计

不涉及 API 接口，纯前端功能。

## 数据模型

### localStorage 存储格式
```javascript
// 键名
'theme'

// 值类型
string: 'light' | 'dark'

// 示例
localStorage.setItem('theme', 'dark');
```

## 错误处理

1. **localStorage 不可用**
   - 降级到内存存储
   - 刷新页面后重置为默认值

2. **next-themes Hook 使用错误**
   - 确保 ThemeProvider 在组件树的顶层
   - 确保使用 useTheme 的组件在 ThemeProvider 内部

## 样式实现

### CSS 过渡动画

在 `src/index.css` 中添加：
```css
* {
  transition: background-color 0.3s ease, color 0.3s ease, border-color 0.3s ease;
}
```

## 实现步骤

1. 检查并安装 next-themes 依赖
2. 创建 ThemeProvider 组件
3. 在 App.jsx 中集成 ThemeProvider
4. 创建 ThemeToggle 组件
5. 在 Header.jsx 中添加 ThemeToggle 按钮
6. 添加 CSS 过渡动画
7. 测试功能
