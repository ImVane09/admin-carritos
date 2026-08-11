import { useEffect, useState, useRef } from 'react';
import { Card } from 'primereact/card';
import CustomDataTable from "../../components/ui/CustomDataTable";
import ManagementPageHeader from "../../components/management/ManagementPageHeader";
import { Button } from 'primereact/button';
import { Dropdown } from 'primereact/dropdown';
import { Toast } from 'primereact/toast';
import { fetchComplaints, updateComplaintStatus } from '../../services/adminService';
import { Dialog } from 'primereact/dialog';
import { InputText } from 'primereact/inputtext';
import { InputTextarea } from 'primereact/inputtextarea';
import StatCardPremium from '../../components/StatCardPremium';


export default function ComplaintsManagement() {
  const toast = useRef(null);
  const [complaints, setComplaints] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState(null);
  const [totalRecords, setTotalRecords] = useState(0);
  const [globalStats, setGlobalStats] = useState({ pending: 0, resolved: 0, dismissed: 0, total: 0 });
  const [page, setPage] = useState(1);
  const [globalFilterValue, setGlobalFilterValue] = useState("");
  const [selectedComplaint, setSelectedComplaint] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const rows = 10;

  useEffect(() => {
    loadComplaints();
  }, [page, statusFilter, globalFilterValue]);

  const loadComplaints = async () => {
    setLoading(true);
    try {
      const result = await fetchComplaints({ search: globalFilterValue, page, per_page: rows, status: statusFilter });
      
      setComplaints(result.data || []);
      setTotalRecords(result.total || 0);
      
      if (result.total_pending !== undefined) {
        setGlobalStats({
          pending: result.total_pending || 0,
          resolved: result.total_resolved || 0,
          dismissed: result.total_dismissed || 0,
          total: result.total_registrados || 0
        });
      }
    } catch (err) {
      console.error(err);
      toast.current?.show({
        severity: 'error',
        summary: 'Error',
        detail: 'No se pudieron cargar las quejas.'
      });
    } finally {
      setLoading(false);
    }
  };

  const handleStatusChange = async (id, newStatus) => {
    try {
      await updateComplaintStatus(id, newStatus);
      toast.current?.show({ severity: 'success', summary: 'Éxito', detail: 'Estado actualizado' });
      // Actualizar localmente sin recargar todo
      setComplaints(complaints.map(c => c.id === id ? { ...c, status: newStatus } : c));
    } catch (err) {
      console.error(err);
      toast.current?.show({ severity: 'error', summary: 'Error', detail: 'No se pudo actualizar el estado' });
    }
  };

  const handleSaveStatus = async () => {
    if (!selectedComplaint) return;
    setIsSubmitting(true);
    try {
      await updateComplaintStatus(selectedComplaint.id, selectedComplaint.status);
      toast.current?.show({ severity: 'success', summary: 'Éxito', detail: 'Estado actualizado' });
      setSelectedComplaint(null);
      loadComplaints();
    } catch (err) {
      console.error(err);
      toast.current?.show({ severity: 'error', summary: 'Error', detail: 'No se pudo actualizar el estado' });
    } finally {
      setIsSubmitting(false);
    }
  };

  const dialogFooter = (
    <div className="flex justify-content-end gap-2">
      <Button label="Cancelar" icon="pi pi-times" onClick={() => setSelectedComplaint(null)} className="p-button-text" />
      <Button label="Guardar" icon="pi pi-check" onClick={handleSaveStatus} autoFocus loading={isSubmitting} />
    </div>
  );

  const statusBodyTemplate = (rowData) => {
    let badgeClass = 'status-badge ';
    let label = 'Desconocido';
    let icon = 'pi pi-question-circle';

    if (rowData.status === 'pending') {
      badgeClass += 'status-warning';
      label = 'Pendiente';
      icon = 'pi pi-clock';
    } else if (rowData.status === 'resolved') {
      badgeClass += 'status-activo';
      label = 'Resuelta';
      icon = 'pi pi-check-circle';
    } else if (rowData.status === 'dismissed') {
      badgeClass += 'status-danger';
      label = 'Desestimada';
      icon = 'pi pi-times-circle';
    }

    return (
      <span className={badgeClass}>
        {label}
      </span>
    );
  };

  const actionsBodyTemplate = (rowData) => {
    return (
      <Button 
        icon="pi pi-eye" 
        rounded 
        text 
        severity="info" 
        onClick={() => setSelectedComplaint(rowData)} 
        tooltip="Ver Detalles"
      />
    );
  };

  const userBodyTemplate = (rowData) => {
    return rowData.user ? rowData.user.name : 'Usuario Desconocido';
  };

  const dateBodyTemplate = (rowData) => {
    if (!rowData.created_at) return '-';
    const date = new Date(rowData.created_at);
    return date.toLocaleDateString() + ' ' + date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  return (
    <div className="management-section">
      <Toast ref={toast} />
      
      <ManagementPageHeader
        title="Quejas de Usuarios"
        subtitle="Gestión de quejas y reclamos de pasajeros"
        icon="pi pi-exclamation-circle"
      />

      <div className="dashboard-grid-premium">
        <StatCardPremium title="Total Quejas" value={globalStats.total} icon="pi pi-exclamation-circle" tone="red" subtitle="Registradas en el sistema" loading={loading} />
        <StatCardPremium title="Pendientes" value={globalStats.pending} icon="pi pi-clock" tone="amber" subtitle="A la espera de revisión" loading={loading} />
        <StatCardPremium title="Resueltas" value={globalStats.resolved} icon="pi pi-check" tone="green" subtitle="Quejas solucionadas" loading={loading} />
      </div>

        <CustomDataTable
          value={complaints}
          columns={[
            { field: 'id', header: 'ID' },
            { field: 'created_at', header: 'Fecha', body: dateBodyTemplate },
            { header: 'Pasajero', body: userBodyTemplate },
            { field: 'subject', header: 'Asunto' },
            { header: 'Estado', body: statusBodyTemplate },
            { header: 'Acciones', body: actionsBodyTemplate, style: { minWidth: '100px' } }
          ]}
          loading={loading}
          page={page}
          totalRecords={totalRecords}
          rows={rows}
          onPageChange={setPage}
          title="Lista de Quejas"
          globalFilter={globalFilterValue}
          setGlobalFilter={(val) => { setGlobalFilterValue(val); setPage(1); }}
          headerElements={
            <div className="management-toolbar-filters">
              <Dropdown 
                value={statusFilter} 
                options={[
                  { label: 'Todas', value: null },
                  { label: 'Pendientes', value: 'pending' },
                  { label: 'Resueltas', value: 'resolved' },
                  { label: 'Desestimadas', value: 'dismissed' }
                ]} 
                optionLabel="label"
                optionValue="value"
                onChange={(e) => { setStatusFilter(e.value); setPage(1); }} 
                placeholder="Filtrar por estado" 
              />
            </div>
          }
        />

      {/* Modal de Detalles de la Queja */}
      <Dialog 
        header="Detalles de la Queja" 
        visible={!!selectedComplaint} 
        style={{ width: '40vw' }} 
        onHide={() => setSelectedComplaint(null)}
        footer={dialogFooter}
      >
        {selectedComplaint && (
          <div className="flex flex-column gap-2 p-fluid">
            <div className="field">
              <label className="font-bold">Pasajero</label>
              <InputText value={selectedComplaint.user?.name || 'Usuario Desconocido'} readOnly />
            </div>
            <div className="field">
              <label className="font-bold">Asunto</label>
              <InputText value={selectedComplaint.subject || ''} readOnly />
            </div>
            <div className="field">
              <label className="font-bold">Descripción</label>
              <InputTextarea value={selectedComplaint.description || ''} readOnly rows={4} autoResize />
            </div>
            
            {selectedComplaint.trip_id && (
              <div className="field">
                <label className="font-bold">Viaje Asociado</label>
                <InputText value={`ID del Viaje: #${selectedComplaint.trip_id}`} readOnly />
              </div>
            )}

            <div className="field">
              <label className="font-bold">Cambiar Estado</label>
              <Dropdown
                value={selectedComplaint.status}
                options={[
                  { label: 'Pendiente', value: 'pending' },
                  { label: 'Resuelta', value: 'resolved' },
                  { label: 'Desestimada', value: 'dismissed' }
                ]}
                onChange={(e) => setSelectedComplaint(prev => ({ ...prev, status: e.value }))}
                optionLabel="label"
                placeholder="Seleccionar Estado"
              />
            </div>
          </div>
        )}
      </Dialog>
    </div>
  );
}
