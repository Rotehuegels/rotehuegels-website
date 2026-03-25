export default function AddEmployee() {
  return (
    <main className="p-10 max-w-4xl">
      <h1 className="text-2xl font-semibold mb-8">
        Register New Employee
      </h1>

      <form className="grid gap-6">

        <h2 className="text-lg font-semibold">Basic Information</h2>

        <input className="input" placeholder="Full Name" />

        <select className="input">
          <option>Employment Type</option>
          <option>Full Time</option>
          <option>Part Time</option>
          <option>Consultant</option>
          <option>Contract</option>
        </select>

        <input className="input" placeholder="Role / Designation" />

        <input className="input" placeholder="Reporting Manager" />

        <h2 className="text-lg font-semibold mt-6">Contact</h2>

        <input className="input" placeholder="Phone Number" />

        <input className="input" placeholder="Email" />

        <textarea className="input" placeholder="Address" />

        <h2 className="text-lg font-semibold mt-6">Identity</h2>

        <input className="input" placeholder="Aadhaar / SSN / National ID" />

        <h2 className="text-lg font-semibold mt-6">Bank Details</h2>

        <input className="input" placeholder="Bank Name" />

        <input className="input" placeholder="Account Number" />

        <input className="input" placeholder="IFSC / Routing Code" />

        <h2 className="text-lg font-semibold mt-6">Emergency Contact</h2>

        <input className="input" placeholder="Emergency Contact Name" />

        <input className="input" placeholder="Emergency Phone Number" />

        <h2 className="text-lg font-semibold mt-6">Salary</h2>

        <input className="input" placeholder="Basic Salary" />

        <input className="input" placeholder="Allowance" />

        <input className="input" placeholder="Bonus" />

        <button className="bg-red-600 p-3 rounded text-white">
          Register Employee
        </button>

      </form>
    </main>
  );
}