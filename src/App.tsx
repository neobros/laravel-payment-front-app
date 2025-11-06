import { RouterProvider } from "react-router-dom";
import { router } from "./router";
import { AuthProvider } from "./lib/auth";
import "./styles.css";

export default function App() {
  return (
    <AuthProvider>
      <RouterProvider router={router} />
    </AuthProvider>
  );
}
