# Vercel 环境变量修复指南 (命令行版)

既然 Vercel 网页版有 Bug，我们直接使用 **命令行 (CLI)** 来上传环境变量。这种方法 100% 有效。

请在下方的终端 (Terminal) 中，依次运行以下命令。

## 第 1 步：登录并关联项目
运行以下命令，按提示操作（使用方向键选择，回车确认）：

```bash
npx vercel login
```
*(选择 Continue with GitHub，然后在浏览器确认)*

登录成功后，运行：
```bash
npx vercel link
```
*   Set up “...” ? **Y**
*   Which scope ... ? **(选择你的用户名)**
*   Link to existing project? **Y**
*   What’s the name of your existing project? **ai-video** (或者你 Vercel 上的项目名)

## 第 2 步：添加环境变量 (复制以下命令)

**添加 URL:**
运行下方命令，当它问你 `What’s the value of NEXT_PUBLIC_SUPABASE_URL?` 时，
复制粘贴这个值：`https://hygjhzbpxheunaewsuwk.supabase.co`
然后选择环境：按 `A` (Select All) 然后回车。

```bash
npx vercel env add NEXT_PUBLIC_SUPABASE_URL
```

**添加 Anon Key:**
运行下方命令，当它问你 `What’s the value of NEXT_PUBLIC_SUPABASE_ANON_KEY?` 时，
复制粘贴这个值：`eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imh5Z2poemJweGhldW5hZXdzdXdrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjY5MzE0ODMsImV4cCI6MjA4MjUwNzQ4M30.usMKD2403drIJjO-bQE9f8LmByu9KgIzYy9C_FXGBzc`
然后选择环境：按 `A` (Select All) 然后回车。

```bash
npx vercel env add NEXT_PUBLIC_SUPABASE_ANON_KEY
```

## 第 4 步：验证部署状态
完成上述步骤后，Vercel 会自动开始新的构建。你可以通过以下命令查看部署状态：

```bash
npx vercel list
```

如果状态显示为 `Ready`，说明部署成功。
