import SellerLayout from "../../components/seller/SellerLayout";

// Shared placeholder for seller sections not built yet in the current batch —
// keeps the sidebar nav fully clickable without any route 404ing while the
// rest of the seller dashboard is built out batch by batch.
export default function SellerComingSoon({ title, batch }) {
  return (
    <SellerLayout title={title}>
      <div style={s.wrap}>
        <div style={{ fontSize: 34, marginBottom: 10 }}>🚧</div>
        <div style={{ fontSize: 15, fontWeight: 700, color: "#111", marginBottom: 6 }}>
          {title} is coming soon
        </div>
        <div style={{ fontSize: 13, color: "#888", maxWidth: 360, margin: "0 auto" }}>
          {batch ? `This section is part of ${batch} and hasn't been built yet.` : "This section hasn't been built yet."}
        </div>
      </div>
    </SellerLayout>
  );
}

const s = {
  wrap: { background: "#fff", border: "1px solid #e8e4dc", borderRadius: 12, padding: "64px 24px", textAlign: "center" },
};
