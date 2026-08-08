import { useEffect, useState, useRef } from 'react';
import { Card } from 'primereact/card';
import CustomDataTable from "../../components/ui/CustomDataTable";
import ManagementPageHeader from "../../components/management/ManagementPageHeader";
import { Button } from 'primereact/button';
import { Dropdown } from 'primereact/dropdown';
import { Toast } from 'primereact/toast';
import { fetchComplaints, updateComplaintStatus } from '../../services/adminService';
import StatCardPremium from '../../components/StatCardPremium';


export default function ComplaintsManagement() {
  const toast = useRef(null);
  const [complaints, setComplaints] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState(null);
  const [totalRecords, setTotalRecords] = useState(0);
  const [globalStats, setGlobalStats] = useState({ pending: 0, resolved: 0, dismissed: 0 });
  const [page, setPage] = useState(1);
  const rows = 10;

  useEffect(() => {
    loadComplaints();
  }, [page, statusFilter]);

  const loadComplaints = async () => {
    setLoading(true);
    try {
      const result = await fetchComplaints({ page, per_page: rows, status: statusFilter });
      
      setComplaints(result.data || []);
      setTotalRecords(result.total || 0);
      
      if (result.total_pending !== undefined) {
        setGlobalStats({
          pending: result.total_pending || 0,
          resolved: result.total_resolved || 0,
          dismissed: result.total_dismissed || 0,
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

  const statusBodyTemplate = (rowData) => {
    const statusOptions = [
      { label: 'Pendiente', value: 'pending' },
      { label: 'Resuelta', value: 'resolved' },
      { label: 'Desestimada', value: 'dismissed' }
    ];

    let badgeClass = 'status-badge ';
    let label = 'Desconocido';

    if (rowData.status === 'pending') {
      badgeClass += 'status-inactivo'; // Naranja/rojo
      label = 'Pendiente';
    } else if (rowData.status === 'resolved') {
      badgeClass += 'status-activo'; // Verde
      label = 'Resuelta';
    } else if (rowData.status === 'dismissed') {
      badgeClass += 'status-inactivo';
      label = 'Desestimada';
    }

    return (
      <Dropdown
        value={rowData.status}
        options={statusOptions}
        onChange={(e) => handleStatusChange(rowData.id, e.value)}
        optionLabel="label"
        placeholder="Estado"
        style={{ width: '130px' }}
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
        <StatCardPremium title="Total Quejas" value={totalRecords} icon="pi pi-exclamation-circle" tone="red" subtitle="Registradas en el sistema" loading={loading} />
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
            { field: 'description', header: 'Descripción' },
            { field: 'trip_id', header: 'Viaje ID' },
            { header: 'Estado', body: statusBodyTemplate },
          ]}
          loading={loading}
          page={page}
          totalRecords={totalRecords}
          rows={rows}
          onPageChange={setPage}
          title="Lista de Quejas"
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
    </div>
  );
}
