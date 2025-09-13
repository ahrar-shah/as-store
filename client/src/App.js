import { useState } from "react";
import Login from "./components/Login";
import Register from "./components/Register";
import Products from "./components/Products";
import SellerDashboard from "./components/SellerDashboard";
import AdminDashboard from "./components/AdminDashboard";

function App() {
  const [token, setToken] = useState(null);
  const [role, setRole] = useState(null);

  return (
    <div style={{ padding: 20 }}>
      <h1>AS Store</h1>

      {!token && (
        <>
          <Register />
          <Login setToken={setToken} setRole={setRole} />
        </>
      )}

      {token && role === "buyer" && (
        <Products token={token} />
      )}

      {token && role === "seller" && (
        <SellerDashboard token={token} />
      )}

      {token && role === "admin" && (
        <AdminDashboard token={token} />
      )}
    </div>
  );
}

export default App;
