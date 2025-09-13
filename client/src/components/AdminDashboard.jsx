import { useEffect, useState } from "react";

export default function AdminDashboard({ token }) {
  const [users, setUsers] = useState([]);
  const [orders, setOrders] = useState([]);

  useEffect(() => {
    fetch("http://localhost:4000/api/admin/users", {
      headers: { Authorization: "Bearer " + token },
    })
      .then((res) => res.json())
      .then(setUsers);

    fetch("http://localhost:4000/api/admin/orders", {
      headers: { Authorization: "Bearer " + token },
    })
      .then((res) => res.json())
      .then(setOrders);
  }, [token]);

  return (
    <div>
      <h2>Admin Dashboard</h2>
      <h3>Users</h3>
      <ul>
        {users.map((u) => (
          <li key={u.id}>{u.email} ({u.role})</li>
        ))}
      </ul>

      <h3>Orders</h3>
      <ul>
        {orders.map((o) => (
          <li key={o.id}>Order #{o.id} - ${o.total / 100} - {o.status}</li>
        ))}
      </ul>
    </div>
  );
}
