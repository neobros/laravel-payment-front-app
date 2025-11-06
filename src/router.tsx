import { createBrowserRouter } from "react-router-dom";
import Login from "./pages/Login";
import Register from "./pages/Register";
import MyPayments from "./pages/MyPayments";
import AdminUpload from "./pages/AdminUpload";
import AdminBatches from "./pages/AdminBatches";
import ProtectedRoute from "./lib/ProtectedRoute";
import AdminRoute from "./lib/AdminRoute";

export const router = createBrowserRouter([
  { path: "/login", element: <Login /> },
  { path: "/register", element: <Register /> },

  { path: "/", element:
    //   <ProtectedRoute><MyPayments /></ProtectedRoute>
      <AdminRoute><AdminUpload /></AdminRoute>
  },

  { path: "/user/home", element:
    <ProtectedRoute><MyPayments /></ProtectedRoute>
  },

  { path: "/admin/upload", element:
      <AdminRoute><AdminUpload /></AdminRoute>
  },
  { path: "/admin/batches", element:
      <AdminRoute><AdminBatches /></AdminRoute>
  },

  { path: "*", element: <Login /> },
]);
