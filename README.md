# 网页合集

一个静态网页导航合集。

## 文件结构

- `index.html` — 合集页（访问根域名看到的导航页）
- `love.html` — 情侣纪念网页（合集页点卡片跳转过来）

## 本地预览

任意一种：

```bash
python -m http.server 8000
# 浏览器打开 http://localhost:8000
```

或直接双击 `index.html` 用浏览器打开。

## 加新网页

编辑 `index.html` 里第 130 行附近的 `PAGES` 数组，复制一段改成你的：

```js
{
  title: "新网页的名字",
  desc: "一句话描述。",
  url: "新网页文件名.html",
  cat: "工具",
  badge: "new",
  date: "2026-11-xx"
},
```

把新网页文件丢进同一目录，重新提交即可。
