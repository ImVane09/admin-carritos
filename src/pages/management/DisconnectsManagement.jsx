import { useEffect, useRef, useState } from "react";
import ManagementPageHeader from "../../components/management/ManagementPageHeader";
import { Button } from "primereact/button";
import { Card } from "primereact/card";
import CustomDataTable from "../../components/ui/CustomDataTable";
import { Toast } from "primereact/toast";
import { Dropdown } from "primereact/dropdown";
import { fetchDisconnectRequests, approveDriverDisconnect, rejectDriverDisconnect } from "../../services/adminService";
import StatCardPremium from "../../components/StatCardPremium";
import { Dialog } from "primereact/dialog";

function formatDate(value) {
  if (!value) return "—";
  const date = new Date(value);
  return date.toLocaleString("es-ES", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });
}

export default function DisconnectsManagement() {
  const toast = useRef(null);
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('all');
  const [page, setPage] = useState(1);
  const [totalRecords, setTotalRecords] = useState(0);
  const [globalStats, setGlobalStats] = useState({ aprobados: 0, rechazados: 0 });

  const [confirmDialog, setConfirmDialog] = useState(null);

  const statusOptions = [
    { label: "Todos los Estados", value: "all" },
    { label: "Pendientes", value: "pending" },
    { label: "Aprobados", value: "approved" },
    { label: "Rechazados", value: "rejected" }
  ];

  const load = async () => {
    setLoading(true);
    try {
      const params = { per_page: 10, page };
      if (statusFilter && statusFilter !== 'all') {
        params.status = statusFilter;
      }
      const result = await fetchDisconnectRequests(params);
      setRequests(result?.data || []);
      setTotalRecords(result?.total || 0);
      if (result?.total_aprobados !== undefined) {
        setGlobalStats({
          aprobados: result.total_aprobados || 0,
          rechazados: result.total_rechazados || 0,
        });
      }
    } catch (err) {
      console.error("Error al cargar historial de desconexiones:", err);
      toast.current?.show({
        severity: "error",
        summary: "Error",
        detail: "No se pudo cargar el historial de desconexiones.",
      });
      setRequests([]);
      setTotalRecords(0);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, [page, statusFilter]);

  const handleAction = async (actionType, record) => {
    try {
      if (actionType === 'approve') {
        await approveDriverDisconnect(record.driver_id);
        toast.current?.show({ severity: "success", summary: "Éxito", detail: "Desconexión aprobada." });
      } else {
        await rejectDriverDisconnect(record.driver_id);
        toast.current?.show({ severity: "info", summary: "Rechazado", detail: "Desconexión rechazada." });
      }
      setConfirmDialog(null);
      load();
    } catch (error) {
      toast.current?.show({ severity: "error", summary: "Error", detail: "Ocurrió un error al procesar la solicitud." });
    }
  };

  const confirmAction = (actionType, record) => {
    setConfirmDialog({ type: actionType, record });
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case 'pending':
        return (
          <span className="status-badge" style={{ backgroundColor: "#fff3e0", color: "#e65100", borderLeft: "3px solid #e65100" }}>
            Pendiente
          </span>
        );
      case 'approved':
        return (
          <span className="status-badge" style={{ backgroundColor: "#e8f5e9", color: "#2e7d32", borderLeft: "3px solid #2e7d32" }}>
            Aprobado
          </span>
        );
      case 'rejected':
        return (
          <span className="status-badge" style={{ backgroundColor: "#ffebee", color: "#c62828", borderLeft: "3px solid #c62828" }}>
            Rechazado
          </span>
        );
      default:
        return (
          <span className="status-badge" style={{ backgroundColor: "#f5f5f5", color: "#616161", borderLeft: "3px solid #9e9e9e" }}>
            Desconocido
          </span>
        );
    }
  };

  const columns = [
    { field: "id", header: "ID", sortable: false, width: "6%" },
    { 
      field: "driver.name", 
      header: "Conductor", 
      sortable: false,
      body: (rowData) => rowData.driver ? rowData.driver.name : '—'
    },
    { 
      field: "reason", 
      header: "Motivo", 
      sortable: false,
      body: (rowData) => (
        <div style={{ wordBreak: 'break-word', whiteSpace: 'pre-wrap', maxWidth: '300px' }}>
          {rowData.reason}
        </div>
      )
    },
    {
      field: "status",
      header: "Estado",
      sortable: false,
      body: (rowData) => getStatusBadge(rowData.status),
    },
    {
      field: "created_at",
      header: "Fecha de Solicitud",
      sortable: false,
      body: (rowData) => formatDate(rowData.created_at),
    },
    {
      field: "actions",
      header: "Acciones",
      body: (rowData) => {
        if (rowData.status !== 'pending') return <span style={{ color: '#9e9e9e', fontSize: '0.85rem' }}>No disponible</span>;
        return (
          <div style={{ display: "flex", gap: "0.5rem" }}>
            <Button
              icon="pi pi-check"
              className="p-button-rounded p-button-success p-button-text"
              tooltip="Aprobar"
              tooltipOptions={{ position: "top" }}
              onClick={() => confirmAction('approve', rowData)}
            />
            <Button
              icon="pi pi-times"
              className="p-button-rounded p-button-danger p-button-text"
              tooltip="Rechazar"
              tooltipOptions={{ position: "top" }}
              onClick={() => confirmAction('reject', rowData)}
            />
          </div>
        );
      },
    },
  ];

  return (
    <div className="management-page">
      <Toast ref={toast} position="top-right" />
      <ManagementPageHeader
        title="Registro de Desconexiones"
        description="Historial de solicitudes de desconexión de conductores"
        icon="pi pi-power-off"
      />

      <div className="dashboard-grid-premium">
        <StatCardPremium
          title="Total Registros"
          value={totalRecords}
          icon="pi pi-list"
          tone="blue"
        />
        <StatCardPremium
          title="Total Aprobados"
          value={globalStats.aprobados}
          icon="pi pi-check-circle"
          tone="green"
        />
        <StatCardPremium
          title="Total Rechazados"
          value={globalStats.rechazados}
          icon="pi pi-times-circle"
          tone="red"
        />
      </div>

      <CustomDataTable
        title="Historial de Solicitudes"
        headerElements={
          <div style={{ display: "flex", gap: "0.75rem", alignItems: "center" }}>
            <Dropdown
              value={statusFilter}
              options={statusOptions}
              onChange={(e) => {
                setStatusFilter(e.value);
                setPage(1);
              }}
              placeholder="Filtrar por Estado"
              className="w-full md:w-14rem"
            />
            <Button
              icon="pi pi-refresh"
              onClick={() => { setPage(1); load(); }}
              className="p-button-outlined"
              tooltip="Actualizar Datos"
            />
          </div>
        }
        value={requests}
        columns={columns}
        loading={loading}
        lazy
        totalRecords={totalRecords}
        onPageChange={(p) => setPage(p)}
        page={page}
        rows={10}
      />

      <Dialog blockScroll
        header={confirmDialog?.type === 'approve' ? 'Confirmar Aprobación' : 'Confirmar Rechazo'}
        visible={!!confirmDialog}
        style={{ width: '30rem' }}
        onHide={() => setConfirmDialog(null)}
      >
        {confirmDialog && (
          <div style={{ padding: '1rem 0' }}>
            <p>
              ¿Estás seguro de que deseas <strong>{confirmDialog.type === 'approve' ? 'aprobar' : 'rechazar'}</strong> la solicitud de desconexión del conductor <strong>{confirmDialog.record.driver?.name}</strong>?
            </p>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginTop: '0.5rem', wordBreak: 'break-word', whiteSpace: 'pre-wrap' }}>
              Motivo: {confirmDialog.record.reason}
            </p>
          </div>
        )}
        <div className="premium-modal-footer">
          <Button label="Cancelar" icon="pi pi-times" onClick={() => setConfirmDialog(null)} className="p-button-text" />
          <Button 
            label="Confirmar" 
            icon="pi pi-check" 
            onClick={() => handleAction(confirmDialog?.type, confirmDialog?.record)} 
            severity={confirmDialog?.type === 'approve' ? 'success' : 'danger'}
            autoFocus 
          />
        </div>
      </Dialog>
    </div>
  );
}
