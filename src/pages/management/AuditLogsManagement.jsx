import { useEffect, useState } from 'react';
import ManagementPageHeader from '../../components/management/ManagementPageHeader';
import ManagementActionButtons from '../../components/management/ManagementActionButtons';
import CustomDataTable from '../../components/ui/CustomDataTable';
import { DetailField, DetailModal } from '../../components/ui/DetailModal';
import { fetchAuditLogs } from '../../services/adminService';

const ACTION_LABELS = {
  'driver.created': 'Creó un conductor',
  'passenger.created': 'Creó un pasajero',
  'admin.created': 'Creó un administrador',
  'user.updated': 'Actualizó un usuario',
  'admin.updated': 'Actualizó un administrador',
  'user.deleted': 'Eliminó un usuario',
  'admin.deleted': 'Eliminó un administrador',
  'user.status_toggled': 'Cambió el estado de un usuario',
  'admin.status_toggled': 'Cambió el estado de un administrador',
  'vehicle.created': 'Creó un vehículo',
  'vehicle.updated': 'Actualizó un vehículo',
  'vehicle.deleted': 'Eliminó un vehículo',
  'destination.created': 'Creó un destino',
  'destination.updated': 'Actualizó un destino',
  'destination.deleted': 'Eliminó un destino',
  'destination.status_toggled': 'Cambió el estado de un destino',
  'shift.created': 'Creó un horario',
  'shift.updated': 'Actualizó un horario',
  'shift.deleted': 'Eliminó un horario',
  'shift.status_toggled': 'Cambió el estado de un horario',
  'assignment.created': 'Creó una asignación',
  'assignment.updated': 'Actualizó una asignación',
  'assignment.deleted': 'Eliminó una asignación',
  'assignment.status_toggled': 'Cambió el estado de una asignación',
  'event.created': 'Creó un evento',
  'event.updated': 'Actualizó un evento',
  'event.deleted': 'Eliminó un evento',
  'complaint.status_updated': 'Actualizó una queja',
  'disconnect.approved': 'Aprobó una desconexión',
  'disconnect.rejected': 'Rechazó una desconexión',
  'role.created': 'Creó un rol',
  'role.updated': 'Actualizó un rol',
  'role.deleted': 'Eliminó un rol',
  'state.created': 'Creó un estado',
  'state.updated': 'Actualizó un estado',
  'state.deleted': 'Eliminó un estado',
};

function formatTarget(log) {
  return log.target_name || 'Registro administrativo';
}

function translateAction(action) {
  return ACTION_LABELS[action] || action.replaceAll('.', ' · ');
}

function resultLabel(result) {
  return result === 'success' ? 'Exitoso' : result === 'failed' ? 'Fallido' : result || 'Sin resultado';
}

function resultClass(result) {
  return result === 'success' ? 'status-activo' : result === 'failed' ? 'status-danger' : 'status-warning';
}

const VALUE_LABELS = {
  name: 'Nombre',
  description: 'Descripción',
  plate: 'Placa',
  brand: 'Marca',
  model: 'Modelo',
  status: 'Estado',
  is_active: 'Activo',
  start_time: 'Hora de inicio',
  end_time: 'Hora de fin',
  start_date: 'Fecha de inicio',
  end_date: 'Fecha de fin',
  state_name: 'Estado del viaje',
  permissions: 'Permisos',
};

function formatValue(value) {
  if (typeof value === 'boolean') return value ? 'Sí' : 'No';
  if (Array.isArray(value)) return value.join(', ') || 'Ninguno';
  return String(value);
}

function AuditValues({ values, emptyLabel = 'Sin cambios' }) {
  if (!values || Object.keys(values).length === 0) {
    return <span style={{ color: '#64748b' }}>{emptyLabel}</span>;
  }

  return (
    <div style={{ display: 'grid', gap: '0.45rem' }}>
      {Object.entries(values).map(([key, value]) => (
        <div key={key} style={{ display: 'flex', justifyContent: 'space-between', gap: '1rem' }}>
          <strong>{VALUE_LABELS[key] || key}</strong>
          <span style={{ textAlign: 'right' }}>{formatValue(value)}</span>
        </div>
      ))}
    </div>
  );
}

