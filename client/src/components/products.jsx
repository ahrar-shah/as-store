import { useEffect, useState } from "react";

export default function Products({ token }) {
  const [products, setProducts] = useState([]);

  useEffect(() => {
    fetch("http://localhost:4000/api/products")
      .then((res) => res.json())
      .then(setProducts);
  }, []);

  async function checkout(id) {
    const res = await fetch("http://localhost:4000/api/checkout", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: "Bearer " + token,
      },
      body: JSON.stringify({ items: [{ id, qty: 1 }] }),
    });
    const data = await res.json();
    alert("Payment intent created: " + data.clientSecret);
  }

  return (
    <div>
      <h2>Products</h2>
      {products.map((p) => (
        <div key={p.id}>
          {p.title} - ${p.price / 100}
          <button onClick={() => checkout(p.id)}>Buy</button>
        </div>
      ))}
    </div>
  );
}
