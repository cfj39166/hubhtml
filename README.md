# 网页合集 hub

一个静态网页导航合集。

## 文件结构

- `index.html` — 与 `hub.html` 同步，作为 GitHub Pages 的入口（访问根域名直接看到合集）
- `hub.html` — 合集页（你实际编辑这个文件）
- `love.html` — 情侣纪念网页（合集页第一张卡片跳转过来）

> 后续新增网页时，编辑 `hub.html` 加卡片，然后 `cp hub.html index.html` 同步入口即可。

## 本地预览

```bash
python -m http.server 8000
# 浏览器打开 http://localhost:8000
```

## 加新网页

编辑 `hub.html` 里第 130 行附近的 `PAGES` 数组，复制一段改成你的：

```js
{
  title: "新网页的名字",
  desc: "一句话描述。",
  url: "新网页文件名.html",   // 同目录下的文件，部署后自动拼成完整 URL
  cat: "工具",                // 随便起个分类
  badge: "new",               // hot / new / 留空
  date: "2026-11-xx"
},
```

把新网页文件丢进同一目录，然后同步入口：

```bash
cp hub.html index.html
git add .
git commit -m "新增 xxx 网页"
git push
```

GitHub Pages 会自动重新部署，1-2 分钟后刷新链接就能看到新卡片。
