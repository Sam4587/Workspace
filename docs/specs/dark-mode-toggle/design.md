# 深色模式切换 技术设计

## 架构设计

### 整体架构

```
┌─────────────────────────────────────────────────────────┐
│                    ThemeProvider                         │
├─────────────────────────────────────────────────────────┤
│  ┌──────────────────┐    ┌──────────────────┐          │
│  │  ThemeStorage    │    │  SystemTheme     │          │
│  │  (localStorage)  │    │  (matchMedia)    │          │
│  └──────────────────┘    └──────────────────┘          │
│           │                       │                     │
│           └───────────┬───────────┘                     │
│                       ▼                                 │
│              ┌──────────────────┐                       │
│              │  ThemeContext    │                       │
│              └──────────────────┘                       │
│                       │                                 │
│           ┌───────────┴───────────┐                     │
│           ▼                       ▼                     │
│  ┌──────────────────┐    ┌──────────────────┐          │
│  │  ThemeToggle     │    │  CSS Variables   │          │
│  │  (UI Component)  │    │  (样式系统)       │          │
│  └──────────────────┘    └──────────────────┘          │
└─────────────────────────────────────────────────────────┘
```

## 模块划分

### 1. ThemeProvider (主题提供者)

**职责**:
- 管理主题状态
- 提供主题切换方法
- 处理初始化逻辑

**API 设计**:
```jsx
<ThemeProvider defaultTheme="system" storageKey="theme">
  {children}
</ThemeProvider>
```

### 2. useTheme Hook

**职责**:
- 提供主题状态访问
- 提供主题切换方法

**API 设计**:
```jsx
const { theme, setTheme, resolvedTheme } = useTheme();
// theme: 'light' | 'dark' | 'system'
// resolvedTheme: 'light' | 'dark' (实际应用的主题)
```

### 3. ThemeToggle 组件

**职责**:
- 提供主题切换 UI
- 显示当前主题状态

**Props**:
```jsx
<ThemeToggle 
  size="default"  // 'sm' | 'default' | 'lg'
  variant="icon"  // 'icon' | 'switch' | 'dropdown'
/>
```

## CSS 变量设计

### 颜色变量

```css
:root {
  --background: 0 0% 100%;
  --foreground: 222.2 84% 4.9%;
  --card: 0 0% 100%;
  --card-foreground: 222.2 84% 4.9%;
  --primary: 222.2 47.4% 11.2%;
  --primary-foreground: 210 40% 98%;
  --secondary: 210 40% 96.1%;
  --secondary-foreground: 222.2 47.4% 11.2%;
  --muted: 210 40% 96.1%;
  --muted-foreground: 215.4 16.3% 46.9%;
  --accent: 210 40% 96.1%;
  --accent-foreground: 222.2 47.4% 11.2%;
  --border: 214.3 31.8% 91.4%;
  --input: 214.3 31.8% 91.4%;
  --ring: 222.2 84% 4.9%;
}

.dark {
  --background: 222.2 84% 4.9%;
  --foreground: 210 40% 98%;
  --card: 222.2 84% 4.9%;
  --card-foreground: 210 40% 98%;
  --primary: 210 40% 98%;
  --primary-foreground: 222.2 47.4% 11.2%;
  --secondary: 217.2 32.6% 17.5%;
  --secondary-foreground: 210 40% 98%;
  --muted: 217.2 32.6% 17.5%;
  --muted-foreground: 215 20.2% 65.1%;
  --accent: 217.2 32.6% 17.5%;
  --accent-foreground: 210 40% 98%;
  --border: 217.2 32.6% 17.5%;
  --input: 217.2 32.6% 17.5%;
  --ring: 212.7 26.8% 83.9%;
}
```

## 实现方案

### 方案选择

使用 `next-themes` 库（适用于 React/Vite 项目）：
- 成熟稳定
- 支持 SSR
- 支持系统主题跟随
- 支持 CSS 变量

### 安装

```bash
npm install next-themes
```

### 使用示例

```jsx
// main.jsx
import { ThemeProvider } from 'next-themes';

ReactDOM.createRoot(document.getElementById('root')).render(
  <ThemeProvider attribute="class" defaultTheme="system">
    <App />
  </ThemeProvider>
);

// ThemeToggle.jsx
import { useTheme } from 'next-themes';

export function ThemeToggle() {
  const { theme, setTheme } = useTheme();
  
  return (
    <button onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}>
      {theme === 'dark' ? <SunIcon /> : <MoonIcon />}
    </button>
  );
}
```

## 文件结构

```
src/
├── components/
│   └── ui/
│       └── theme-toggle.jsx    # 主题切换组件
├── lib/
│   └── theme-provider.jsx      # 主题提供者配置
└── styles/
    └── globals.css             # CSS 变量定义
```

## 兼容性

- Chrome 76+
- Firefox 67+
- Safari 12.1+
- Edge 79+
