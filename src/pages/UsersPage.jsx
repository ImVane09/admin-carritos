import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from 'primereact/button';
import { Card } from 'primereact/card';
import { Column } from 'primereact/column';
import { DataTable } from 'primereact/datatable';
import { Dialog } from 'primereact/dialog';
import { InputText } from 'primereact/inputtext';
import { Tag } from 'primereact/tag';
import { ProgressSpinner } from 'primereact/progressspinner';
import { fetchUsers } from '../services/adminService';

export default function UsersPage() {
  const navigate = useNavigate();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedQuery, setDebouncedQuery] = useState('');
  const [page, setPage] = useState(1);
  const [totalRecords, setTotalRecords] = useState(0);
  const [selectedUser, setSelectedUser] = useState(null);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedQuery(searchQuery);
      setPage(1);
    }, 500);
    return () => clearTimeout(handler);
  }, [searchQuery]);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        const result = await fetchUsers({ per_page: 10, page, search: debouncedQuery });
        const dataArray = result?.data || [];
        const parsed = dataArray.map(u => ({
          ...u,
          role: (u.role || u.rol?.rol_name || 'pasajero').toLowerCase()
        }));
        setUsers(parsed);
        setTotalRecords(result?.total || 0);
      } catch (error) {
        console.error('Error al cargar usuarios:', error);
        setUsers([]);
        setTotalRecords(0);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [page, debouncedQuery]);

  const roleBodyTemplate = (row) => {
    const role = row.role?.toLowerCase() || 'pasajero';
    let severity = 'info';
    let icon = 'pi pi-user';
    let label = 'Pasajero';

    if (role === 'admin' || role === 'administrador') {
      severity = 'danger';
      icon = 'pi pi-shield';
      label = 'Admin';
    } else if (role === 'conductor') {
      severity = 'success';
      icon = 'pi pi-car';
      label = 'Conductor';
    }

    return (
      <Tag
        value={label}
        severity={severity}
        icon={icon}
        style={{
          padding: '0.35rem 0.65rem',
          borderRadius: '0.5rem',
          fontWeight: 600,
          letterSpacing: '0.3px',
        }}
      />
    );
  };

  const statusBodyTemplate = (row) => {
    const isActive = row.is_active !== false;
    return (
      <span className={`status-badge status-${isActive ? 'activo' : 'inactivo'}`}>
        {isActive ? 'Activo' : 'Inactivo'}
      </span>
    );
  };

  const dateBodyTemplate = (row) => {
    if (!row.created_at) return 'Sin fecha';
    return new Date(row.created_at).toLocaleDateString('es-ES', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const actionsBodyTemplate = (row) => {
    return (
      <div className="action-buttons">
        <Button
          size="small"
          icon="pi pi-eye"
          text
          rounded
          onClick={() => setSelectedUser(row)}
          title="Ver detalles"
          style={{ width: '2.5rem', height: '2.5rem' }}
        />
        <Button
          size="small"
          icon="pi pi-cog"
          text
          rounded
          className="p-button-secondary"
          onClick={() => {
            const role = row.role?.toLowerCase() || 'pasajero';
            if (role === 'admin' || role === 'administrador') {
              navigate('/management/admins');
            } else if (role === 'conductor') {
              navigate('/management/drivers');
            } else {
              navigate('/management/passengers');
            }
          }}
          title="Gestionar en su sección"
          style={{ width: '2.5rem', height: '2.5rem' }}
        />
      </div>
    );
  };

  return (
    <div className="management-section">
      <div className="management-header">
        <i className="pi pi-users" style={{ color: 'var(--brand-700)' }} />
        <div className="management-header-content">
          <h2>Usuarios del Sistema</h2>
          <p>Visión general y monitoreo consolidado de todas las cuentas registradas</p>
        </div>
      </div>

      <Card className="management-table">
        <div className="users-toolbar">
          <h2>Lista de Usuarios ({totalRecords})</h2>
          <div className="management-toolbar-actions">
            <span className="p-input-icon-left">
              <i className="pi pi-search" />
              <InputText
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Buscar por nombre, correo o rol..."
                style={{ width: '18rem', borderRadius: '0.5rem' }}
              />
            </span>
          </div>
        </div>

        <DataTable
          value={users}
          lazy
          paginator
          first={(page - 1) * 10}
          rows={10}
          totalRecords={totalRecords}
          onPage={(e) => setPage(e.page + 1)}
          stripedRows
          responsiveLayout="scroll"
          emptyMessage="No se encontraron usuarios"
          loading={loading}
          rowsPerPageOptions={[5, 10, 20, 50]}
          paginatorTemplate="FirstPageLink PrevPageLink PageLinks NextPageLink LastPageLink CurrentPageReport RowsPerPageDropdown"
          currentPageReportTemplate="Mostrando {first} a {last} de {totalRecords} usuarios"
        >
          <Column field="name" header="Nombre" sortable style={{ fontWeight: 500 }} />
          <Column field="email" header="Correo Electrónico" sortable />
          <Column header="Rol" body={roleBodyTemplate} sortable sortField="role" />
          <Column header="Estado" body={statusBodyTemplate} sortable sortField="is_active" />
          <Column header="Fecha de Registro" body={dateBodyTemplate} sortable sortField="created_at" />
          <Column header="Acciones" body={actionsBodyTemplate} style={{ width: '8rem', textAlign: 'center' }} />
        </DataTable>
      </Card>

      <Dialog
        header="Detalles del Usuario"
        visible={!!selectedUser}
        style={{ width: '32rem', borderRadius: '1rem' }}
        onHide={() => setSelectedUser(null)}
        breakpoints={{ '960px': '75vw', '641px': '90vw' }}
        dismissableMask
      >
        {selectedUser && (
          <div className="user-detail" style={{ padding: '0.5rem 0' }}>
            <div style={{ textAlign: 'center', marginBottom: '1.5rem' }}>
              <div
                style={{
                  width: '64px',
                  height: '64px',
                  borderRadius: '50%',
                  backgroundColor: 'var(--brand-700)',
                  color: 'white',
                  display: 'inline-flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '1.5rem',
                  fontWeight: 'bold',
                  marginBottom: '0.5rem',
                }}
              >
                {selectedUser.name?.slice(0, 1).toUpperCase()}
              </div>
              <h3 style={{ margin: '0.3rem 0', color: 'var(--brand-900)' }}>{selectedUser.name}</h3>
              <p style={{ color: 'var(--ink-500)', fontSize: '0.85rem' }}>ID de Usuario: #{selectedUser.id}</p>
            </div>

            <div style={{ display: 'grid', gap: '0.8rem', borderTop: '1px solid var(--border)', paddingTop: '1rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: 'var(--ink-500)' }}>Correo Electrónico:</span>
                <strong>{selectedUser.email}</strong>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ color: 'var(--ink-500)' }}>Rol asignado:</span>
                {roleBodyTemplate(selectedUser)}
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ color: 'var(--ink-500)' }}>Estado de cuenta:</span>
                {statusBodyTemplate(selectedUser)}
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: 'var(--ink-500)' }}>Fecha de Registro:</span>
                <strong>
                  {selectedUser.created_at
                    ? new Date(selectedUser.created_at).toLocaleString('es-ES', {
                        dateStyle: 'medium',
                        timeStyle: 'short',
                      })
                    : 'Sin registro'}
                </strong>
              </div>
            </div>

            <div style={{ display: 'flex', gap: '1rem', justifyContent: 'flex-end', marginTop: '2rem' }}>
              <Button
                label="Cerrar"
                onClick={() => setSelectedUser(null)}
                className="p-button-outlined p-button-secondary"
                style={{ borderRadius: '0.5rem' }}
              />
              <Button
                label="Gestionar Completo"
                icon="pi pi-cog"
                onClick={() => {
                  const role = selectedUser.role?.toLowerCase() || 'pasajero';
                  setSelectedUser(null);
                  if (role === 'admin' || role === 'administrador') {
                    navigate('/management/admins');
                  } else if (role === 'conductor') {
                    navigate('/management/drivers');
                  } else {
                    navigate('/management/passengers');
                  }
                }}
                className="p-button-primary"
                style={{ borderRadius: '0.5rem' }}
              />
            </div>
          </div>
        )}
      </Dialog>
    </div>
  );
}
