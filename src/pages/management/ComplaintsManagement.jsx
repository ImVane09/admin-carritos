import { useEffect, useState, useRef } from 'react';
import { Card } from 'primereact/card';
import { DataTable } from 'primereact/datatable';
import { Column } from 'primereact/column';
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
  const [lazyParams, setLazyParams] = useState({
    first: 0,
    rows: 10,
    page: 0,
  });

  useEffect(() => {
    loadComplaints();
  }, [lazyParams, statusFilter]);

  const loadComplaints = async () => {
    setLoading(true);
    try {
      const result = await fetchComplaints({ page: lazyParams.page + 1, per_page: lazyParams.rows, status: statusFilter });
      
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
      
      <div className="management-header">
        <div className="management-header-left">
          <i className="pi pi-exclamation-circle" />
          <div className="management-header-content">
            <h2>Quejas de Usuarios</h2>
            <p>Gestión de quejas y reclamos de pasajeros</p>
          </div>
        </div>
      </div>

      <div className="dashboard-grid-premium" style={{ marginBottom: '1.25rem', marginTop: '1.25rem' }}>
        <StatCardPremium title="Total Quejas" value={totalRecords} icon="pi pi-exclamation-circle" tone="red" subtitle="Registradas en el sistema" loading={loading} />
        <StatCardPremium title="Pendientes" value={globalStats.pending} icon="pi pi-clock" tone="amber" subtitle="A la espera de revisión" loading={loading} />
        <StatCardPremium title="Resueltas" value={globalStats.resolved} icon="pi pi-check" tone="green" subtitle="Quejas solucionadas" loading={loading} />
      </div>

      <Card className="management-table">
        <div className="management-toolbar">
          <h3>Lista de Quejas</h3>
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
              onChange={(e) => setStatusFilter(e.value)} 
              placeholder="Filtrar por estado" 
            />
          </div>
        </div>

        <DataTable
          value={complaints}
          loading={loading}
          paginator
          lazy
          first={lazyParams.first}
          rows={lazyParams.rows}
          totalRecords={totalRecords}
          onPage={(e) => setLazyParams(e)}
          stripedRows
          responsiveLayout="scroll"
          emptyMessage="No hay quejas registradas."
        >
          <Column field="id" header="ID" style={{ width: '80px' }} sortable />
          <Column header="Fecha" body={dateBodyTemplate} sortable field="created_at" />
          <Column header="Pasajero" body={userBodyTemplate} />
          <Column field="subject" header="Asunto" style={{ minWidth: '150px' }} />
          <Column field="description" header="Descripción" style={{ minWidth: '300px' }} />
          <Column field="trip_id" header="Viaje ID" />
          <Column header="Estado" body={statusBodyTemplate} style={{ minWidth: '150px' }} />
        </DataTable>
      </Card>
    </div>
  );
}
