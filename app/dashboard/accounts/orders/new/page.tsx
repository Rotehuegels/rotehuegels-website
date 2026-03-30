import NewOrderForm from './NewOrderForm';

export default function NewOrderPage() {
  return (
    <div className="p-8">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-white">New Order</h1>
        <p className="mt-1 text-sm text-zinc-400">Record a new goods or service order</p>
      </div>
      <NewOrderForm />
    </div>
  );
}
