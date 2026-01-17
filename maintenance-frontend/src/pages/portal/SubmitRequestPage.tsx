import { RequestForm } from '../../components/portal';

export function SubmitRequestPage() {
  return (
    <div className="max-w-2xl mx-auto">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Submit a Service Request</h1>
        <p className="mt-2 text-gray-500">
          Please provide details about your maintenance issue and we'll get it resolved as soon as possible.
        </p>
      </div>

      <RequestForm />
    </div>
  );
}
