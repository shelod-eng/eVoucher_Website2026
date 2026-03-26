import React, { useMemo } from "react";

const SHIPMENTS = [
  { id: "LGT-2401", merchant: "SuperPrecast", orderRef: "EV-100231", status: "created", eta: "2026-03-24", value: 1135.97 },
  { id: "LGT-2402", merchant: "Shoprite", orderRef: "EV-100232", status: "in_transit", eta: "2026-03-23", value: 500.0 },
  { id: "LGT-2403", merchant: "Pick n Pay", orderRef: "EV-100233", status: "delivered", eta: "2026-03-22", value: 1000.0 },
  { id: "LGT-2404", merchant: "SuperPrecast", orderRef: "EV-100234", status: "exception", eta: "2026-03-23", value: 63.25 },
];

const STATUS_CLASS = {
  created: "bg-blue-500/20 text-blue-200 border-blue-500/40",
  picked: "bg-cyan-500/20 text-cyan-200 border-cyan-500/40",
  in_transit: "bg-yellow-500/20 text-yellow-200 border-yellow-500/40",
  delivered: "bg-emerald-500/20 text-emerald-200 border-emerald-500/40",
  exception: "bg-red-500/20 text-red-200 border-red-500/40",
};

export default function Logistics() {
  const counts = useMemo(() => {
    return SHIPMENTS.reduce(
      (acc, item) => {
        acc.total += 1;
        acc[item.status] = (acc[item.status] || 0) + 1;
        return acc;
      },
      { total: 0, created: 0, picked: 0, in_transit: 0, delivered: 0, exception: 0 }
    );
  }, []);

  return (
    <div className="space-y-5">
      <div className="bg-white/5 border border-white/10 rounded-2xl p-5">
        <h1 className="text-3xl font-bold">Logistics Control Tower</h1>
        <p className="text-blue-100/70 mt-1">
          Shipment lifecycle tracking for voucher-linked orders and settlement readiness.
        </p>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-6 gap-3">
        <KpiCard title="Total" value={counts.total} />
        <KpiCard title="Created" value={counts.created} />
        <KpiCard title="Picked" value={counts.picked} />
        <KpiCard title="In Transit" value={counts.in_transit} />
        <KpiCard title="Delivered" value={counts.delivered} />
        <KpiCard title="Exceptions" value={counts.exception} danger />
      </div>

      <div className="bg-white/5 border border-white/10 rounded-2xl overflow-hidden">
        <div className="px-5 py-4 border-b border-white/10">
          <h2 className="text-xl font-semibold">Live Shipments</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-white/5">
              <tr className="text-left">
                <th className="px-4 py-3">Shipment ID</th>
                <th className="px-4 py-3">Merchant</th>
                <th className="px-4 py-3">Order Ref</th>
                <th className="px-4 py-3">ETA</th>
                <th className="px-4 py-3">Order Value</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3">Settlement Gate</th>
              </tr>
            </thead>
            <tbody>
              {SHIPMENTS.map((shipment) => (
                <tr key={shipment.id} className="border-t border-white/10">
                  <td className="px-4 py-3 font-medium">{shipment.id}</td>
                  <td className="px-4 py-3">{shipment.merchant}</td>
                  <td className="px-4 py-3">{shipment.orderRef}</td>
                  <td className="px-4 py-3">{shipment.eta}</td>
                  <td className="px-4 py-3">R{shipment.value.toFixed(2)}</td>
                  <td className="px-4 py-3">
                    <span className={`inline-flex rounded-full border px-2 py-1 text-xs font-medium ${STATUS_CLASS[shipment.status] || ""}`}>
                      {shipment.status.replace("_", " ")}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    {shipment.status === "delivered" ? (
                      <span className="text-emerald-300">Ready for settlement</span>
                    ) : shipment.status === "exception" ? (
                      <span className="text-red-300">Blocked: review required</span>
                    ) : (
                      <span className="text-blue-100/70">Await delivery confirmation</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

function KpiCard({ title, value, danger = false }) {
  return (
    <div className="bg-white/5 border border-white/10 rounded-xl p-4">
      <div className="text-xs text-blue-100/70">{title}</div>
      <div className={`text-2xl font-bold mt-1 ${danger ? "text-red-300" : "text-white"}`}>{value}</div>
    </div>
  );
}
