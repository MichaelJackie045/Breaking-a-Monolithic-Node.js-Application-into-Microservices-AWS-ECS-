const Koa = require("koa");
const Router = require("koa-router");

const users = [
  { id: 1, name: "Ava" },
  { id: 2, name: "Noah" },
  { id: 3, name: "Mia" },
];

function createApp() {
  const app = new Koa();
  const router = new Router();

  router.get("/api/users", async (ctx) => {
    ctx.body = users;
  });

  router.get("/api/users/:id", async (ctx) => {
    const id = Number(ctx.params.id);
    const user = users.find((u) => u.id === id);
    if (!user) ctx.throw(404, "User not found");
    ctx.body = user;
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
