# Color Space (工作区颜色空间)

[English](#english) | [中文](#chinese)

<a name="english"></a>
## English

**Color Space** is a VS Code and Trae extension that automatically assigns a unique color to your workspace window. This helps you quickly distinguish between different projects at a glance.

### Features

- **Auto Coloring**: Automatically generates a unique pastel color based on the workspace name.
- **Status Bar Integration**: Quickly manage colors from the status bar.
- **Manual Control**: Pick from presets, randomize, or clear colors via commands.
- **Configurable**: Enable/Disable globally or ignore specific workspaces.

### Usage

1. Open a folder or workspace.
2. The title bar, activity bar, and status bar will automatically change color.
3. Click the "Paint Can" icon in the status bar to open the menu.

### Commands

- `Color Space: Enable` - Enable auto coloring.
- `Color Space: Disable` - Disable auto coloring and reset colors.
- `Color Space: Pick Color` - Choose from a list of preset colors.
- `Color Space: Randomize` - Apply a random color.
- `Color Space: Clear` - Reset the current workspace color to default.

### Extension Settings

This extension contributes the following settings:

* `colorspace.enabled`: Enable/disable the extension.
* `colorspace.ignoreList`: Array of workspace names to ignore.

---

<a name="chinese"></a>
## 中文 (Chinese)

**Color Space** 是一款兼容 VS Code 和 Trae 的扩展插件，能够为您的每个工作区自动分配独特的颜色。这可以帮助您一目了然地快速区分不同的项目窗口。

### 功能特性

- **自动着色**: 根据工作区名称自动生成唯一的柔和色调。
- **状态栏集成**: 通过状态栏快速管理颜色。
- **手动控制**: 通过命令选择预设颜色、随机生成或清除颜色。
- **可配置**: 全局启用/禁用，或忽略特定工作区。

### 使用方法

1. 打开一个文件夹或工作区。
2. 标题栏、活动栏和状态栏的颜色将自动改变。
3. 点击状态栏中的“油漆桶”图标可打开菜单。

### 命令

- `Color Space: Enable` - 启用自动着色。
- `Color Space: Disable` - 禁用自动着色并重置颜色。
- `Color Space: Pick Color` - 从预设颜色列表中选择。
- `Color Space: Randomize` - 应用随机颜色。
- `Color Space: Clear` - 将当前工作区颜色重置为默认值。

### 扩展设置

本插件提供以下设置：

* `colorspace.enabled`: 启用/禁用插件。
* `colorspace.ignoreList`: 忽略的工作区名称列表。

### Development & Testing

- **Run tests (VS Code)**: `npm test`
- **Run tests (Trae)**: `npm run test:trae`
  - *Note: Ensure Trae is installed at the default location or set `TRAE_EXECUTABLE_PATH` environment variable.*

## License

[MIT](LICENSE)
