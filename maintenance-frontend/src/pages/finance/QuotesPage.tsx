import { useState, useEffect } from 'react';
import { financeApi, Quote, QuoteStatus, Company, companyApi } from '../../services/api';

interface QuoteFormData {
  clientId: string;
  description?: string;
  validUntil: string;
  lineItems: {
    description: string;
    quantity: number;
    unitPrice: number;
    discount?: number;
  }[];
  terms?: string;
  notes?: string;
}

export function QuotesPage() {
  const [quotes, setQuotes] = useState<Quote[]>([]);
  const [clients, setClients] = useState<Company[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingQuote, setEditingQuote] = useState<Quote | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<QuoteStatus | 'all'>('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalQuotes, setTotalQuotes] = useState(0);
  const [formData, setFormData] = useState<QuoteFormData>({
    clientId: '',
    description: '',
    validUntil: '',
    lineItems: [{ description: '', quantity: 1, unitPrice: 0, discount: 0 }],
    terms: '',
    notes: '',
  });

  const limit = 10;
  const totalPages = Math.ceil(totalQuotes / limit);

  useEffect(() => {
    loadQuotes();
    loadClients();
  }, [currentPage, statusFilter]);

  const loadQuotes = async () => {
    setLoading(true);
    try {
      const response = await financeApi.quotes.getAll({
        page: currentPage,
        limit,
        status: statusFilter !== 'all' ? statusFilter : undefined,
        search: searchQuery || undefined,
      });
      setQuotes(response.data || []);
      setTotalQuotes(response.total || 0);
    } catch (error) {
      console.error('Failed to load quotes:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadClients = async () => {
    try {
      const response = await companyApi.getAll({ limit: 100 });
      setClients(response.data || response || []);
    } catch (error) {
      console.error('Failed to load clients:', error);
    }
  };

  const handleSearch = () => {
    setCurrentPage(1);
    loadQuotes();
  };

  const handleCreateQuote = () => {
    setEditingQuote(null);
    setFormData({
      clientId: '',
      description: '',
      validUntil: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      lineItems: [{ description: '', quantity: 1, unitPrice: 0, discount: 0 }],
      terms: 'This quote is valid for 30 days from the date of issue.',
      notes: '',
    });
    setShowModal(true);
  };

  const handleEditQuote = (quote: Quote) => {
    setEditingQuote(quote);
    setFormData({
      clientId: quote.clientId,
      description: quote.description || '',
      validUntil: quote.validUntil.split('T')[0],
      lineItems: (quote.lineItems || []).map((item) => ({
        description: item.description,
        quantity: item.quantity,
        unitPrice: item.unitPrice,
      })),
      terms: quote.terms || '',
      notes: quote.notes || '',
    });
    setShowModal(true);
  };

  const handleDeleteQuote = async (id: string) => {
    if (!window.confirm('Are you sure you want to delete this quote?')) return;
    try {
      await financeApi.quotes.delete(id);
      loadQuotes();
    } catch (error) {
      console.error('Failed to delete quote:', error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const quoteData = {
        ...formData,
        lineItems: formData.lineItems.map((item) => ({
          ...item,
          id: '',
          quoteId: editingQuote?.id || '',
          amount: item.quantity * item.unitPrice * (1 - (item.discount || 0) / 100),
        })),
      };
      if (editingQuote) {
        await financeApi.quotes.update(editingQuote.id, quoteData);
      } else {
        await financeApi.quotes.create(quoteData);
      }
      setShowModal(false);
      loadQuotes();
    } catch (error) {
      console.error('Failed to save quote:', error);
    }
  };

  const handleSendQuote = async (id: string) => {
    try {
      await financeApi.quotes.sendToClient(id);
      loadQuotes();
    } catch (error) {
      console.error('Failed to send quote:', error);
    }
  };

  const handleConvertToWorkOrder = async (id: string) => {
    try {
      await financeApi.quotes.convertToWorkOrder(id);
      loadQuotes();
      alert('Quote has been converted to a work order successfully!');
    } catch (error) {
      console.error('Failed to convert quote:', error);
    }
  };

  const addLineItem = () => {
    setFormData({
      ...formData,
      lineItems: [...formData.lineItems, { description: '', quantity: 1, unitPrice: 0, discount: 0 }],
    });
  };

  const removeLineItem = (index: number) => {
    setFormData({
      ...formData,
      lineItems: formData.lineItems.filter((_, i) => i !== index),
    });
  };

  const updateLineItem = (index: number, field: string, value: string | number) => {
    const newItems = [...formData.lineItems];
    newItems[index] = { ...newItems[index], [field]: value };
    setFormData({ ...formData, lineItems: newItems });
  };

  const calculateSubtotal = () => {
    return formData.lineItems.reduce((sum, item) => sum + item.quantity * item.unitPrice, 0);
  };

  const calculateDiscount = () => {
    return formData.lineItems.reduce(
      (sum, item) => sum + item.quantity * item.unitPrice * ((item.discount || 0) / 100),
      0
    );
  };

  const calculateTotal = () => {
    return calculateSubtotal() - calculateDiscount();
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(amount);
  };

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  const getStatusColor = (status: QuoteStatus) => {
    const colors: Record<QuoteStatus, string> = {
      draft: 'bg-gray-100 text-gray-800',
      sent: 'bg-blue-100 text-blue-800',
      viewed: 'bg-purple-100 text-purple-800',
      accepted: 'bg-green-100 text-green-800',
      rejected: 'bg-red-100 text-red-800',
      expired: 'bg-yellow-100 text-yellow-800',
      converted: 'bg-teal-100 text-teal-800',
    };
    return colors[status];
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Quotes & Estimates</h1>
          <p className="text-gray-500 mt-1">Create and manage customer quotes</p>
        </div>
        <button
          onClick={handleCreateQuote}
          className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          Create Quote
        </button>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1">
            <div className="relative">
              <input
                type="text"
                placeholder="Search quotes..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                className="w-full pl-10 pr-4 py-2 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <svg
                className="w-5 h-5 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                />
              </svg>
            </div>
          </div>
          <select
            value={statusFilter}
            onChange={(e) => {
              setStatusFilter(e.target.value as QuoteStatus | 'all');
              setCurrentPage(1);
            }}
            className="px-4 py-2 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="all">All Status</option>
            <option value="draft">Draft</option>
            <option value="sent">Sent</option>
            <option value="viewed">Viewed</option>
            <option value="accepted">Accepted</option>
            <option value="rejected">Rejected</option>
            <option value="expired">Expired</option>
            <option value="converted">Converted</option>
          </select>
          <button
            onClick={handleSearch}
            className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
          >
            Search
          </button>
        </div>
      </div>

      {/* Quotes Table */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Quote #
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Client
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Title
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Amount
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Valid Until
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {quotes.map((quote) => (
                  <tr key={quote.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="font-medium text-gray-900">{quote.quoteNumber}</span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="text-gray-600">{quote.client?.name || 'N/A'}</span>
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-gray-900">{quote.description || 'No description'}</span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="font-medium text-gray-900">
                        {formatCurrency(quote.totalAmount)}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span
                        className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(
                          quote.status
                        )}`}
                      >
                        {quote.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-gray-500">
                      {formatDate(quote.validUntil)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right">
                      <div className="flex items-center justify-end space-x-2">
                        {quote.status === 'draft' && (
                          <button
                            onClick={() => handleSendQuote(quote.id)}
                            className="p-1 text-blue-600 hover:text-blue-800"
                            title="Send Quote"
                          >
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                            </svg>
                          </button>
                        )}
                        {quote.status === 'accepted' && (
                          <button
                            onClick={() => handleConvertToWorkOrder(quote.id)}
                            className="p-1 text-green-600 hover:text-green-800"
                            title="Convert to Work Order"
                          >
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
                            </svg>
                          </button>
                        )}
                        <button
                          onClick={() => handleEditQuote(quote)}
                          className="p-1 text-gray-600 hover:text-gray-800"
                          title="Edit"
                        >
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                          </svg>
                        </button>
                        <button
                          onClick={() => handleDeleteQuote(quote.id)}
                          className="p-1 text-red-600 hover:text-red-800"
                          title="Delete"
                        >
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                          </svg>
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
                {quotes.length === 0 && (
                  <tr>
                    <td colSpan={7} className="px-6 py-12 text-center text-gray-500">
                      No quotes found
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="px-6 py-4 border-t border-gray-200 flex items-center justify-between">
            <button
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              disabled={currentPage === 1}
              className="px-3 py-1 text-sm text-gray-600 hover:text-gray-900 disabled:opacity-50"
            >
              Previous
            </button>
            <span className="text-sm text-gray-500">
              Page {currentPage} of {totalPages}
            </span>
            <button
              onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages}
              className="px-3 py-1 text-sm text-gray-600 hover:text-gray-900 disabled:opacity-50"
            >
              Next
            </button>
          </div>
        )}
      </div>

      {/* Quote Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex min-h-screen items-center justify-center p-4">
            <div className="fixed inset-0 bg-black bg-opacity-50" onClick={() => setShowModal(false)}></div>
            <div className="relative bg-white rounded-xl shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
              <div className="p-6 border-b border-gray-200">
                <h2 className="text-xl font-bold text-gray-900">
                  {editingQuote ? 'Edit Quote' : 'Create Quote'}
                </h2>
              </div>
              <form onSubmit={handleSubmit} className="p-6 space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Client *</label>
                    <select
                      value={formData.clientId}
                      onChange={(e) => setFormData({ ...formData, clientId: e.target.value })}
                      required
                      className="w-full px-3 py-2 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="">Select Client</option>
                      {clients.map((client) => (
                        <option key={client.id} value={client.id}>
                          {client.name}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Valid Until *</label>
                    <input
                      type="date"
                      value={formData.validUntil}
                      onChange={(e) => setFormData({ ...formData, validUntil: e.target.value })}
                      required
                      className="w-full px-3 py-2 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Description *</label>
                  <textarea
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    rows={2}
                    required
                    className="w-full px-3 py-2 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="e.g., HVAC System Maintenance Proposal - Brief description of the quote..."
                  />
                </div>

                {/* Line Items */}
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <label className="block text-sm font-medium text-gray-700">Line Items</label>
                    <button
                      type="button"
                      onClick={addLineItem}
                      className="text-sm text-blue-600 hover:text-blue-700 font-medium"
                    >
                      + Add Item
                    </button>
                  </div>
                  <div className="space-y-3">
                    {formData.lineItems.map((item, index) => (
                      <div key={index} className="flex items-start space-x-3 p-3 bg-gray-50 rounded-lg">
                        <div className="flex-1">
                          <input
                            type="text"
                            placeholder="Description"
                            value={item.description}
                            onChange={(e) => updateLineItem(index, 'description', e.target.value)}
                            required
                            className="w-full px-3 py-2 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
                          />
                        </div>
                        <div className="w-20">
                          <input
                            type="number"
                            placeholder="Qty"
                            value={item.quantity}
                            onChange={(e) => updateLineItem(index, 'quantity', parseInt(e.target.value) || 0)}
                            min="1"
                            required
                            className="w-full px-3 py-2 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
                          />
                        </div>
                        <div className="w-28">
                          <input
                            type="number"
                            placeholder="Unit Price"
                            value={item.unitPrice}
                            onChange={(e) => updateLineItem(index, 'unitPrice', parseFloat(e.target.value) || 0)}
                            step="0.01"
                            min="0"
                            required
                            className="w-full px-3 py-2 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
                          />
                        </div>
                        <div className="w-20">
                          <input
                            type="number"
                            placeholder="Disc %"
                            value={item.discount || 0}
                            onChange={(e) => updateLineItem(index, 'discount', parseFloat(e.target.value) || 0)}
                            step="0.01"
                            min="0"
                            max="100"
                            className="w-full px-3 py-2 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
                          />
                        </div>
                        <div className="w-28 text-right font-medium text-gray-900 py-2">
                          {formatCurrency(item.quantity * item.unitPrice * (1 - (item.discount || 0) / 100))}
                        </div>
                        {formData.lineItems.length > 1 && (
                          <button
                            type="button"
                            onClick={() => removeLineItem(index)}
                            className="p-2 text-red-500 hover:text-red-700"
                          >
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                          </button>
                        )}
                      </div>
                    ))}
                  </div>

                  {/* Totals */}
                  <div className="mt-4 pt-4 border-t border-gray-200">
                    <div className="flex justify-end">
                      <div className="w-64 space-y-2">
                        <div className="flex justify-between text-sm">
                          <span className="text-gray-500">Subtotal:</span>
                          <span className="font-medium">{formatCurrency(calculateSubtotal())}</span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span className="text-gray-500">Discount:</span>
                          <span className="font-medium text-red-600">-{formatCurrency(calculateDiscount())}</span>
                        </div>
                        <div className="flex justify-between text-lg font-bold border-t pt-2">
                          <span>Total:</span>
                          <span>{formatCurrency(calculateTotal())}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Terms & Conditions</label>
                  <textarea
                    value={formData.terms}
                    onChange={(e) => setFormData({ ...formData, terms: e.target.value })}
                    rows={2}
                    className="w-full px-3 py-2 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Payment terms, warranty information, etc."
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Notes</label>
                  <textarea
                    value={formData.notes}
                    onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                    rows={2}
                    className="w-full px-3 py-2 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Internal notes..."
                  />
                </div>

                <div className="flex justify-end space-x-3 pt-4 border-t border-gray-200">
                  <button
                    type="button"
                    onClick={() => setShowModal(false)}
                    className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                  >
                    {editingQuote ? 'Update Quote' : 'Create Quote'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
