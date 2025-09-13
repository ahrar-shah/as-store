import { useEffect, useState } from "react";

export default function SellerDashboard({ token }) {
  const [title, setTitle] = useState("");
  const [desc, setDesc] = useState("");
  const [price, setPrice] = useState("");

  async function addProduct() {
    await fetch("http://localhost:4000/api/seller/products", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: "Bearer " + token,
      },
      body: JSON.stringify({ title, description: desc, price: parseInt(price) }),
    });
    alert("Product added!");
  }

  return (
    <div>
      <h2>Seller Dashboard</h2>
      <input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="title" />
      <input value={desc} onChange={(e) => setDesc(e.target.value)} placeholder="description" />
      <input value={price} onChange={(e) => setPrice(e.target.value)} placeholder="price (cents)" />
      <button onClick={addProduct}>Add Product</button>
    </div>
  );
}
