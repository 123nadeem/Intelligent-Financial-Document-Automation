import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import axios from 'axios';

interface Invoice {
  id: number;
  filename: string;
  vendor_name: string;
  invoice_number: string;
  invoice_date: string;
  due_date: string;
  total_amount: number;
  tax_amount: number;
  currency: string;
  status: string;
  raw_text: string;
  processed_data: string;
  confidence_score: number;
  created_at: string;
}

interface LineItem {
  id: number;
  description: string;
  quantity: number;
  unit_price: number;
  total_price: number;
}

const InvoiceDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const [invoice, setInvoice] = useState<Invoice | null>(null);
  const [lineItems, setLineItems] = useState<LineItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>('');

  useEffect(() => {
    if (id) {
      fetchInvoiceDetail(parseInt(id));
    }
  }, [id]);

  const fetchInvoiceDetail = async (invoiceId: number) => {
    try {
      const response = await axios.get(`http://localhost:8000/api/v1/invoices/${invoiceId}`);
      setInvoice(response.data.invoice);
      setLineItems(response.data.line_items || []);
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Failed to fetch invoice details');
    } finally {
      setLoading(false);
    }
  };

  const approveInvoice = async () => {
    if (!invoice) return;

    try {
      await axios.put(`http://localhost:8000/api/v1/invoices/${invoice.id}/approve`);
      setInvoice({ ...invoice, status: 'approved' });
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Failed to approve invoice');
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (error || !invoice) {
    return (
      <div className="text-center py-12">
        <p className="text-red-600">{error || 'Invoice not found'}</p>
        <Link
          to="/invoices"
          className="mt-4 inline-block bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
        >
          Back to Invoice List
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto">
      <div className="mb-6">
        <Link
          to="/invoices"
          className="text-blue-600 hover:text-blue-800 flex items-center"
        >
          ← Back to Invoice List
        </Link>
      </div>

      <div className="bg-white shadow overflow-hidden sm:rounded-lg">
        <div className="px-4 py-5 sm:px-6 flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">
              Invoice Details
            </h1>
            <p className="mt-1 max-w-2xl text-sm text-gray-500">
              Processed on {new Date(invoice.created_at).toLocaleDateString()}
            </p>
          </div>

          {invoice.status === 'pending' && (
            <button
              onClick={approveInvoice}
              className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700"
            >
              Approve Invoice
            </button>
          )}
        </div>

        <div className="border-t border-gray-200">
          <dl className="sm:divide-y sm:divide-gray-200">
            <div className="py-4 sm:py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
              <dt className="text-sm font-medium text-gray-500">Status</dt>
              <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">
                <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                  invoice.status === 'approved'
                    ? 'bg-green-100 text-green-800'
                    : invoice.status === 'rejected'
                    ? 'bg-red-100 text-red-800'
                    : 'bg-yellow-100 text-yellow-800'
                }`}>
                  {invoice.status}
                </span>
              </dd>
            </div>

            <div className="py-4 sm:py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
              <dt className="text-sm font-medium text-gray-500">Vendor</dt>
              <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">
                {invoice.vendor_name || 'Not specified'}
              </dd>
            </div>

            <div className="py-4 sm:py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
              <dt className="text-sm font-medium text-gray-500">Invoice Number</dt>
              <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">
                {invoice.invoice_number || 'Not specified'}
              </dd>
            </div>

            <div className="py-4 sm:py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
              <dt className="text-sm font-medium text-gray-500">Total Amount</dt>
              <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">
                {invoice.currency} {invoice.total_amount || '0.00'}
              </dd>
            </div>

            <div className="py-4 sm:py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
              <dt className="text-sm font-medium text-gray-500">Confidence Score</dt>
              <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">
                {Math.round((invoice.confidence_score || 0) * 100)}%
              </dd>
            </div>

            <div className="py-4 sm:py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
              <dt className="text-sm font-medium text-gray-500">Raw Extracted Text</dt>
              <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">
                <pre className="whitespace-pre-wrap bg-gray-50 p-4 rounded-lg text-xs max-h-64 overflow-y-auto">
                  {invoice.raw_text || 'No text extracted'}
                </pre>
              </dd>
            </div>
          </dl>
        </div>
      </div>
    </div>
  );
};

export default InvoiceDetail;