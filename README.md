# pactveil ai — Vercel 版

这是完整的独立 Next.js 项目，包含原网站页面、405 个本地资源、案例、Book demo、管理员登录和 CSV 导出。

技术：Next.js App Router / React / Node.js 24 / Neon PostgreSQL。没有 Cloudflare、D1、Sites 或 ChatGPT 登录依赖。

## 当前业务行为

- Book demo 在服务器验证后写入数据库，成功后返回询盘编号。
- 只有写入成功才显示提交成功；数据库未配置或写入失败会显示错误并保留输入。
- **此版本不会发送邮件**，也不需要 Resend 密钥。Elizabeth 的邮箱仅为未来通知目标。
- 合作署名 hotmedia × hotchain 保留；品牌为 pactveil，右上角小号 ai。
- 隐私、安全及法律联系地址为 legal@pactveil.com。
- 网站首页公开；`/admin` 和 CSV 导出必须通过独立管理员登录。Vercel 项目的预览保护另行配置。

## 1. 本地准备

安装 Node.js 24，打开本目录：

```sh
npm ci
cp .env.example .env.local
npm run admin:setup
```

`admin:setup` 提示填写管理员邮箱，生成随机登录密码、密码哈希与会话密钥，并将服务器配置写入已忽略的 `.env.local`。将生成的密码保存到密码管理器；不要提交 `.env.local`。

## 2. 创建 Neon 数据库

在客户自己的 Neon 账号创建项目，或通过 Vercel Marketplace 连接 Neon。
将 Neon 提供的 PostgreSQL 连接串放入 `.env.local` 的 `DATABASE_URL`；保留连接串中的 TLS 参数。

```sh
npm run db:setup
```

这条命令执行 `db/schema.sql`，创建询盘、登录/提交频率限制表和索引；不会删除已有询盘。
也可以在 Neon SQL Editor 手动执行同一文件。

然后启动本地开发：

```sh
npm run dev
```

访问终端打印的地址；管理员入口为 `/admin/login`。

## 3. 上传 GitHub

把此目录的内容作为仓库根目录上传到客户的 GitHub 私有仓库。提交 `package-lock.json`，不要上传 `.env.local`、`node_modules` 或 `.next`。

## 4. 在 Vercel 导入

Add New → Project → 选择仓库：

| 设置 | 值 |
| --- | --- |
| Framework Preset | Next.js |
| Root Directory | 本项目所在目录（仓库根目录时留默认） |
| Node.js | 24.x |
| Install Command | npm ci |
| Build Command | npm run build |
| Output Directory | 使用 Next.js 默认值，不填 dist |

在 Settings → Environment Variables 添加以下服务器变量：

| 变量 | 内容 |
| --- | --- |
| DATABASE_URL | Neon 连接串 |
| ADMIN_EMAIL | 运行 admin:setup 时填写的管理员邮箱 |
| ADMIN_PASSWORD_HASH | admin:setup 生成的完整 scrypt 值 |
| SESSION_SECRET | admin:setup 生成的随机密钥 |

不要给这些变量加 `NEXT_PUBLIC_` 前缀。Production 和 Preview 分别配置，建议 Preview 使用独立 Neon 分支，以免测试写入正式询盘。每个数据库都先执行 schema.sql。

变量设置完后部署；变量变更后重新部署。构建不连接数据库，但实际表单和后台需要有效数据库及表结构。

## 5. 上线验收

1. 打开首页、AI solutions、案例、Privacy 和 Security，检查图片及手机布局。
2. 提交一次测试 Book demo，确认得到成功编号。
3. 使用管理员邮箱及生成密码登录 `/admin/login`，确认记录存在并可导出 CSV。
4. 退出后访问 `/admin` 应跳转登录；直接访问 `/api/admin/export` 应返回 403。
5. 确认没有发出真实邮件。
6. 客户验收后，在 Vercel Settings → Domains 绑定正式域名，按平台显示的 DNS 记录操作。
7. 正式域名再测试提交、登录、退出和导出。

## 原询盘迁移（如有）

原 Sites 数据不会自动进入新数据库。请在旧站管理员后台导出 CSV，安全保存后，在本地执行：

```sh
npm run db:import -- /完整路径/旧站导出.csv
```

导入脚本以 ID 去重，可重试；原导出未包含隐私同意版本，因此标记为 `legacy-export-not-recorded`，不伪造历史版本。核对总数、时间和记录内容后再切换域名。保留旧站及数据备份直到迁移确认完成。

## 管理与维护

- 一个管理员账号；密码经过带盐 scrypt 哈希处理，登录会话 8 小时有效。
- 生产 Cookie 使用 HttpOnly、Secure、SameSite=Strict；不依赖可伪造的 ChatGPT 身份请求头。
- 单管理员账号每 15 分钟最多 10 次登录尝试，成功尝试也计入；触发后等待窗口过期。配置缺失或数据库故障会拒绝登录。
- 同一客户邮箱每 15 分钟最多提交 5 次询盘；前端蜜罐和服务器校验继续保留。
- 再运行 `npm run admin:setup` 可轮换密码及会话密钥；更新 Vercel 变量并重新部署后，旧会话失效。
- CSV 导出上限 10,000 条；更多记录请通过数据库管理工具导出。后台按每页 50 条分页。
- 可定期删除 rate_limits 中过期的条目；不要删除 inquiries 数据。
- 没有自动邮件重试任务、邮件发送后台或订阅功能。

## 检查命令

```sh
npm test
npm run build
npm run typecheck
```

测试覆盖表单校验、真实 PostgreSQL 内核（PGlite）上的数据保存/排序/分页、限流、密码验证、会话篡改/过期/轮换、CSV 公式防护及请求来源和大小限制。

实际 Neon/Vercel 账号、DNS 及生产数据库不包含在源码包内，必须按以上步骤配置后再做线上验收。

官方参考：[Vercel Next.js](https://vercel.com/docs/frameworks/full-stack/nextjs)、[环境变量](https://vercel.com/docs/environment-variables)、[Neon Driver](https://neon.com/docs/serverless/serverless-driver)。