export default function AuditLogsManagement() {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [search, setSearch] = useState('');
  const [selectedLog, setSelectedLog] = useState(null);

  useEffect(() => {
    let active = true;
    setLoading(true);
    fetchAuditLogs({ page, per_page: 10, search: search || undefined })
      .then((response) => {
        if (!active) return;
        setLogs(response.data || []);
        setTotal(response.total || 0);
      })
      .catch((error) => console.error('Error al cargar auditoría:', error))
      .finally(() => active && setLoading(false));

    return () => { active = false; };
  }, [page, search]);

  const columns = [
    { field: 'created_at', header: 'Fecha', body: (row) => new Date(row.created_at).toLocaleString('es-EC') },
    { field: 'action', header: 'Acción realizada', body: (row) => translateAction(row.action) },
    { header: 'Actor', body: (row) => row.actor?.name || 'Sistema' },
    { header: 'Objetivo', body: (row) => formatTarget(row) },
    { field: 'result', header: 'Resultado', body: (row) => <span className={`status-badge ${resultClass(row.result)}`}>{resultLabel(row.result)}</span> },
    { header: 'Acciones', body: (row) => <ManagementActionButtons row={row} onView={setSelectedLog} /> },
  ];

  return (
    <div className="management-section">
      <ManagementPageHeader title="Auditoría del sistema" subtitle="Registro de acciones administrativas" icon="pi pi-list" />

      <CustomDataTable
        value={logs}
        columns={columns}
        loading={loading}
        page={page}
        totalRecords={total}
        rows={10}
        onPageChange={setPage}
        title="Acciones registradas"
        globalFilter={search}
        setGlobalFilter={(value) => { setSearch(value); setPage(1); }}
        searchPlaceholder="Buscar acción, usuario..."
      />

      <DetailModal
        header="Detalle de la acción"
        visible={!!selectedLog}
        onHide={() => setSelectedLog(null)}
        icon="pi pi-list"
        title={selectedLog ? translateAction(selectedLog.action) : ''}
        subtitle={selectedLog ? 'Acción registrada en el sistema' : ''}
      >
        {selectedLog && (
          <>
            <DetailField icon="pi pi-calendar" label="Fecha">{new Date(selectedLog.created_at).toLocaleString('es-EC')}</DetailField>
            <DetailField icon="pi pi-user" label="Actor">{selectedLog.actor?.name || 'Sistema'}</DetailField>
            <DetailField icon="pi pi-bullseye" label="Objetivo">{formatTarget(selectedLog)}</DetailField>
            <DetailField icon="pi pi-check-circle" label="Resultado">
              <span className={`status-badge ${resultClass(selectedLog.result)}`}>{resultLabel(selectedLog.result)}</span>
            </DetailField>
            <div style={{ marginTop: '0.75rem' }}>
              <strong style={{ color: 'var(--ink-600)' }}>Valores anteriores</strong>
              <div style={{ margin: '0.5rem 0 1rem', padding: '0.75rem', background: '#f8fafc', borderRadius: '0.5rem', fontSize: '0.8rem' }}>
                <AuditValues values={selectedLog.before_values} />
              </div>
              <strong style={{ color: 'var(--ink-600)' }}>Valores posteriores</strong>
              <div style={{ margin: '0.5rem 0', padding: '0.75rem', background: '#f8fafc', borderRadius: '0.5rem', fontSize: '0.8rem' }}>
                <AuditValues values={selectedLog.after_values} emptyLabel="No aplica: el registro fue eliminado o no hubo cambios posteriores" />
              </div>
            </div>
          </>
        )}
      </DetailModal>
    </div>
  );
}
