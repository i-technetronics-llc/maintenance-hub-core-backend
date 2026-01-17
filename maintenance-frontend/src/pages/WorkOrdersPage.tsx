import { useState, useEffect, useRef } from 'react';
import { api, inventoryApi, inventoryMasterApi, userApi, companyApi, workOrderApi, priceBookApi, boqApi, WorkOrder, Company, Inventory, Service, PriceBook, PriceBookItem } from '../services/api';
import { useAuthStore } from '../store/authStore';
import { useOrganizationStore } from '../store/organizationStore';

interface InventoryStatus {
  available: boolean;
  partial: boolean;
  itemCount: number;
  availableCount: number;
}

interface ChecklistItem {
  item: string;
  completed: boolean;
  mandatory: boolean;
  itemType: 'task' | 'product' | 'service';
  inventoryId?: string;
  inventoryName?: string;
  serviceId?: string;
  serviceName?: string;
}

interface User {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
}

interface WorkOrderFormData {
  title: string;
  description: string;
  type: string;
  priority: string;
  status: string;
  riskLevel: string;
  urgency: string;
  assignedToId: string;
  companyId: string;
  scheduledDate: string;
  dueDate: string;
  estimatedCost: string;
  checklist: ChecklistItem[];
}

const defaultFormData: WorkOrderFormData = {
  title: '',
  description: '',
  type: 'corrective',
  priority: 'medium',
  status: 'draft',
  riskLevel: 'low',
  urgency: 'normal',
  assignedToId: '',
  companyId: '',
  scheduledDate: '',
  dueDate: '',
  estimatedCost: '',
  checklist: [],
};

const WORK_ORDER_STATUSES = [
  { value: 'DRAFT', label: 'Draft', color: 'bg-gray-100 text-gray-800 border-gray-200' },
  { value: 'PENDING_APPROVAL', label: 'Pending Approval', color: 'bg-yellow-100 text-yellow-800 border-yellow-200' },
  { value: 'APPROVED', label: 'Approved', color: 'bg-blue-100 text-blue-800 border-blue-200' },
  { value: 'ASSIGNED', label: 'Assigned', color: 'bg-purple-100 text-purple-800 border-purple-200' },
  { value: 'IN_PROGRESS', label: 'In Progress', color: 'bg-indigo-100 text-indigo-800 border-indigo-200' },
  { value: 'COMPLETED', label: 'Completed', color: 'bg-green-100 text-green-800 border-green-200' },
  { value: 'CLOSED', label: 'Closed', color: 'bg-gray-100 text-gray-800 border-gray-200' },
  { value: 'CANCELLED', label: 'Cancelled', color: 'bg-red-100 text-red-800 border-red-200' },
];

