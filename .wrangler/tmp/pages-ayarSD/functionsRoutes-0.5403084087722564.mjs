import { onRequest as __api_items_js_onRequest } from "/Users/jorgenjunker/Desktop/Antigravity/Lager/functions/api/items.js"

export const routes = [
    {
      routePath: "/api/items",
      mountPath: "/api",
      method: "",
      middlewares: [],
      modules: [__api_items_js_onRequest],
    },
  ]