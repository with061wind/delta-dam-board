# 零号大坝 · 情报板

一个只在本机运行的《三角洲行动》大坝信息收集网站。主页选择地图，进入「零号大坝」后，可以在左右两岸各三支小队、每队三个席位中记录：

- **干员**：17 名干员，单选，可选填
- **头甲等级**：Ⅰ–Ⅵ 级，可选填
- **死后**：存活 / 阵亡 / 待确认 + 80 字以内备注，可选填
- **皮肤**：8 套本地外观标签 + 未设置，可选填

所有字段都不是必填，修改后自动保存到浏览器本地，不需要登录，也不会向外部服务器上传。

## 快速启动

1. 保持整个文件夹在 `D:\delta-dam-board`（或任意本地目录，不要拆散文件）。
2. 双击 **`start.bat`**。
3. 浏览器会自动打开 `http://127.0.0.1:4173/`。
4. 如果 4173 上已经有本工具在运行，脚本会直接打开现有页面，不会重复启动；如果端口被其他程序占用，会提示你关闭占用程序，而不是悄悄换端口，避免浏览器存档地址变化。
5. 用完在黑色命令行窗口按 `Ctrl+C` 停止服务。

本机已安装 Python 3，`start.bat` 会自动调用它。项目没有 npm 依赖，不需要 `npm install`，也不需要联网。

> 如果直接双击 `index.html`，页面本身可以打开，但浏览器对 `file://` 的本地存储可能按文件隔离，主页与编成台之间的存档读取会不稳定。**建议始终通过 `start.bat` 启动。**

## 页面与使用流程

1. **主页**：查看地图卡片和上次编成摘要。
2. 点击「地图」或地图预览，弹出地图选择。
3. 点击「零号大坝 / 进入大坝编成台」。
4. **编成台**：
   - 左岸、右岸各三队，每队三个位置；
   - 点击任意席位，弹出编辑面板；
   - 先选干员（再次点击同一干员可取消），再按需补头甲、死后状态/备注、皮肤；
   - 点「保存此位」，自动写入本地存档；
   - 全部留空也可以保存为未配置席位。

## 数据保存、导入与导出

- 存档位置：当前浏览器的 `localStorage`
- 存储键：`delta-dam-board.v1`
- 是否上传：否，网站只绑定 `127.0.0.1`
- 换浏览器、清理浏览器站点数据、手动换端口，都可能导致读不到旧存档
- 默认固定使用 4173；如果该端口被其他程序占用，请关闭占用程序后重试，避免换端口后浏览器把新地址当成新的存档源
- 建议定期点顶部「导出」，会得到类似 `零号大坝编成-20261110-2203.json` 的备份
- 「导入」会先校验文件，再要求确认覆盖当前编成
- 「复制简报」可把当前 18 个席位复制成文字，方便发给队友
- 「清空」会删除全部 18 个席位，需二次确认

## 目录结构

```text
delta-dam-board/
├─ index.html              # 主页：地图入口、上次编成摘要
├─ dam.html                # 大坝编成台：左右岸 × 三队 × 三席
├─ start.bat               # Windows 一键启动（自动找 python / py）
├─ server.py               # 零依赖本地静态服务器，仅绑定 127.0.0.1
├─ README.md
├─ assets/
│  ├─ dam-map.svg          # 本地绘制的大坝战术地图
│  └─ favicon.svg
├─ css/
│  ├─ base.css             # 变量、重置、头部、按钮、弹窗、Toast
│  ├─ home.css             # 主页与地图选择
│  └─ board.css            # 编成台与席位编辑器
└─ js/
   ├─ core.js              # 图标、弹窗、Toast、复制/下载等公共工具
   ├─ data.js              # 干员、头甲、死后状态、皮肤、队伍文案
   ├─ store.js             # 存档结构、校验、统计、简报生成
   ├─ home.js              # 主页逻辑
   └─ board.js             # 编成台与编辑面板逻辑
```

## 部署到 GitHub Pages（手机访问）

目标地址：

```text
https://with061wind.github.io/delta-dam-board/
```

仓库必须是 **Public**（免费账号的 GitHub Pages 不支持私有仓库）。不需要服务器、构建命令或数据库。

### 方式一：网页上传（最简单）

