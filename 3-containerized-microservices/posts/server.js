const Koa = require("koa");
const Router = require("koa-router");

const posts = [
  { id: 1, threadId: 1, userId: 2, message: "Hello everyone!" },
  { id: 2, threadId: 2, userId: 3, message: "Use ALB path routing for services." },
];

function nextId(items) {
  return items.reduce((max, item) => Math.max(max, item.id), 0) + 1;
}

async function readJsonBody(req) {
  const chunks = [];
  for await (const chunk of req) chunks.push(chunk);
  const raw = Buffer.concat(chunks).toString("utf8").trim();
  if (!raw) return null;
  return JSON.parse(raw);
}

function createApp() {
  const app = new Koa();
  const router = new Router();

  router.get("/api/posts/in-thread/:threadId", async (ctx) => {
    const threadId = Number(ctx.params.threadId);
    ctx.body = posts.filter((p) => p.threadId === threadId);
  });

  router.post("/api/posts", async (ctx) => {
    const body = await readJsonBody(ctx.req);
    if (
      !body ||
      typeof body.threadId !== "number" ||
      typeof body.userId !== "number" ||
      typeof body.message !== "string"
    ) {
      ctx.throw(400, "Invalid body");
    }

    const post = {
      id: nextId(posts),
      threadId: body.threadId,
      userId: body.userId,
      message: body.message,
    };

    posts.push(post);
    ctx.status = 201;
    ctx.body = post;
  });

  app.use(async (ctx, next) => {
    try {
      await next();
    } catch (err) {
      ctx.status = err.status || 500;
      ctx.body = { error: err.message || "Internal Server Error" };
    }
  });

  app.use(router.routes());
  app.use(router.allowedMethods());
  return app;
}

const port = Number(process.env.PORT || 3000);
createApp().listen(port);