export default function WorkOrdersPage() {
  const { isSuperAdmin } = useAuthStore();
  const { selectedOrganization } = useOrganizationStore();
  const [workOrders, setWorkOrders] = useState<WorkOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [inventoryStatus, setInventoryStatus] = useState<Record<string, InventoryStatus>>({});
  const [selectedWorkOrder, setSelectedWorkOrder] = useState<WorkOrder | null>(null);
  const [showDetailDrawer, setShowDetailDrawer] = useState(false);
  const [viewMode, setViewMode] = useState<'table' | 'calendar' | 'kanban'>('table');
  const [currentMonth, setCurrentMonth] = useState(new Date());

  // Calendar date modal
  const [showDateModal, setShowDateModal] = useState(false);
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [selectedDateWorkOrders, setSelectedDateWorkOrders] = useState<WorkOrder[]>([]);

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [searchQuery, setSearchQuery] = useState('');

  // Companies for super admin
  const [companies, setCompanies] = useState<Company[]>([]);
  const [companyFilter, setCompanyFilter] = useState('');
  const [companySearchQuery, setCompanySearchQuery] = useState('');
  const [showCompanySuggestions, setShowCompanySuggestions] = useState(false);
  const companySearchRef = useRef<HTMLDivElement>(null);

  // Create Work Order State
  const [showCreateDrawer, setShowCreateDrawer] = useState(false);
  const [formData, setFormData] = useState<WorkOrderFormData>(defaultFormData);
  const [users, setUsers] = useState<User[]>([]);
  const [userSearchQuery, setUserSearchQuery] = useState('');
  const [showUserSuggestions, setShowUserSuggestions] = useState(false);
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [newChecklistItem, setNewChecklistItem] = useState('');
  const [isMandatory, setIsMandatory] = useState(false);
  const [checklistItemType, setChecklistItemType] = useState<'task' | 'product' | 'service'>('task');
  const [inventoryList, setInventoryList] = useState<Inventory[]>([]);
  const [servicesList, setServicesList] = useState<Service[]>([]);
  const [selectedInventoryId, setSelectedInventoryId] = useState('');
  const [selectedServiceId, setSelectedServiceId] = useState('');
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const userSearchRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // BOQ State
  const [showBOQDrawer, setShowBOQDrawer] = useState(false);
  const [boqWorkOrder, setBOQWorkOrder] = useState<WorkOrder | null>(null);
  const [boqItems, setBOQItems] = useState<Array<{
    itemType: 'inventory' | 'service' | 'custom';
    itemId?: string;
    name: string;
    description: string;
    quantity: number;
    unit: string;
    inventoryPrice: number;
    priceBookPrice: number;
    enteredPrice: string;
  }>>([]);
  const [boqPriceBooks, setBOQPriceBooks] = useState<PriceBook[]>([]);
  const [selectedPriceBookId, setSelectedPriceBookId] = useState('');
  const [boqTitle, setBOQTitle] = useState('');
  const [boqDescription, setBOQDescription] = useState('');
  const [boqTaxRate, setBOQTaxRate] = useState('');
  const [boqDiscount, setBOQDiscount] = useState('');
  const [boqNotes, setBOQNotes] = useState('');
  const [boqLoading, setBOQLoading] = useState(false);

  useEffect(() => {
    fetchWorkOrders();
    fetchUsers();
    fetchInventoryItems();
    fetchServices();
    if (isSuperAdmin()) {
      fetchCompanies();
    }
  }, [currentPage, itemsPerPage, searchQuery, companyFilter, selectedOrganization]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (userSearchRef.current && !userSearchRef.current.contains(event.target as Node)) {
        setShowUserSuggestions(false);
      }
      if (companySearchRef.current && !companySearchRef.current.contains(event.target as Node)) {
        setShowCompanySuggestions(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const fetchWorkOrders = async () => {
    try {
      setLoading(true);
      // Use selected organization for super admin, or fall back to company filter
      const orgId = selectedOrganization?.id || companyFilter || undefined;

      const result = await workOrderApi.getAll({
        page: currentPage,
        limit: itemsPerPage,
        search: searchQuery || undefined,
        companyId: orgId,
      });
      setWorkOrders(result.data || []);
      setTotalPages(result.totalPages || 1);
      setTotalItems(result.total || 0);
      await checkInventoryForWorkOrders(result.data || []);
    } catch (error) {
      console.error('Error fetching work orders:', error);
      setWorkOrders([]);
    } finally {
      setLoading(false);
    }
  };

  const fetchUsers = async () => {
    try {
      const response = await userApi.getAll();
      setUsers(Array.isArray(response) ? response : []);
    } catch (error) {
      console.error('Error fetching users:', error);
      setUsers([]);
    }
  };

  const fetchCompanies = async () => {
    try {
      const response = await companyApi.getAll({ limit: 100 });
      const data = response?.data || response || [];
      setCompanies(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error('Error fetching companies:', error);
      setCompanies([]);
    }
  };

  const fetchInventoryItems = async () => {
    try {
      const response = await inventoryApi.getAll({ limit: 100, status: 'active' });
      const data = response?.data || response || [];
      setInventoryList(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error('Error fetching inventory:', error);
      setInventoryList([]);
    }
  };

  const fetchServices = async () => {
    try {
      const data = await inventoryMasterApi.services.getAll({ isActive: true });
      setServicesList(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error('Error fetching services:', error);
      setServicesList([]);
    }
  };

  // BOQ Functions
  const handleOpenBOQ = async (workOrder: WorkOrder) => {
    setBOQWorkOrder(workOrder);
    setBOQTitle(`BOQ - ${workOrder.woNumber || workOrder.title}`);
    setBOQDescription(workOrder.description || '');
    setBOQNotes('');
    setBOQTaxRate('');
    setBOQDiscount('');
    setSelectedPriceBookId('');

    // Fetch price books for the organization
    if (workOrder.clientOrganization?.id) {
      try {
        const priceBooks = await priceBookApi.getByOrganization(workOrder.clientOrganization.id);
        setBOQPriceBooks(priceBooks);
      } catch (error) {
        console.error('Error fetching price books:', error);
        setBOQPriceBooks([]);
      }
    }

    // Populate BOQ items from checklist
    const items: typeof boqItems = [];
    if (workOrder.checklist) {
      for (const checklistItem of workOrder.checklist) {
        const itemType = checklistItem.itemType || 'custom';
        let inventoryPrice = 0;
        let unit = '';

        if (itemType === 'product' && checklistItem.inventoryId) {
          const invItem = inventoryList.find(i => i.id === checklistItem.inventoryId);
          if (invItem) {
            inventoryPrice = invItem.unitPrice || 0;
            unit = invItem.unit || 'each';
          }
        } else if (itemType === 'service' && checklistItem.serviceId) {
          const svcItem = servicesList.find(s => s.id === checklistItem.serviceId);
          if (svcItem) {
            inventoryPrice = svcItem.unitPrice || 0;
            unit = svcItem.unit || 'hour';
          }
        }

        items.push({
          itemType: itemType === 'task' ? 'custom' : itemType as 'inventory' | 'service' | 'custom',
          itemId: checklistItem.inventoryId || checklistItem.serviceId,
          name: checklistItem.item,
          description: '',
          quantity: 1,
          unit: unit || 'each',
          inventoryPrice,
          priceBookPrice: 0,
          enteredPrice: inventoryPrice.toString(),
        });
      }
    }
    setBOQItems(items);
    setShowBOQDrawer(true);
  };

  const handlePriceBookChange = async (priceBookId: string) => {
    setSelectedPriceBookId(priceBookId);
    if (!priceBookId) {
      // Reset to inventory prices
      setBOQItems(items => items.map(item => ({
        ...item,
        priceBookPrice: 0,
        enteredPrice: item.inventoryPrice.toString(),
      })));
      return;
    }

    try {
      const priceBookItems = await priceBookApi.items.getAll(priceBookId);
      setBOQItems(items => items.map(item => {
        const pbItem = priceBookItems.find(
          (pbi: PriceBookItem) => pbi.itemId === item.itemId
        );
        if (pbItem) {
          return {
            ...item,
            priceBookPrice: pbItem.unitPrice,
            enteredPrice: pbItem.unitPrice.toString(),
          };
        }
        return item;
      }));
    } catch (error) {
      console.error('Error fetching price book items:', error);
    }
  };

  const handleBOQItemChange = (index: number, field: string, value: any) => {
    setBOQItems(items => items.map((item, i) =>
      i === index ? { ...item, [field]: value } : item
    ));
  };

  const handleAddCustomBOQItem = () => {
    setBOQItems(items => [...items, {
      itemType: 'custom',
      name: '',
      description: '',
      quantity: 1,
      unit: 'each',
      inventoryPrice: 0,
      priceBookPrice: 0,
      enteredPrice: '0',
    }]);
  };

  const handleRemoveBOQItem = (index: number) => {
    setBOQItems(items => items.filter((_, i) => i !== index));
  };

  const calculateBOQTotals = () => {
    const subtotal = boqItems.reduce((sum, item) => {
      const price = parseFloat(item.enteredPrice) || 0;
      return sum + (price * item.quantity);
    }, 0);
    const taxRate = parseFloat(boqTaxRate) || 0;
    const discount = parseFloat(boqDiscount) || 0;
    const taxAmount = subtotal * (taxRate / 100);
    const total = subtotal + taxAmount - discount;
    return { subtotal, taxAmount, total };
  };

  const handleSaveBOQ = async () => {
    if (!boqWorkOrder) return;

    setBOQLoading(true);
    try {
      const { subtotal, taxAmount, total } = calculateBOQTotals();
      const boqData = {
        workOrderId: boqWorkOrder.id,
        organizationId: boqWorkOrder.clientOrganization?.id,
        title: boqTitle,
        description: boqDescription,
        status: 'draft' as const,
        items: boqItems.map(item => ({
          itemType: item.itemType,
          itemId: item.itemId,
          name: item.name,
          description: item.description,
          quantity: item.quantity,
          unit: item.unit,
          inventoryPrice: item.inventoryPrice,
          priceBookPrice: item.priceBookPrice,
          enteredPrice: parseFloat(item.enteredPrice) || 0,
          totalAmount: (parseFloat(item.enteredPrice) || 0) * item.quantity,
        })),
        subtotal,
        taxRate: parseFloat(boqTaxRate) || 0,
        taxAmount,
        discount: parseFloat(boqDiscount) || 0,
        totalAmount: total,
        notes: boqNotes,
      };

      await boqApi.create(boqData as any);
      showToast('BOQ created successfully', 'success');
      setShowBOQDrawer(false);
    } catch (error: any) {
      showToast(error.response?.data?.message || 'Failed to create BOQ', 'error');
    } finally {
      setBOQLoading(false);
    }
  };

  const checkInventoryForWorkOrders = async (orders: WorkOrder[]) => {
    const statuses: Record<string, InventoryStatus> = {};
    try {
      const inventoryResponse = await inventoryApi.getAll({ limit: 100 });
      const inventoryItems = inventoryResponse.data || [];

      for (const wo of orders) {
        const checklistItems = wo.checklist?.length || 0;
        const availableItems = inventoryItems.filter((item: any) =>
          item.status === 'active' && item.quantity > 0
        );
        const availableForWO = Math.min(checklistItems, availableItems.length);

        statuses[wo.id] = {
          available: checklistItems === 0 || availableForWO >= checklistItems,
          partial: checklistItems > 0 && availableForWO > 0 && availableForWO < checklistItems,
          itemCount: checklistItems,
          availableCount: availableForWO,
        };
      }
    } catch (error) {
      for (const wo of orders) {
        statuses[wo.id] = { available: true, partial: false, itemCount: 0, availableCount: 0 };
      }
    }
    setInventoryStatus(statuses);
  };

  const showToast = (message: string, type: 'success' | 'error') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  };

  const getStatusColor = (status: string) => {
    const statusConfig = WORK_ORDER_STATUSES.find(s => s.value === status?.toUpperCase());
    return statusConfig?.color || 'bg-gray-100 text-gray-800';
  };

  const getPriorityColor = (priority: string) => {
    switch (priority?.toUpperCase()) {
      case 'CRITICAL': return 'bg-red-100 text-red-800';
      case 'HIGH': return 'bg-orange-100 text-orange-800';
      case 'MEDIUM': return 'bg-yellow-100 text-yellow-800';
      case 'LOW': return 'bg-green-100 text-green-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getRiskColor = (risk: string) => {
    return risk?.toUpperCase() === 'HIGH' ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700';
  };

  const getUrgencyColor = (urgency: string) => {
    return urgency?.toUpperCase() === 'URGENT' ? 'bg-orange-100 text-orange-700' : 'bg-blue-100 text-blue-700';
  };

  const getInventoryStatusBadge = (woId: string, compact: boolean = false) => {
    const status = inventoryStatus[woId];
    if (!status) {
      return (
        <span className="inline-flex items-center px-2 py-1 text-xs font-medium rounded-full bg-gray-100 text-gray-600">
          <svg className="w-3 h-3 mr-1 animate-spin" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
          </svg>
          {!compact && 'Checking...'}
        </span>
      );
    }

    if (status.available) {
      return (
        <span className="inline-flex items-center px-2 py-1 text-xs font-medium rounded-full bg-green-100 text-green-700">
          <svg className="w-3 h-3 mr-1" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
          </svg>
          {compact ? '' : 'Available'}
        </span>
      );
    }

    if (status.partial) {
      return (
        <span className="inline-flex items-center px-2 py-1 text-xs font-medium rounded-full bg-yellow-100 text-yellow-700" title={`${status.availableCount}/${status.itemCount} items available`}>
          <svg className="w-3 h-3 mr-1" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
          </svg>
          {compact ? '' : `Partial (${status.availableCount}/${status.itemCount})`}
        </span>
      );
    }

    return (
      <span className="inline-flex items-center px-2 py-1 text-xs font-medium rounded-full bg-red-100 text-red-700">
        <svg className="w-3 h-3 mr-1" fill="currentColor" viewBox="0 0 20 20">
          <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
        </svg>
        {compact ? '' : 'Unavailable'}
      </span>
    );
  };

  // Kanban View Functions
  const getWorkOrdersByStatus = (status: string) => {
    return workOrders.filter(wo => wo.status?.toUpperCase() === status);
  };

  const handleDragStart = (e: React.DragEvent, workOrder: WorkOrder) => {
    e.dataTransfer.setData('workOrderId', workOrder.id);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDrop = async (e: React.DragEvent, newStatus: string) => {
    e.preventDefault();
    const workOrderId = e.dataTransfer.getData('workOrderId');
    const workOrder = workOrders.find(wo => wo.id === workOrderId);

    if (workOrder && workOrder.status?.toUpperCase() !== newStatus) {
      try {
        await workOrderApi.update(workOrderId, { status: newStatus.toLowerCase() } as any);
        showToast('Work order status updated', 'success');
        fetchWorkOrders();
      } catch (error) {
        showToast('Failed to update status', 'error');
      }
    }
  };

  const renderKanbanView = () => (
    <div className="flex gap-4 overflow-x-auto pb-4">
      {WORK_ORDER_STATUSES.map(statusConfig => {
        const statusWorkOrders = getWorkOrdersByStatus(statusConfig.value);
        return (
          <div
            key={statusConfig.value}
            className="flex-shrink-0 w-72 bg-gray-50 rounded-xl p-3"
            onDragOver={handleDragOver}
            onDrop={(e) => handleDrop(e, statusConfig.value)}
          >
            <div className={`px-3 py-2 rounded-lg mb-3 flex items-center justify-between ${statusConfig.color}`}>
              <span className="font-medium text-sm">{statusConfig.label}</span>
              <span className="text-xs font-bold">{statusWorkOrders.length}</span>
            </div>
            <div className="space-y-2 min-h-[200px]">
              {statusWorkOrders.map(wo => (
                <div
                  key={wo.id}
                  draggable
                  onDragStart={(e) => handleDragStart(e, wo)}
                  onClick={() => { setSelectedWorkOrder(wo); setShowDetailDrawer(true); }}
                  className="bg-white rounded-lg p-3 shadow-sm border border-gray-200 cursor-pointer hover:shadow-md transition-shadow"
                >
                  <div className="text-xs text-blue-600 font-medium mb-1">
                    {wo.woNumber || wo.id.slice(0, 8)}
                  </div>
                  <div className="font-medium text-gray-900 text-sm mb-2 line-clamp-2">
                    {wo.title}
                  </div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className={`px-2 py-0.5 text-xs font-medium rounded-full ${getPriorityColor(wo.priority)}`}>
                      {wo.priority}
                    </span>
                    {wo.assignedTo && (
                      <span className="text-xs text-gray-500">
                        {wo.assignedTo.firstName} {wo.assignedTo.lastName?.[0]}.
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );

  // Calendar Functions
  const getDaysInMonth = (date: Date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startingDay = firstDay.getDay();
    return { daysInMonth, startingDay };
  };

  const getWorkOrdersForDate = (date: Date) => {
    return workOrders.filter(wo => {
      const createdDate = new Date(wo.createdAt);
      return (
        createdDate.getDate() === date.getDate() &&
        createdDate.getMonth() === date.getMonth() &&
        createdDate.getFullYear() === date.getFullYear()
      );
    });
  };

  const handleDateClick = (date: Date) => {
    const dateWOs = getWorkOrdersForDate(date);
    setSelectedDate(date);
    setSelectedDateWorkOrders(dateWOs);
    setShowDateModal(true);
  };

  const renderCalendar = () => {
    const { daysInMonth, startingDay } = getDaysInMonth(currentMonth);
    const days = [];
    const weekDays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

    for (let i = 0; i < startingDay; i++) {
      days.push(<div key={`empty-${i}`} className="h-28 bg-gray-50"></div>);
    }

    for (let day = 1; day <= daysInMonth; day++) {
      const date = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), day);
      const dayWorkOrders = getWorkOrdersForDate(date);
      const isToday = new Date().toDateString() === date.toDateString();

      days.push(
        <div
          key={day}
          className={`h-28 border border-gray-200 p-1 overflow-hidden cursor-pointer hover:bg-gray-50 transition-colors ${isToday ? 'bg-blue-50 hover:bg-blue-100' : 'bg-white'}`}
          onClick={() => handleDateClick(date)}
        >
          <div className={`text-sm font-medium mb-1 flex items-center justify-between ${isToday ? 'text-blue-600' : 'text-gray-700'}`}>
            <span>{day}</span>
            {dayWorkOrders.length > 0 && (
              <span className="text-xs bg-blue-500 text-white rounded-full w-5 h-5 flex items-center justify-center">
                {dayWorkOrders.length}
              </span>
            )}
          </div>
          <div className="space-y-1 overflow-y-auto max-h-20">
            {dayWorkOrders.slice(0, 2).map(wo => (
              <div
                key={wo.id}
                onClick={(e) => { e.stopPropagation(); setSelectedWorkOrder(wo); setShowDetailDrawer(true); }}
                className="text-xs p-1 rounded-lg cursor-pointer truncate bg-red-100 text-red-800 hover:bg-red-200"
                title={wo.title}
              >
                {wo.woNumber || wo.id.slice(0, 6)} - {wo.title}
              </div>
            ))}
            {dayWorkOrders.length > 2 && (
              <div className="text-xs text-blue-600 font-medium">
                +{dayWorkOrders.length - 2} more
              </div>
            )}
          </div>
        </div>
      );
    }

    return (
      <div className="bg-white rounded-xl shadow overflow-hidden">
        <div className="flex items-center justify-between px-6 py-4 border-b">
          <button
            onClick={() => setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1))}
            className="p-2 hover:bg-gray-100 rounded-xl"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          <h3 className="text-lg font-semibold text-gray-900">
            {currentMonth.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
          </h3>
          <button
            onClick={() => setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1))}
            className="p-2 hover:bg-gray-100 rounded-xl"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </button>
        </div>
        <div className="grid grid-cols-7 border-b">
          {weekDays.map(day => (
            <div key={day} className="py-2 text-center text-sm font-medium text-gray-500 bg-gray-50">
              {day}
            </div>
          ))}
        </div>
        <div className="grid grid-cols-7">
          {days}
        </div>
      </div>
    );
  };

  // User Auto-suggest
  const filteredUsers = Array.isArray(users) ? users.filter(user => {
    const query = userSearchQuery.toLowerCase();
    return (
      user.firstName?.toLowerCase().includes(query) ||
      user.lastName?.toLowerCase().includes(query) ||
      user.email?.toLowerCase().includes(query)
    );
  }) : [];

  const handleSelectUser = (user: User) => {
    setFormData({ ...formData, assignedToId: user.id });
    setUserSearchQuery(`${user.firstName} ${user.lastName}`);
    setShowUserSuggestions(false);
  };

  // Company Auto-suggest (for super admin)
  const filteredCompanies = Array.isArray(companies) ? companies.filter(company => {
    const query = companySearchQuery.toLowerCase();
    return company.name?.toLowerCase().includes(query);
  }) : [];

  const handleSelectCompany = (company: Company) => {
    setFormData({ ...formData, companyId: company.id });
    setCompanySearchQuery(company.name);
    setShowCompanySuggestions(false);
  };

  // Checklist Functions
  const handleAddChecklistItem = () => {
    if (checklistItemType === 'task' && !newChecklistItem.trim()) return;
    if (checklistItemType === 'product' && !selectedInventoryId) {
      showToast('Please select an inventory item', 'error');
      return;
    }
    if (checklistItemType === 'service' && !selectedServiceId) {
      showToast('Please select a service', 'error');
      return;
    }

    let itemText = newChecklistItem.trim();
    let inventoryId: string | undefined;
    let inventoryName: string | undefined;
    let serviceId: string | undefined;
    let serviceName: string | undefined;

    if (checklistItemType === 'product') {
      const selectedItem = inventoryList.find(inv => inv.id === selectedInventoryId);
      if (selectedItem) {
        itemText = selectedItem.name;
        inventoryId = selectedItem.id;
        inventoryName = selectedItem.name;
      }
    } else if (checklistItemType === 'service') {
      const selectedService = servicesList.find(svc => svc.id === selectedServiceId);
      if (selectedService) {
        itemText = selectedService.name;
        serviceId = selectedService.id;
        serviceName = selectedService.name;
      }
    }

    const newItem: ChecklistItem = {
      item: itemText,
      completed: false,
      mandatory: isMandatory,
      itemType: checklistItemType,
      inventoryId,
      inventoryName,
      serviceId,
      serviceName,
    };

    setFormData({
      ...formData,
      checklist: [...formData.checklist, newItem],
    });
    setNewChecklistItem('');
    setIsMandatory(false);
    setChecklistItemType('task');
    setSelectedInventoryId('');
    setSelectedServiceId('');
  };

  const handleRemoveChecklistItem = (index: number) => {
    setFormData({
      ...formData,
      checklist: formData.checklist.filter((_, i) => i !== index),
    });
  };

  // File Upload
  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    setSelectedFiles([...selectedFiles, ...files]);
  };

  const handleRemoveFile = (index: number) => {
    setSelectedFiles(selectedFiles.filter((_, i) => i !== index));
  };

  // Submit Work Order
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.title.trim()) {
      showToast('Title is required', 'error');
      return;
    }

    setSubmitting(true);
    try {
      const payload: any = {
        title: formData.title,
        description: formData.description || undefined,
        type: formData.type,
        priority: formData.priority,
        status: formData.status,
        riskLevel: formData.riskLevel,
        urgency: formData.urgency,
        assignedToId: formData.assignedToId || undefined,
        scheduledDate: formData.scheduledDate || undefined,
        dueDate: formData.dueDate || undefined,
        estimatedCost: formData.estimatedCost ? parseFloat(formData.estimatedCost) : undefined,
        checklist: formData.checklist.length > 0 ? formData.checklist : undefined,
      };

      if (isSuperAdmin() && formData.companyId) {
        payload.clientOrgId = formData.companyId;
      }

      const createdWorkOrder = await workOrderApi.create(payload);

      // Upload files if any
      if (selectedFiles.length > 0 && createdWorkOrder.id) {
        for (const file of selectedFiles) {
          const formDataFile = new FormData();
          formDataFile.append('file', file);
          try {
            await api.post(`/work-orders/${createdWorkOrder.id}/attachments`, formDataFile, {
              headers: { 'Content-Type': 'multipart/form-data' },
            });
          } catch (err) {
            console.error('Error uploading file:', err);
          }
        }
      }

      showToast('Work order created successfully', 'success');
      setShowCreateDrawer(false);
      setFormData(defaultFormData);
      setSelectedFiles([]);
      setUserSearchQuery('');
      setCompanySearchQuery('');
      fetchWorkOrders();
    } catch (error: any) {
      showToast(error.response?.data?.message || 'Failed to create work order', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const handleRowClick = (workOrder: WorkOrder) => {
    setSelectedWorkOrder(workOrder);
    setShowDetailDrawer(true);
  };

  const closeDetailDrawer = () => {
    setShowDetailDrawer(false);
    setSelectedWorkOrder(null);
  };

  // Pagination handlers
  const handlePageChange = (page: number) => {
    if (page >= 1 && page <= totalPages) {
      setCurrentPage(page);
    }
  };

  const renderPagination = () => (
    <div className="flex items-center justify-between px-4 py-3 bg-white border-t border-gray-200 sm:px-6">
      <div className="flex items-center">
        <p className="text-sm text-gray-700">
          Showing <span className="font-medium">{((currentPage - 1) * itemsPerPage) + 1}</span> to{' '}
          <span className="font-medium">{Math.min(currentPage * itemsPerPage, totalItems)}</span> of{' '}
          <span className="font-medium">{totalItems}</span> results
        </p>
      </div>
      <div className="flex items-center gap-2">
        <select
          value={itemsPerPage}
          onChange={(e) => {
            setItemsPerPage(Number(e.target.value));
            setCurrentPage(1);
          }}
          className="px-3 py-2 border border-gray-300 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
        >
          <option value={10}>10 per page</option>
          <option value={25}>25 per page</option>
          <option value={50}>50 per page</option>
          <option value={100}>100 per page</option>
        </select>
        <nav className="flex items-center gap-1">
          <button
            onClick={() => handlePageChange(1)}
            disabled={currentPage === 1}
            className="px-3 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-xl hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            First
          </button>
          <button
            onClick={() => handlePageChange(currentPage - 1)}
            disabled={currentPage === 1}
            className="px-3 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-xl hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Previous
          </button>
          <span className="px-4 py-2 text-sm text-gray-700">
            Page {currentPage} of {totalPages}
          </span>
          <button
            onClick={() => handlePageChange(currentPage + 1)}
            disabled={currentPage === totalPages}
            className="px-3 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-xl hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Next
          </button>
          <button
            onClick={() => handlePageChange(totalPages)}
            disabled={currentPage === totalPages}
            className="px-3 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-xl hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Last
          </button>
        </nav>
      </div>
    </div>
  );

  if (loading && workOrders.length === 0) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div>
      {/* Toast */}
      {toast && (
        <div className={`fixed top-4 right-4 z-50 px-4 py-3 rounded-xl shadow-lg ${
          toast.type === 'success' ? 'bg-green-500 text-white' : 'bg-red-500 text-white'
        }`}>
          {toast.message}
        </div>
      )}

      {/* Header */}
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Work Orders</h2>
          <p className="text-gray-600">Manage maintenance work orders</p>
        </div>
        <div className="flex items-center gap-3">
          {/* Search */}
          <div className="relative">
            <input
              type="text"
              placeholder="Search work orders..."
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setCurrentPage(1);
              }}
              className="w-64 px-4 py-2 pl-10 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
            <svg className="w-5 h-5 text-gray-400 absolute left-3 top-2.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </div>

          {/* Company Filter for Super Admin */}
          {isSuperAdmin() && companies.length > 0 && (
            <select
              value={companyFilter}
              onChange={(e) => {
                setCompanyFilter(e.target.value);
                setCurrentPage(1);
              }}
              className="px-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="">All Companies</option>
              {companies.map(company => (
                <option key={company.id} value={company.id}>{company.name}</option>
              ))}
            </select>
          )}

          {/* View Toggle */}
          <div className="flex items-center bg-gray-100 rounded-xl p-1">
            <button
              onClick={() => setViewMode('table')}
              className={`px-3 py-1.5 text-sm font-medium rounded-lg transition-colors ${
                viewMode === 'table' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-600 hover:text-gray-900'
              }`}
              title="Table View"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 10h16M4 14h16M4 18h16" />
              </svg>
            </button>
            <button
              onClick={() => setViewMode('kanban')}
              className={`px-3 py-1.5 text-sm font-medium rounded-lg transition-colors ${
                viewMode === 'kanban' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-600 hover:text-gray-900'
              }`}
              title="Kanban View"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 17V7m0 10a2 2 0 01-2 2H5a2 2 0 01-2-2V7a2 2 0 012-2h2a2 2 0 012 2m0 10a2 2 0 002 2h2a2 2 0 002-2M9 7a2 2 0 012-2h2a2 2 0 012 2m0 10V7m0 10a2 2 0 002 2h2a2 2 0 002-2V7a2 2 0 00-2-2h-2a2 2 0 00-2 2" />
              </svg>
            </button>
            <button
              onClick={() => setViewMode('calendar')}
              className={`px-3 py-1.5 text-sm font-medium rounded-lg transition-colors ${
                viewMode === 'calendar' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-600 hover:text-gray-900'
              }`}
              title="Calendar View"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
            </button>
          </div>

          {/* New Work Order Button */}
          <button
            onClick={() => setShowCreateDrawer(true)}
            className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-xl hover:bg-blue-700"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            New Work Order
          </button>
        </div>
      </div>

      {/* Table View */}
      {viewMode === 'table' && (
        <div className="bg-white rounded-xl shadow overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">WO #</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Title</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Company</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Priority</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Risk</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Urgency</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Inventory</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Created</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {workOrders.map((wo) => (
                  <tr
                    key={wo.id}
                    className="hover:bg-gray-50 cursor-pointer transition-colors"
                    onClick={() => handleRowClick(wo)}
                  >
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-blue-600">
                      {wo.woNumber || wo.id.slice(0, 8)}
                    </td>
                    <td className="px-6 py-4">
                      <div className="font-medium text-gray-900">{wo.title}</div>
                      {wo.description && (
                        <div className="text-sm text-gray-500 truncate max-w-xs">{wo.description}</div>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">{wo.clientOrganization?.name || 'N/A'}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 py-1 text-xs font-medium rounded-full ${getPriorityColor(wo.priority)}`}>
                        {wo.priority}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 py-1 text-xs font-medium rounded-full ${getRiskColor(wo.riskLevel || 'low')}`}>
                        {wo.riskLevel || 'Low'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 py-1 text-xs font-medium rounded-full ${getUrgencyColor(wo.urgency || 'normal')}`}>
                        {wo.urgency || 'Normal'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(wo.status)}`}>
                        {wo.status?.replace('_', ' ')}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {getInventoryStatusBadge(wo.id)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {new Date(wo.createdAt).toLocaleDateString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {renderPagination()}
        </div>
      )}

      {/* Kanban View */}
      {viewMode === 'kanban' && renderKanbanView()}

      {/* Calendar View */}
      {viewMode === 'calendar' && renderCalendar()}

      {workOrders.length === 0 && !loading && (
        <div className="text-center py-12 bg-white rounded-xl shadow">
          <svg className="mx-auto h-12 w-12 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
          </svg>
          <h3 className="mt-2 text-sm font-medium text-gray-900">No work orders</h3>
          <p className="mt-1 text-sm text-gray-500">Get started by creating a new work order.</p>
          <button
            onClick={() => setShowCreateDrawer(true)}
            className="mt-4 px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-xl hover:bg-blue-700"
          >
            New Work Order
          </button>
        </div>
      )}

      {/* Create Work Order Drawer */}
      {showCreateDrawer && (
        <>
          <div className="fixed inset-0 bg-black bg-opacity-50 z-40" onClick={() => setShowCreateDrawer(false)} />
          <div className="fixed inset-y-0 right-0 w-full max-w-2xl bg-white shadow-xl z-50">
            <div className="h-full flex flex-col">
              <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
                <h2 className="text-xl font-bold text-gray-900">Create Work Order</h2>
                <button onClick={() => setShowCreateDrawer(false)} className="p-2 hover:bg-gray-100 rounded-xl">
                  <svg className="w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-6">
                {/* Company Selector (Super Admin Only) */}
                {isSuperAdmin() && (
                  <div ref={companySearchRef} className="relative">
                    <label className="block text-sm font-medium text-gray-700 mb-1">Company *</label>
                    <input
                      type="text"
                      value={companySearchQuery}
                      onChange={(e) => {
                        setCompanySearchQuery(e.target.value);
                        setShowCompanySuggestions(true);
                        if (!e.target.value) setFormData({ ...formData, companyId: '' });
                      }}
                      onFocus={() => setShowCompanySuggestions(true)}
                      className="w-full px-4 py-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      placeholder="Type to search companies..."
                    />
                    {showCompanySuggestions && companySearchQuery && filteredCompanies.length > 0 && (
                      <div className="absolute z-10 w-full mt-1 bg-white border border-gray-200 rounded-xl shadow-lg max-h-48 overflow-y-auto">
                        {filteredCompanies.slice(0, 5).map(company => (
                          <button
                            key={company.id}
                            type="button"
                            onClick={() => handleSelectCompany(company)}
                            className="w-full px-4 py-2 text-left hover:bg-gray-100 flex items-center gap-3"
                          >
                            <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 text-sm font-medium">
                              {company.name?.[0]?.toUpperCase()}
                            </div>
                            <div>
                              <div className="text-sm font-medium text-gray-900">{company.name}</div>
                              <div className="text-xs text-gray-500">{company.type}</div>
                            </div>
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                )}

                {/* Title */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Title *</label>
                  <input
                    type="text"
                    required
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="Enter work order title"
                  />
                </div>

                {/* Description */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                  <textarea
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    rows={3}
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="Describe the work order"
                  />
                </div>

                {/* Type, Priority, Status Row */}
                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Type</label>
                    <select
                      value={formData.type}
                      onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                      className="w-full px-4 py-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    >
                      <option value="preventive">Preventive</option>
                      <option value="corrective">Corrective</option>
                      <option value="predictive">Predictive</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Priority</label>
                    <select
                      value={formData.priority}
                      onChange={(e) => setFormData({ ...formData, priority: e.target.value })}
                      className="w-full px-4 py-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    >
                      <option value="low">Low</option>
                      <option value="medium">Medium</option>
                      <option value="high">High</option>
                      <option value="critical">Critical</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                    <select
                      value={formData.status}
                      onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                      className="w-full px-4 py-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    >
                      <option value="draft">Draft</option>
                      <option value="pending_approval">Pending Approval</option>
                      <option value="approved">Approved</option>
                    </select>
                  </div>
                </div>

                {/* Risk Level and Urgency */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Risk Level</label>
                    <div className="flex gap-3">
                      <label className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="radio"
                          name="riskLevel"
                          value="low"
                          checked={formData.riskLevel === 'low'}
                          onChange={(e) => setFormData({ ...formData, riskLevel: e.target.value })}
                          className="text-blue-600"
                        />
                        <span className="text-sm text-gray-700">Low Risk</span>
                      </label>
                      <label className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="radio"
                          name="riskLevel"
                          value="high"
                          checked={formData.riskLevel === 'high'}
                          onChange={(e) => setFormData({ ...formData, riskLevel: e.target.value })}
                          className="text-red-600"
                        />
                        <span className="text-sm text-gray-700">High Risk</span>
                      </label>
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Urgency</label>
                    <div className="flex gap-3">
                      <label className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="radio"
                          name="urgency"
                          value="normal"
                          checked={formData.urgency === 'normal'}
                          onChange={(e) => setFormData({ ...formData, urgency: e.target.value })}
                          className="text-blue-600"
                        />
                        <span className="text-sm text-gray-700">Normal</span>
                      </label>
                      <label className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="radio"
                          name="urgency"
                          value="urgent"
                          checked={formData.urgency === 'urgent'}
                          onChange={(e) => setFormData({ ...formData, urgency: e.target.value })}
                          className="text-orange-600"
                        />
                        <span className="text-sm text-gray-700">Urgent</span>
                      </label>
                    </div>
                  </div>
                </div>

                {/* Assign To with Auto-suggest */}
                <div ref={userSearchRef} className="relative">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Assign To</label>
                  <input
                    type="text"
                    value={userSearchQuery}
                    onChange={(e) => {
                      setUserSearchQuery(e.target.value);
                      setShowUserSuggestions(true);
                      if (!e.target.value) setFormData({ ...formData, assignedToId: '' });
                    }}
                    onFocus={() => setShowUserSuggestions(true)}
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="Type to search users..."
                  />
                  {showUserSuggestions && userSearchQuery && filteredUsers.length > 0 && (
                    <div className="absolute z-10 w-full mt-1 bg-white border border-gray-200 rounded-xl shadow-lg max-h-48 overflow-y-auto">
                      {filteredUsers.slice(0, 5).map(user => (
                        <button
                          key={user.id}
                          type="button"
                          onClick={() => handleSelectUser(user)}
                          className="w-full px-4 py-2 text-left hover:bg-gray-100 flex items-center gap-3"
                        >
                          <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 text-sm font-medium">
                            {user.firstName?.[0]}{user.lastName?.[0]}
                          </div>
                          <div>
                            <div className="text-sm font-medium text-gray-900">{user.firstName} {user.lastName}</div>
                            <div className="text-xs text-gray-500">{user.email}</div>
                          </div>
                        </button>
                      ))}
                    </div>
                  )}
                </div>

                {/* Dates */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Scheduled Date</label>
                    <input
                      type="date"
                      value={formData.scheduledDate}
                      onChange={(e) => setFormData({ ...formData, scheduledDate: e.target.value })}
                      className="w-full px-4 py-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Due Date</label>
                    <input
                      type="date"
                      value={formData.dueDate}
                      onChange={(e) => setFormData({ ...formData, dueDate: e.target.value })}
                      className="w-full px-4 py-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                </div>

                {/* Estimated Cost */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Estimated Cost ($)</label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={formData.estimatedCost}
                    onChange={(e) => setFormData({ ...formData, estimatedCost: e.target.value })}
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="0.00"
                  />
                </div>

                {/* Checklist */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Checklist</label>

                  {/* Type Selector */}
                  <div className="flex gap-2 mb-3">
                    <button
                      type="button"
                      onClick={() => setChecklistItemType('task')}
                      className={`px-3 py-1.5 text-sm font-medium rounded-lg transition-colors ${
                        checklistItemType === 'task'
                          ? 'bg-blue-600 text-white'
                          : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                      }`}
                    >
                      Task
                    </button>
                    <button
                      type="button"
                      onClick={() => setChecklistItemType('product')}
                      className={`px-3 py-1.5 text-sm font-medium rounded-lg transition-colors ${
                        checklistItemType === 'product'
                          ? 'bg-green-600 text-white'
                          : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                      }`}
                    >
                      Product
                    </button>
                    <button
                      type="button"
                      onClick={() => setChecklistItemType('service')}
                      className={`px-3 py-1.5 text-sm font-medium rounded-lg transition-colors ${
                        checklistItemType === 'service'
                          ? 'bg-purple-600 text-white'
                          : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                      }`}
                    >
                      Service
                    </button>
                  </div>

                  {/* Input based on type */}
                  <div className="flex gap-2 mb-3">
                    {checklistItemType === 'task' && (
                      <input
                        type="text"
                        value={newChecklistItem}
                        onChange={(e) => setNewChecklistItem(e.target.value)}
                        onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddChecklistItem())}
                        className="flex-1 px-4 py-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        placeholder="Add checklist item..."
                      />
                    )}
                    {checklistItemType === 'product' && (
                      <select
                        value={selectedInventoryId}
                        onChange={(e) => setSelectedInventoryId(e.target.value)}
                        className="flex-1 px-4 py-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      >
                        <option value="">Select inventory item...</option>
                        {inventoryList.map(item => (
                          <option key={item.id} value={item.id}>
                            {item.name} ({item.sku}) - Qty: {item.quantity}
                          </option>
                        ))}
                      </select>
                    )}
                    {checklistItemType === 'service' && (
                      <select
                        value={selectedServiceId}
                        onChange={(e) => setSelectedServiceId(e.target.value)}
                        className="flex-1 px-4 py-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      >
                        <option value="">Select service...</option>
                        {servicesList.map(svc => (
                          <option key={svc.id} value={svc.id}>
                            {svc.name} ({svc.code}){svc.unitPrice ? ` - $${svc.unitPrice}` : ''}
                          </option>
                        ))}
                      </select>
                    )}
                    <label className="flex items-center gap-1 px-2">
                      <input
                        type="checkbox"
                        checked={isMandatory}
                        onChange={(e) => setIsMandatory(e.target.checked)}
                        className="rounded-lg border-gray-300"
                      />
                      <span className="text-xs text-gray-600">Required</span>
                    </label>
                    <button
                      type="button"
                      onClick={handleAddChecklistItem}
                      className="px-4 py-2.5 text-sm font-medium text-white bg-blue-600 rounded-xl hover:bg-blue-700"
                    >
                      Add
                    </button>
                  </div>

                  {formData.checklist.length > 0 && (
                    <div className="border border-gray-200 rounded-xl p-3 space-y-2">
                      {formData.checklist.map((item, index) => (
                        <div key={index} className="flex items-center justify-between py-1">
                          <div className="flex items-center gap-2">
                            <div className="w-5 h-5 border-2 border-gray-300 rounded-lg"></div>
                            {/* Type badge */}
                            <span className={`px-2 py-0.5 text-xs font-medium rounded-full ${
                              item.itemType === 'product'
                                ? 'bg-green-100 text-green-700'
                                : item.itemType === 'service'
                                  ? 'bg-purple-100 text-purple-700'
                                  : 'bg-blue-100 text-blue-700'
                            }`}>
                              {item.itemType === 'product' ? 'Product' : item.itemType === 'service' ? 'Service' : 'Task'}
                            </span>
                            <span className="text-sm text-gray-700">{item.item}</span>
                            {item.mandatory && (
                              <span className="text-xs text-red-500 font-medium">Required</span>
                            )}
                          </div>
                          <button
                            type="button"
                            onClick={() => handleRemoveChecklistItem(index)}
                            className="p-1 text-gray-400 hover:text-red-500"
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* File Upload */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Attachments</label>
                  <input
                    ref={fileInputRef}
                    type="file"
                    multiple
                    onChange={handleFileSelect}
                    className="hidden"
                  />
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="w-full px-4 py-3 border-2 border-dashed border-gray-300 rounded-xl hover:border-blue-400 hover:bg-blue-50 transition-colors"
                  >
                    <div className="flex items-center justify-center gap-2 text-gray-600">
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                      </svg>
                      <span className="text-sm font-medium">Click to upload files</span>
                    </div>
                  </button>
                  {selectedFiles.length > 0 && (
                    <div className="mt-3 space-y-2">
                      {selectedFiles.map((file, index) => (
                        <div key={index} className="flex items-center justify-between px-3 py-2 bg-gray-50 rounded-xl">
                          <div className="flex items-center gap-2">
                            <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                            </svg>
                            <span className="text-sm text-gray-700">{file.name}</span>
                            <span className="text-xs text-gray-500">({(file.size / 1024).toFixed(1)} KB)</span>
                          </div>
                          <button
                            type="button"
                            onClick={() => handleRemoveFile(index)}
                            className="p-1 text-gray-400 hover:text-red-500"
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </form>

              <div className="px-6 py-4 border-t border-gray-200 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setShowCreateDrawer(false)}
                  className="px-4 py-2.5 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-xl hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSubmit}
                  disabled={submitting}
                  className="px-4 py-2.5 text-sm font-medium text-white bg-blue-600 rounded-xl hover:bg-blue-700 disabled:opacity-50"
                >
                  {submitting ? 'Creating...' : 'Create Work Order'}
                </button>
              </div>
            </div>
          </div>
        </>
      )}

      {/* Work Order Detail Drawer */}
      {showDetailDrawer && selectedWorkOrder && (
        <>
          <div className="fixed inset-0 bg-black bg-opacity-50 z-40" onClick={closeDetailDrawer} />
          <div className="fixed inset-y-0 right-0 w-full max-w-2xl bg-white shadow-xl z-50">
            <div className="h-full flex flex-col">
              <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between bg-white">
                <div>
                  <h2 className="text-xl font-bold text-gray-900">Work Order Details</h2>
                  <p className="text-sm text-gray-500 mt-1">{selectedWorkOrder.woNumber || selectedWorkOrder.id.slice(0, 8)}</p>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleOpenBOQ(selectedWorkOrder)}
                    className="px-3 py-1.5 bg-purple-600 text-white text-sm rounded-lg hover:bg-purple-700 flex items-center gap-1"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                    </svg>
                    Generate BOQ
                  </button>
                  <button onClick={closeDetailDrawer} className="p-2 hover:bg-gray-100 rounded-xl">
                    <svg className="w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
              </div>

              <div className="flex-1 overflow-y-auto p-6">
                <div className="mb-6">
                  <h3 className="text-lg font-semibold text-gray-900">{selectedWorkOrder.title}</h3>
                  {selectedWorkOrder.description && (
                    <p className="text-gray-600 mt-2">{selectedWorkOrder.description}</p>
                  )}
                </div>

                <div className="flex flex-wrap gap-3 mb-6">
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-gray-500">Priority:</span>
                    <span className={`px-3 py-1 text-sm font-medium rounded-full ${getPriorityColor(selectedWorkOrder.priority)}`}>
                      {selectedWorkOrder.priority}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-gray-500">Risk:</span>
                    <span className={`px-3 py-1 text-sm font-medium rounded-full ${getRiskColor(selectedWorkOrder.riskLevel || 'low')}`}>
                      {selectedWorkOrder.riskLevel || 'Low'}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-gray-500">Urgency:</span>
                    <span className={`px-3 py-1 text-sm font-medium rounded-full ${getUrgencyColor(selectedWorkOrder.urgency || 'normal')}`}>
                      {selectedWorkOrder.urgency || 'Normal'}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-gray-500">Status:</span>
                    <span className={`px-3 py-1 text-sm font-medium rounded-full ${getStatusColor(selectedWorkOrder.status)}`}>
                      {selectedWorkOrder.status?.replace('_', ' ')}
                    </span>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4 mb-6">
                  <div className="bg-gray-50 rounded-xl p-4">
                    <h4 className="font-semibold text-gray-900 mb-2">Client Company</h4>
                    <p className="text-gray-700">{selectedWorkOrder.clientOrganization?.name || 'Not specified'}</p>
                  </div>
                  <div className="bg-gray-50 rounded-xl p-4">
                    <h4 className="font-semibold text-gray-900 mb-2">Assigned To</h4>
                    <p className="text-gray-700">
                      {selectedWorkOrder.assignedTo
                        ? `${selectedWorkOrder.assignedTo.firstName} ${selectedWorkOrder.assignedTo.lastName}`
                        : 'Unassigned'}
                    </p>
                  </div>
                </div>

                <div className="mb-6">
                  <h4 className="font-semibold text-gray-900 mb-3">Inventory Availability</h4>
                  <div className="bg-gray-50 rounded-xl p-4">
                    {inventoryStatus[selectedWorkOrder.id] ? (
                      <div className="flex items-center justify-between">
                        <span className="text-gray-600">Status:</span>
                        {getInventoryStatusBadge(selectedWorkOrder.id)}
                      </div>
                    ) : (
                      <div className="text-gray-500">Checking inventory status...</div>
                    )}
                  </div>
                </div>

                {selectedWorkOrder.checklist && selectedWorkOrder.checklist.length > 0 && (
                  <div className="mb-6">
                    <h4 className="font-semibold text-gray-900 mb-3">Checklist Items</h4>
                    <div className="bg-gray-50 rounded-xl p-4 space-y-2">
                      {selectedWorkOrder.checklist.map((item: any, index) => (
                        <div key={index} className="flex items-center gap-3">
                          <div className={`w-5 h-5 rounded-lg border-2 flex items-center justify-center ${
                            item.completed ? 'bg-green-500 border-green-500' : 'border-gray-300'
                          }`}>
                            {item.completed && (
                              <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                              </svg>
                            )}
                          </div>
                          {/* Type badge */}
                          {item.itemType && (
                            <span className={`px-2 py-0.5 text-xs font-medium rounded-full ${
                              item.itemType === 'product'
                                ? 'bg-green-100 text-green-700'
                                : item.itemType === 'service'
                                  ? 'bg-purple-100 text-purple-700'
                                  : 'bg-blue-100 text-blue-700'
                            }`}>
                              {item.itemType === 'product' ? 'Product' : item.itemType === 'service' ? 'Service' : 'Task'}
                            </span>
                          )}
                          <span className={`${item.completed ? 'text-gray-500 line-through' : 'text-gray-700'}`}>
                            {item.item}
                          </span>
                          {item.mandatory && (
                            <span className="text-xs text-red-500 font-medium">Required</span>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-gray-50 rounded-xl p-4">
                    <h4 className="font-semibold text-gray-900 mb-3">Dates</h4>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-gray-500">Created:</span>
                        <span className="text-gray-700">{new Date(selectedWorkOrder.createdAt).toLocaleDateString()}</span>
                      </div>
                      {selectedWorkOrder.scheduledDate && (
                        <div className="flex justify-between">
                          <span className="text-gray-500">Scheduled:</span>
                          <span className="text-gray-700">{new Date(selectedWorkOrder.scheduledDate).toLocaleDateString()}</span>
                        </div>
                      )}
                      {selectedWorkOrder.dueDate && (
                        <div className="flex justify-between">
                          <span className="text-gray-500">Due:</span>
                          <span className="text-gray-700">{new Date(selectedWorkOrder.dueDate).toLocaleDateString()}</span>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="bg-gray-50 rounded-xl p-4">
                    <h4 className="font-semibold text-gray-900 mb-3">Cost</h4>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-gray-500">Estimated:</span>
                        <span className="text-gray-700">
                          {selectedWorkOrder.estimatedCost ? `$${Number(selectedWorkOrder.estimatedCost).toFixed(2)}` : 'N/A'}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-500">Actual:</span>
                        <span className="text-gray-700">
                          {selectedWorkOrder.actualCost ? `$${Number(selectedWorkOrder.actualCost).toFixed(2)}` : 'N/A'}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="px-6 py-4 border-t border-gray-200 bg-gray-50">
                <div className="flex justify-end">
                  <button
                    onClick={closeDetailDrawer}
                    className="px-4 py-2.5 text-gray-700 bg-white border border-gray-300 rounded-xl hover:bg-gray-50"
                  >
                    Close
                  </button>
                </div>
              </div>
            </div>
          </div>
        </>
      )}

      {/* Calendar Date Modal */}
      {showDateModal && selectedDate && (
        <>
          <div className="fixed inset-0 bg-black bg-opacity-50 z-40" onClick={() => setShowDateModal(false)} />
          <div className="fixed inset-y-0 right-0 w-full max-w-lg bg-white shadow-xl z-50 animate-slide-in-right">
            <div className="h-full flex flex-col">
              <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between bg-white">
                <div>
                  <h2 className="text-lg font-bold text-gray-900">
                    {selectedDate.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })}
                  </h2>
                  <p className="text-sm text-gray-500 mt-1">
                    {selectedDateWorkOrders.length} work order{selectedDateWorkOrders.length !== 1 ? 's' : ''}
                  </p>
                </div>
                <button onClick={() => setShowDateModal(false)} className="p-2 hover:bg-gray-100 rounded-xl">
                  <svg className="w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              <div className="flex-1 overflow-y-auto p-4">
                {selectedDateWorkOrders.length === 0 ? (
                  <div className="text-center py-12">
                    <svg className="w-16 h-16 text-gray-300 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                    </svg>
                    <p className="text-gray-500">No work orders for this date</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {selectedDateWorkOrders.map(wo => (
                      <div
                        key={wo.id}
                        className="bg-white border border-gray-200 rounded-xl p-4 hover:shadow-md transition-shadow cursor-pointer"
                        onClick={() => {
                          setSelectedWorkOrder(wo);
                          setShowDateModal(false);
                          setShowDetailDrawer(true);
                        }}
                      >
                        <div className="flex items-start justify-between mb-2">
                          <div className="flex-1">
                            <div className="flex items-center gap-2">
                              <span className="text-xs font-mono text-gray-500">{wo.woNumber || wo.id.slice(0, 8)}</span>
                              <span className={`px-2 py-0.5 text-xs font-medium rounded-full ${getStatusColor(wo.status)}`}>
                                {wo.status?.replace('_', ' ')}
                              </span>
                            </div>
                            <h4 className="font-medium text-gray-900 mt-1">{wo.title}</h4>
                          </div>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setSelectedWorkOrder(wo);
                              setShowDateModal(false);
                              setShowDetailDrawer(true);
                            }}
                            className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg"
                            title="View details"
                          >
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                            </svg>
                          </button>
                        </div>
                        {wo.description && (
                          <p className="text-sm text-gray-600 line-clamp-2 mb-2">{wo.description}</p>
                        )}
                        <div className="flex items-center gap-3 text-xs text-gray-500">
                          <span className={`px-2 py-0.5 rounded-full ${getPriorityColor(wo.priority)}`}>
                            {wo.priority}
                          </span>
                          {wo.assignedTo && (
                            <span className="flex items-center gap-1">
                              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                              </svg>
                              {wo.assignedTo.firstName} {wo.assignedTo.lastName}
                            </span>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="px-6 py-4 border-t border-gray-200 bg-gray-50">
                <button
                  onClick={() => setShowDateModal(false)}
                  className="w-full px-4 py-2.5 text-gray-700 bg-white border border-gray-300 rounded-xl hover:bg-gray-50"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </>
      )}

      {/* BOQ Drawer */}
      {showBOQDrawer && boqWorkOrder && (
        <>
          <div className="fixed inset-0 bg-black bg-opacity-50 z-50" onClick={() => setShowBOQDrawer(false)} />
          <div className="fixed inset-y-0 right-0 w-full max-w-4xl bg-white shadow-xl z-50 animate-slide-in-right">
            <div className="h-full flex flex-col">
              {/* Header */}
              <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between bg-white">
                <div>
                  <h2 className="text-xl font-bold text-gray-900">Bill of Quantity (BOQ)</h2>
                  <p className="text-sm text-gray-500 mt-1">
                    Work Order: {boqWorkOrder.woNumber || boqWorkOrder.title}
                  </p>
                </div>
                <button onClick={() => setShowBOQDrawer(false)} className="p-2 hover:bg-gray-100 rounded-xl">
                  <svg className="w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              {/* Content */}
              <div className="flex-1 overflow-y-auto p-6">
                {/* BOQ Details */}
                <div className="grid grid-cols-2 gap-4 mb-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">BOQ Title</label>
                    <input
                      type="text"
                      value={boqTitle}
                      onChange={(e) => setBOQTitle(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Price Book</label>
                    <select
                      value={selectedPriceBookId}
                      onChange={(e) => handlePriceBookChange(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="">Use Inventory Prices</option>
                      {boqPriceBooks.map(pb => (
                        <option key={pb.id} value={pb.id}>{pb.name}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="mb-6">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                  <textarea
                    value={boqDescription}
                    onChange={(e) => setBOQDescription(e.target.value)}
                    rows={2}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                {/* Items Table */}
                <div className="mb-6">
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="text-lg font-semibold text-gray-900">Items</h3>
                    <button
                      onClick={handleAddCustomBOQItem}
                      className="px-3 py-1.5 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-1"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                      </svg>
                      Add Custom Item
                    </button>
                  </div>

                  <div className="overflow-x-auto border border-gray-200 rounded-lg">
                    <table className="w-full">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">Type</th>
                          <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">Item</th>
                          <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase w-20">Qty</th>
                          <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase w-20">Unit</th>
                          <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase w-28">Inv. Price</th>
                          <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase w-28">Your Price</th>
                          <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase w-28">Total</th>
                          <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase w-10"></th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-200">
                        {boqItems.length === 0 ? (
                          <tr>
                            <td colSpan={8} className="px-3 py-8 text-center text-gray-500">
                              No items. Add items from work order checklist or add custom items.
                            </td>
                          </tr>
                        ) : (
                          boqItems.map((item, index) => (
                            <tr key={index} className="hover:bg-gray-50">
                              <td className="px-3 py-2">
                                <span className={`px-2 py-0.5 text-xs rounded-full ${
                                  item.itemType === 'inventory'
                                    ? 'bg-green-100 text-green-700'
                                    : item.itemType === 'service'
                                      ? 'bg-purple-100 text-purple-700'
                                      : 'bg-gray-100 text-gray-700'
                                }`}>
                                  {item.itemType === 'inventory' ? 'Product' : item.itemType === 'service' ? 'Service' : 'Custom'}
                                </span>
                              </td>
                              <td className="px-3 py-2">
                                <input
                                  type="text"
                                  value={item.name}
                                  onChange={(e) => handleBOQItemChange(index, 'name', e.target.value)}
                                  className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:ring-1 focus:ring-blue-500"
                                  readOnly={item.itemType !== 'custom'}
                                />
                              </td>
                              <td className="px-3 py-2">
                                <input
                                  type="number"
                                  min="1"
                                  value={item.quantity}
                                  onChange={(e) => handleBOQItemChange(index, 'quantity', parseInt(e.target.value) || 1)}
                                  className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:ring-1 focus:ring-blue-500"
                                />
                              </td>
                              <td className="px-3 py-2">
                                <input
                                  type="text"
                                  value={item.unit}
                                  onChange={(e) => handleBOQItemChange(index, 'unit', e.target.value)}
                                  className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:ring-1 focus:ring-blue-500"
                                />
                              </td>
                              <td className="px-3 py-2 text-sm text-gray-500">
                                ${item.inventoryPrice.toFixed(2)}
                                {item.priceBookPrice > 0 && (
                                  <span className="block text-xs text-purple-600">PB: ${item.priceBookPrice.toFixed(2)}</span>
                                )}
                              </td>
                              <td className="px-3 py-2">
                                <div className="relative">
                                  <span className="absolute left-2 top-1.5 text-gray-500 text-sm">$</span>
                                  <input
                                    type="number"
                                    step="0.01"
                                    min="0"
                                    value={item.enteredPrice}
                                    onChange={(e) => handleBOQItemChange(index, 'enteredPrice', e.target.value)}
                                    className="w-full pl-6 pr-2 py-1 text-sm border border-gray-300 rounded focus:ring-1 focus:ring-blue-500"
                                  />
                                </div>
                              </td>
                              <td className="px-3 py-2 text-sm font-medium text-gray-900">
                                ${((parseFloat(item.enteredPrice) || 0) * item.quantity).toFixed(2)}
                              </td>
                              <td className="px-3 py-2">
                                <button
                                  onClick={() => handleRemoveBOQItem(index)}
                                  className="p-1 text-gray-400 hover:text-red-500"
                                >
                                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                  </svg>
                                </button>
                              </td>
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* Totals */}
                <div className="grid grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Notes</label>
                    <textarea
                      value={boqNotes}
                      onChange={(e) => setBOQNotes(e.target.value)}
                      rows={3}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                      placeholder="Additional notes..."
                    />
                  </div>
                  <div className="bg-gray-50 rounded-lg p-4">
                    <div className="space-y-3">
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-600">Subtotal:</span>
                        <span className="font-medium">${calculateBOQTotals().subtotal.toFixed(2)}</span>
                      </div>
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-gray-600">Tax Rate (%):</span>
                        <input
                          type="number"
                          step="0.1"
                          min="0"
                          max="100"
                          value={boqTaxRate}
                          onChange={(e) => setBOQTaxRate(e.target.value)}
                          className="w-20 px-2 py-1 text-sm border border-gray-300 rounded text-right"
                          placeholder="0"
                        />
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-600">Tax Amount:</span>
                        <span className="font-medium">${calculateBOQTotals().taxAmount.toFixed(2)}</span>
                      </div>
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-gray-600">Discount ($):</span>
                        <input
                          type="number"
                          step="0.01"
                          min="0"
                          value={boqDiscount}
                          onChange={(e) => setBOQDiscount(e.target.value)}
                          className="w-20 px-2 py-1 text-sm border border-gray-300 rounded text-right"
                          placeholder="0"
                        />
                      </div>
                      <div className="pt-3 border-t border-gray-200 flex justify-between">
                        <span className="text-lg font-semibold text-gray-900">Total:</span>
                        <span className="text-lg font-bold text-blue-600">${calculateBOQTotals().total.toFixed(2)}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Footer */}
              <div className="px-6 py-4 border-t border-gray-200 bg-gray-50 flex justify-end gap-3">
                <button
                  onClick={() => setShowBOQDrawer(false)}
                  className="px-4 py-2 text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSaveBOQ}
                  disabled={boqLoading || boqItems.length === 0}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 flex items-center gap-2"
                >
                  {boqLoading ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                      Saving...
                    </>
                  ) : (
                    <>
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                      Save BOQ
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