1. 登录 GitHub，打开 <https://github.com/new>。
2. 仓库名填 `delta-dam-board`，可见性选 **Public**，不要勾选自动生成 README，点 **Create repository**。
3. 在新仓库页面点 **uploading an existing file**。
4. 打开 `D:\delta-dam-board`，把里面的 **所有内容**（`index.html`、`dam.html`、`assets`、`css`、`js` 等）拖进上传区域。
   - 注意：拖的是文件夹 **里面的内容**，不要把 `delta-dam-board` 整个文件夹再套一层，否则网站会多出一层路径。
5. 下方 Commit changes 填 `Deploy dam intel board`，点提交。
6. 进入仓库 **Settings → Pages**。
7. 在 **Build and deployment** 中：
   - Source 选 **Deploy from a branch**
   - Branch 选 **main**
   - 文件夹选 **/ (root)**
   - 点 **Save**
8. 等待 1–3 分钟，访问 `https://with061wind.github.io/delta-dam-board/`。
9. 手机浏览器打开同一个地址即可；可以在浏览器菜单里「添加到主屏幕」。

> `.nojekyll` 已经放在项目里。如果网页上传时它没有出现在根目录，可以手动 Add file → Create new file，文件名填 `.nojekyll`，内容留空后提交。它不是必需的，但可以避免 GitHub 用 Jekyll 处理静态文件。

### 方式二：Git 命令

先在 GitHub 新建公开仓库 `delta-dam-board`，然后在本机执行：

```powershell
cd /d D:\delta-dam-board
git init -b main
git add .
git commit -m "Deploy dam intel board"
git remote add origin https://github.com/with061wind/delta-dam-board.git
git push -u origin main
```

推送成功后，按上面的 **Settings → Pages** 设置 `main` / `/ (root)`。

### 手机使用注意

- 手机端和电脑端的编成数据分别保存在各自浏览器的 `localStorage` 中，不会自动同步。
- 需要在两端迁移时，用网站顶部的「导出」生成 JSON，在另一台设备用「导入」恢复。
- GitHub Pages 是 HTTPS，手机端剪贴板和本地存储都可以正常使用。
- 更新网站时，重新上传改动文件并提交，Pages 会自动重新发布。

## 自定义

### 增加 / 修改干员

编辑 `js/data.js` 里的 `OPERATORS` 数组，每项格式：

```js
{
  id: 'redwolf',          // 唯一 id，不要和已有重复
  name: '红狼',
  en: 'D-WOLF',
  role: 'assault',        // assault / engineer / support / recon
  glyph: '狼',            // 头像里的单字
  accent: '#df7047',      // 主题色
  tag: '动力外骨骼 · 机动突进'
}
```

保存后刷新页面即可。已经存档的旧干员 id 仍会保留。

### 修改队伍 / 阵营名称

`js/data.js` 的 `TEAM_NAMES` 和 `SIDES`。如果要改每边队伍数或每队人数，需要同时调整 `TEAM_COUNT` / `PLAYERS_PER_TEAM`，并检查 `store.js` 的存档结构；当前固定为 3 × 3 × 2。

### 修改地图

替换 `assets/dam-map.svg` 即可，主页和地图选择弹窗会自动引用。地图上的地名直接写在 SVG 里。

### 修改皮肤、头甲等级

同样在 `js/data.js` 中改 `SKINS`、`ARMOR_LEVELS`、`DEATH_STATES`。存档校验会根据这些 id 过滤未知值。

## 说明

- 这是非官方本地工具，仅用于阵容/信息记录；干员名称、地图名称等版权归原权利方所有。
- 「死后」字段实现为「状态 + 备注」：状态可记录存活、阵亡或待确认；备注可以写掉落点、装备安排等。若你只想把它当作纯文本框，可以保留备注、把状态留空。
- 没有后端、没有账号、没有远程请求；`server.py` 只监听 `127.0.0.1`。
- 页面使用系统字体、内联 SVG 和本地 CSS，不依赖 CDN，断网也能用。

## 故障排查

| 现象 | 处理 |
| --- | --- |
| 双击 `start.bat` 闪退 | 右键「在终端中运行」，查看 Python 是否可用；或手动执行 `python server.py` |
| 端口被占用 | 关闭占用 4173 的程序后重试；如确需换端口，运行 `python server.py --port 4180`，但旧端口存档不会自动迁移 |
| 页面能开但主页没有上次编成 | 确认两次访问的是同一个地址（例如都是 `127.0.0.1:4173`），且没有清理站点数据 |
| 导入提示 JSON 无效 | 只导入本工具「导出」得到的文件；不要手工改坏结构 |
| 浏览器阻止本地保存 | 检查隐私/无痕模式设置；普通窗口访问 localhost 一般可写入 |
