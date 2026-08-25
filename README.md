# 秋招进度台

面向 2027 届秋招的个人求职管理系统，本地优先、数据自主可控。

- 城市：杭州
- 方向：大模型评测、Agent 开发
- 企业偏好：中型公司优先

## 功能

- **投递记录**：公司、职位、薪资、状态、联系人、链接全流程追踪
- **招聘日程**：管理企业招聘批次、宣讲会、笔试面试安排
- **企业门户**：维护各公司官方投递入口和校招门户
- **材料管理**：上传简历、求职信、面试录音录像
- **状态历史**：完整记录每次状态变更，支持回溯
- **数据看板**：转化率漏斗、每周活动热力图、面试时间线
- **AI 洞察**：分析投递管线瓶颈，定位卡点环节
- **浏览器扩展**：从任意招聘网页一键提取职位信息
- **自定义流程**：自定义状态和面试轮次类型
- **主题定制**：Gruvbox、Catppuccin、Dracula 等多主题
- **数据便携**：支持 JSON / CSV / ZIP 全量导出导入
- **本地优先**：SQLite 存储，无需云端，数据完全自有

## 本机启动

Windows PowerShell：

```powershell
.\start-local.ps1
```

然后打开 `http://localhost:5173`。首次进入时创建本机账户，业务数据存放在
`data/autumn-recruitment.db`，上传文件存放在 `uploads/`。

## Docker 部署

### SQLite 模式（个人使用）

```bash
curl -fsSLO https://raw.githubusercontent.com/Norman-bury/autumn/main/deploy/compose/docker-compose.yml
docker compose up -d
```

### PostgreSQL 模式（多用户/生产）

```bash
curl -fsSLO https://raw.githubusercontent.com/Norman-bury/autumn/main/deploy/compose/docker-compose.postgres.yml
echo "POSTGRES_PASSWORD=$(openssl rand -hex 32)" > .env
docker compose -f docker-compose.postgres.yml up -d
```

打开 `http://localhost:5577`，首个注册账户自动成为管理员。

## 技术栈

- **后端**：Python / FastAPI / SQLAlchemy / Alembic
- **前端**：React / TypeScript / Vite / Tailwind CSS
- **数据库**：SQLite（默认）或 PostgreSQL
- **CLI**：Python / Typer
- **浏览器扩展**：Chrome / Firefox（Manifest V3）
- **部署**：Docker Compose / Helm (Kubernetes)

## 项目结构

```
├── backend/          # FastAPI 后端
│   ├── app/
│   │   ├── api/          # API 路由
│   │   ├── core/         # 配置、安全、数据库
│   │   ├── models/       # SQLAlchemy 模型
│   │   ├── schemas/      # Pydantic 模型
│   │   └── services/     # 业务逻辑
│   ├── alembic/          # 数据库迁移
│   └── tests/            # 后端测试
├── frontend/         # React 前端
│   └── src/
│       ├── components/   # UI 组件
│       ├── pages/        # 页面
│       ├── lib/          # API 客户端和工具
│       └── contexts/     # React Context
├── cli/              # 命令行工具
├── extension/        # 浏览器扩展
├── deploy/           # Docker Compose / Helm 部署配置
└── documentation/    # 文档站（Docusaurus）
```

## License

MIT License — 详见 [LICENSE](LICENSE)
