export default function FactPanel() {
  return (
    <div className="rounded-xl border border-white/10 bg-white/5 p-5">
      <h3 className="text-base font-semibold mb-3">Quick Facts</h3>
      <div className="grid sm:grid-cols-2 gap-4 text-sm">
        <div>
          <div className="font-medium mb-1">Ports (from Redhills)</div>
          <ul className="list-disc pl-5 space-y-1">
            <li>Kamarajar (Ennore) ~20 km</li>
            <li>Kattupalli ~24 km</li>
            <li>Chennai Port ~22 km</li>
          </ul>
        </div>
        <div>
          <div className="font-medium mb-1">Airport</div>
          <p>Chennai International (MAA) ~30 km</p>
        </div>
        <div>
          <div className="font-medium mb-1">Warehousing</div>
          <ul className="list-disc pl-5 space-y-1">
            <li>DP World Redhills CFS (20.5 acres, ~45k TEUs p.a.)</li>
            <li>CWC – Chennai Region</li>
            <li>Private bonded: Redhills–Madhavaram–Manali</li>
          </ul>
        </div>
        <div>
          <div className="font-medium mb-1">Industrial Clusters</div>
          <ul className="list-disc pl-5 space-y-1">
            <li>Manali (petrochem/refining)</li>
            <li>Madhavaram (logistics)</li>
            <li>Gummidipoondi SIPCOT (heavy industry)</li>
            <li>Recycling belt (e-waste/metals)</li>
          </ul>
        </div>
      </div>
    </div>
  );
}