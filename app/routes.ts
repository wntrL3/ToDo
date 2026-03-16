import { type RouteConfig, index, route } from "@react-router/dev/routes";

export default [
  index("routes/root-redirect.tsx"),
  route("login", "routes/login.tsx"),
  route("signup", "routes/signup.tsx"),
  route("todos", "routes/todos.tsx"),
  route("logout", "routes/logout.tsx")
] satisfies RouteConfig;