import { createBrowserRouter } from "react-router";
import { RootLayout } from "./layouts/RootLayout";
import { FeedPage } from "./pages/FeedPage";
import { ModelsPage } from "./pages/ModelsPage";
import { BookmarksPage } from "./pages/BookmarksPage";
import { LoginPage } from "./pages/LoginPage";
import { RegisterPage } from "./pages/RegisterPage";

export const router = createBrowserRouter([
  {
    path: "/",
    Component: RootLayout,
    children: [
      { index: true, Component: FeedPage },
      { path: "models", Component: ModelsPage },
      { path: "bookmarks", Component: BookmarksPage },
      { path: "login", Component: LoginPage },
      { path: "register", Component: RegisterPage },
    ],
  },
]);
