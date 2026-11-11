# 零号大坝 · 快速编成

手机优先的《三角洲行动》大坝编成记录工具。目标是**局内快速记干员**：点一下干员就保存并回到编成台；头甲、皮肤、存活/死亡都是随后补的选项，不再有底部确认按钮。

## 这一版的核心变化

- **点击即保存**：选择干员、皮肤、头甲后自动保存，不需要「确定 / 保存此位」。
- **干员优先**：点席位只弹出干员选择；选完立即回到编成台。
- **行内顺序**：从左到右固定为「干员 → 头甲 → 皮肤 → 存活/死亡」。
- **头甲拆分**：点击头甲后，上半段是头盔 1–6，下半段是盔甲 1–6；两项各点一次后自动保存。
- **存活默认**：选完干员默认「存活」绿色方块；点一下变成红色「死亡」，再点恢复。
- **皮肤限制**：只显示该干员实际可选的皮肤。
- **本局出生**：首次进入先选左/右岸和一号位/非一号位；出生侧自动排在编成台上方。
- **手机适配**：所有弹层使用 `100dvh` + 安全区，关闭按钮固定在顶部，不会再把底部操作区顶出屏幕。

## 使用流程

1. 双击 `start.bat`，打开 `http://127.0.0.1:4173/`。
2. 主页 →「地图」→「零号大坝」。
3. 首次进入编成台：
   - 选择本局出生侧：左岸 / 右岸；
   - 选择本局位置：一号位 / 非一号位。
   - 选完第二个选项自动保存并返回，不需要确认。
4. 点某个席位的「干员」区域：
   - 搜索或按定位筛选；
   - 点击干员，立即保存并关闭；
   - 再次点击这个席位，可以更换干员。
5. 补充信息（全部可选）：
   - **头甲**：先点头盔等级，再点盔甲等级，第二次点击自动保存；中途关闭不会保存。
   - **皮肤**：只列出该干员可用皮肤，点击自动保存。
   - **存活/死亡**：默认存活；点绿色方块切到死亡，再点切回。
6. 所有修改自动保存在当前浏览器，顶部会显示「已保存 时间」。

## 干员皮肤对应

| 干员 | 可选皮肤 |
| --- | --- |
| 威龙 | 白龙 |
| 红狼 | 黑狼 |
| 老黑 | 红 |
| 乌鲁鲁 | 红皮 |
| 女医 | 红医 |
| 露娜 | 猫猫头 |
| 麦晓雯 | 白小麦、红小麦 |
| 银翼 | 白皮 |

其他干员暂不显示皮肤选项。皮肤定义在 `js/data.js` 的 `SKINS` 中，可自行补充。

## 快速启动（电脑本地）

1. 整个文件夹保持在 `D:\delta-dam-board`。
2. 双击 **`start.bat`**。
3. 浏览器自动打开 `http://127.0.0.1:4173/`。
4. 用完在命令行窗口按 `Ctrl+C` 停止。

本机已安装 Python 3，项目没有 npm 依赖，不需要 `npm install`，也不需要联网。

> 直接双击 `index.html` 虽然能打开页面，但 `file://` 下浏览器可能按文件隔离本地存储，导致主页和编成台读不到同一份存档。建议始终通过 `start.bat` 启动。

## 部署到 GitHub Pages（手机访问）

目标地址：

```text
https://with061wind.github.io/delta-dam-board/
```

免费账号的 GitHub Pages 需要 **Public** 仓库。网站是纯静态文件，不需要构建命令。

### 首次部署

1. 打开 <https://github.com/new>，新建公开仓库 `delta-dam-board`。
2. 在仓库页点 **Add file → Upload files**。
3. 打开 `D:\delta-dam-board`，把文件夹 **里面的全部内容** 拖进上传区域：
   - `index.html`、`dam.html`
   - `assets`、`css`、`js`
   - `README.md`、`.nojekyll`
   - `start.bat`、`server.py` 也可以一起上传，Pages 不会执行它们
4. Commit changes。
5. 仓库 **Settings → Pages**：
   - Source：**Deploy from a branch**
   - Branch：**main**
   - Folder：**/ (root)**
   - Save
6. 等待 1–3 分钟，手机打开上面的地址。

### 更新已部署的网站

把修改过的文件重新上传并提交即可，Pages 会自动重新发布。重点会变的是：

- `index.html`、`dam.html`
- `css/base.css`、`css/board.css`、`css/home.css`
- `js/data.js`、`js/store.js`、`js/board.js`、`js/home.js`、`js/core.js`

如果 GitHub 网页上传不方便，也可以在本地仓库执行：

```powershell
cd /d D:\delta-dam-board
git add .
git commit -m "Update mobile quick record flow"
git push
```

## 数据与备份

- 存档键：`delta-dam-board.v2`
- 旧版 `delta-dam-board.v1` 会在读取时自动升级：旧的单一 `armor` 会同时补到头盔和盔甲，旧皮肤如果不在新名单中会被清空。
- 手机端和电脑端的数据分别保存在各自浏览器，不会自动同步。
- 需要迁移时，用顶部的「导出」生成 JSON，在另一台设备「导入」。
- 清空全部编成会同时清除本局出生设置，操作前会二次确认。

## 目录结构

```text
delta-dam-board/
├─ index.html              # 主页 / 地图入口 / 上次编成摘要
├─ dam.html                # 快速编成台 + 出生设置 + 三类选择弹层
├─ start.bat               # Windows 一键启动
├─ server.py               # 零依赖本地服务器，仅绑定 127.0.0.1
├─ .nojekyll               # GitHub Pages 跳过 Jekyll
├─ assets/
│  ├─ dam-map.svg          # 本地绘制的大坝战术地图
│  └─ favicon.svg
├─ css/
│  ├─ base.css             # 变量、头部、按钮、弹窗、Toast
│  ├─ home.css             # 主页与地图选择
│  └─ board.css            # 编成台、行内单元格、选择弹层
└─ js/
   ├─ core.js              # 图标、弹窗、Toast、复制/下载
   ├─ data.js              # 干员、别名、头甲、皮肤映射
   ├─ store.js             # v2 存档、v1 迁移、统计、简报
   ├─ home.js              # 主页逻辑
   └─ board.js             # 点击即保存、出生排序、头甲两步选择
```

## 自定义

### 修改干员名称 / 增加别名

编辑 `js/data.js` 的 `OPERATORS`：

```js
{
  id: 'redwolf',
  name: '红狼',
  en: 'D-WOLF',
  aliases: ['黑狼'],
  role: 'assault',       // assault / engineer / support / recon
  glyph: '狼',
  accent: '#df7047',
  tag: '动力外骨骼 · 机动突进'
}
```

`aliases` 会参与搜索，方便用旧称或外号找到干员。

### 修改皮肤

`js/data.js` 的 `SKINS` 每一项包含 `operatorId`；只有对应干员的皮肤会出现在皮肤弹层中。没有列出的干员不会显示皮肤选项。

### 修改头甲等级

`ARMOR_LEVELS` 固定为 1–6 级；颜色和名称可在 `js/data.js` 中调整。

## 说明

- 非官方本地工具，仅用于阵容记录；干员名、地图名等版权归原权利方所有。
- 没有后端、账号或远程请求；`server.py` 只监听 `127.0.0.1`。
- 页面使用系统字体、内联 SVG 和本地 CSS，不依赖 CDN，断网也能用。
